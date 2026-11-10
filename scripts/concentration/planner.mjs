import { upkeepCost, concentrationDC } from "./calculation.mjs";

/** Read only this actor's source-linked cast records, without using native single-spell concentration. */
export function maintainedCasts(actor) {
  return Array.from(actor.effects ?? []).filter(e => e.flags?.["n5e-module"]?.maintainedCast).map(e => ({ ...e.flags["n5e-module"].maintainedCast, effectId: e.id }));
}

/** Compute upkeep from actual paid costs, with Efficient independent of damage protection. */
export function upkeepPlan(actor, keepIds) {
  const records = maintainedCasts(actor);
  const selected = keepIds === undefined ? records.map(r => r.castId) : keepIds;
  if (!Array.isArray(selected) || new Set(selected).size !== selected.length || selected.some(id => !records.some(r => r.castId === id))) throw new Error("Choose only current casts once.");
  const kept = records.filter(r => selected.includes(r.castId));
  const amount = kept.reduce((sum, r) => sum + upkeepCost(r.actualChakraPaid, { efficient: r.efficient }), 0);
  if (amount > (actor.system.n5e?.chakra?.value ?? 0)) throw new Error("Choose affordable casts; remaining casts end.");
  return { amount, kept, ended: records.filter(r => !selected.includes(r.castId)) };
}

/** Stable casts still contribute rank to the DC but cannot be ended by damage failure. */
export function damageCheckPlan(actor, damage) {
  if (!Number.isSafeInteger(damage) || damage < 0) throw new Error("Invalid final damage amount.");
  const records = maintainedCasts(actor);
  const atRisk = records.filter(r => !r.stable);
  if (!damage || !atRisk.length) return null;
  return { dc: concentrationDC({ rankValues: records.map(r => ["E", "D", "C", "B", "A", "S"].indexOf(r.castRank)), damage }), castIds: records.map(r => r.castId), atRisk: atRisk.map(r => r.castId) };
}

/** Incapacity, death and loss of required molding are separate from damage-only Stable protection. */
export function canMaintain(actor) {
  const statuses = new Set(actor.statuses ?? []);
  const flags = actor.n5eConditions?.flags ?? {};
  return !["dead", "unconscious", "incapacitated", "stunned", "petrified", "n5e.petrified"].some(k => statuses.has(k)) && !flags.incapacitated && !flags.cannotMoldChakra && !flags.noComponents?.includes("cm");
}
