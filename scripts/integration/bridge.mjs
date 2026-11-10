import { trialPlan } from "./planner.mjs";
import { nativeUpkeepUpdates, beginCast } from "../concentration/service.mjs";
import { chooseReplacement } from "../concentration/controls.mjs";
import { maintainedCasts } from "../concentration/planner.mjs";
import { postDamage } from "../damage/controls.mjs";
import { recover } from "../damage/service.mjs";
import { baneExample } from "../saves/examples.mjs";
import { rollSave } from "../saves/native.mjs";
import { disciplineNumbers } from "../skills/native.mjs";

const busy = new WeakSet();
const row = (damage, conditions = [], manual = []) => ({ damage, conditions, manual });

/** Author exact source outcomes for the selected trial mode, with unsupported clauses explicitly scheduled. */
export function saveDefinition(plan, source, castId, dc, packet) {
  if (plan.trial.source.name === "Bane") return { ...baneExample(source, plan.rank), id: castId, dc };
  const butterfly = plan.trial.source.name === "Butterfly Kick";
  const condition = butterfly ? [{ key: "concussed", ranks: 1 }] : ["C", "B", "A", "S"].includes(plan.rank) ? [{ key: "sealed", ranks: 1 }] : [];
  const damage = plan.kind === "attackSave" ? "none" : "full";
  const failure = row(damage, condition, butterfly && plan.mode === "finisher" ? ["Knock affected creatures Prone and resolve the printed movement."] : []);
  const success = row(butterfly && plan.mode === "finisher" ? "half" : "none");
  return { version: 1, id: castId, activityId: source.itemUuid, source, rank: plan.rank, mode: plan.mode, graded: true, ability: plan.saveAbility, dc, damagePacket: packet, modes: { [plan.mode]: { outcomes: { critSuccess: success, success, failure, critFailure: failure } } } };
}

/** Post a defender-owned save request when the caster cannot legally roll the target's actor. */
async function requestSave(target, definition) {
  if (target.isOwner) return rollSave(target, definition);
  return ChatMessage.create({ content: '<button type="button" data-n5e-trial-save>Roll save</button>', flags: { "n5e-module": { trialSave: { targetUuid: target.uuid, definition } } } });
}

/** Pay once and join native rolls to existing services without invoking native item consumption again. */
export async function castTrial(activity, options, targets = []) {
  const actor = activity.actor;
  if (!actor?.isOwner || busy.has(actor)) throw new Error("Own the caster and finish its current cast first.");
  if (options.attackBonus == null || options.dc == null) {
    const numbers = disciplineNumbers(actor, activity.item.flags["n5e-module"].trial.source.discipline);
    options = { ...options, attackBonus: options.attackBonus ?? numbers.attack, dc: options.dc ?? numbers.dc };
  }
  const plan = trialPlan(activity, options);
  if (plan.mode === "strike" && !maintainedCasts(actor).some(r => r.itemUuid === activity.item.uuid)) throw new Error("Maintain Arms of Buddha before using its strike.");
  for (const part of plan.parts) if (!Roll.validate(part.formula)) throw new Error("Invalid damage/healing formula.");
  if (plan.cost > actor.system.n5e.chakra.value) throw new Error("Not enough Chakra.");
  const selection = plan.maintained ? await chooseReplacement(actor) : {};
  if (selection.cancelled) return { cancelled: true };
  if (plan.maintained && maintainedCasts(actor).some(r => r.itemUuid === activity.item.uuid)) throw new Error("This jutsu is already maintained.");
  busy.add(actor);
  try {
    const castId = crypto.randomUUID();
    const source = { id: castId, kind: "jutsu", actorUuid: actor.uuid, itemUuid: activity.item.uuid, castId };
    const payment = await nativeUpkeepUpdates(actor, plan.cost);
    if (Object.keys(payment).length) await actor.update(payment);
    if (plan.maintained) {
      const match = /up to\s+(\d+)\s+(minute|hour)/i.exec(plan.trial.source.duration);
      await beginCast(actor, { version: 1, id: castId, targetUuid: actor.uuid, source, castId, itemUuid: activity.item.uuid, baseRank: plan.trial.baseRank, castRank: plan.rank, actualChakraPaid: plan.cost, stable: /\bStable\b/.test(plan.trial.source.keywords), efficient: /\bEfficient\b/.test(plan.trial.source.keywords), dependentEffectUuids: [], expiresAt: match ? game.time.worldTime + Number(match[1]) * (match[2].toLowerCase() === "hour" ? 3600 : 60) : null }, selection);
    }
    let attack = null;
    if (["attack", "attackSave"].includes(plan.kind)) {
      attack = await new CONFIG.Dice.D20Roll("1d20 + @bonus", { bonus: options.attackBonus }).evaluate();
      await attack.toMessage({ speaker: ChatMessage.getSpeaker({ actor }) });
    }
    const rolls = [];
    const critical = options.critical === true || attack?.dice?.some(die => die.faces === 20 && die.results.some(r => r.result === 20 && r.active !== false && !r.discarded));
    for (const part of plan.parts) {
      let formula = critical ? part.formula.replace(/(\d*)d(\d+)/g, (_m, count, faces) => `${(Number(count) || 1) * 2}d${faces}`) : part.formula;
      if (critical && plan.trial.source.name === "Butterfly Kick") formula += ` + (${options.unarmedAbilityModifier ?? actor.system.abilities.str.mod})`;
      rolls.push(await new CONFIG.Dice.DamageRoll(formula, {}, { type: part.type }).evaluate());
    }
    if (plan.kind === "heal") {
      const message = await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), rolls, content: '<button type="button" data-n5e-trial-heal>Apply healing to selected tokens</button>', flags: { "n5e-module": { trialHealing: { amount: rolls[0].total } } } });
      return { castId, cost: plan.cost, messageUuid: message.uuid };
    }
    let packet = null;
    if (rolls.length) {
      packet = { version: 1, id: castId, source, targetUuid: targets[0]?.uuid ?? actor.uuid, kind: "damage", critical: !!critical, rollUuid: null, components: plan.parts.map((part, index) => ({ id: `${castId}:${index}`, type: part.type, pool: part.type === "chakra" ? "chakra" : "hp", amount: rolls[index].total })) };
      const message = await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), rolls, content: "" });
      packet.rollUuid = message.uuid;
    }
    for (const target of targets) {
      if (["attack", "attackSave"].includes(plan.kind) && packet) await postDamage(target, { ...packet, targetUuid: target.uuid });
      if (plan.saveAbility) await requestSave(target, saveDefinition(plan, source, castId, options.dc, packet));
    }
    return { castId, cost: plan.cost, attack, packet, plan };
  } finally { busy.delete(actor); }
}

/** Source restrictions apply even when the user selects a healing recipient after casting. */
export async function applyTrialHealing(actor, amount) {
  const type = actor.system.details?.type?.value ?? actor.system.details?.type;
  if (["undead", "construct"].includes(type)) throw new Error("Adept Healing has no effect on undead or constructs.");
  return recover(actor, amount, "hp");
}

/** Collect explicit trial inputs until general discipline/progression and component adapters are delivered. */
export async function useTrial(activity) {
  const options = await foundry.applications.api.DialogV2.prompt({ window: { title: activity.item.name }, content: '<label>Rank<select name="rank"><option>D</option><option>C</option><option>B</option><option>A</option><option>S</option></select></label><label>Full attack bonus<input name="attack" type="number"></label><label>Save DC<input name="dc" type="number"></label><label>Full unarmed formula<input name="unarmed"></label><label><input name="confirmed" type="checkbox">I confirmed source requirements, range, targets and mode eligibility</label>', ok: { label: "Cast", callback: (_e, _b, dialog) => { const get = n => dialog.element.querySelector(`[name="${n}"]`); return { rank: get("rank").value, attackBonus: get("attack").value === "" ? null : Number(get("attack").value), dc: get("dc").value === "" ? null : Number(get("dc").value), unarmedFormula: get("unarmed").value, requirementsConfirmed: get("confirmed").checked }; } } });
  if (options === null || options === undefined) return { cancelled: true };
  return castTrial(activity, options, Array.from(game.user.targets).map(token => token.actor).filter(Boolean));
}

/** Route only trial activities through the bridge, leaving all other native item use unchanged. */
export function registerTrialBridge() {
  Hooks.on("dnd5e.preUseActivity", activity => {
    if (!activity.item.flags?.["n5e-module"]?.trial) return;
    void useTrial(activity).catch(error => ui.notifications.error(error.message));
    return false;
  });
  Hooks.on("renderChatMessageHTML", (message, html) => {
    const save = message.flags?.["n5e-module"]?.trialSave;
    if (save) html.querySelector("[data-n5e-trial-save]")?.addEventListener("click", () => { void fromUuid(save.targetUuid).then(actor => rollSave(actor, save.definition)).catch(error => ui.notifications.error(error.message)); });
    const heal = message.flags?.["n5e-module"]?.trialHealing;
    if (heal) html.querySelector("[data-n5e-trial-heal]")?.addEventListener("click", async event => {
      const button = event.currentTarget; button.disabled = true;
      try {
        for (const token of game.user.targets) {
          const actor = token.actor;
          if ((actor.flags?.["n5e-module"]?.trialHealingReceipts ?? []).includes(message.uuid)) continue;
          const result = await applyTrialHealing(actor, heal.amount);
          if (!result.blocked) await actor.update({ "flags.n5e-module.trialHealingReceipts": [...(actor.flags?.["n5e-module"]?.trialHealingReceipts ?? []).slice(-49), message.uuid] });
        }
      } catch (error) { ui.notifications.error(error.message); }
      finally { button.disabled = false; }
    });
  });
}
