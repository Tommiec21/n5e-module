import { validateContract } from "../contracts.mjs";
import { maintainedCasts, upkeepPlan, canMaintain } from "./planner.mjs";

const queues = new WeakMap();

/** Serialize concentration writes locally per actor, leaving other actors and dialogs independent. */
function enqueue(actor, action) {
  const next = (queues.get(actor) ?? Promise.resolve()).catch(() => {}).then(() => { if (!actor.isOwner) throw new Error("Actor ownership is required."); return action(); });
  queues.set(actor, next);
  void next.finally(() => { if (queues.get(actor) === next) queues.delete(actor); }).catch(() => {});
  return next;
}

/** Remove only a cast's explicitly linked effects; never delete an unrelated native concentration effect. */
async function endRecord(actor, record) {
  for (const uuid of record.dependentEffectUuids) {
    const effect = await fromUuid(uuid);
    if (!effect || effect.documentName !== "ActiveEffect") continue;
    if (!effect.isOwner) throw new Error("GM or effect-owner permission is required for linked-effect cleanup.");
    await effect.delete();
  }
  await actor.deleteEmbeddedDocuments("ActiveEffect", [record.effectId]);
}

/** Record an already-paid cast; callers must choose replacement before spending its initial Chakra. */
export function beginCast(actor, input, { replaceCastId = null } = {}) {
  return enqueue(actor, async () => {
    const record = structuredClone(validateContract("MaintainedCast", input));
    if (record.source.castId !== record.castId) throw new Error("Cast source identity mismatch.");
    if (record.targetUuid !== actor.uuid || !canMaintain(actor)) throw new Error("Actor cannot maintain this cast.");
    const current = maintainedCasts(actor);
    if (current.some(r => r.castId === record.castId)) return { duplicate: true };
    if (current.some(r => r.itemUuid === record.itemUuid)) throw new Error("The source permits two different maintained jutsu, not duplicate copies.");
    if (current.length >= 2) {
      const replaced = current.find(r => r.castId === replaceCastId);
      if (!replaced) throw new Error("Choose one existing cast to replace before casting.");
      await endRecord(actor, replaced);
    }
    return actor.createEmbeddedDocuments("ActiveEffect", [{ name: "Maintained jutsu", img: "icons/svg/aura.svg", changes: [], flags: { "n5e-module": { maintainedCast: record } } }]);
  });
}

/** Voluntary ending and lifecycle cleanup use the same source-scoped operation. */
export function endCast(actor, castId) {
  return enqueue(actor, async () => {
    const record = maintainedCasts(actor).find(r => r.castId === castId);
    if (record) await endRecord(actor, record);
  });
}

/** Ask the native attribute consumption handler to calculate an approved upkeep spend. */
export async function nativeUpkeepUpdates(actor, amount) {
  const consume = CONFIG.DND5E.activityConsumptionTypes.attribute.consume;
  const context = { actor, target: "n5e.chakra.value", activity: { name: "Concentration upkeep" }, item: { name: "Maintained jutsu" }, resolveCost: async () => ({ total: amount }) };
  const updates = { actor: {}, rolls: [] };
  if (amount) await consume.call(context, {}, updates);
  return updates.actor;
}

/** Pay through native consumption once per turn and end only the player's unselected casts. */
export function payUpkeep(actor, tickId, keepIds) {
  return enqueue(actor, async () => {
    if (typeof tickId !== "string" || !tickId) throw new Error("A combat turn identity is required.");
    const combat = globalThis.game?.combat;
    if (combat && `${combat.uuid}:${combat.round}:${combat.turn}` !== tickId) throw new Error("This upkeep prompt belongs to an earlier turn.");
    if (actor.flags?.["n5e-module"]?.lastUpkeepTick === tickId) return { duplicate: true };
    const plan = upkeepPlan(actor, keepIds);
    const updates = await nativeUpkeepUpdates(actor, plan.amount);
    await actor.update({ ...updates, "flags.n5e-module.lastUpkeepTick": tickId });
    for (const record of plan.ended) await endRecord(actor, record);
    return plan;
  });
}

/** Expiry and incapacity cleanup include Stable casts, unlike damage-only failure. */
export async function cleanup(actor, worldTime) {
  if (!actor.isOwner) return;
  for (const record of maintainedCasts(actor)) if (!canMaintain(actor) || record.expiresAt !== null && record.expiresAt <= worldTime) await endCast(actor, record.castId);
}

/** Resolve one damage check against its captured cast list, leaving later casts untouched. */
export function applyCheck(actor, eventId, plan, total) {
  return enqueue(actor, async () => {
    if (!Number.isFinite(total)) throw new Error("A rolled check total is required.");
    if (!plan || !Number.isFinite(plan.dc) || !Array.isArray(plan.atRisk)) throw new Error("A captured concentration plan is required.");
    const receipts = actor.flags?.["n5e-module"]?.concentrationChecks ?? [];
    if (receipts.includes(eventId)) return { duplicate: true };
    if (total < plan.dc) for (const record of maintainedCasts(actor)) if (plan.atRisk.includes(record.castId)) await endRecord(actor, record);
    await actor.update({ "flags.n5e-module.concentrationChecks": [...receipts.slice(-49), eventId] });
    return { success: total >= plan.dc };
  });
}
