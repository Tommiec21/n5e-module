import { trialPlan } from "./planner.mjs";
import { beginCast } from "../concentration/service.mjs";
import { validateDefinition } from "../saves/planner.mjs";
import { chooseReplacement } from "../concentration/controls.mjs";
import { maintainedCasts } from "../concentration/planner.mjs";
import { postDamage } from "../damage/controls.mjs";
import { recover } from "../damage/service.mjs";
import { baneExample } from "../saves/examples.mjs";
import { rollSave } from "../saves/native.mjs";
import { disciplineNumbers } from "../skills/native.mjs";
import { castingProfile, generalPlan, eligibility, maximumRank, ranks } from "./casting.mjs";
import { preparePayment, commitPayment } from "./payment.mjs";
import { canMaintain } from "../concentration/planner.mjs";
import { deliverCastEffect, attackEffectFormula } from "./effects.mjs";

const busy = new WeakSet();
const row = (damage, conditions = [], manual = []) => ({ damage, conditions, manual });

/** Author exact source outcomes for the selected trial mode, with unsupported clauses explicitly scheduled. */
export function saveDefinition(plan, source, castId, dc, packet) {
  if (plan.profile) return { version: 1, id: castId, activityId: source.itemUuid, source, rank: plan.rank, mode: plan.mode, graded: true, ability: plan.saveAbility, dc, damagePacket: packet, modes: { [plan.mode]: { outcomes: plan.outcomes } } };
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
  busy.add(actor);
  try {
  const profile = castingProfile(activity);
  const trial = activity.item.flags?.["n5e-module"]?.trial;
  if (profile?.allowedAbilities && !profile.allowedAbilities.includes(options.castingAbility)) throw new Error("Choose one of this clan's Hijutsu casting abilities.");
  const numbers = disciplineNumbers(actor, profile?.discipline ?? trial?.source.discipline, { ability: profile?.allowedAbilities ? options.castingAbility : undefined });
  options = { ...options, rank: options.rank ?? profile?.baseRank ?? trial?.baseRank, castingAbility: numbers.ability, attackBonus: options.attackBonus ?? numbers.attack, dc: options.dc ?? numbers.dc };
  if (!profile) eligibility(actor, { baseRank: trial.baseRank, discipline: trial.source.discipline, components: trial.source.components.split(",").map(c => c.trim().toLowerCase()) }, options);
  const plan = profile ? generalPlan(activity, options) : trialPlan(activity, options);
  if (plan.effects) {
    targets = plan.recipient === "self" ? [actor] : [...new Map(targets.map(t => [t.uuid, t])).values()];
    if (!targets.length || plan.maxTargets && targets.length > plan.maxTargets || plan.excludeSelf && targets.some(t => t.uuid === actor.uuid)) throw new Error("Choose eligible effect recipients before casting.");
  }
  if (plan.mode === "strike" && !maintainedCasts(actor).some(r => r.itemUuid === activity.item.uuid)) throw new Error("Maintain Arms of Buddha before using its strike.");
  for (const part of plan.parts) if (!Roll.validate(part.formula)) throw new Error("Invalid damage/healing formula.");
  if (plan.cost > actor.system.n5e.chakra.value) throw new Error("Not enough Chakra.");
  if (plan.maintained && !canMaintain(actor)) throw new Error("The caster cannot maintain concentration.");
  if (plan.profile && plan.saveAbility && !["critSuccess", "success", "failure", "critFailure"].every(k => plan.outcomes?.[k])) throw new Error("Author all four save outcomes before casting.");
  await preparePayment(activity, plan.cost, profile?.consumes ?? []);
  if (plan.saveAbility) validateDefinition(saveDefinition(plan, { id: "preflight", kind: "jutsu", actorUuid: actor.uuid, itemUuid: activity.item.uuid, castId: "preflight" }, "preflight", options.dc, null));
  const selection = plan.maintained ? await chooseReplacement(actor) : {};
  if (selection.cancelled) return { cancelled: true };
  if (plan.maintained && maintainedCasts(actor).some(r => r.itemUuid === activity.item.uuid)) throw new Error("This jutsu is already maintained.");
  if (plan.maintained && maintainedCasts(actor).length >= 2 && !maintainedCasts(actor).some(r => r.castId === selection.replaceCastId)) throw new Error("The concentration selection changed; choose again.");
  if (plan.cost > actor.system.n5e.chakra.value) throw new Error("Chakra changed while choosing; cast again.");
    const castId = crypto.randomUUID();
    const source = { id: castId, kind: "jutsu", actorUuid: actor.uuid, itemUuid: activity.item.uuid, castId };
    await commitPayment(actor, await preparePayment(activity, plan.cost, profile?.consumes ?? []));
    if (plan.maintained) {
      const match = /up to\s+(\d+)\s+(minute|hour)/i.exec(plan.trial.source.duration);
      await beginCast(actor, { version: 1, id: castId, targetUuid: actor.uuid, source, castId, itemUuid: activity.item.uuid, baseRank: plan.trial.baseRank, castRank: plan.rank, actualChakraPaid: plan.cost, stable: plan.stable ?? /\bStable\b/.test(plan.trial.source.keywords), efficient: plan.efficient ?? /\bEfficient\b/.test(plan.trial.source.keywords), dependentEffectUuids: [], expiresAt: plan.durationSeconds != null ? game.time.worldTime + plan.durationSeconds : match ? game.time.worldTime + Number(match[1]) * (match[2].toLowerCase() === "hour" ? 3600 : 60) : null }, selection);
    }
    let attack = null;
    if (["attack", "attackSave"].includes(plan.kind)) {
      const extra = attackEffectFormula(actor);
      attack = await new CONFIG.Dice.D20Roll(`1d20 + @bonus${extra ? ` + ${extra}` : ""}`, { bonus: options.attackBonus }).evaluate();
      await attack.toMessage({ speaker: ChatMessage.getSpeaker({ actor }) });
    }
    const rolls = [];
    const critical = ["attack", "attackSave"].includes(plan.kind) && (options.critical === true || attack?.dice?.some(die => die.faces === 20 && die.results.some(r => r.result === 20 && r.active !== false && !r.discarded)));
    for (const part of plan.parts) {
      let formula = critical ? part.formula.replace(/(\d*)d(\d+)/g, (_m, count, faces) => `${(Number(count) || 1) * 2}d${faces}`) : part.formula;
      if (critical && plan.trial.source.name === "Butterfly Kick") formula += ` + (${options.unarmedAbilityModifier ?? actor.system.abilities.str.mod})`;
      rolls.push(await new CONFIG.Dice.DamageRoll(formula, {}, { type: part.type }).evaluate());
    }
    if (plan.kind === "heal") {
      const message = await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), rolls, content: '<button type="button" data-n5e-trial-heal>Apply healing to selected tokens</button>', flags: { "n5e-module": { trialHealing: { amount: rolls.reduce((sum, roll) => sum + roll.total, 0), excludedTypes: profile?.healingExcludedTypes ?? ["undead", "construct"] } } } });
      return { castId, cost: plan.cost, messageUuid: message.uuid };
    }
    let packet = null;
    if (rolls.length) {
      packet = { version: 1, id: castId, source, targetUuid: targets[0]?.uuid ?? actor.uuid, kind: "damage", critical: !!critical, rollUuid: null, components: plan.parts.map((part, index) => ({ id: `${castId}:${index}`, type: part.type, pool: part.type === "chakra" ? "chakra" : "hp", amount: rolls[index].total })) };
      const message = await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), rolls, content: "" });
      packet.rollUuid = message.uuid;
    }
    for (const target of targets) {
      if (plan.effects) {
        const concentration = Array.from(actor.effects ?? []).find(e => e.flags?.["n5e-module"]?.maintainedCast?.castId === castId);
        if (plan.maintained && !concentration?.uuid) throw new Error("Concentration ended before the effect could be linked.");
        await deliverCastEffect(target, { id: `${castId}:${target.uuid}`, source, targetUuid: target.uuid, name: activity.item.name, img: activity.item.img, changes: plan.effects.changes ?? [], masteryTargets: plan.effects.masteryTargets ?? [], attackFormula: plan.effects.attackFormula ?? null, stackKey: activity.item.flags["n5e-module"].selected?.sourceId ?? activity.item.system.identifier, potency: ranks.indexOf(plan.rank), expiresAt: plan.durationSeconds === null ? null : game.time.worldTime + plan.durationSeconds, endsAt: plan.effects.endsAt ?? null, gainedTurnId: game.combat ? `${game.combat.uuid}:${game.combat.round}:${game.combat.turn}` : null, dependentOn: concentration?.uuid ?? null });
      }
      if (["attack", "attackSave"].includes(plan.kind) && packet) await postDamage(target, { ...packet, targetUuid: target.uuid });
      if (plan.saveAbility) await requestSave(target, saveDefinition(plan, source, castId, options.dc, packet));
    }
    if (!rolls.length && plan.kind === "maintain") await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), flavor: activity.item.name, content: plan.effects ? "Effect applied or awaiting recipient." : "Cast — resolve source effects manually." });
    return { castId, cost: plan.cost, attack, packet, plan };
  } finally { busy.delete(actor); }
}

/** Source restrictions apply even when the user selects a healing recipient after casting. */
export async function applyTrialHealing(actor, amount, excludedTypes = ["undead", "construct"]) {
  const type = actor.system.details?.type?.value ?? actor.system.details?.type;
  if (excludedTypes.includes(type)) throw new Error("This jutsu cannot heal this creature type.");
  return recover(actor, amount, "hp");
}

/** Collect explicit trial inputs until general discipline/progression and component adapters are delivered. */
export async function useTrial(activity) {
  const profile = castingProfile(activity);
  const base = profile?.baseRank ?? activity.item.flags["n5e-module"].trial.baseRank;
  const allowed = ranks.filter(r => (profile?.upcast !== false || r === base) && ranks.indexOf(r) >= ranks.indexOf(base) && ranks.indexOf(r) <= ranks.indexOf(maximumRank(activity.actor)));
  const choices = profile?.costChoices?.filter(c => !c.automatic) ?? [];
  const rankOptions = allowed.map(r => '<option>' + r + '</option>').join('');
  const costOptions = choices.map((_c, i) => '<label><input name="cost" type="checkbox" value="' + i + '">Cost option ' + (i + 1) + '</label>').join('');
  const abilityOptions = profile?.allowedAbilities ? '<label>Hijutsu ability<select name="ability">' + profile.allowedAbilities.map(a => '<option>' + a + '</option>').join('') + '</select></label>' : '';
  const content = '<label>Rank<select name="rank">' + rankOptions + '</select></label>' + abilityOptions + '<label>Full unarmed formula<input name="unarmed"></label>' + costOptions + (profile?.requiresCompletedCasting ? '<label><input name="complete" type="checkbox">The source casting time has been completed</label>' : '') + '<label><input name="confirmed" type="checkbox">Confirm free hands, seals, required equipment, prerequisites, range and targets</label>';
  const options = await foundry.applications.api.DialogV2.prompt({ window: { title: activity.item.name }, content, ok: { label: "Cast", callback: (_e, _b, dialog) => { const get = n => dialog.element.querySelector('[name="' + n + '"]'); return { rank: get("rank").value, castingAbility: get("ability")?.value, unarmedFormula: get("unarmed").value, requirementsConfirmed: get("confirmed").checked, castingCompleted: get("complete")?.checked ?? false, costChoices: Array.from(dialog.element.querySelectorAll('[name="cost"]:checked')).map(input => choices[Number(input.value)].id) }; } } });
  if (options === null || options === undefined) return { cancelled: true };
  return castTrial(activity, options, Array.from(game.user.targets).map(token => token.actor).filter(Boolean));
}

/** Route only trial activities through the bridge, leaving all other native item use unchanged. */
export function registerTrialBridge() {
  Hooks.on("dnd5e.preUseActivity", activity => {
    if (!activity.item.flags?.["n5e-module"]?.trial && !castingProfile(activity)) return;
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
          const result = await applyTrialHealing(actor, heal.amount, heal.excludedTypes);
          if (!result.blocked) await actor.update({ "flags.n5e-module.trialHealingReceipts": [...(actor.flags?.["n5e-module"]?.trialHealingReceipts ?? []).slice(-49), message.uuid] });
        }
      } catch (error) { ui.notifications.error(error.message); }
      finally { button.disabled = false; }
    });
  });
}
