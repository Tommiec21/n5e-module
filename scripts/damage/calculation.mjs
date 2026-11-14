/**
 * Damage, healing and death saves from the N5e shared rules core (SHARED1b).
 *
 * The module's snapshot passes no `conditionPenalties` and no `dealtPenalty`, so the core's Bruised,
 * Petrified and source-penalty steps stay off. Damage results are the same as the previous copy.
 * Health rules (instantDeath, envenomedBlocksHealing) come from the core default (true), as before.
 */
export { damagePlan, healPlan, deathSaveResult } from "../core/module/rules/damage.mjs";

/** The module's concentration lifecycle owns concentration checks; this planner stays off, as it was. */
export function concentrationOnDamage() { return null; }
