import { computeJutsuCost } from "./cost.mjs";
import { modifiers } from "../conditions/planner.mjs";

/** Resolve one explicitly selected trial mode without inferring branches from its full description. */
export function trialPlan(activity, options) {
  const trial = activity.item.flags?.["n5e-module"]?.trial;
  const mode = trial?.roles[activity.id];
  if (!trial || !mode) throw new Error("This activity is not a trial jutsu.");
  const ranks = ["E", "D", "C", "B", "A", "S"];
  const steps = ranks.indexOf(options.rank) - ranks.indexOf(trial.baseRank);
  if (steps < 0 || !ranks.includes(options.rank)) throw new Error("Choose a valid cast rank.");
  if (!options.requirementsConfirmed) throw new Error("Confirm source requirements and target eligibility first.");
  const actor = activity.actor;
  const maintained = trial.concentration && mode !== "strike";
  const cost = mode === "strike" ? 0 : computeJutsuCost({ base: trial.baseCost, upcastRanks: steps, costPerRank: 3, baseAdds: [modifiers(actor).baseCost[trial.source.discipline === "Genjutsu" ? "gen" : trial.source.discipline === "Taijutsu" ? "tai" : "nin"]] }).cost;
  const name = activity.item.name;
  if (mode === "strike") {
    const cast = Array.from(actor.effects ?? []).map(e => e.flags?.["n5e-module"]?.maintainedCast).find(r => r?.itemUuid === activity.item.uuid);
    if (!cast || cast.castRank !== options.rank) throw new Error("Use the actual maintained rank for this strike.");
  }
  let parts = [], kind = "attack", saveAbility = null;
  if (name === "Chakra Bolt") parts = [{ formula: `${4 + steps}d6`, type: "force" }];
  if (name === "Medical Release: Adept Healing") { kind = "heal"; parts = [{ formula: mode === "bonus" ? String(8 + steps * 4) : `${3 + steps}d8${mode === "fullTurn" ? "+4" : ""}`, type: "healing" }]; }
  if (name === "Butterfly Kick") {
    if (steps > 0) throw new Error("Trial Butterfly Kick is D-rank only; its higher-rank choices belong to Batch12.");
    if (!options.unarmedFormula) throw new Error("Provide the current full unarmed formula.");
    parts = [{ formula: `(${options.unarmedFormula}) + ${mode === "finisher" ? "4d6" : "2d6"}`, type: options.unarmedType ?? "bludgeoning" }];
    kind = mode === "finisher" ? "save" : "attackSave"; saveAbility = "str";
  }
  if (name === "Bane") { kind = "save"; saveAbility = "cha"; }
  if (name === "Arms of Buddha") { kind = mode === "start" ? "maintain" : "attack"; if (mode === "strike") parts = [{ formula: `${4 + (steps >= 1 ? 1 : 0) + (steps >= 4 ? 1 : 0)}d8`, type: "bludgeoning" }]; }
  if (name === "Sealing Art: Fracturing Splinter") { kind = "save"; saveAbility = "cha"; parts = [{ formula: `${2 + steps}d8`, type: "force" }, { formula: `${2 + steps}d8`, type: "chakra" }]; }
  if (["attack", "attackSave"].includes(kind) && !Number.isSafeInteger(options.attackBonus)) throw new Error("Supply the full current attack bonus.");
  if (saveAbility && !Number.isFinite(options.dc)) throw new Error("Supply the current discipline save DC.");
  return { trial, mode, rank: options.rank, cost, parts, kind, saveAbility, maintained };
}
