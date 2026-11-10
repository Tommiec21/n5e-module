import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { convertClasses } from "../tools/convert-classes.mjs";
import { classMasterySources, classTags, registerClassProficiencies } from "../scripts/classes/progression.mjs";
import { importClassLibrary } from "../scripts/classes/import.mjs";
import { masterySources, masteryFor } from "../scripts/skills/calculation.mjs";

const snapshot = JSON.parse(await readFile("content/class-source.json", "utf8"));
const bundle = JSON.parse(await readFile("content/class-content.json", "utf8"));

test("three requested classes preserve their complete402-record dependency closure reproducibly", () => {
  assert.deepEqual(convertClasses(snapshot), bundle);
  assert.equal(bundle.items.length, 402);
  const counts = {}; for (const i of bundle.items) counts[i.type] = (counts[i.type] ?? 0) + 1;
  assert.deepEqual(counts, { class: 3, subclass: 20, feat: 379 });
  assert.equal(new Set(bundle.items.map(i => i._id)).size, 402);
  for (const i of bundle.items) { assert.match(i._id, /^[a-f0-9]{16}$/); assert.ok(i.flags["n5e-module"].selected.sourceHash); assert.ok(i.flags["n5e-module"].selected.folderPath.length <= 4); }
});

test("native class hit dice, proficiency choices, scales and subclass levels match source", () => {
  const expected = { "scout-nin": ["d8",3], "ninjutsu-specialist": ["d6",2], "taijutsu-specialist": ["d12",3] };
  for (const item of bundle.items.filter(i => i.type === "class")) {
    assert.equal(item.system.hd.denomination, expected[item.system.identifier][0]);
    assert.equal(item.system.spellcasting.progression, "none");
    assert.equal(item.system.advancement.find(a => a.type === "Subclass").level, expected[item.system.identifier][1]);
    assert.ok(item.system.advancement.some(a => a.type === "HitPoints"));
    const traits = item.system.advancement.find(a => a.type === "Trait");
    assert.equal(traits.configuration.grants.filter(g => g.startsWith("saves:")).length, 3);
    const scale = item.system.advancement.find(a => a.configuration.identifier === "jutsu-known");
    assert.equal(Object.keys(scale.configuration.scale).length, 20);
  }
});

test("every grant and choice resolves to a native selected Item and retains unspent native values", () => {
  const ids = new Set(bundle.items.map(i => `Item.${i._id}`));
  for (const item of bundle.items) for (const a of item.system.advancement) {
    assert.match(a._id, /^[a-f0-9]{16}$/);
    assert.deepEqual(a.value, {});
    for (const r of a.configuration.items ?? a.configuration.pool ?? []) assert.ok(ids.has(r.uuid), r.uuid);
  }
  for (const item of bundle.items.filter(i => i.type === "subclass")) assert.ok(["scout-nin","ninjutsu-specialist","taijutsu-specialist"].includes(item.system.classIdentifier));
});

test("Scholar Mastery deduplicates overlapping old imports and tracks actual class levels", () => {
  const item = structuredClone(bundle.items.find(i => i.type === "class" && i.system.identifier === "ninjutsu-specialist"));
  const actor = { items: [item], effects: [], system: { n5e: { level: 20 } } };
  for (const [level,count] of [[1,0],[2,1],[7,2],[13,3]]) {
    item.system.levels = level;
    assert.equal(classMasterySources(actor).length, count);
    assert.equal(masteryFor(masterySources(actor), "skill.n5eNinshou", 20).rank, count);
  }
  const subclass = structuredClone(bundle.items.find(i => i.type === "subclass" && i.flags["n5e-module"].classProgression.tags.some(t => t.tag === "fire")));
  actor.items.push(subclass); item.system.levels = 1; assert.deepEqual(classTags(actor), []);
  item.system.levels = 2; assert.deepEqual(classTags(actor), ["fire"]);
});

test("Refined Focus uses native consumption and long-rest recovery while extensive features remain manual", () => {
  const focus = bundle.items.find(i => i.system.identifier === "refined-focus");
  assert.equal(focus.system.uses.max, "1 + @prof");
  assert.equal(focus.system.uses.recovery[0].period, "lr");
  const activity = Object.values(focus.system.activities)[0];
  assert.equal(activity._id.length, 16);
  assert.equal(activity.consumption.targets[0].type, "itemUses");
  assert.ok(bundle.items.filter(i => i.type === "feat").every(i => ["manual","partial"].includes(i.flags["n5e-module"].selected.automation.status)));
});

test("class import reuses duplicate-safe world library and custom proficiency keys stay namespaced", async () => {
  const config = { DND5E: { weaponProficiencies: { sim: "Simple" }, toolProficiencies: {} } };
  registerClassProficiencies(config); assert.equal(config.DND5E.weaponProficiencies["n5e-combat-scrolls"], "Combat Scrolls"); assert.equal(config.DND5E.weaponProficiencies.sim, "Simple");
  const items = []; items.get = id => items.find(i => i.id === id);
  globalThis.game = { user: { isGM: true }, items, folders: [] };
  globalThis.fetch = async url => { assert.match(url, /class-content\.json$/); return { ok: true, json: async () => ({ ...bundle, items: bundle.items.filter(i => i.type === "class") }) }; };
  globalThis.Folder = { create: async data => { const d = { ...data, id: `f${game.folders.length}` }; game.folders.push(d); return d; } };
  globalThis.Item = { create: async data => { const d = { ...data, id: data._id }; items.push(d); return d; } };
  assert.deepEqual(await importClassLibrary(), { created: 3, skipped: 0 });
  assert.deepEqual(await importClassLibrary(), { created: 0, skipped: 3 });
});
