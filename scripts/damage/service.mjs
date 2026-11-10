import { planDamage, planRecovery } from "./planner.mjs";

const queues = new WeakMap();

/** Lock only this actor's local resource operations, not every actor or the whole game. */
function enqueue(actor, action) {
  const next = (queues.get(actor) ?? Promise.resolve()).catch(() => {}).then(() => { if (!actor.isOwner) throw new Error("Actor ownership is required."); return action(); });
  queues.set(actor, next);
  void next.finally(() => { if (queues.get(actor) === next) queues.delete(actor); }).catch(() => {});
  return next;
}

/** Map old planner output paths onto native HP and the inherited Chakra extension. */
function nativeUpdates(update) {
  return Object.fromEntries(Object.entries(update).map(([key, value]) => [key.replace("system.hp.", "system.attributes.hp.").replace("system.cp.", "system.n5e.chakra.").replace("system.deathSaves.", "system.attributes.death."), value]));
}

/** Apply N5e zero-HP outcomes once without also calling native applyDamage. */
async function applyZeroState(actor, result) {
  const p = result.plan;
  if (p.health <= 0) return;
  if (p.instantDeath || (actor.type === "npc" && actor.system.n5e.diesAtZero && p.dropsToZero) || (actor.system.attributes.death?.failure ?? 0) >= 3) await actor.toggleStatusEffect("dead", { active: true });
  else if (p.dropsToZero) await actor.toggleStatusEffect("unconscious", { active: true });
}

/** One bounded receipt prevents ordinary local retries, without claiming distributed atomic updates. */
export function applyDamage(actor, packet, options = {}) {
  return enqueue(actor, async () => {
    const receipts = actor.flags?.["n5e-module"]?.damageReceipts ?? [];
    const fingerprint = JSON.stringify({ packet, options });
    const previous = receipts.find(r => r.id === packet.id && r.targetUuid === actor.uuid);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new Error("Operation ID was already used for different damage.");
      return { duplicate: true, rollUuid: packet.rollUuid };
    }
    const result = planDamage(actor, packet, options);
    if (result.plan.requiresDROrder) throw new Error("The damaged creature must choose DR type order before application.");
    const update = nativeUpdates(result.plan.update);
    if (result.plan.deathFailures) update["system.attributes.death.failure"] = Math.min(3, (actor.system.attributes.death?.failure ?? 0) + result.plan.deathFailures);
    update["flags.n5e-module.damageReceipts"] = [...receipts.slice(-49), { id: packet.id, targetUuid: actor.uuid, fingerprint, rollUuid: packet.rollUuid }];
    await actor.update(update, { n5eDamageApplied: true });
    await applyZeroState(actor, result);
    if (result.concentration.damageAmount > 0) globalThis.Hooks?.callAll("n5e-module.damageApplied", actor, result);
    return result;
  });
}

/** Retarget explicitly while preserving the source roll and typed damage components. */
export function retarget(packet, actorUuid) {
  return { ...structuredClone(packet), targetUuid: actorUuid };
}

/** Recovery never emits damage events and cannot bypass Envenomed's HP recovery restriction. */
export function recover(actor, amount, pool = "hp") {
  return enqueue(actor, async () => {
    const result = planRecovery(actor, amount, pool);
    if (result.blocked) return result;
    await actor.update(nativeUpdates(result.update));
    if (result.revived) await actor.toggleStatusEffect("unconscious", { active: false });
    return result;
  });
}
