import { conditions } from "./conditions/registry.mjs";
import { conditionActorClass } from "./conditions/actor.mjs";
import { modifiers, turnStartRequests } from "./conditions/planner.mjs";
import { addRanks, setCondition, removeCondition, resolveRemoval, processTurnEnd } from "./conditions/service.mjs";
import { openConditions } from "./conditions/controls.mjs";
import { registerConditionLifecycle } from "./conditions/lifecycle.mjs";
import { supportsHost } from "./compatibility.mjs";

const MODULE_ID = "n5e-module";

/** Expose foundation status without replacing native models or registering gameplay handlers. */
function initialize() {
  const module = game.modules.get(MODULE_ID);
  if (!module) return;
  const supported = supportsHost(game.system, game.version);
  if (supported) {
    CONFIG.Actor.documentClass = conditionActorClass(CONFIG.Actor.documentClass);
    for (const [key, def] of Object.entries(conditions)) if (!CONFIG.statusEffects.some(e => e.id === `n5e.${key}`)) CONFIG.statusEffects.push({ id: `n5e.${key}`, name: def.label, img: def.icon });
    registerConditionLifecycle();
  }
  module.api = Object.freeze({
    version: module.version,
    supported: supportsHost(game.system, game.version),
    gameplayEnabled: false,
    conditions: Object.freeze({ definitions: conditions, modifiers, add: addRanks, set: setCondition, remove: removeCondition, resolveRemoval, processTurnEnd, turnStartRequests, open: openConditions })
  });
}

/** Report unsupported hosts once and leave all native gameplay behavior untouched. */
function reportCompatibility() {
  const api = game.modules.get(MODULE_ID)?.api;
  if (api && !api.supported) ui.notifications.warn("N5e development requires Foundry 13.347+ (v13) and dnd5e 5.3.3; no N5e gameplay is enabled.");
}

Hooks.once("init", initialize);
Hooks.once("ready", reportCompatibility);
