import { processTurnEnd } from "./service.mjs";
import { turnStartRequests } from "./planner.mjs";

const previous = new WeakMap();
const queues = new WeakMap();

/** Only the active GM executes automatic condition lifecycle writes. */
function activeGM() { return game.user.isGM && game.users.activeGM?.id === game.user.id; }

/** Capture the outgoing actor before the native combat document advances its turn. */
function capture(combat, changes) {
  if (!activeGM() || !("round" in changes || "turn" in changes)) return;
  previous.set(combat, { actor: combat.combatant?.actor, id: `${combat.uuid}:${combat.round}:${combat.turn}` });
}

/** Process only the outgoing and incoming actors, without scanning a world or applying damage. */
function advance(combat, changes) {
  if (!activeGM() || !("round" in changes || "turn" in changes)) return;
  const outgoing = previous.get(combat);
  previous.delete(combat);
  const actor = combat.combatant?.actor;
  const turnId = `${combat.uuid}:${combat.round}:${combat.turn}`;
  const now = game.time.worldTime;
  const task = (queues.get(combat) ?? Promise.resolve()).catch(() => {}).then(async () => {
    if (outgoing?.actor && outgoing.id !== turnId) {
      await processTurnEnd(outgoing.actor, outgoing.id, now);
      Hooks.callAll("n5e-module.conditionTurnEnded", outgoing.actor, outgoing.id);
    }
    if (actor && outgoing?.id !== turnId) {
      Hooks.callAll("n5e-module.conditionTurnStarted", actor, turnId);
      actor.n5eConditionDamageRequests = turnStartRequests(actor, turnId);
      if (actor.n5eConditionDamageRequests.length) Hooks.callAll("n5e-module.conditionDamageRequested", actor, actor.n5eConditionDamageRequests);
    }
  });
  queues.set(combat, task);
  void task.catch(error => ui.notifications.error(`N5e condition turn processing: ${error.message}`)).finally(() => { if (queues.get(combat) === task) queues.delete(combat); });
}

/** Register bounded actor-specific processing through the native combat lifecycle. */
export function registerConditionLifecycle() {
  Hooks.on("preUpdateCombat", capture);
  Hooks.on("updateCombat", advance);
}
