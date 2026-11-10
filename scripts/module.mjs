import { supportsHost } from "./compatibility.mjs";

const MODULE_ID = "n5e-module";

/** Expose foundation status without replacing native models or registering gameplay handlers. */
function initialize() {
  const module = game.modules.get(MODULE_ID);
  if (!module) return;
  module.api = Object.freeze({
    version: module.version,
    supported: supportsHost(game.system, game.version),
    gameplayEnabled: false
  });
}

/** Report unsupported hosts once and leave all native gameplay behavior untouched. */
function reportCompatibility() {
  const api = game.modules.get(MODULE_ID)?.api;
  if (api && !api.supported) ui.notifications.warn("N5e development requires Foundry 13.347+ (v13) and dnd5e 5.3.3; no N5e gameplay is enabled.");
}

Hooks.once("init", initialize);
Hooks.once("ready", reportCompatibility);
