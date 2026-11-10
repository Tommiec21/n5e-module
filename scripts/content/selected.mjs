let importing = false;

/** Read the shipped native bundle without evaluating the preserved source descriptions. */
export async function loadSelectedContent() {
  const response = await fetch("modules/n5e-module/content/selected-content.json");
  if (!response.ok) throw new Error("Selected N5e content could not be loaded.");
  const bundle = await response.json();
  if (bundle.version !== 1 || !Array.isArray(bundle.items)) throw new Error("Unsupported selected-content bundle.");
  return bundle;
}

/** Build only missing owned folders, preserving the requested content hierarchy on repeated imports. */
async function ensureFolder(path, folders) {
  let parent = null;
  for (let depth = 1; depth <= path.length; depth++) {
    const key = path.slice(0, depth).join("/");
    let folder = folders.get(key);
    if (!folder) {
      folder = await Folder.create({ name: path[depth - 1], type: "Item", folder: parent, flags: { "n5e-module": { selectedFolder: key } } });
      folders.set(key, folder);
    }
    parent = folder.id;
  }
  return parent;
}

/** Import an idempotent world library without changing existing actors or campaign content. */
export async function importSelectedWorld({ clans = null, general = true } = {}) {
  if (!game.user.isGM) throw new Error("Only a GM can import the world library.");
  if (importing) throw new Error("A selected-content import is already running.");
  importing = true;
  const deadline = Date.now() + 300000;
  try {
    const { items } = await loadSelectedContent();
    const chosen = items.filter(i => { const c = i.flags["n5e-module"].selected.clan; return c ? clans === null || clans.includes(c) : general; });
    const existing = new Map(Array.from(game.items).filter(i => i.flags?.["n5e-module"]?.selected).map(i => [i.flags["n5e-module"].selected.sourceId, i]));
    const folders = new Map(Array.from(game.folders).filter(f => f.type === "Item" && f.flags?.["n5e-module"]?.selectedFolder).map(f => [f.flags["n5e-module"].selectedFolder, f]));
    let created = 0, skipped = 0;
    for (const data of chosen) {
      if (Date.now() >= deadline) throw new Error("Import paused at its five-minute limit; run again to continue without duplicates.");
      const meta = data.flags["n5e-module"].selected;
      if (existing.has(meta.sourceId)) { skipped++; continue; }
      if (game.items.get(data._id)) throw new Error(`An unrelated Item occupies the reserved ID for ${data.name}.`);
      const folder = await ensureFolder(meta.folderPath, folders);
      const item = await Item.create({ ...structuredClone(data), folder }, { keepId: true });
      existing.set(meta.sourceId, item); created++;
    }
    return { created, skipped };
  } finally { importing = false; }
}

/** Copy selected native records to an owned actor with fresh embedded IDs and duplicate protection. */
export async function importSelectedActor(actor, sourceIds) {
  if (!actor?.isOwner) throw new Error("Actor ownership is required.");
  if (!Array.isArray(sourceIds)) throw new Error("Choose explicit source IDs to import.");
  const { items } = await loadSelectedContent();
  const existing = new Set(Array.from(actor.items).map(i => i.flags?.["n5e-module"]?.selected?.sourceId));
  const selected = new Set(sourceIds);
  const create = items.filter(i => selected.has(i.flags["n5e-module"].selected.sourceId) && !existing.has(i.flags["n5e-module"].selected.sourceId)).map(data => { const copy = structuredClone(data); delete copy._id; delete copy.folder; return copy; });
  return create.length ? actor.createEmbeddedDocuments("Item", create) : [];
}

/** Provide a GM settings entry for explicit world-library import; activation alone creates no documents. */
export function registerSelectedContent() {
  class SelectedContentMenu extends foundry.applications.api.ApplicationV2 {
    render() {
      void foundry.applications.api.DialogV2.confirm({ window: { title: "Import selected N5e test content" }, content: "<p>Import the selected D-rank general jutsu and eight clan packages into organized Item folders? Existing imported records and actors are unchanged.</p>" }).then(async accepted => {
        if (!accepted) return;
        const result = await importSelectedWorld();
        ui.notifications.info(`N5e content: ${result.created} imported, ${result.skipped} already present.`);
      }).catch(error => ui.notifications.error(error.message));
      return this;
    }
  }
  game.settings.registerMenu("n5e-module", "selectedContent", { name: "Selected N5e test content", label: "Import test content", hint: "Organized general jutsu and clan packages; reviewed automation is identified per record.", icon: "fas fa-scroll", type: SelectedContentMenu, restricted: true });
}
