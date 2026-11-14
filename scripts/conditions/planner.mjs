import { conditions } from "./registry.mjs";
import { aggregatePenalties, clampRanks } from "./modifiers.mjs";
import { removalResult as coreRemovalResult } from "../core/module/rules/condition-lifecycle.mjs";

/** Read only enabled N5e condition applications, keeping their native effect identity. */
export function applications(actor, { includeExpired = false } = {}) {
  return Array.from(actor.effects ?? []).filter(e => !e.disabled && !e.isSuppressed && e.flags?.["n5e-module"]?.condition).map((e, index) => ({ ...e.flags["n5e-module"].condition, effectId: e.id, creationOrder: e._stats?.createdTime ?? index })).filter(r => includeExpired || r.expiresAt === null || actor.n5eWorldTime === undefined || r.expiresAt > actor.n5eWorldTime);
}

/** Combine ranks only under an explicit source policy, then apply the registry cap once. */
export function effectiveConditions(records) {
  const groups = new Map();
  for (const record of records) {
    if (!conditions[record.key]) continue;
    const group = groups.get(record.key) ?? [];
    group.push(record); groups.set(record.key, group);
  }
  return Array.from(groups, ([key, group]) => {
    const policies = new Set(group.map(r => r.stackingPolicyId));
    if (group.length > 1 && (policies.size !== 1 || !["add", "highest"].includes(group[0].stackingPolicyId))) throw new Error(`Choose an explicit stacking policy for ${key}.`);
    const rank = group[0].stackingPolicyId === "add" ? group.reduce((sum, r) => sum + r.ranks, 0) : Math.max(...group.map(r => r.ranks));
    const strongest = group.reduce((a, b) => ["E", "D", "C", "B", "A", "S"].indexOf(b.sourceRank) > ["E", "D", "C", "B", "A", "S"].indexOf(a.sourceRank) ? b : a);
    return { key, ranks: clampRanks(conditions[key], rank), sourceRank: strongest.sourceRank };
  });
}

/** Produce derived modifiers without updating the actor's stored base statistics. */
export function modifiers(actor) {
  return aggregatePenalties(effectiveConditions(applications(actor)));
}

/** Check native condition immunities plus the source-defined damage-immunity aliases. */
export function immune(actor, key) {
  const ci = new Set(actor.system?.traits?.ci?.value ?? []);
  const di = new Set(actor.system?.traits?.di?.value ?? []);
  return ci.has(key) || ci.has(`n5e.${key}`) || (conditions[key]?.immunityFrom ?? []).some(i => i.startsWith("damage:") && di.has(i.slice(7)));
}

/** Emit source-labelled damage requests; Batch03 owns rolling and applying their damage. */
export function turnStartRequests(actor, turnId) {
  const records = applications(actor);
  return effectiveConditions(records).flatMap(record => {
    const damage = conditions[record.key].turnStartDamage;
    if (!damage) return [];
    const [count, faces] = damage.die.split("d").map(Number);
    return [{ id: `${turnId}:${actor.uuid}:${record.key}`, targetUuid: actor.uuid, source: { id: record.key, kind: "condition", actorUuid: actor.uuid, itemUuid: null, castId: null }, formula: `${count * (damage.perRank ? record.ranks : 1)}d${faces}`, type: damage.type, ignoreDR: true, applicationIds: records.filter(r => r.key === record.key).map(r => r.id) }];
  });
}

/**
 * Removal from the N5e shared rules core (SHARED1b): the core decides success and ranks removed; this keeps the
 * module's record shape, including escalating Sealed DCs stored on the application as removalDC.
 */
export function removalResult(record, option, total) {
  const removalDC = record.removalDC ?? 0;
  const result = coreRemovalResult({ ...option, dc: option.dc + removalDC }, total, record.ranks);
  if (!result.success) return { ranks: record.ranks, removalDC: removalDC + result.raiseDC };
  return { ranks: result.ranks === "all" ? 0 : Math.max(0, record.ranks - result.ranks), removalDC };
}
