import { importSelectedWorld, loadSelectedContent } from "../content/selected.mjs";

/** Reuse the same idempotent native world-library importer as the jutsu/clan data. */
export function importClassLibrary(options = {}) { return importSelectedWorld({ ...options, library: "class" }); }

/** Expose an explicit class-library import without creating actors or applying advancements automatically. */
export function registerClassLibrary() {
  class ClassLibraryMenu extends foundry.applications.api.ApplicationV2 {
    render() {
      void foundry.applications.api.DialogV2.prompt({ window: { title: "Import N5e classes" }, content: '<p>Import Scout-Nin, Ninjutsu Specialist, Taijutsu Specialist and their subclass/feature choices into organized Item folders.</p><label><input name="update" type="checkbox">Replace previously imported class-library records (overwrites library edits; actors unchanged)</label>', ok: { label: "Import", callback: (_e, _b, dialog) => ({ updateExisting: dialog.element.querySelector('[name="update"]').checked }) } }).then(async options => {
        if (!options) return;
        const result = await importClassLibrary(options);
        ui.notifications.info(`N5e classes: ${result.created} imported, ${result.updated ?? 0} updated, ${result.skipped} already present.`);
      }).catch(error => ui.notifications.error(error.message));
      return this;
    }
  }
  game.settings.registerMenu("n5e-module", "classLibrary", { name: "N5e class library", label: "Import three classes", hint: "Native classes, subclasses, level grants and options; complex feature mechanics remain manual.", icon: "fas fa-graduation-cap", type: ClassLibraryMenu, restricted: true });
}

/** Fetch the portable class bundle for integrations without exposing a separate conversion format. */
export function loadClassLibrary() { return loadSelectedContent("class"); }
