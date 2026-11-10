import { degreeOfSuccess, DEGREE_KEYS } from "./degree.mjs";
import { validateContract } from "../contracts.mjs";
import { conditions } from "../conditions/registry.mjs";

/** Validate complete explicit tier tables before any defender rolls or consequences are applied. */
export function validateDefinition(request) {
  if (!request || request.version !== 1 || request.graded !== true || !Number.isFinite(request.dc) || !Number.isSafeInteger(request.shift ?? 0) || !["str", "dex", "con", "int", "wis", "cha"].includes(request.ability)) throw new Error("An explicit graded save definition is required.");
  if (!request.id || !request.activityId || !request.mode || !request.source || !["E", "D", "C", "B", "A", "S"].includes(request.rank)) throw new Error("Save identity, source, mode and rank are required.");
  const mode = request.modes?.[request.mode];
  if (!mode) throw new Error("Unknown save mode.");
  const table = mode.ranks?.[request.rank] ?? mode.outcomes;
  for (const key of DEGREE_KEYS) {
    const row = table?.[key];
    if (!row || !["none", "full", "half", "double"].includes(row.damage) || !Array.isArray(row.conditions) || !Array.isArray(row.manual)) throw new Error(`Invalid outcome table: ${key}.`);
    for (const item of row.conditions) if (!conditions[item.key] || !Number.isSafeInteger(item.ranks) || item.ranks <= 0 || item.seconds !== undefined && (!Number.isFinite(item.seconds) || item.seconds < 0)) throw new Error("Unknown condition or invalid outcome ranks/duration.");
    if (row.outcome !== undefined && !DEGREE_KEYS.includes(row.outcome)) throw new Error("Invalid activity-local outcome remapping.");
    if (row.manual.some(text => typeof text !== "string")) throw new Error("Manual instructions must be text.");
  }
  return table;
}

/** Select one target's consequences without changing the shared original damage packet. */
export function resolveSave(request, targetUuid, roll) {
  const table = validateDefinition(request);
  if (!Number.isFinite(roll.total) || !Number.isInteger(roll.natural) || roll.natural < 1 || roll.natural > 20 || !roll.rollUuid) throw new Error("A native roll reference and kept d20 are required.");
  const result = degreeOfSuccess(roll.total, request.dc, { natural: roll.natural, shift: request.shift ?? 0, isSave: true });
  const effect = structuredClone(table[result.key]);
  const id = `${request.id}:${request.mode}:${targetUuid}`;
  const outcome = { version: 1, id, targetUuid, source: structuredClone(request.source), activityId: request.activityId, rollUuid: roll.rollUuid, policyId: "n5e-five-margin-natural20-floor-v1", outcome: effect.outcome ?? result.key, total: roll.total, dc: request.dc, natural: roll.natural, damagePacketIds: effect.damage === "none" ? [] : [`${id}:damage`], conditionApplicationIds: effect.conditions.map((_condition, index) => `${id}:condition:${index}`) };
  validateContract("SaveOutcome", outcome);
  return { outcome, effect };
}
