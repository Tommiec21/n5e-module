import { test } from "node:test";
import assert from "node:assert/strict";
import { beginCast, endCast, payUpkeep, applyCheck, cleanup } from "../scripts/concentration/service.mjs";
import { maintainedCasts, damageCheckPlan, upkeepPlan } from "../scripts/concentration/planner.mjs";
import { chooseReplacement } from "../scripts/concentration/controls.mjs";

/** Native-shaped methods retain effects/resources while tests avoid live Foundry use. */
function actor() {
  const effects = [];
  return { uuid: "Actor.caster", documentName: "Actor", isOwner: true, effects, flags: {}, statuses: new Set(), system: { n5e: { chakra: { value: 20 } } }, async update(updates) { for (const [path, value] of Object.entries(updates)) { const parts = path.split("."); const key = parts.pop(); let target = this; for (const part of parts) target = target[part] ??= {}; target[key] = value; } }, async createEmbeddedDocuments(_type, records) { records.forEach(data => effects.push({ ...data, id: `effect-${Math.random()}` })); }, async deleteEmbeddedDocuments(_type, ids) { for (let i = effects.length - 1; i >= 0; i--) if (ids.includes(effects[i].id)) effects.splice(i, 1); } };
}

/** Separate cast and item identities prove that the service stores actual rank/cost per use. */
function record(id, changes = {}) {
  return { version: 1, id, targetUuid: "Actor.caster", castId: id, itemUuid: `Actor.caster.Item.${id}`, source: { id, kind: "jutsu", actorUuid: "Actor.caster", itemUuid: `Actor.caster.Item.${id}`, castId: id }, baseRank: "D", castRank: "B", actualChakraPaid: 9, stable: false, efficient: false, dependentEffectUuids: [], expiresAt: null, ...changes };
}

globalThis.fromUuid = async () => null;
globalThis.CONFIG = { DND5E: { activityConsumptionTypes: { attribute: { async consume(_config, updates) { assert.equal(this.target, "n5e.chakra.value"); const cost = (await this.resolveCost()).total; if (cost > this.actor.system.n5e.chakra.value) throw new Error("Insufficient Chakra."); updates.actor["system.n5e.chakra.value"] = this.actor.system.n5e.chakra.value - cost; } } } } };

test("two casts persist; third replacement is explicit and cancellation changes nothing", async () => {
  const a = actor();
  await beginCast(a, record("one")); await beginCast(a, record("two"));
  globalThis.foundry = { applications: { api: { DialogV2: { prompt: async () => null } } } };
  assert.deepEqual(await chooseReplacement(a), { cancelled: true });
  await assert.rejects(beginCast(a, record("three")), /Choose one/);
  assert.equal(maintainedCasts(a).length, 2);
  await beginCast(a, record("three"), { replaceCastId: "one" });
  assert.deepEqual(maintainedCasts(a).map(r => r.castId), ["two", "three"]);
  assert.equal(a.system.n5e.chakra.value, 20);
});

test("upkeep uses actual spend, Efficient is free and native consumption pays once", async () => {
  const a = actor();
  await beginCast(a, record("one")); await beginCast(a, record("two", { efficient: true, actualChakraPaid: 20 }));
  assert.equal(upkeepPlan(a).amount, 4);
  await payUpkeep(a, "turn-1"); await payUpkeep(a, "turn-1");
  assert.equal(a.system.n5e.chakra.value, 16);
  assert.equal(maintainedCasts(a)[0].castRank, "B");
});

test("insufficient upkeep needs an affordable explicit selection and ends unpaid casts", async () => {
  const a = actor();
  await beginCast(a, record("one")); await beginCast(a, record("two"));
  a.system.n5e.chakra.value = 5;
  await assert.rejects(payUpkeep(a, "turn-1"), /affordable/);
  assert.equal(maintainedCasts(a).length, 2);
  await payUpkeep(a, "turn-1", ["two"]);
  assert.equal(a.system.n5e.chakra.value, 1);
  assert.deepEqual(maintainedCasts(a).map(r => r.castId), ["two"]);
});

test("one failed check ends both non-Stable casts, with actual ranks and final damage", async () => {
  const a = actor();
  await beginCast(a, record("one")); await beginCast(a, record("two", { castRank: "S" }));
  const plan = damageCheckPlan(a, 10);
  assert.equal(plan.dc, 23);
  await applyCheck(a, "damage-1", plan, 22);
  assert.equal(maintainedCasts(a).length, 0);
  assert.equal((await applyCheck(a, "damage-1", plan, 22)).duplicate, true);
  assert.equal(damageCheckPlan(a, 0), null);
});

test("Stable survives damage failure but expiry/incapacity ends it and only linked effects", async () => {
  const a = actor();
  await beginCast(a, record("one", { stable: true, expiresAt: 10 }));
  await beginCast(a, record("two"));
  const plan = damageCheckPlan(a, 100);
  assert.equal(plan.dc, 50);
  await applyCheck(a, "damage-1", plan, 1);
  assert.deepEqual(maintainedCasts(a).map(r => r.castId), ["one"]);
  a.effects.push({ id: "unrelated", flags: {} });
  await cleanup(a, 10);
  assert.equal(a.effects.length, 1);
  await beginCast(a, record("new", { stable: true }));
  a.statuses.add("unconscious"); await cleanup(a, 11);
  assert.equal(maintainedCasts(a).length, 0); assert.equal(a.effects.length, 1);
});

test("source-linked remote effects require ownership and unrelated effects remain", async () => {
  const a = actor(); let removed = 0;
  globalThis.fromUuid = async uuid => uuid === "Actor.target.ActiveEffect.link" ? { documentName: "ActiveEffect", isOwner: true, delete: async () => removed++ } : null;
  await beginCast(a, record("one", { dependentEffectUuids: ["Actor.target.ActiveEffect.link"] }));
  await endCast(a, "one"); assert.equal(removed, 1);
  a.isOwner = false; await assert.rejects(beginCast(a, record("two")), /ownership/);
});
