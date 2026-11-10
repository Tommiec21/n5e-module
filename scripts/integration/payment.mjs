import { nativeUpkeepUpdates } from "../concentration/service.mjs";

/** Prepare native Chakra and material consumption without changing any document. */
export async function preparePayment(activity, cost, materials = []) {
  const actor = activity.actor;
  const updates = { actor: await nativeUpkeepUpdates(actor, cost), item: [], delete: [], rolls: [] };
  const totals = new Map();
  for (const entry of materials) {
    if (!entry.itemId || !Number.isSafeInteger(entry.amount) || entry.amount < 1) throw new Error("Invalid consumed component.");
    totals.set(entry.itemId, (totals.get(entry.itemId) ?? 0) + entry.amount);
  }
  for (const [target, amount] of totals) await CONFIG.DND5E.activityConsumptionTypes.material.consume.call({ actor, activity, item: activity.item, target, resolveCost: async () => ({ total: amount }) }, {}, updates);
  return updates;
}

/** Commit the prepared native updates once, without invoking a second activity consumption workflow. */
export async function commitPayment(actor, updates) {
  if (Object.keys(updates.actor).length) await actor.update(updates.actor);
  if (updates.item.length) await actor.updateEmbeddedDocuments("Item", updates.item);
  if (updates.delete.length) await actor.deleteEmbeddedDocuments("Item", updates.delete);
}
