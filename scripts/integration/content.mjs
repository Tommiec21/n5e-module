/** Import only the six opt-in trial Items, preserving source IDs without reusing embedded document IDs. */
export async function importTrialItems(actor) {
  if (!actor.isOwner) throw new Error("Actor ownership is required.");
  const response = await fetch("modules/n5e-module/content/trial-jutsu.json");
  if (!response.ok) throw new Error("Trial content could not be loaded.");
  const data = await response.json();
  const existing = new Set(Array.from(actor.items).map(item => item.flags?.["n5e-module"]?.trial?.sourceId));
  const create = data.filter(item => !existing.has(item.flags["n5e-module"].trial.sourceId)).map(item => { const copy = structuredClone(item); delete copy._id; return copy; });
  return create.length ? actor.createEmbeddedDocuments("Item", create) : [];
}
