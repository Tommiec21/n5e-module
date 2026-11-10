import { validateContract } from "../contracts.mjs";
import { planDamage } from "./planner.mjs";
import { applyDamage, retarget } from "./service.mjs";

/** Resolve target-selected DR order before the serialized application rereads the live resources. */
export async function applyWithChoice(actor, packet, options = {}) {
  if (!actor.isOwner) throw new Error("Actor ownership is required.");
  const preview = planDamage(actor, packet, options);
  if (preview.plan.requiresDROrder) {
    const types = preview.plan.eligibleTypes.join(", ").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    const order = await foundry.applications.api.DialogV2.prompt({ window: { title: "Choose damage reduction order" }, content: `<p>Enter every type once in reduction order: ${types}</p><input name="order" type="text">`, ok: { label: "Apply", callback: (_event, _button, dialog) => dialog.element.querySelector('[name="order"]').value.split(",").map(v => v.trim()) } });
    if (!order) return { cancelled: true };
    options = { ...options, drOrder: order };
  }
  return applyDamage(actor, packet, options);
}

/** Keep the actual native damage roll on its message and bind application to that same source. */
export async function postDamage(actor, input, rolls = [], options = {}) {
  const packet = structuredClone(validateContract("DamagePacket", input));
  if (packet.targetUuid !== actor.uuid) throw new Error("Damage card target mismatch.");
  const message = await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), rolls, content: '<div class="n5e-damage"><button type="button" data-n5e-damage="apply">Apply</button><button type="button" data-n5e-damage="retarget">Retarget to selected token</button></div>', flags: { "n5e-module": { damage: { packet, options } } } });
  if (!packet.rollUuid && rolls.length) {
    packet.rollUuid = message.uuid;
    await message.update({ "flags.n5e-module.damage.packet": packet });
  }
  return message;
}

/** Hook only module-owned cards; native dnd5e cards keep their existing application flow. */
export function registerDamageCards() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    const data = message.flags?.["n5e-module"]?.damage;
    if (!data) return;
    for (const button of html.querySelectorAll("[data-n5e-damage]")) button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const actor = button.dataset.n5eDamage === "retarget" ? canvas.tokens.controlled[0]?.actor : await fromUuid(data.packet.targetUuid);
        if (!actor) throw new Error("Select a token for the damage recipient.");
        const result = await applyWithChoice(actor, retarget(data.packet, actor.uuid), data.options);
        if (!result.cancelled) ui.notifications.info(result.duplicate ? "Damage already applied." : "Damage applied.");
      } catch (error) { ui.notifications.error(error.message); }
      finally { button.disabled = false; }
    });
  });
}

/** Consume condition requests by rolling once and presenting a manual apply card, never auto-spending HP. */
export function registerConditionDamage() {
  const posted = new WeakMap();
  Hooks.on("n5e-module.conditionDamageRequested", (actor, requests) => {
    if (!game.user.isGM || game.users.activeGM?.id !== game.user.id) return;
    const seen = posted.get(actor) ?? new Set();
    posted.set(actor, seen);
    void (async () => {
      for (const request of requests) {
        if (seen.has(request.id)) continue;
        const roll = await new Roll(request.formula).evaluate();
        const packet = { version: 1, id: request.id, targetUuid: actor.uuid, source: request.source, kind: "damage", rollUuid: null, critical: false, components: [{ id: request.id, type: request.type, pool: "hp", amount: roll.total }] };
        await postDamage(actor, packet, [roll], { ignoreDR: true });
        seen.add(request.id);
        if (seen.size > 50) seen.delete(seen.values().next().value);
      }
    })().catch(error => ui.notifications.error(error.message));
  });
}
