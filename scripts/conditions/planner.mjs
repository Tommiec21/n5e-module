import { conditions } from "./registry.mjs";
import { aggregatePenalties, clampRanks } from "./modifiers.mjs";

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

/** Removal follows the original N5e check formula, including escalating Sealed DCs. */
export function removalResult(record, option, total) {
  const dc = option.dc + (record.removalDC ?? 0);
  if (total < dc) return { ranks: record.ranks, removalDC: (record.removalDC ?? 0) + (option.onFail?.dcIncrease ?? 0) };
  const removed = option.ranks === "all" ? record.ranks : (option.ranks ?? 1) + (option.perOver ? Math.floor((total - dc) / option.perOver.every) * option.perOver.ranks : 0);
  return { ranks: Math.max(0, record.ranks - removed), removalDC: record.removalDC ?? 0 };
}
