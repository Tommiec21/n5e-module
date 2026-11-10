import { test } from "node:test";
import assert from "node:assert/strict";
import { setCondition, removeCondition, processTurnEnd } from "../scripts/conditions/service.mjs";
import { applications, modifiers } from "../scripts/conditions/planner.mjs";
import { expireConditions, conditionRestPlan, movementDamagePlan } from "../scripts/conditions/completion.mjs";
import { finishConditionRest, registerConditionCompletion } from "../scripts/conditions/completion-hooks.mjs";

/** Document-shaped effects retain creation order without requiring a live Foundry world. */
function actor() {
  const effects = []; effects.get = id => effects.find(e => e.id === id);
  return { uuid: "Actor.test", documentName: "Actor", isOwner: true, inCombat: true, effects, system: { traits: {} }, async createEmbeddedDocuments(_t, data) { for (const row of data) { const effect = { ...row, id: `effect-${Math.random()}` }; effect.update = async patch => Object.assign(effect, patch); effects.push(effect); } }, async deleteEmbeddedDocuments(_t, ids) { for (let i = effects.length - 1; i >= 0; i--) if (ids.includes(effects[i].id)) effects.splice(i, 1); } };
}

const record = (id, key, ranks) => ({ version: 1, id, targetUuid: "Actor.test", key, ranks, sourceRank: "D", source: { id, kind: "manual", actorUuid: "Actor.test", itemUuid: null, castId: null }, expiresAt: null, stackingPolicyId: "add" });

test("excess ranks are discarded and oldest source loses one total rank per turn", async () => {
  const a = actor();
  await setCondition(a, record("old", "shocked", 4), { turnId: "previous" });
  await setCondition(a, record("new", "shocked", 3), { turnId: "previous" });
  assert.deepEqual(applications(a).map(r => r.ranks), [4, 1]);
  await processTurnEnd(a, "next", 1);
  assert.deepEqual(applications(a).map(r => r.ranks), [3, 1]);
  await removeCondition(a, "old"); assert.equal(applications(a)[0].ranks, 1);
});

test("world-time expiry removes only elapsed sources and never expires persistent conditions", async () => {
  const a = actor();
  await setCondition(a, record("burn", "burned", 2), { worldTime: 10 });
  await setCondition(a, record("seal", "sealed", 2), { worldTime: 10 });
  a.n5eWorldTime = 70;
  assert.equal(applications(a).length, 1);
  await expireConditions(a, 70);
  assert.equal(a.effects.length, 1); assert.equal(modifiers(a).baseCost.nin, 8);
});

test("Chilled requires more than five willing feet, accumulates movement and fires once per turn", async () => {
  const a = actor(); await setCondition(a, record("cold", "chilled", 2));
  const first = movementDamagePlan(a, { distanceFeet: 5, kind: "willing", eventId: "move" });
  assert.equal(first.request, null);
  const next = movementDamagePlan(a, { distanceFeet: 5, kind: "willing", previousFeet: first.movedFeet, eventId: "move" });
  assert.equal(next.request.formula, "2d10"); assert.equal(next.request.ignoreDR, true);
  assert.equal(movementDamagePlan(a, { distanceFeet: 20, kind: "forced", eventId: "forced" }).request, null);
  assert.equal(movementDamagePlan(a, { distanceFeet: 20, kind: "teleport", eventId: "teleport" }).request, null);
  assert.equal(movementDamagePlan(a, { distanceFeet: 10, kind: "willing", alreadyTriggered: true, eventId: "again" }).request, null);
});

test("Exhaustion rest recovery requires food/drink and Envenomed blocks benefits", async () => {
  const a = actor(); await setCondition(a, record("fatigue", "exhaustion", 4));
  globalThis.game = { time: { worldTime: 100 }, user: { isGM: true, id: "gm" }, users: { activeGM: { id: "gm" } } };
  assert.deepEqual(conditionRestPlan(a, { type: "long", foodAndDrink: false }).removals, []);
  await finishConditionRest(a, { type: "long", foodAndDrink: true });
  assert.equal(applications(a)[0].ranks, 2);
  await setCondition(a, record("poison", "envenomed", 1));
  assert.equal(conditionRestPlan(a, { type: "long", foodAndDrink: true }).blocked, true);
});

test("native combat ending automatically removes Chilled, leaving unrelated sources", async () => {
  const handlers = new Map();
  globalThis.Hooks = { on: (name, callback) => handlers.set(name, callback), once: (name, callback) => handlers.set(name, callback) };
  const a = actor(); await setCondition(a, record("cold", "chilled", 1)); await setCondition(a, record("seal", "sealed", 1));
  registerConditionCompletion(); a.inCombat = false;
  handlers.get("deleteCombat")({ started: false, combatants: [{ actor: a }] });
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.deepEqual(applications(a).map(r => r.key), ["sealed"]);
});
