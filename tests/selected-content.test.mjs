import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { convertSnapshot } from "../tools/convert-selected.mjs";
import { importSelectedWorld, importSelectedActor } from "../scripts/content/selected.mjs";

const snapshot = JSON.parse(await readFile("content/selected-source.json", "utf8"));
const bundle = JSON.parse(await readFile("content/selected-content.json", "utf8"));

test("requested groups and eight clan packages preserve all377 selected records without Clan Feats", () => {
  assert.equal(bundle.items.length, 377);
  const general = bundle.items.filter(i => !i.flags["n5e-module"].selected.clan);
  const counts = {};
  for (const item of general) { const m = item.flags["n5e-module"].selected; const key = `${m.discipline}/${m.group}`; counts[key] = (counts[key] ?? 0) + 1; assert.equal(m.rank, "D"); }
  assert.deepEqual(counts, { "buki/shinobiBasics": 21, "gen/phantasm": 22, "nin/fire": 19, "nin/nonElemental": 30, "nin/wind": 21, "tai/taijutsu": 51 });
  assert.equal(bundle.items.filter(i => i.type === "race").length, 8);
  assert.equal(bundle.items.filter(i => i.flags["n5e-module"].selected.clan && i.type === "spell").length, 87);
  assert.ok(bundle.items.every(i => i.flags["n5e-module"].selected.category !== "clan"));
});

test("conversion is reproducible and native IDs, types, descriptions and provenance are preserved", () => {
  assert.deepEqual(convertSnapshot(snapshot), bundle);
  assert.equal(new Set(bundle.items.map(i => i._id)).size, 377);
  for (const [index, item] of bundle.items.entries()) {
    const source = snapshot.records[index];
    assert.match(item._id, /^[a-f0-9]{16}$/);
    assert.ok(["race", "spell", "feat"].includes(item.type));
    assert.ok(item.system.description.value.includes(source.data.system.description));
    assert.equal(item.flags["n5e-module"].selected.sourceHash, source.hash);
    assert.deepEqual(item.effects, []);
    assert.equal(item.flags["n5e-module"].selected.automation.status, "manual");
    assert.ok(item.flags["n5e-module"].selected.folderPath.length <= 4);
  }
});

test("clan links target selected native records rather than the old system compendium", () => {
  const ids = new Set(bundle.items.map(i => i._id));
  for (const clan of bundle.items.filter(i => i.type === "race")) {
    assert.ok(clan.flags["n5e-module"].selected.relatedSourceIds.length > 10);
    for (const match of clan.system.description.value.matchAll(/@UUID\[Item\.([^\]]+)\]/g)) assert.ok(ids.has(match[1]));
    assert.ok(!clan.system.description.value.includes("@UUID[Compendium.n5e."));
  }
});

test("explicit world imports create organized folders once and repeat imports leave records untouched", async () => {
  const items = [], folders = [];
  items.get = id => items.find(i => i.id === id);
  globalThis.game = { user: { isGM: true }, items, folders };
  globalThis.fetch = async () => ({ ok: true, json: async () => structuredClone(bundle) });
  globalThis.Folder = { create: async data => { const f = { ...data, id: `folder${folders.length}` }; folders.push(f); return f; } };
  globalThis.Item = { create: async (data, options) => { assert.equal(options.keepId, true); const item = { ...data, id: data._id }; items.push(item); return item; } };
  assert.deepEqual(await importSelectedWorld({ clans: [], general: true }), { created: 164, skipped: 0 });
  const count = folders.length;
  assert.deepEqual(await importSelectedWorld({ clans: [], general: true }), { created: 0, skipped: 164 });
  assert.equal(folders.length, count); assert.equal(items.length, 164);
  game.user.isGM = false;
  await assert.rejects(importSelectedWorld(), /Only a GM/);
});

test("actor imports remove embedded IDs and skip existing source identities", async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => structuredClone(bundle) });
  const ids = bundle.items.slice(0, 2).map(i => i.flags["n5e-module"].selected.sourceId);
  const actor = { isOwner: true, items: [bundle.items[0]], async createEmbeddedDocuments(type, records) { assert.equal(type, "Item"); assert.equal(records.length, 1); assert.equal(records[0]._id, undefined); assert.equal(records[0].folder, undefined); return records; } };
  assert.equal((await importSelectedActor(actor, ids)).length, 1);
  actor.isOwner = false;
  await assert.rejects(importSelectedActor(actor, ids), /ownership/);
});
