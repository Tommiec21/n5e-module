import { registerSelectedContent, loadSelectedContent, importSelectedWorld, importSelectedActor } from "./content/selected.mjs";
import { generalPlan, eligibility, maximumRank } from "./integration/casting.mjs";
import { registerConditionCompletion, finishConditionRest, processMovement } from "./conditions/completion-hooks.mjs";
import { expireConditions, normalizeConditionCaps, removeConditionRanks } from "./conditions/completion.mjs";
import { importTrialItems } from "./integration/content.mjs";
import { registerSkills, skillActorClass, rollSkill, setMasterySources, disciplineNumbers } from "./skills/native.mjs";
import { skills } from "./skills/registry.mjs";
import { castTrial, registerTrialBridge } from "./integration/bridge.mjs";
import { beginCast, endCast, payUpkeep, cleanup, applyCheck } from "./concentration/service.mjs";
import { maintainedCasts, damageCheckPlan, upkeepPlan } from "./concentration/planner.mjs";
import { chooseReplacement, chooseUpkeep, rollCheck, registerConcentrationCards } from "./concentration/controls.mjs";
import { registerConcentrationLifecycle } from "./concentration/lifecycle.mjs";
import { resolveSave } from "./saves/planner.mjs";
import { applySaveOutcome } from "./saves/service.mjs";
import { rollSave, registerSaveCards } from "./saves/native.mjs";
import { registerDamageFields } from "./damage/schema.mjs";
import { planDamage, planRecovery } from "./damage/planner.mjs";
import { applyDamage, recover, retarget } from "./damage/service.mjs";
import { applyWithChoice, postDamage, registerDamageCards, registerConditionDamage } from "./damage/controls.mjs";
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
    registerDamageFields(CONFIG, foundry.data.fields);
    registerSkills(CONFIG, foundry.data.fields);
    registerDamageCards();
    registerSaveCards();
    registerTrialBridge();
    registerSelectedContent();
    registerConcentrationCards();
    registerConcentrationLifecycle();
    registerConditionDamage();
    CONFIG.Actor.documentClass = skillActorClass(conditionActorClass(CONFIG.Actor.documentClass));
    for (const [key, def] of Object.entries(conditions)) if (!CONFIG.statusEffects.some(e => e.id === `n5e.${key}`)) CONFIG.statusEffects.push({ id: `n5e.${key}`, name: def.label, img: def.icon });
    registerConditionLifecycle();
    registerConditionCompletion();
  }
  module.api = Object.freeze({
    version: module.version,
    supported: supportsHost(game.system, game.version),
    gameplayEnabled: false,
    skills: Object.freeze({ definitions: skills, roll: rollSkill, setMasterySources, disciplineNumbers }),
    casting: Object.freeze({ cast: castTrial, plan: generalPlan, eligibility, maximumRank }),
    content: Object.freeze({ load: loadSelectedContent, importWorld: importSelectedWorld, importActor: importSelectedActor }),
    trial: Object.freeze({ importItems: importTrialItems, cast: castTrial }),
    concentration: Object.freeze({ begin: beginCast, end: endCast, payUpkeep, cleanup, applyCheck, list: maintainedCasts, damageCheckPlan, upkeepPlan, chooseReplacement, chooseUpkeep, rollCheck }),
    saves: Object.freeze({ resolve: resolveSave, apply: applySaveOutcome, roll: rollSave }),
    damage: Object.freeze({ plan: planDamage, apply: applyDamage, applyWithChoice, post: postDamage, recover, planRecovery, retarget }),
    conditions: Object.freeze({ definitions: conditions, modifiers, expire: expireConditions, normalizeCaps: normalizeConditionCaps, removeRanks: removeConditionRanks, finishRest: finishConditionRest, movement: processMovement, add: addRanks, set: setCondition, remove: removeCondition, resolveRemoval, processTurnEnd, turnStartRequests, open: openConditions })
  });
}

/** Report unsupported hosts once and leave all native gameplay behavior untouched. */
function reportCompatibility() {
  const api = game.modules.get(MODULE_ID)?.api;
  if (api && !api.supported) ui.notifications.warn("N5e development requires Foundry 13.347+ (v13) and dnd5e 5.3.3; no N5e gameplay is enabled.");
}

Hooks.once("init", initialize);
Hooks.once("ready", reportCompatibility);
