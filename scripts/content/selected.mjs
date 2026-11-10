let importing = false;

/** Read the shipped native bundle without evaluating the preserved source descriptions. */
export async function loadSelectedContent(library = "selected") {
  if (!["selected", "class"].includes(library)) throw new Error("Unknown N5e content library.");
  const response = await fetch(`modules/n5e-module/content/${library}-content.json`);
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
export async function importSelectedWorld({ clans = null, general = true, updateExisting = false, library = "selected" } = {}) {
  if (!game.user.isGM) throw new Error("Only a GM can import the world library.");
  if (importing) throw new Error("A selected-content import is already running.");
  importing = true;
  const deadline = Date.now() + 300000;
  try {
    const { items } = await loadSelectedContent(library);
    const chosen = items.filter(i => { const c = i.flags["n5e-module"].selected.clan; return c ? clans === null || clans.includes(c) : general; });
    const existing = new Map(Array.from(game.items).filter(i => i.flags?.["n5e-module"]?.selected).map(i => [i.flags["n5e-module"].selected.sourceId, i]));
    const folders = new Map(Array.from(game.folders).filter(f => f.type === "Item" && f.flags?.["n5e-module"]?.selectedFolder).map(f => [f.flags["n5e-module"].selectedFolder, f]));
    let created = 0, skipped = 0, updated = 0;
    for (const data of chosen) {
      if (Date.now() >= deadline) throw new Error("Import paused at its five-minute limit; run again to continue without duplicates.");
      const meta = data.flags["n5e-module"].selected;
      if (existing.has(meta.sourceId)) {
        if (updateExisting) {
          const copy = structuredClone(data); delete copy._id;
          await existing.get(meta.sourceId).update(copy);
          updated++;
        } else skipped++;
        continue;
      }
      if (game.items.get(data._id)) throw new Error(`An unrelated Item occupies the reserved ID for ${data.name}.`);
      const folder = await ensureFolder(meta.folderPath, folders);
      const item = await Item.create({ ...structuredClone(data), folder }, { keepId: true });
      existing.set(meta.sourceId, item); created++;
    }
    return updateExisting ? { created, skipped, updated } : { created, skipped };
  } finally { importing = false; }
}

/** Copy selected native records to an owned actor with fresh embedded IDs and duplicate protection. */
export async function importSelectedActor(actor, sourceIds, { library = "selected" } = {}) {
  if (!actor?.isOwner) throw new Error("Actor ownership is required.");
  if (!Array.isArray(sourceIds)) throw new Error("Choose explicit source IDs to import.");
  const { items } = await loadSelectedContent(library);
  const existing = new Set(Array.from(actor.items).map(i => i.flags?.["n5e-module"]?.selected?.sourceId));
  const selected = new Set(sourceIds);
  const create = items.filter(i => selected.has(i.flags["n5e-module"].selected.sourceId) && !existing.has(i.flags["n5e-module"].selected.sourceId)).map(data => { const copy = structuredClone(data); delete copy._id; delete copy.folder; return copy; });
  return create.length ? actor.createEmbeddedDocuments("Item", create) : [];
}

/** Set only explicit testing resources; native ability scores and existing class records remain editable on the sheet. */
export async function prepareTestActor(actor, { level, chakra, maximum }) {
  if (!actor?.isOwner) throw new Error("Actor ownership is required.");
  if (!Number.isInteger(level) || level < 1 || level > 20 || ![chakra, maximum].every(Number.isSafeInteger) || chakra < 0 || maximum < chakra) throw new Error("Choose level1–20 and valid nonnegative Chakra values.");
  return actor.update({ "system.n5e.level": level, "system.n5e.chakra.value": chakra, "system.n5e.chakra.max": maximum });
}

/** Provide resource setup for a chosen test actor without requiring a console command. */
async function openTestActor() {
  const actors = Array.from(game.actors).filter(a => a.isOwner && ["character", "npc"].includes(a.type));
  const esc = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
  const content = '<label>Test actor<select name="actor">' + actors.map((a, i) => `<option value="${i}">${esc(a.name)}</option>`).join("") + '</select></label><label>N5e level<input name="level" type="number" min="1" max="20" value="1"></label><label>Current Chakra<input name="chakra" type="number" min="0" value="100"></label><label>Maximum Chakra<input name="max" type="number" min="0" value="100"></label>';
  const values = await foundry.applications.api.DialogV2.prompt({ window: { title: "Prepare N5e test actor" }, content, ok: { label: "Set testing values", callback: (_e, _b, dialog) => { const value = name => Number(dialog.element.querySelector(`[name="${name}"]`).value); return { actor: actors[value("actor")], level: value("level"), chakra: value("chakra"), maximum: value("max") }; } } });
  if (!values) return;
  await prepareTestActor(values.actor, values);
  ui.notifications.info("N5e test level and Chakra saved.");
}

/** Provide a GM settings entry for explicit world-library import; activation alone creates no documents. */
export function registerSelectedContent() {
  class TestActorMenu extends foundry.applications.api.ApplicationV2 {
    render() { void openTestActor().catch(error => ui.notifications.error(error.message)); return this; }
  }
  class SelectedContentMenu extends foundry.applications.api.ApplicationV2 {
    render() {
      void foundry.applications.api.DialogV2.prompt({ window: { title: "Import selected N5e test content" }, content: '<p>Import selected D-rank general jutsu and eight clan packages into organized Item folders.</p><label><input name="update" type="checkbox">Replace previously imported world-library records with this release (overwrites edits to those records; actors unchanged)</label>', ok: { label: "Import", callback: (_e, _b, dialog) => ({ updateExisting: dialog.element.querySelector('[name="update"]').checked }) } }).then(async selection => {
        if (!selection) return;
        const result = await importSelectedWorld(selection);
        ui.notifications.info(`N5e content: ${result.created} imported, ${result.updated ?? 0} updated, ${result.skipped} already present.`);
      }).catch(error => ui.notifications.error(error.message));
      return this;
    }
  }
  game.settings.registerMenu("n5e-module", "selectedContent", { name: "Selected N5e test content", label: "Import test content", hint: "Organized general jutsu and clan packages; reviewed automation is identified per record.", icon: "fas fa-scroll", type: SelectedContentMenu, restricted: true });
  game.settings.registerMenu("n5e-module", "testActor", { name: "Prepare N5e test actor", label: "Set test level and Chakra", hint: "Choose a test actor and explicitly set its N5e level and Chakra pool.", icon: "fas fa-user-ninja", type: TestActorMenu, restricted: true });
}
