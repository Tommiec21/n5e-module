import { maintainedCasts, damageCheckPlan } from "./planner.mjs";
import { applyCheck, endCast, payUpkeep } from "./service.mjs";

/** Choose replacement before an initial cast spends Chakra; cancellation makes no changes. */
export async function chooseReplacement(actor) {
  const records = maintainedCasts(actor);
  if (records.length < 2) return { replaceCastId: null };
  const index = await foundry.applications.api.DialogV2.prompt({ window: { title: "Replace maintained jutsu" }, content: '<select name="cast"><option value="0">First maintained jutsu</option><option value="1">Second maintained jutsu</option></select>', ok: { label: "Choose", callback: (_e, _b, dialog) => Number(dialog.element.querySelector('[name="cast"]').value) } });
  return index === null || index === undefined ? { cancelled: true } : { replaceCastId: records[index]?.castId };
}

/** Present affordable upkeep choices to the owning player without holding an actor lock while deciding. */
export async function chooseUpkeep(actor, tickId) {
  if (!actor.isOwner) throw new Error("Actor ownership is required.");
  const records = maintainedCasts(actor);
  const selected = await foundry.applications.api.DialogV2.prompt({ window: { title: "Maintain jutsu" }, content: records.map((r, i) => `<label><input type="checkbox" name="keep" value="${i}" checked>${r.castRank}-rank jutsu: ${r.efficient ? 0 : Math.floor(r.actualChakraPaid / 2)} Chakra</label>`).join(""), ok: { label: "Pay selected upkeep", callback: (_e, _b, dialog) => Array.from(dialog.element.querySelectorAll('[name="keep"]:checked')).map(input => records[Number(input.value)].castId) } });
  if (selected === null || selected === undefined) return { cancelled: true };
  return payUpkeep(actor, tickId, selected);
}

/** Use native skill rolls where available, or an explicitly supplied full modifier with native dice. */
export async function rollCheck(actor, eventId, plan) {
  if (!actor.isOwner) throw new Error("Actor ownership is required.");
  if (actor.flags?.["n5e-module"]?.concentrationChecks?.includes(eventId)) return { duplicate: true };
  let rolls;
  if (actor.system.skills?.n5eChakraControl) rolls = await actor.rollSkill({ skill: "n5eChakraControl", targetValue: plan.dc }, {}, { create: false });
  else {
    const modifier = await foundry.applications.api.DialogV2.prompt({ window: { title: "Chakra Control check" }, content: '<label>Full Chakra Control modifier, including proficiency/Mastery and conditions<input name="modifier" type="number" required></label>', ok: { label: "Roll", callback: (_e, _b, dialog) => { const text = dialog.element.querySelector('[name="modifier"]').value; if (text === "" || !Number.isSafeInteger(Number(text))) throw new Error("Enter the full check modifier."); return Number(text); } } });
    if (modifier === null || modifier === undefined) return { cancelled: true };
    rolls = [await new Roll("1d20 + @modifier", { modifier }).evaluate()];
  }
  if (!rolls?.length) return { cancelled: true };
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), rolls, content: `<p>Concentration DC ${plan.dc}</p>` });
  return applyCheck(actor, eventId, plan, rolls[0].total);
}

/** Add owner-only actions to module concentration cards rather than the host's concentration UI. */
export function registerConcentrationCards() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    const data = message.flags?.["n5e-module"]?.concentration;
    if (!data) return;
    for (const button of html.querySelectorAll("[data-n5e-concentration]")) button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const actor = await fromUuid(data.actorUuid);
        if (data.kind === "upkeep") await chooseUpkeep(actor, data.tickId);
        else if (data.kind === "check") await rollCheck(actor, data.eventId, data.plan);
        else await endCast(actor, data.castId);
      } catch (error) { ui.notifications.error(error.message); }
      finally { button.disabled = false; }
    });
  });
}

/** Create one concise card from an already-calculated damage check or upkeep request. */
export function postConcentrationCard(actor, data) {
  return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<button type="button" data-n5e-concentration>${data.kind === "upkeep" ? "Choose concentration upkeep" : "Roll concentration check"}</button>`, flags: { "n5e-module": { concentration: { ...data, actorUuid: actor.uuid } } } });
}
