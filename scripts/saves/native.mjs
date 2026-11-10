import { validateDefinition, resolveSave } from "./planner.mjs";
import { applySaveOutcome } from "./service.mjs";

/** Read the kept natural die rather than confusing the modified total with a natural20. */
export function keptNatural(roll) {
  const dice = roll.dice?.filter(die => die.faces === 20) ?? [];
  const results = dice.flatMap(die => die.results.filter(result => result.active !== false && !result.discarded));
  if (results.length !== 1) throw new Error("Expected exactly one kept d20 for this save.");
  return results[0].result;
}

/** Use the native save dialog and roll, but leave native binary half-damage handling out of this path. */
export async function rollSave(actor, request) {
  if (!actor.isOwner) throw new Error("Actor ownership is required.");
  if (request.graded === false) return actor.rollSavingThrow({ ability: request.ability, targetValue: request.dc });
  validateDefinition(request);
  const rolls = await actor.rollSavingThrow({ ability: request.ability, targetValue: request.dc }, {}, { create: false });
  if (!rolls?.length) return { cancelled: true };
  if (rolls.length !== 1) throw new Error("Select one native save roll per target.");
  const roll = rolls[0];
  const natural = keptNatural(roll);
  const preview = resolveSave(request, actor.uuid, { total: roll.total, natural, rollUuid: "pending-message" });
  const message = await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), rolls: [roll], content: `<p>${preview.outcome.outcome}</p><button type="button" data-n5e-save-apply>Apply outcome</button>`, flags: { "n5e-module": { save: { targetUuid: actor.uuid, request, roll: { total: roll.total, natural } } } } });
  return { ...preview, outcome: { ...preview.outcome, rollUuid: message.uuid }, rollUuid: message.uuid };
}

/** Attach application only to explicitly authored N5e graded-save cards. */
export function registerSaveCards() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    const data = message.flags?.["n5e-module"]?.save;
    if (!data) return;
    html.querySelector("[data-n5e-save-apply]")?.addEventListener("click", async event => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const actor = await fromUuid(data.targetUuid);
        const result = await applySaveOutcome(actor, data.request, { ...data.roll, rollUuid: message.uuid });
        if (!result.cancelled) ui.notifications.info(result.duplicate ? "Save outcome already applied." : "Save outcome applied.");
        if (result.effect.manual.length) ui.notifications.info("This outcome also has manual effects; see its jutsu description.");
      } catch (error) { ui.notifications.error(error.message); }
      finally { button.disabled = false; }
    });
  });
}
