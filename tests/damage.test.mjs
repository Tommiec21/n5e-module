import { test } from "node:test";
import assert from "node:assert/strict";
import { planDamage } from "../scripts/damage/planner.mjs";
import { applyDamage, recover, retarget } from "../scripts/damage/service.mjs";
import { applyWithChoice, postDamage } from "../scripts/damage/controls.mjs";
import { registerDamageFields } from "../scripts/damage/schema.mjs";

/** Model native resource paths and record writes without launching a Foundry instance. */
function actor() {
  return { uuid: "Actor.target", type: "character", isOwner: true, effects: [], flags: {}, statuses: [], writes: 0, system: { attributes: { hp: { value: 20, max: 20, temp: 0 }, death: { success: 0, failure: 0 } }, n5e: { chakra: { value: 20, max: 20, temp: 0 }, dr: 5 }, traits: { dr: { value: new Set() }, di: { value: new Set() }, dv: { value: new Set() } } }, async update(updates) { this.writes++; for (const [path, value] of Object.entries(updates)) { const parts = path.split("."); const key = parts.pop(); let current = this; for (const part of parts) current = current[part] ??= {}; current[key] = value; } }, async toggleStatusEffect(key, { active }) { this.statuses.push({ key, active }); } };
}

/** Build one already-rolled packet with distinct component identities and an original roll reference. */
function packet(types = ["fire", "chakra"], amounts = [8, 8]) {
  return { version: 1, id: "damage-1", targetUuid: "Actor.target", kind: "damage", critical: false, rollUuid: "ChatMessage.original", source: { id: "cast-1", kind: "jutsu", actorUuid: "Actor.caster", itemUuid: "Actor.caster.Item.jutsu", castId: "cast-1" }, components: types.map((type, i) => ({ id: `part-${i}`, type, pool: type === "chakra" ? "chakra" : "hp", amount: amounts[i] })) };
}

test("DR independently protects HP/Chakra and requires target ordering within HP", () => {
  const a = actor();
  const result = planDamage(a, packet());
  assert.deepEqual([result.plan.health, result.plan.chakra], [3, 3]);
  assert.equal(result.concentration.damageAmount, 6);
  const mixed = packet(["fire", "lightning"]);
  assert.equal(planDamage(a, mixed).plan.requiresDROrder, true);
  assert.deepEqual(planDamage(a, mixed, { drOrder: ["fire", "lightning"] }).plan.parts.map(p => p.amount), [3, 8]);
  assert.equal(a.system.attributes.hp.value, 20);
});

test("flat DR precedes multipliers and temporary pools count toward concentration", () => {
  const a = actor();
  a.system.traits.dr.value.add("fire"); a.system.traits.dv.value.add("fire");
  a.system.attributes.hp.temp = 10; a.system.n5e.chakra.temp = 2;
  let result = planDamage(a, packet(), { flatReduction: 1 });
  assert.deepEqual([result.plan.health, result.plan.chakra], [2, 2]);
  assert.equal(result.after.hp.value, 20); assert.equal(result.after.chakra.value, 20);
  assert.equal(result.concentration.damageAmount, 4);
  a.system.traits.di.value.add("fire");
  result = planDamage(a, packet(), { ignoreDR: true });
  assert.equal(result.plan.health, 0); assert.equal(result.plan.chakra, 8);
  assert.throws(() => planDamage(a, packet(), { flatReduction: NaN }));
});

test("application serializes duplicates, keeps roll identity and emits only one damage event", async () => {
  const a = actor(); let events = 0;
  globalThis.Hooks = { callAll: () => events++ };
  const [first, second] = await Promise.all([applyDamage(a, packet()), applyDamage(a, packet())]);
  assert.equal(first.rollUuid, "ChatMessage.original"); assert.equal(second.duplicate, true);
  assert.equal(a.writes, 1); assert.equal(events, 1);
  assert.deepEqual([a.system.attributes.hp.value, a.system.n5e.chakra.value], [17, 17]);
  await assert.rejects(applyDamage(a, { ...packet(), components: [{ ...packet().components[0], amount: 99 }] }), /already used/);
  a.isOwner = false; await assert.rejects(applyDamage(a, packet()), /ownership/);
});

test("cancelled choices leave both pools untouched and retargeting preserves the roll", async () => {
  const a = actor();
  globalThis.foundry = { applications: { api: { DialogV2: { prompt: async () => null } } } };
  assert.deepEqual(await applyWithChoice(a, packet(["fire", "lightning"])), { cancelled: true });
  assert.equal(a.writes, 0);
  const moved = retarget(packet(), "Actor.interceptor");
  assert.equal(moved.rollUuid, "ChatMessage.original"); assert.equal(moved.targetUuid, "Actor.interceptor");
  assert.equal(packet().targetUuid, "Actor.target");
});

test("Envenomed blocks HP recovery but not Chakra and Chakra-only damage cannot kill", async () => {
  const a = actor();
  a.effects = [{ flags: { "n5e-module": { condition: { id: "poison", key: "envenomed", ranks: 1, sourceRank: null, stackingPolicyId: "add" } } } }];
  a.system.n5e.chakra.value = 5;
  assert.ok((await recover(a, 3, "hp")).blocked);
  assert.equal(a.writes, 0);
  await recover(a, 3, "cp"); assert.equal(a.system.n5e.chakra.value, 8);
  a.system.attributes.hp.value = 0;
  await applyDamage(a, packet(["chakra"], [100]));
  assert.equal(a.statuses.length, 0);
});

test("native schema inheritance and condition roll cards preserve host values and source", async () => {
  class Base { static defineSchema() { return { native: true }; } }
  class Field { constructor(options) { this.options = options; } }
  const config = { Actor: { dataModels: { character: Base, npc: Base } } };
  registerDamageFields(config, { NumberField: Field, BooleanField: Field, SchemaField: Field });
  assert.equal(config.Actor.dataModels.character.defineSchema().native, true);
  assert.ok(new config.Actor.dataModels.npc() instanceof Base);
  globalThis.ChatMessage = { getSpeaker: () => ({}), create: async data => ({ ...data, uuid: "ChatMessage.new", update: async patch => { assert.equal(patch["flags.n5e-module.damage.packet"].rollUuid, "ChatMessage.new"); } }) };
  const p = { ...packet(), rollUuid: null };
  const roll = { total: 16 };
  const message = await postDamage(actor(), p, [roll]);
  assert.equal(message.rolls[0], roll);
});
