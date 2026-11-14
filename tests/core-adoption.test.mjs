/** SHARED1b: the vendored shared core, its sync tool, the module adapter and the degree replacement. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { deflateRawSync } from "node:zlib";
import { unzip } from "../tools/sync-core.mjs";
import { registerCoreAdapter } from "../scripts/integration/core-adapter.mjs";
import { rule } from "../scripts/core/module/rules/settings.mjs";
import * as moduleDegree from "../scripts/saves/degree.mjs";
import * as coreDegree from "../scripts/core/module/rules/degree.mjs";

/** A one-file deflated ZIP, enough to exercise the central-directory reader. */
function zipOf(name, text) {
  const data = deflateRawSync(Buffer.from(text)), file = Buffer.from(name);
  const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(8, 8); local.writeUInt32LE(data.length, 18); local.writeUInt16LE(file.length, 26);
  const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50); central.writeUInt16LE(8, 10); central.writeUInt32LE(data.length, 20); central.writeUInt16LE(file.length, 28);
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(1, 10); end.writeUInt32LE(46 + file.length, 12); end.writeUInt32LE(30 + file.length + data.length, 16);
  return Buffer.concat([local, file, data, central, file, end]);
}

test("the sync tool reads deflated ZIP entries", () => {
  assert.deepEqual(unzip(zipOf("n5e-core/a.txt", "core")).map(f => [f.name, f.data.toString()]), [["n5e-core/a.txt", "core"]]);
  assert.throws(() => unzip(Buffer.from("not a zip")), /Not a ZIP/);
});

test("the vendored core is recorded and complete", async () => {
  const manifest = JSON.parse(await readFile("module.json", "utf8"));
  const core = JSON.parse(await readFile("scripts/core/package.json", "utf8"));
  assert.equal(manifest.flags.n5eCore.version, core.version);
  const index = await import("../scripts/core/index.mjs");
  assert.equal(typeof index.degree.degreeOfSuccess, "function");
});

test("the adapter reads n5e-module settings and falls back to core defaults", () => {
  registerCoreAdapter({ get: (scope, key) => (scope === "n5e-module" && key === "skillActionPenalties" ? false : undefined) });
  assert.equal(rule("skillActionPenalties"), false);
  registerCoreAdapter({ get: () => { throw new Error("not registered"); } });
  assert.notEqual(rule("skillActionPenalties"), undefined);
});

test("saves/degree.mjs is the core resolver", () => {
  assert.equal(moduleDegree.degreeOfSuccess, coreDegree.degreeOfSuccess);
  assert.deepEqual(moduleDegree.degreeOfSuccess(14, 15, { natural: 20 }), { degree: 2, key: "success" });
});

import * as moduleModifiers from "../scripts/conditions/modifiers.mjs";
import * as coreConditions from "../scripts/core/module/rules/conditions.mjs";
import { conditions as moduleRegistry } from "../scripts/conditions/registry.mjs";

test("condition modifiers come from the core and default to the module registry", () => {
  assert.equal(moduleModifiers.emptyPenalties, coreConditions.emptyPenalties);
  assert.equal(moduleModifiers.clampRanks, coreConditions.clampRanks);
  const active = [{ key: "exhaustion", ranks: 3 }];
  assert.deepEqual(moduleModifiers.aggregatePenalties(active), coreConditions.aggregatePenalties(active, moduleRegistry));
  assert.equal(moduleModifiers.aggregatePenalties(active).ac, -3);
});

test("damage calculation comes from the core with unchanged module results", async () => {
  const local = await import("../scripts/damage/calculation.mjs");
  const core = await import("../scripts/core/module/rules/damage.mjs");
  assert.equal(local.damagePlan, core.damagePlan);
  assert.equal(local.healPlan, core.healPlan);
  assert.equal(local.deathSaveResult, core.deathSaveResult);
  assert.equal(local.concentrationOnDamage({ system: {} }, 20), null);
  const target = { system: { hp: { value: 20, max: 20, temp: 0 }, cp: { value: 10, max: 10, temp: 0 }, dr: 2, traits: { resist: [], immune: [], vuln: [] } }, effects: [] };
  const plan = local.damagePlan(target, [{ amount: 7, type: "bludgeoning" }]);
  assert.equal(plan.update["system.hp.value"], 15);
});

test("chakra cost, upkeep and concentration DC come from the core", async () => {
  const cost = await import("../scripts/integration/cost.mjs");
  const conc = await import("../scripts/concentration/calculation.mjs");
  const core = await import("../scripts/core/module/rules/cost.mjs");
  for (const name of ["computeJutsuCost", "upkeepCost", "concentrationDC"]) assert.equal(cost[name], core[name]);
  assert.equal(conc.upkeepCost, core.upkeepCost);
  assert.equal(conc.concentrationDC, core.concentrationDC);
  assert.equal(cost.upkeepCost(9), 4);
  assert.equal(cost.upkeepCost(9, { efficient: true }), 0);
  assert.equal(cost.concentrationDC({ rankValues: [2, 3], damage: 50 }), 25);
});
