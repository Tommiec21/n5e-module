const tracked = new Set();
const winners = new WeakMap();

/** Prepare one most-potent source winner per actor preparation, allowing weaker effects to resume later. */
function sourceWinners(actor) {
  if (winners.has(actor)) return winners.get(actor);
  const result = new Map();
  for (const effect of actor.effects ?? []) {
    const data = effect.flags?.["n5e-module"]?.castEffect;
    if (!data?.stackKey || effect.disabled) continue;
    const prior = result.get(data.stackKey);
    if (!prior || data.potency > prior.potency) result.set(data.stackKey, { id: effect.id, potency: data.potency });
  }
  winners.set(actor, result);
  return result;
}

/** Clear the source index once per native actor preparation, rather than rebuilding it on every roll. */
export function sourceEffectActorClass(Base) {
  return class extends Base { prepareData() { winners.delete(this); super.prepareData(); } };
}

/** Retain native suppression and add the core rule that duplicate same-source effects never stack. */
export function sourceEffectClass(Base) {
  return class extends Base {
    get isSuppressed() {
      if (super.isSuppressed) return true;
      const data = this.flags?.["n5e-module"]?.castEffect;
      return data?.stackKey && this.parent?.documentName === "Actor" ? sourceWinners(this.parent).get(data.stackKey)?.id !== this.id : false;
    }
  };
}

/** Read only active source-owned attack dice, leaving native weapon bonuses on the native path. */
export function attackEffectFormula(actor) {
  const seen = new Set();
  return Array.from(actor.effects ?? []).filter(e => !e.disabled && !e.isSuppressed && e.flags?.["n5e-module"]?.castEffect).flatMap(e => {
    const data = e.flags["n5e-module"].castEffect;
    if (!data.attackFormula || seen.has(data.source.itemUuid)) return [];
    seen.add(data.source.itemUuid); return [`(${data.attackFormula})`];
  }).join(" + ");
}

/** Apply one idempotent source-linked effect; native dnd5e deletes dependencies when concentration ends. */
export async function applyCastEffect(actor, request) {
  if (!actor?.isOwner) throw new Error("Actor ownership is required.");
  if (actor.uuid !== request.targetUuid) throw new Error("Effect recipient mismatch.");
  const previous = Array.from(actor.effects ?? []).find(e => e.flags?.["n5e-module"]?.castEffect?.id === request.id);
  if (previous) return previous;
  if (request.dependentOn) {
    const source = await fromUuid(request.dependentOn);
    if (source?.flags?.["n5e-module"]?.maintainedCast?.castId !== request.source.castId) throw new Error("The originating concentration has ended.");
  }
  const data = { name: request.name, img: request.img, origin: request.source.itemUuid, transfer: false, changes: structuredClone(request.changes), flags: { "n5e-module": { castEffect: structuredClone(request), masterySources: request.masteryTargets.map(target => ({ target, source: request.source.itemUuid })) }, ...(request.dependentOn ? { dnd5e: { dependentOn: request.dependentOn } } : {}) };
  if (request.expiresAt !== null) data.duration = { startTime: game.time.worldTime, seconds: Math.max(0, request.expiresAt - game.time.worldTime) };
  const result = await actor.createEmbeddedDocuments("ActiveEffect", [data]);
  winners.delete(actor);
  tracked.add(actor);
  return result;
}

/** Deliver an owner-approved effect request rather than writing another player's actor through the caster. */
export async function deliverCastEffect(actor, request) {
  if (actor.isOwner) return applyCastEffect(actor, request);
  return ChatMessage.create({ content: '<button type="button" data-n5e-buff-apply>Apply effect</button>', flags: { "n5e-module": { castEffectRequest: request } } });
}

/** Delete only expired source effects and retain unrelated native effects. */
export async function expireCastEffects(actor, { time = game.time.worldTime, phase = null, turnId = null } = {}) {
  const expired = Array.from(actor.effects ?? []).filter(e => {
    const r = e.flags?.["n5e-module"]?.castEffect;
    return r && (r.expiresAt !== null && r.expiresAt <= time || phase && r.endsAt === phase && r.gainedTurnId !== turnId);
  });
  if (expired.length && actor.isOwner) await actor.deleteEmbeddedDocuments("ActiveEffect", expired.map(e => e.id));
  if (!Array.from(actor.effects ?? []).some(e => e.flags?.["n5e-module"]?.castEffect)) tracked.delete(actor);
}

/** Bound expiry to tracked actors and turn events already emitted by the existing condition lifecycle. */
export function registerCastEffects() {
  const safely = task => void task.catch(error => ui.notifications.error(error.message));
  Hooks.once("ready", () => { for (const actor of game.actors) if (Array.from(actor.effects).some(e => e.flags?.["n5e-module"]?.castEffect)) tracked.add(actor); });
  Hooks.on("createActiveEffect", effect => { if (effect.flags?.["n5e-module"]?.castEffect) tracked.add(effect.parent); });
  Hooks.on("updateWorldTime", time => { if (game.user === game.users.activeGM) for (const actor of tracked) safely(expireCastEffects(actor, { time })); });
  Hooks.on("n5e-module.conditionTurnEnded", (actor, turnId) => { if (game.user === game.users.activeGM) safely(expireCastEffects(actor, { phase: "turnEnd", turnId: null })); });
  Hooks.on("renderChatMessageHTML", (message, html) => {
    const request = message.flags?.["n5e-module"]?.castEffectRequest;
    if (!request) return;
    html.querySelector("[data-n5e-buff-apply]")?.addEventListener("click", () => safely(fromUuid(request.targetUuid).then(actor => applyCastEffect(actor, request))));
  });
}
