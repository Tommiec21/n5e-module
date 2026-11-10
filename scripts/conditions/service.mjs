import { validateContract } from "../contracts.mjs";
import { conditions } from "./registry.mjs";
import { clampRanks } from "./modifiers.mjs";
import { applications, immune, removalResult } from "./planner.mjs";

const queues = new WeakMap();

/** Serialize only this actor's local condition writes; unrelated actors never share a queue. */
function enqueue(actor, action) {
  const previous = queues.get(actor) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(() => { if (!actor.isOwner) throw new Error("Actor ownership is required."); return action(); });
  queues.set(actor, next);
  void next.finally(() => { if (queues.get(actor) === next) queues.delete(actor); }).catch(() => {});
  return next;
}

/** Set one source application, preserving other sources and native effect lifecycle methods. */
export function setCondition(actor, input, { worldTime = 0, turnId = null, increment = false } = {}) {
  return enqueue(actor, async () => {
    const record = structuredClone(validateContract("ConditionApplication", input));
    record.stackingPolicyId = "add";
    const def = conditions[record.key];
    if (!def || record.targetUuid !== actor.uuid) throw new Error("Unknown condition or mismatched target.");
    if (immune(actor, record.key)) return { blocked: "immune" };
    record.ranks = clampRanks(def, record.ranks);
    record.gainedTurnId = input.gainedTurnId ?? turnId;
    if (record.expiresAt === null && !def.persists && !def.endsAt) record.expiresAt = worldTime + 60;
    const existing = applications(actor).find(r => r.id === record.id);
    if (increment && existing) record.ranks = clampRanks(def, existing.ranks + input.ranks);
    const other = applications(actor).filter(r => r.id !== record.id && r.key === record.key);
    if (other.length && (!["add", "highest"].includes(record.stackingPolicyId) || other.some(r => r.stackingPolicyId !== record.stackingPolicyId))) throw new Error("Select a consistent stacking policy before adding another source.");
    const data = { name: `${def.label}${def.maxRanks === null ? "" : ` (${record.ranks})`}`, img: def.icon, statuses: [`n5e.${record.key}`], changes: [], flags: { "n5e-module": { condition: record } } };
    if (existing) return actor.effects.get(existing.effectId).update(data);
    return actor.createEmbeddedDocuments("ActiveEffect", [data]);
  });
}

/** Remove only the selected application, rather than deleting every source of the condition. */
export function removeCondition(actor, applicationId) {
  return enqueue(actor, () => {
    const record = applications(actor).find(r => r.id === applicationId);
    return record ? actor.deleteEmbeddedDocuments("ActiveEffect", [record.effectId]) : null;
  });
}

/** Apply an already-rolled removal check without inventing skill access or spending an action twice. */
export async function resolveRemoval(actor, applicationId, optionIndex, total) {
  const record = applications(actor).find(r => r.id === applicationId);
  const option = conditions[record?.key]?.removal?.[optionIndex];
  if (!record || !Number.isFinite(total) || !Number.isFinite(option?.dc)) throw new Error("A supported removal option and rolled total are required.");
  const result = removalResult(record, option, total);
  return result.ranks ? setCondition(actor, { ...record, ...result }) : removeCondition(actor, applicationId);
}

/** Process one actor's end-of-turn decay and expiry, retaining source-specific timing. */
export async function processTurnEnd(actor, turnId, worldTime) {
  const records = applications(actor);
  const manual = [];
  for (const record of records) {
    const def = conditions[record.key];
    if (record.expiresAt !== null && record.expiresAt <= worldTime) { await removeCondition(actor, record.id); continue; }
    if (record.gainedTurnId === turnId) continue;
    if (def.decay?.when === "turnEnd" && records.filter(r => r.key === record.key).length > 1) { manual.push(record.id); continue; }
    if (def.endsAt === "nextTurnEnd") await removeCondition(actor, record.id);
    else if (def.decay?.when === "turnEnd") {
      const ranks = record.ranks - def.decay.amount;
      if (ranks <= 0) await removeCondition(actor, record.id);
      else await setCondition(actor, { ...record, ranks }, { worldTime });
    }
  }
  return { manualDecayApplicationIds: manual };
}

/** Add ranks within one source using the same serialized native write boundary. */
export function addRanks(actor, input, options = {}) { return setCondition(actor, input, { ...options, increment: true }); }
