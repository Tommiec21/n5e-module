import { applyWithChoice } from "../damage/controls.mjs";
import { retarget } from "../damage/service.mjs";
import { planDamage } from "../damage/planner.mjs";
import { setCondition } from "../conditions/service.mjs";
import { resolveSave } from "./planner.mjs";

const queues = new WeakMap();
const factors = Object.freeze({ full: 1, half: 0.5, double: 2 });

/** One target-local queue prevents duplicate save consequences without locking other defenders. */
export function applySaveOutcome(actor, request, roll) {
  const next = (queues.get(actor) ?? Promise.resolve()).catch(() => {}).then(async () => {
    if (!actor.isOwner) throw new Error("Actor ownership is required.");
    const resolved = resolveSave(request, actor.uuid, roll);
    const { outcome, effect } = resolved;
    const receipts = actor.flags?.["n5e-module"]?.saveReceipts ?? [];
    const fingerprint = JSON.stringify({ request, roll });
    const previous = receipts.find(entry => entry.id === outcome.id);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new Error("Save operation already used for different consequences.");
      return { ...resolved, duplicate: true };
    }
    if (effect.damage !== "none") {
      if (!request.damagePacket) throw new Error("This outcome needs the original unscaled damage packet.");
      if (request.damageOptions?.multiplier !== undefined && request.damageOptions.multiplier !== 1) throw new Error("Save damage must not already have a native half/double multiplier.");
      const packet = retarget(request.damagePacket, actor.uuid);
      packet.id = `${outcome.id}:damage`;
      const options = { ...request.damageOptions, multiplier: factors[effect.damage] };
      planDamage(actor, packet, options);
      const damage = await applyWithChoice(actor, packet, options);
      if (damage.cancelled) return { ...resolved, cancelled: true };
    }
    const worldTime = globalThis.game?.time?.worldTime ?? 0;
    const combat = globalThis.game?.combat;
    for (const [index, item] of effect.conditions.entries()) await setCondition(actor, { version: 1, id: outcome.conditionApplicationIds[index], targetUuid: actor.uuid, source: outcome.source, key: item.key, ranks: item.ranks, sourceRank: request.rank, stackingPolicyId: "add", expiresAt: item.seconds === undefined ? null : worldTime + item.seconds }, { worldTime, turnId: combat ? `${combat.uuid}:${combat.round}:${combat.turn}` : null });
    await actor.update({ "flags.n5e-module.saveReceipts": [...receipts.slice(-49), { id: outcome.id, fingerprint, rollUuid: roll.rollUuid }] });
    return resolved;
  });
  queues.set(actor, next);
  void next.finally(() => { if (queues.get(actor) === next) queues.delete(actor); }).catch(() => {});
  return next;
}
