import { validateContract } from "../contracts.mjs";
import { damagePlan, healPlan } from "./calculation.mjs";
import { applications, modifiers } from "../conditions/planner.mjs";

/** Translate native data paths into the existing planner shape without changing stored actor data. */
export function snapshot(actor) {
  if (actor.n5eConditionError) throw new Error(actor.n5eConditionError);
  const hp = actor.system.attributes?.hp, cp = actor.system.n5e?.chakra;
  if (!hp || !cp) throw new Error("This actor requires the N5e creature resource schema.");
  const mods = modifiers(actor);
  const target = { system: { hp: { value: hp.value, max: hp.max, temp: hp.temp ?? 0 }, cp: { ...cp }, dr: Math.max(0, (actor.system.n5e.dr ?? 0) + mods.dr), traits: { resist: actor.system.traits?.dr?.value ?? [], immune: actor.system.traits?.di?.value ?? [], vuln: actor.system.traits?.dv?.value ?? [] } }, effects: applications(actor).map(r => ({ type: "condition", system: { key: r.key } })) };
  for (const pool of [target.system.hp, target.system.cp]) for (const n of [pool.value, pool.max, pool.temp]) if (!Number.isSafeInteger(n) || n < 0) throw new Error("Resource points must be nonnegative integers.");
  return target;
}

/** Validate defense choices before using the reused planner, preventing invalid multipliers or coercion. */
export function defenseOptions(packet, input = {}) {
  const options = { ...input, crit: packet.critical };
  for (const field of ["pierce", "flatReduction"]) if (options[field] !== undefined && (!Number.isSafeInteger(options[field]) || options[field] < 0)) throw new Error(`Invalid ${field}.`);
  for (const field of ["multiplier", "reactionMultiplier"]) if (options[field] !== undefined && ![0.5, 1, 2].includes(options[field])) throw new Error(`Invalid ${field}.`);
  for (const field of ["ignoreDR", "genjutsu", "piercing"]) if (options[field] !== undefined && typeof options[field] !== "boolean") throw new Error(`Invalid ${field}.`);
  if (options.drOrder !== undefined && !Array.isArray(options.drOrder)) throw new Error("DR order must be an array.");
  return options;
}

/** Keep rolled components intact while calculating HP, Chakra and concentration amounts together. */
export function planDamage(actor, packet, options = {}) {
  validateContract("DamagePacket", packet);
  if (packet.targetUuid !== actor.uuid) throw new Error("Retarget the packet explicitly before applying it.");
  for (const part of packet.components) if ((part.type === "chakra") !== (part.pool === "chakra")) throw new Error("Nonstandard pool conversion requires an explicit feature adapter.");
  const target = snapshot(actor);
  const plan = damagePlan(target, packet.components, defenseOptions(packet, options));
  const result = { version: 1, id: packet.id, packetId: packet.id, targetUuid: actor.uuid, rollUuid: packet.rollUuid, before: { hp: target.system.hp, chakra: target.system.cp }, after: { hp: { ...target.system.hp, value: plan.update["system.hp.value"] ?? target.system.hp.value, temp: plan.update["system.hp.temp"] ?? target.system.hp.temp }, chakra: { ...target.system.cp, value: plan.update["system.cp.value"] ?? target.system.cp.value, temp: plan.update["system.cp.temp"] ?? target.system.cp.temp } }, components: plan.parts.map((part, i) => ({ id: packet.components[i].id, type: part.type, pool: packet.components[i].pool, afterDefenses: part.amount })), concentration: { damageAmount: plan.total, policyId: "combined-final-including-temporary-pools" }, plan };
  validateContract("DamageResult", result);
  return result;
}

/** Use the same source-aware healing restriction and point clamps for both pools. */
export function planRecovery(actor, amount, pool) {
  if (!Number.isSafeInteger(amount) || amount < 0 || !["hp", "cp", "tempHp", "tempCp"].includes(pool)) throw new Error("Invalid recovery amount or pool.");
  return healPlan(snapshot(actor), amount, pool);
}
