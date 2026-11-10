import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { generalPlan, eligibility } from "../scripts/integration/casting.mjs";
import { validateDefinition } from "../scripts/saves/planner.mjs";
import { saveDefinition, castTrial } from "../scripts/integration/bridge.mjs";
import { prepareTestActor, importSelectedWorld } from "../scripts/content/selected.mjs";
import { convertSnapshot } from "../tools/convert-selected.mjs";

const bundle = JSON.parse(await readFile("content/selected-content.json", "utf8"));
const source = JSON.parse(await readFile("content/selected-source.json", "utf8"));
const actor = () => ({ uuid: "Actor.test", isOwner: true, flags: {}, effects: [], items: [], statuses: new Set(), system: { n5e: { level: 17, chakra: { value: 100 } }, attributes: { movement: { walk: 30 } }, abilities: Object.fromEntries(["str", "dex", "con", "int", "wis", "cha"].map(a => [a, { value: 20, mod: 5 }])) } });
function activity(name, a = actor()) { const item = structuredClone(bundle.items.find(i => i.name === name)); item.uuid = `Actor.test.Item.${item._id}`; return { id: Object.keys(item.flags["n5e-module"].casting.activities)[0], actor: a, item }; }
const options = { rank: "D", requirementsConfirmed: true, castingAbility: "int" };

test("all242 source-cost profiles use native activities and keep manual mechanics explicit", () => {
  assert.deepEqual(convertSnapshot(source), bundle);
  const items = bundle.items.filter(i => i.flags["n5e-module"].casting);
  assert.equal(items.length, 242);
  assert.equal(items.filter(i => i.flags["n5e-module"].selected.automation.status === "base-rank-core").length, 4);
  for (const item of items) {
    const p = item.flags["n5e-module"].casting;
    assert.equal(p.upcast, false);
    assert.ok(Number.isSafeInteger(p.baseCost));
    for (const id of Object.keys(p.activities)) {
      assert.equal(id.length, 16);
      assert.deepEqual(item.system.activities[id].consumption.targets, []);
    }
  }
});

test("source-correct direct modes keep typed damage, half-save results and conditions separate", () => {
  const fire = generalPlan(activity("Fire Release: Erupting Flame"), options);
  assert.equal(fire.parts[0].formula, "4d8+4"); assert.equal(fire.outcomes.success.damage, "half");
  assert.deepEqual(fire.outcomes.failure.conditions, []); assert.match(fire.outcomes.failure.manual[0], /Dazed/);
  const bolt = generalPlan(activity("Chakra Bolt"), options); assert.equal(bolt.parts[0].formula, "4d6");
  const splinter = generalPlan(activity("Sealing Art: Fracturing Splinter"), options);
  assert.deepEqual(splinter.parts.map(p => p.type), ["force", "chakra"]);
  assert.deepEqual(splinter.outcomes.failure.conditions, []);
  const flame = generalPlan(activity("Fire Release: Fireball"), options);
  assert.deepEqual(flame.outcomes.failure.conditions, [{ key: "burned", ranks: 1 }]);
  for (const item of bundle.items.filter(i => Object.values(i.flags["n5e-module"].casting?.activities ?? {}).some(m => m.saveAbility))) {
    const a = activity(item.name), plan = generalPlan(a, { ...options, rank: item.flags["n5e-module"].casting.baseRank });
    validateDefinition(saveDefinition(plan, { id: "test", kind: "jutsu", actorUuid: "Actor.test", itemUuid: a.item.uuid, castId: "test" }, "test", 18, null));
  }
});

test("healing resolves the source ability modifier and unsupported upcasts fail instead of guessing", () => {
  const a = activity("Wind Release: Second Wind");
  const plan = generalPlan(a, options);
  assert.equal(plan.kind, "heal"); assert.equal(plan.parts[0].formula, "2d6 + 5");
  assert.throws(() => generalPlan(a, { ...options, rank: "C" }), /does not support upcasting/);
  const longer = { ...a.item.flags["n5e-module"].casting, requiresCompletedCasting: true };
  assert.throws(() => eligibility(a.actor, longer, options), /Complete the source casting time/);
});

test("reviewed Fireball flows through native spending and original-roll save packets once", async () => {
  const a = activity("Fire Release: Fireball"); let writes = 0; const messages = [];
  a.actor.update = async values => { writes++; a.actor.system.n5e.chakra.value = values["system.n5e.chakra.value"]; };
  globalThis.Roll = { validate: () => true };
  globalThis.ChatMessage = { getSpeaker: () => ({}), create: async data => { const m = { ...data, uuid: `ChatMessage.${messages.length}` }; messages.push(m); return m; } };
  globalThis.CONFIG = { Dice: { DamageRoll: class { async evaluate() { this.total = 18; return this; } } }, DND5E: { activityConsumptionTypes: { attribute: { async consume(_c, updates) { updates.actor["system.n5e.chakra.value"] = this.actor.system.n5e.chakra.value - (await this.resolveCost()).total; } } } } };
  const result = await castTrial(a, options, [{ uuid: "Actor.target", isOwner: false }]);
  assert.equal(writes, 1); assert.equal(a.actor.system.n5e.chakra.value, 100 - result.cost);
  assert.equal(result.packet.components[0].amount, 18);
  assert.equal(messages.at(-1).flags["n5e-module"].trialSave.definition.damagePacket.rollUuid, "ChatMessage.0");
});

test("test-actor setup validates values and world-library replacement requires explicit opt-in", async () => {
  let saved; const a = { isOwner: true, async update(data) { saved = data; } };
  await prepareTestActor(a, { level: 5, chakra: 80, maximum: 100 });
  assert.equal(saved["system.n5e.level"], 5);
  await assert.rejects(prepareTestActor(a, { level: 21, chakra: 0, maximum: 100 }), /level1/);
  const first = structuredClone(bundle.items[0]); let updates = 0;
  const items = [{ ...first, id: first._id, update: async () => { updates++; } }]; items.get = id => items.find(i => i.id === id);
  globalThis.game = { user: { isGM: true }, items, folders: [] };
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ version: 1, items: [first] }) });
  await importSelectedWorld({ clans: [] }); assert.equal(updates, 0);
  await importSelectedWorld({ clans: [], updateExisting: true }); assert.equal(updates, 1);
});
