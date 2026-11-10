import { maintainedCasts, damageCheckPlan, canMaintain, upkeepPlan } from "./planner.mjs";
import { cleanup, payUpkeep } from "./service.mjs";
import { postConcentrationCard } from "./controls.mjs";

const tracked = new Set();
const damageEvents = new WeakMap();

/** Report asynchronous failures without crashing native document or combat preparation. */
function safely(task) { void Promise.resolve(task).catch(error => ui.notifications.error(`N5e concentration: ${error.message}`)); }

/** Track only actors with maintained casts, including unlinked actors encountered through lifecycle events. */
function track(actor) {
  if (!actor) return;
  if (maintainedCasts(actor).length) tracked.add(actor); else tracked.delete(actor);
}

/** After one applied damage event, create one owner-resolved check using its captured cast identities. */
async function damageTaken(actor, result) {
  track(actor);
  if (!canMaintain(actor)) return cleanup(actor, game.time.worldTime);
  const plan = damageCheckPlan(actor, result.concentration.damageAmount);
  if (!plan) return;
  const seen = damageEvents.get(actor) ?? new Set();
  damageEvents.set(actor, seen);
  if (seen.has(result.id)) return;
  seen.add(result.id);
  if (seen.size > 50) seen.delete(seen.values().next().value);
  await postConcentrationCard(actor, { kind: "check", eventId: result.id, plan });
}

/** Charge affordable upkeep automatically, otherwise leave the choice to the player through a card. */
async function startTurn(actor, tickId) {
  if (!game.user.isGM || game.users.activeGM?.id !== game.user.id) return;
  track(actor);
  await cleanup(actor, game.time.worldTime);
  if (!maintainedCasts(actor).length) return;
  let affordable = true;
  try { upkeepPlan(actor); } catch { affordable = false; }
  if (affordable) await payUpkeep(actor, tickId);
  else await postConcentrationCard(actor, { kind: "upkeep", tickId });
}

/** Register only source-scoped native hooks; ordinary dnd5e concentration remains native. */
export function registerConcentrationLifecycle() {
  Hooks.on("n5e-module.damageApplied", (actor, result) => safely(damageTaken(actor, result)));
  Hooks.on("n5e-module.conditionTurnStarted", (actor, tickId) => safely(startTurn(actor, tickId)));
  for (const event of ["createActiveEffect", "updateActiveEffect", "deleteActiveEffect"]) Hooks.on(event, effect => {
    const actor = effect.parent;
    if (actor?.documentName !== "Actor") return;
    track(actor);
    if (actor.isOwner && !canMaintain(actor)) safely(cleanup(actor, game.time.worldTime));
  });
  Hooks.on("updateActor", actor => { track(actor); if (actor.isOwner && !canMaintain(actor)) safely(cleanup(actor, game.time.worldTime)); });
  Hooks.on("updateWorldTime", time => {
    if (!game.user.isGM || game.users.activeGM?.id !== game.user.id) return;
    for (const actor of tracked) safely(cleanup(actor, time));
  });
  Hooks.once("ready", () => { for (const actor of game.actors) track(actor); });
  Hooks.on("canvasReady", canvas => { for (const token of canvas.tokens.placeables) track(token.actor); });
  Hooks.on("dnd5e.preBeginConcentrating", (_actor, _item, _effect, activity) => {
    if (activity?.flags?.["n5e-module"]?.managedConcentration) return false;
  });
}
