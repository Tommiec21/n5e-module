import { applications } from "./planner.mjs";
import { conditions } from "./registry.mjs";
import { expireConditions, normalizeConditionCaps, conditionRestPlan, removeConditionRanks, movementDamagePlan } from "./completion.mjs";
import { removeCondition } from "./service.mjs";
import { lifecyclePolicy } from "./policy.mjs";

const tracked = new Map(), moves = new WeakMap(), positions = new WeakMap();

/** Surface asynchronous lifecycle errors without breaking native updates or silently swallowing a failed write. */
function safely(task) { void Promise.resolve(task).catch(error => ui.notifications.error(`N5e condition lifecycle: ${error.message}`)); }

/** Index only actors with expiring conditions, rather than scanning the world on each clock update. */
function track(actor) {
  if (!actor || actor.documentName !== "Actor") return;
  const deadlines = applications(actor, { includeExpired: true }).map(r => r.expiresAt).filter(t => t !== null);
  if (deadlines.length) tracked.set(actor, Math.min(...deadlines)); else tracked.delete(actor);
}

/** Native combat membership decides whether Chilled remains active outside a combat encounter. */
async function endChilledOutsideCombat(actor) {
  if (!actor?.isOwner) return;
  const inCombat = typeof actor.inCombat === "boolean" ? actor.inCombat : !!game.combat?.started;
  if (!inCombat) for (const record of applications(actor)) if (record.key === "chilled") await removeCondition(actor, record.id);
}

/** Allocate oldest-first when approved; otherwise require an explicit source order from the owner. */
export async function chooseSourceOrder(actor, key) {
  const group = applications(actor).filter(r => r.key === key).sort((a, b) => a.creationOrder - b.creationOrder);
  if (group.length <= 1 || lifecyclePolicy.allocation === "oldest") return group.map(r => r.id);
  if (lifecyclePolicy.allocation !== "player") throw new Error("Condition source-allocation ruling is pending.");
  const order = await foundry.applications.api.DialogV2.prompt({ window: { title: "Condition rank removal order" }, content: '<label>Source positions in preferred order, starting at1<input name="order"></label>', ok: { label: "Choose", callback: (_e, _b, dialog) => dialog.element.querySelector('[name="order"]').value.split(",").map(value => group[Number(value.trim()) - 1]?.id) } });
  return order;
}

/** Apply one successful rest's condition recovery only after confirming its food/drink requirement. */
export async function finishConditionRest(actor, config) {
  if (!actor.isOwner) throw new Error("Actor ownership is required.");
  let foodAndDrink = config.foodAndDrink;
  if (["long", "full"].includes(config.type) && foodAndDrink === undefined && applications(actor).some(r => r.key === "exhaustion")) foodAndDrink = await foundry.applications.api.DialogV2.confirm({ window: { title: "Exhaustion recovery" }, content: "<p>Did this creature ingest the required food and drink?</p>" });
  const plan = conditionRestPlan(actor, { type: config.type, foodAndDrink });
  if (plan.blocked) return plan;
  for (const removal of plan.removals) {
    const order = await chooseSourceOrder(actor, removal.key);
    if (order) await removeConditionRanks(actor, removal.key, removal.ranks, order, game.time.worldTime);
  }
  return plan;
}

/** Movement is classified explicitly; forced movement and teleportation never count as willing walking. */
export async function processMovement(actor, distanceFeet, kind, bucket) {
  const previous = moves.get(actor);
  const state = previous?.bucket === bucket ? previous : { bucket, movedFeet: 0, triggered: false };
  const result = movementDamagePlan(actor, { distanceFeet, kind, previousFeet: state.movedFeet, alreadyTriggered: state.triggered, eventId: `${bucket}:${actor.uuid}:chilled` });
  moves.set(actor, { bucket, movedFeet: result.movedFeet, triggered: state.triggered || !!result.request });
  if (result.request) Hooks.callAll("n5e-module.conditionDamageRequested", actor, [result.request]);
  return result;
}

/** Convert scene measurement to feet, rejecting unknown units rather than inventing a scale. */
function feetForMove(token, before) {
  const distance = canvas.grid.measurePath([{ x: before.x, y: before.y }, { x: token.x, y: token.y }]).distance;
  const units = String(token.parent.grid.units ?? "").toLowerCase();
  if (["ft", "feet", "foot"].includes(units)) return distance;
  if (["m", "meter", "meters", "metres"].includes(units)) return distance * 3.280839895;
  throw new Error("Specify scene distance units as feet/meters or supply explicit movement feet through the API.");
}

/** Register condition-only rest, movement and world-time events through native lifecycle hooks. */
export function registerConditionCompletion() {
  for (const event of ["createActiveEffect", "updateActiveEffect", "deleteActiveEffect"]) Hooks.on(event, effect => { track(effect.parent); if (effect.parent?.documentName === "Actor") safely(endChilledOutsideCombat(effect.parent)); });
  Hooks.on("deleteActor", actor => tracked.delete(actor));
  Hooks.once("ready", () => { for (const actor of game.actors) { track(actor); if (actor.isOwner) safely(expireConditions(actor, game.time.worldTime).then(() => normalizeConditionCaps(actor, game.time.worldTime)).then(() => endChilledOutsideCombat(actor))); } });
  for (const event of ["deleteCombat", "updateCombat"]) Hooks.on(event, combat => { if (!combat.started || event === "deleteCombat") for (const entry of combat.combatants) safely(endChilledOutsideCombat(entry.actor)); });
  Hooks.on("canvasReady", scene => { for (const token of scene.tokens.placeables) { track(token.actor); if (token.actor?.isOwner) safely(expireConditions(token.actor, game.time.worldTime)); } });
  Hooks.on("updateWorldTime", time => {
    if (!game.user.isGM || game.users.activeGM?.id !== game.user.id) return;
    for (const [actor, deadline] of tracked) if (deadline <= time) safely(expireConditions(actor, time).then(() => track(actor)));
  });
  const restGuard = actor => {
    if (conditionRestPlan(actor, { type: "short", foodAndDrink: false }).blocked) { ui.notifications.warn("Envenomed prevents rest benefits."); return false; }
  };
  Hooks.on("dnd5e.preShortRest", restGuard);
  Hooks.on("dnd5e.preLongRest", restGuard);
  Hooks.on("dnd5e.preRestCompleted", restGuard);
  Hooks.on("dnd5e.restCompleted", (actor, _result, config) => { if (actor.isOwner) safely(finishConditionRest(actor, { type: config.type, foodAndDrink: config.n5eFoodAndDrink })); });
  Hooks.on("preUpdateToken", (token, changes) => { if ("x" in changes || "y" in changes) positions.set(token, { x: token.x, y: token.y }); });
  Hooks.on("updateToken", (token, changes, options) => {
    const actor = token.actor, before = positions.get(token); positions.delete(token);
    if (!before || !actor || !applications(actor).some(r => conditions[r.key].moveDamage) || !game.user.isGM || game.users.activeGM?.id !== game.user.id) return;
    safely((async () => {
      const distance = feetForMove(token, before);
      let kind = options.n5eMovementKind;
      if (!kind) kind = await foundry.applications.api.DialogV2.confirm({ window: { title: "Chilled movement" }, content: "<p>Was this willing movement, excluding forced movement and teleportation?</p>" }) ? "willing" : "forced";
      let bucket;
      if (game.combat?.started) bucket = `${game.combat.uuid}:${game.combat.round}:${game.combat.turn}`;
      else if (lifecyclePolicy.outsideCombatMovement === "ends") { await endChilledOutsideCombat(actor); return; }
      else if (lifecyclePolicy.outsideCombatMovement === "sixSeconds") bucket = `world:${Math.floor(game.time.worldTime / 6)}`;
      else if (lifecyclePolicy.outsideCombatMovement === "eachMove") bucket = `move:${crypto.randomUUID()}`;
      else throw new Error("Outside-combat Chilled timing ruling is pending.");
      await processMovement(actor, distance, kind, bucket);
    })());
  });
}
