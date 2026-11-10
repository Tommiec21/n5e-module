import { conditions } from "./registry.mjs";
import { applications } from "./planner.mjs";
import { setCondition, removeCondition, resolveRemoval } from "./service.mjs";

/** Escape document names before placing them in a native dialog. */
function escape(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

/** Offer explicit rank/source controls and already-rolled removal results without custom sheet replacement. */
export function openConditions(actor) {
  if (!actor.isOwner) throw new Error("Actor ownership is required.");
  const current = applications(actor);
  const content = `<form><label>Condition <select name="key">${Object.entries(conditions).map(([key, def]) => `<option value="${key}">${def.label}</option>`).join("")}</select></label><label>Ranks <input name="ranks" type="number" min="1" value="1"></label><label>Application <select name="id"><option value="">New source</option>${current.map(r => `<option value="${escape(r.id)}">${escape(conditions[r.key].label)} ${r.ranks} — ${escape(r.source.id)}</option>`).join("")}</select></label><label>Stacking <select name="policy"><option value="">Unspecified</option><option value="add">Add ranks</option></select></label><label>Removal option index (0-based) <input name="option" type="number" min="0" value="0"></label><label>Already-rolled removal total <input name="total" type="number"></label></form>`;
  const execute = async (action, dialog) => {
    const value = name => dialog.element.querySelector(`[name="${name}"]`).value;
    const id = value("id");
    if (action === "remove") return removeCondition(actor, id);
    if (action === "check") return resolveRemoval(actor, id, Number(value("option")), value("total") === "" ? NaN : Number(value("total")));
    const old = current.find(r => r.id === id);
    const key = old?.key ?? value("key");
    const applicationId = old?.id ?? crypto.randomUUID();
    const record = { version: 1, id: applicationId, targetUuid: actor.uuid, key, ranks: Number(value("ranks")), sourceRank: old?.sourceRank ?? null, source: old?.source ?? { id: applicationId, kind: "manual", actorUuid: actor.uuid, itemUuid: null, castId: null }, stackingPolicyId: value("policy") || old?.stackingPolicyId || null, expiresAt: old?.expiresAt ?? null };
    const combat = game.combat;
    return setCondition(actor, record, { worldTime: game.time.worldTime, turnId: combat ? `${combat.uuid}:${combat.round}:${combat.turn}` : null });
  };
  return foundry.applications.api.DialogV2.wait({ window: { title: `${actor.name}: N5e conditions` }, content, buttons: [{ action: "set", label: "Set ranks", callback: (_event, _button, dialog) => execute("set", dialog) }, { action: "remove", label: "Remove source", callback: (_event, _button, dialog) => execute("remove", dialog) }, { action: "check", label: "Apply removal result", callback: (_event, _button, dialog) => execute("check", dialog) }] });
}
