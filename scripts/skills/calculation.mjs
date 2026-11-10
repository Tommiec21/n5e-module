import { progression, sourceSkillKeys } from "./registry.mjs";
import { classMasterySources } from "../classes/progression.mjs";

/** Read the existing N5e level bands instead of inheriting dnd5e's four-level proficiency bands. */
export function band(table, level) {
  let value = table[0][1];
  for (const [minimum, next] of table) if (level >= minimum) value = next;
  return value;
}

/** Keep source score-to-modifier arithmetic identical to the existing N5e rule. */
export const abilityMod = score => Math.floor((Number(score ?? 10) - 10) / 2);

/** Explicit level overrides support test/NPC actors until class progression conversion supplies levels. */
export function actorLevel(data) {
  const level = data.n5e?.level ?? data.details?.level ?? 1;
  if (!Number.isInteger(level) || level < 0 || level > 20) throw new Error("N5e level must be an integer from1 to20.");
  return Math.max(1, level);
}

/** Proficiency starts at3 and increases at the source-defined level thresholds. */
export const proficiencyForLevel = level => band(progression.proficiency, Math.max(1, level));

/** Mastery is an independent additive bonus from distinct sources, capped by actor level. */
export function masteryFor(entries, target, level) {
  const normalized = target.replace(/^skill\.([^.]*)$/, (_match, key) => `skill.${sourceSkillKeys[key] ?? key}`);
  const sources = new Set(entries.filter(entry => entry.target.replace(/^skill\.([^.]*)$/, (_match, key) => `skill.${sourceSkillKeys[key] ?? key}`) === normalized).map(entry => entry.source));
  const rank = Math.min(sources.size, progression.mastery.maxRank, band(progression.mastery.capByLevel, level));
  return { rank, bonus: progression.mastery.bonusByRank[rank], sources: [...sources] };
}

/** Ignore suppressed grants and use explicit source identities, never feature display names as unique IDs. */
export function masterySources(actor) {
  const result = [...(actor.system.n5e?.masterySources ?? []), ...classMasterySources(actor)];
  for (const item of actor.items ?? []) result.push(...(item.flags?.["n5e-module"]?.masterySources ?? []));
  for (const effect of actor.effects ?? []) if (!effect.disabled && !effect.isSuppressed) result.push(...(effect.flags?.["n5e-module"]?.masterySources ?? []));
  return result.filter(entry => typeof entry.target === "string" && typeof entry.source === "string" && entry.source && (!/^ASI\b/i.test(entry.source) || /^(skill|tool)\./.test(entry.target)));
}
