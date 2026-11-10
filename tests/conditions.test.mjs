import { test } from "node:test";
import assert from "node:assert/strict";
import { setCondition, removeCondition, resolveRemoval, processTurnEnd } from "../scripts/conditions/service.mjs";
import { applications, modifiers, turnStartRequests } from "../scripts/conditions/planner.mjs";
import { conditionActorClass } from "../scripts/conditions/actor.mjs";

/** Use a document-shaped stand-in to check writes without launching a live Foundry instance. */
function actor() {
  const effects = new Map();
  const a = { uuid: "Actor.test", isOwner: true, effects: [], system: { traits: { ci: { value: new Set() }, di: { value: new Set() } } } };
  const refresh = () => { a.effects = Array.from(effects.values()); a.effects.get = id => effects.get(id); };
  a.createEmbeddedDocuments = async (_type, records) => records.map(data => {
    const effect = { ...data, id: `effect-${effects.size}`, disabled: false, update: async patch => { Object.assign(effect, patch); refresh(); return effect; } };
    effects.set(effect.id, effect); refresh(); return effect;
  });
  a.deleteEmbeddedDocuments = async (_type, ids) => { ids.forEach(id => effects.delete(id)); refresh(); };
  return a;
}

/** Each source has a stable application identity and an explicitly selected stacking policy. */
function record(id, key, ranks) {
  return { version: 1, id, targetUuid: "Actor.test", source: { id, kind: "manual", actorUuid: "Actor.test", itemUuid: null, castId: null }, key, ranks, sourceRank: "D", stackingPolicyId: "add", expiresAt: null };
}

test("rank caps, source removal and Sealed aggregation do not duplicate penalties", async () => {
  const a = actor();
  await setCondition(a, record("first", "sealed", 4));
  await setCondition(a, record("second", "sealed", 3));
  assert.equal(modifiers(a).baseCost.nin, 20);
  await removeCondition(a, "first");
  assert.equal(modifiers(a).baseCost.nin, 12);
  assert.equal(applications(a).length, 1);
  await setCondition(a, record("second", "sealed", 2));
  assert.equal(applications(a).length, 1);
  assert.equal(modifiers(a).baseCost.gen, 8);
});

test("Burned requests retain source identity and never write HP", async () => {
  const a = actor();
  await setCondition(a, record("burn", "burned", 2));
  const before = structuredClone(a.system);
  const [request] = turnStartRequests(a, "turn-1");
  assert.equal(request.formula, "2d8");
  assert.equal(request.ignoreDR, true);
  assert.deepEqual(request.applicationIds, ["burn"]);
  assert.deepEqual(a.system, before);
});

test("immunity, unranked state and next-turn decay retain source timing", async () => {
  const a = actor();
  a.system.traits.di.value.add("poison");
  assert.deepEqual(await setCondition(a, record("poison", "envenomed", 2)), { blocked: "immune" });
  await setCondition(a, record("daze", "dazed", 4), { turnId: "turn-1" });
  await setCondition(a, record("shock", "shocked", 2), { turnId: "turn-1" });
  assert.equal(applications(a).find(r => r.key === "dazed").ranks, 1);
  await processTurnEnd(a, "turn-1", 0);
  assert.equal(applications(a).length, 2);
  await processTurnEnd(a, "turn-2", 1);
  assert.equal(applications(a).length, 1);
  assert.equal(applications(a)[0].ranks, 1);
});

test("removal DC escalation and owner checks use native effect updates only", async () => {
  const a = actor();
  await setCondition(a, record("seal", "sealed", 2));
  await resolveRemoval(a, "seal", 0, 10);
  assert.equal(applications(a)[0].removalDC, 4);
  await resolveRemoval(a, "seal", 0, 24);
  assert.equal(applications(a)[0].ranks, 1);
  a.isOwner = false;
  await assert.rejects(removeCondition(a, "seal"), /ownership/);
});

test("native inheritance resets derived changes on every prepare and isolates invalid flags", () => {
  class NativeActor {
    prepareData() { this.system = { attributes: { ac: { value: 15 } }, abilities: { str: { bonuses: { check: "0", save: "0" } } } }; }
  }
  const Derived = conditionActorClass(NativeActor);
  const a = new Derived();
  a.effects = [{ id: "effect", flags: { "n5e-module": { condition: record("ex", "exhaustion", 2) } } }];
  a.prepareData(); assert.equal(a.system.attributes.ac.value, 13);
  a.prepareData(); assert.equal(a.system.attributes.ac.value, 13);
  assert.equal(a.system.abilities.str.bonuses.save, "(0) + (-2)");
  a.effects.push({ flags: { "n5e-module": { condition: { ...record("other", "exhaustion", 1), stackingPolicyId: null } } } });
  assert.doesNotThrow(() => a.prepareData());
  assert.ok(a.n5eConditionError);
});
