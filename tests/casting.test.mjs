import { test } from "node:test";
import assert from "node:assert/strict";
import { maximumRank, eligibility, generalPlan } from "../scripts/integration/casting.mjs";
import { castTrial, registerTrialBridge } from "../scripts/integration/bridge.mjs";
import { disciplineNumbers } from "../scripts/skills/native.mjs";
import { preparePayment, commitPayment } from "../scripts/integration/payment.mjs";

/** Native-shaped documents record writes without launching a game server. */
function actor(level = 17) {
  const effects = [];
  return { uuid: "Actor.caster", isOwner: true, flags: {}, effects, items: [], statuses: new Set(), writes: [], system: { details: { level }, abilities: Object.fromEntries(["str", "dex", "con", "int", "wis", "cha"].map(k => [k, { value: 20, mod: 5 }])), attributes: { movement: { walk: 30 } }, n5e: { chakra: { value: 100 } } }, async update(data) { this.writes.push(data); if (data["system.n5e.chakra.value"] !== undefined) this.system.n5e.chakra.value = data["system.n5e.chakra.value"]; }, async createEmbeddedDocuments(_type, rows) { this.writes.push(rows); effects.push(...rows.map((r, i) => ({ ...r, id: `new${i}` }))); }, async deleteEmbeddedDocuments(_type, ids) { this.writes.push(ids); for (let i = effects.length - 1; i >= 0; i--) if (ids.includes(effects[i].id)) effects.splice(i, 1); } };
}
const profile = { version: 1, baseRank: "D", baseCost: 5, discipline: "nin", components: ["hs", "cm"], concentration: true, durationSeconds: 60, activities: { use: { kind: "maintain", parts: [] } } };
const options = { rank: "D", requirementsConfirmed: true, castingAbility: "int" };
const activity = (a, p = profile) => ({ id: "use", actor: a, item: { uuid: "Actor.caster.Item.new", name: "Authored jutsu", flags: { "n5e-module": { casting: p } } } });

/** Supply native attribute consumption and cancelable dialogs as isolated adapters. */
function globals(prompt = async () => null) {
  globalThis.game = { time: { worldTime: 100 } };
  globalThis.foundry = { applications: { api: { DialogV2: { prompt } } } };
  globalThis.Roll = { validate: () => true };
  globalThis.CONFIG = { DND5E: { activityConsumptionTypes: { attribute: { async consume(_c, updates) { updates.actor["system.n5e.chakra.value"] = this.actor.system.n5e.chakra.value - (await this.resolveCost()).total; } } } } };
}
function maintained(a, n) {
  for (let i = 0; i < n; i++) a.effects.push({ id: `old${i}`, flags: { "n5e-module": { maintainedCast: { castId: `cast${i}`, itemUuid: `Item.old${i}`, dependentEffectUuids: [] } } } });
}

test("rank bands, explicit exceptions and ability thresholds distinguish base casts from upcasts and Hijutsu", () => {
  for (const [level, rank] of [[1,"D"],[5,"C"],[9,"B"],[13,"A"],[17,"S"]]) assert.equal(maximumRank(actor(level)), rank);
  const a = actor(5);
  assert.throws(() => eligibility(a, profile, { ...options, rank: "S" }), /available ranks/);
  a.flags = { "n5e-module": { casting: { maxRank: "S" } } };
  a.system.abilities.int.value = 10;
  assert.throws(() => eligibility(a, { ...profile, baseRank: "B" }, { ...options, rank: "B" }), /16/);
  assert.equal(eligibility(a, profile, { ...options, rank: "B" }).steps, 2);
  assert.equal(eligibility(a, { ...profile, baseRank: "B", hijutsu: true }, { ...options, rank: "B" }).rank, "B");
});

test("components, armor, explicit affinities and incapacity fail before consumption", () => {
  const a = actor();
  a.effects.push({ flags: { "n5e-module": { condition: { key: "confused", ranks: 1, expiresAt: null } } } });
  assert.throws(() => eligibility(a, profile, options), /components/);
  a.effects.length = 0;
  a.items.push({ type: "equipment", system: { equipped: true, armor: { type: "heavy" }, proficient: false } });
  assert.throws(() => eligibility(a, profile, options), /armor proficiency/);
  a.items.length = 0;
  assert.throws(() => eligibility(a, { ...profile, requiredTags: ["fire"] }, options), /affinity/);
  a.statuses.add("restrained");
  assert.throws(() => eligibility(a, { ...profile, components: ["m"] }, options), /Mobility/);
});

test("authored upcast expressions and cost choices preserve source math and alternative ability grants", () => {
  const a = actor();
  a.flags = { "n5e-module": { casting: { disciplines: { nin: { ability: "cha", attackBonus: 2, dcBonus: 1 } } } } };
  assert.equal(disciplineNumbers(a, "nin").ability, "cha");
  const p = { ...profile, costChoices: [{ id: "reduce", operation: "subtractions", value: 2 }, { id: "double", operation: "multipliers", value: 2 }], activities: { use: { kind: "attack", parts: [{ dice: { base: 4, perRank: 1, faces: 6 }, type: "fire" }] } } };
  const plan = generalPlan(activity(a, p), { ...options, rank: "C", costChoices: ["reduce", "double"] });
  assert.equal(plan.cost, 12); assert.equal(plan.parts[0].formula, "5d6");
  assert.throws(() => generalPlan(activity(a, p), { ...options, costChoices: ["invented"] }), /cost choice/);
});

test("cancelled third cast preserves Chakra and both existing records", async () => {
  globals(); const a = actor(); maintained(a, 2);
  assert.deepEqual(await castTrial(activity(a), options), { cancelled: true });
  assert.equal(a.system.n5e.chakra.value, 100); assert.equal(a.effects.length, 2); assert.equal(a.writes.length, 0);
});

test("confirmed replacement consumes once and registers actual rank, paid cost and expiry", async () => {
  globals(async ({ ok }) => ok.callback(null, null, { element: { querySelector: () => ({ value: "0" }) } }));
  const a = actor(); maintained(a, 2);
  const result = await castTrial(activity(a), { ...options, rank: "C" });
  assert.equal(result.cost, 8); assert.equal(a.system.n5e.chakra.value, 92);
  const records = a.effects.map(e => e.flags["n5e-module"].maintainedCast);
  assert.equal(records.length, 2); assert.ok(records.some(r => r.castId === "cast1"));
  const added = records.find(r => r.castId === result.castId);
  assert.equal(added.actualChakraPaid, 8); assert.equal(added.castRank, "C"); assert.equal(added.expiresAt, 160);
  await assert.rejects(castTrial(activity(a), options), /already maintained/);
  assert.equal(a.system.n5e.chakra.value, 92);
});

test("actor-local guard rejects overlapping dialogs and native bridge intercepts only marked activities", async () => {
  let finish; globals(() => new Promise(resolve => { finish = resolve; }));
  const a = actor(); maintained(a, 2);
  const pending = castTrial(activity(a), options);
  await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(castTrial(activity(a), options), /finish its current cast/);
  finish(null); await pending;
  const hooks = {}; globalThis.Hooks = { on: (key, fn) => { hooks[key] = fn; } };
  registerTrialBridge();
  assert.equal(hooks["dnd5e.preUseActivity"]({ item: { flags: {} } }), undefined);
  assert.equal(a.writes.length, 0);
});

test("native material consumption aggregates matching components and preparation writes nothing", async () => {
  globals(); const a = actor();
  const calls = [];
  CONFIG.DND5E.activityConsumptionTypes.material = { async consume(_c, updates) { const amount = (await this.resolveCost()).total; calls.push({ target: this.target, amount }); updates.item.push({ _id: this.target, "system.quantity": 10 - amount }); } };
  a.updateEmbeddedDocuments = async (_type, rows) => a.writes.push(rows);
  const updates = await preparePayment(activity(a), 5, [{ itemId: "tool", amount: 1 }, { itemId: "tool", amount: 2 }]);
  assert.equal(a.writes.length, 0); assert.deepEqual(calls, [{ target: "tool", amount: 3 }]);
  await commitPayment(a, updates);
  assert.equal(a.system.n5e.chakra.value, 95); assert.equal(a.writes.length, 2);
});

test("incomplete graded-save profiles and malformed costs fail without changing documents", async () => {
  globals(); const a = actor();
  await assert.rejects(castTrial(activity(a, { ...profile, activities: { use: { kind: "save", saveAbility: "dex" } } }), options), /four save outcomes/);
  assert.equal(a.writes.length, 0);
  assert.throws(() => generalPlan(activity(a, { ...profile, baseCost: -1 }), options), /reviewed Chakra cost/);
});
