import { applications, effectiveConditions } from "./planner.mjs";
import { conditions } from "./registry.mjs";
import { setCondition, removeCondition } from "./service.mjs";

/** Delete only elapsed source records, including records already inactive in prepared modifiers. */
export async function expireConditions(actor, worldTime) {
  for (const record of applications(actor, { includeExpired: true })) if (record.expiresAt !== null && record.expiresAt <= worldTime) await removeCondition(actor, record.id);
}

/** Calculate source-by-source rank removal from an explicitly selected allocation order. */
export function rankRemovalPlan(records, key, count, sourceOrder) {
  if (!Number.isSafeInteger(count) || count < 0) throw new Error("Invalid condition rank removal amount.");
  const group = records.filter(r => r.key === key);
  const ordered = sourceOrder.map(id => group.find(r => r.id === id));
  if (ordered.some(r => !r) || new Set(sourceOrder).size !== group.length || sourceOrder.length !== group.length) throw new Error("Select every current source exactly once.");
  let left = count;
  return ordered.map(record => { const removed = Math.min(record.ranks, left); left -= removed; return { record, ranks: record.ranks - removed }; }).filter(change => change.ranks !== change.record.ranks);
}

/** Apply a source-specific removal plan through the existing owner-checked condition services. */
export async function removeConditionRanks(actor, key, count, sourceOrder, worldTime) {
  const records = applications(actor).filter(r => sourceOrder.includes(r.id));
  const plan = rankRemovalPlan(records, key, count, sourceOrder);
  for (const { record, ranks } of plan) {
    if (ranks === 0) await removeCondition(actor, record.id);
    else await setCondition(actor, { ...record, ranks }, { worldTime });
  }
  return plan;
}

/** Discard legacy overflow from newest sources first, so it cannot reappear after older sources end. */
export async function normalizeConditionCaps(actor, worldTime) {
  const records = applications(actor).sort((a, b) => a.creationOrder - b.creationOrder);
  const available = new Map();
  for (const record of records) {
    const cap = conditions[record.key]?.maxRanks;
    if (!(cap > 0)) continue;
    const left = available.has(record.key) ? available.get(record.key) : cap;
    const ranks = Math.min(left, record.ranks);
    available.set(record.key, left - ranks);
    if (ranks === record.ranks) continue;
    if (ranks === 0) await removeCondition(actor, record.id);
    else await setCondition(actor, { ...record, ranks }, { worldTime });
  }
}

/** Envenomed blocks all rest benefits; food and drink are explicit conditions of Exhaustion recovery. */
export function conditionRestPlan(actor, { type, foodAndDrink }) {
  const active = effectiveConditions(applications(actor));
  if (active.some(r => conditions[r.key].flags?.noRestBenefits)) return { blocked: true, removals: [] };
  return { blocked: false, removals: active.filter(r => conditions[r.key].decay?.when === "longRest" && ["long", "full"].includes(type) && foodAndDrink === true).map(r => ({ key: r.key, ranks: conditions[r.key].decay.amount })) };
}

/** Use cumulative willing movement, strict greater-than-five distance and a once-per-turn receipt. */
export function movementDamagePlan(actor, { distanceFeet, kind, previousFeet = 0, alreadyTriggered = false, eventId }) {
  if (!Number.isFinite(distanceFeet) || distanceFeet < 0) throw new Error("Movement distance must be nonnegative feet.");
  if (kind !== "willing") return { movedFeet: previousFeet, request: null };
  const movedFeet = previousFeet + distanceFeet;
  const record = effectiveConditions(applications(actor)).find(r => conditions[r.key].moveDamage);
  if (!record || alreadyTriggered || movedFeet <= conditions[record.key].moveDamage.thresholdFeet) return { movedFeet, request: null };
  const damage = conditions[record.key].moveDamage;
  const [count, faces] = damage.die.split("d").map(Number);
  return { movedFeet, request: { id: eventId, targetUuid: actor.uuid, source: { id: record.key, kind: "condition", actorUuid: actor.uuid, itemUuid: null, castId: null }, formula: `${count * record.ranks}d${faces}`, type: damage.type, ignoreDR: true } };
}
