import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { supportsHost } from "../scripts/compatibility.mjs";
import { runBounded } from "../tools/bounded.mjs";

test("manifest and lifecycle preserve host gameplay and reject unsupported versions", async () => {
  const manifest = JSON.parse(await readFile("module.json", "utf8"));
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(manifest.version, pkg.version);
  assert.equal(supportsHost({ id: "dnd5e", version: "5.3.3" }, "13.347"), true);
  for (const [id, version, host] of [["n5e", "5.3.3", "13.347"], ["dnd5e", "5.2.5", "13.347"], ["dnd5e", "5.3.3", "14.1"], ["dnd5e", "5.3.3", "13.346"]]) assert.equal(supportsHost({ id, version }, host), false);
  const hooks = new Map();
  const module = { version: manifest.version };
  const original = { marker: "native" };
  globalThis.Hooks = { once: (name, callback) => hooks.set(name, callback) };
  globalThis.game = { modules: new Map([[manifest.id, module]]), system: { id: "dnd5e", version: "5.3.3" }, version: "13.347" };
  globalThis.CONFIG = { Actor: original, Item: original };
  let warnings = 0;
  globalThis.ui = { notifications: { warn: () => warnings++ } };
  await import("../scripts/module.mjs");
  hooks.get("init")();
  hooks.get("ready")();
  assert.equal(module.api.supported, true);
  assert.equal(module.api.gameplayEnabled, false);
  assert.equal(CONFIG.Actor, original);
  assert.equal(CONFIG.Item, original);
  assert.equal(warnings, 0);
  game.system.version = "5.4.0";
  hooks.get("init")();
  hooks.get("ready")();
  assert.equal(module.api.supported, false);
  assert.equal(warnings, 1);
});

test("runner retains nonzero exits and rejects deadlines beyond the ceiling", async () => {
  const dir = await mkdtemp(join(tmpdir(), "n5e-runner-"));
  const result = await runBounded(process.execPath, ["-e", "process.exit(7)"], { record: join(dir, "exit.json"), stdio: "ignore" });
  assert.equal(result.code, 7);
  assert.equal(result.status, "failed");
  await assert.rejects(runBounded(process.execPath, [], { timeoutMs: 600001 }), RangeError);
});

/** A stopped heartbeat proves that the descendant was stopped as well as its parent. */
async function checkTreeStop(cancelled) {
  const dir = await mkdtemp(join(tmpdir(), "n5e-tree-"));
  const heartbeat = join(dir, "heartbeat");
  const record = join(dir, "result.json");
  const controller = new AbortController();
  const trigger = cancelled ? setTimeout(() => controller.abort(), 1800) : null;
  try {
    const result = await runBounded(process.execPath, ["tests/fixtures/process-tree.mjs", heartbeat], { timeoutMs: cancelled ? 5000 : 1800, record, signal: controller.signal, stdio: "ignore" });
    assert.equal(result.status, cancelled ? "cancelled" : "timed-out");
    const size = (await stat(heartbeat)).size;
    assert.ok(size > 0, "Descendant actually ran before cleanup.");
    await delay(250);
    assert.equal((await stat(heartbeat)).size, size, "No descendant continues writing after cleanup.");
    assert.equal(JSON.parse(await readFile(record, "utf8")).status, result.status);
  } finally {
    clearTimeout(trigger);
  }
}

test("deadline terminates and records the entire child tree", () => checkTreeStop(false));
test("cancellation terminates and records the entire child tree", () => checkTreeStop(true));
