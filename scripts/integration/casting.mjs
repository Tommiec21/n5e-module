import { actorLevel } from "../skills/calculation.mjs";
import { modifiers } from "../conditions/planner.mjs";
import { computeJutsuCost } from "./cost.mjs";
import { canMaintain } from "../concentration/planner.mjs";
import { classTags } from "../classes/progression.mjs";

export const ranks = ["E", "D", "C", "B", "A", "S"];

/** Use explicit actor grants for exceptions to the shared D1/C5/B9/A13/S17 progression. */
export function maximumRank(actor) {
  const override = actor.flags?.["n5e-module"]?.casting?.maxRank;
  if (override !== undefined && !ranks.includes(override)) throw new Error("Invalid maximum rank grant.");
  return override ?? ranks[[0, 1, 5, 9, 13, 17].findLastIndex(level => actorLevel(actor.system) >= level)];
}

/** Read reviewed metadata, never turn arbitrary description text into executable casting rules. */
export function castingProfile(activity) {
  return activity.item.flags?.["n5e-module"]?.casting ?? null;
}

/** Validate observable conditions and require explicit confirmation for physical facts absent from native data. */
export function eligibility(actor, profile, options) {
  const rank = options.rank ?? profile.baseRank;
  const steps = ranks.indexOf(rank) - ranks.indexOf(profile.baseRank);
  if (!ranks.includes(rank) || !ranks.includes(profile.baseRank) || steps < 0 || ranks.indexOf(rank) > ranks.indexOf(maximumRank(actor))) throw new Error("Cast rank exceeds the caster's available ranks.");
  if (steps && profile.upcast === false) throw new Error("This jutsu does not support upcasting.");
  const ability = options.castingAbility;
  const threshold = { B: 16, A: 18, S: 20 }[profile.baseRank];
  if (!steps && !profile.hijutsu && threshold && !(actor.system.abilities?.[ability]?.value >= threshold)) throw new Error(`This base rank requires ${threshold} in its casting ability.`);
  const m = modifiers(actor), flags = m.flags;
  const statuses = new Set(actor.statuses ?? []);
  if (flags.incapacitated || ["dead", "unconscious", "incapacitated", "stunned", "petrified", "n5e.petrified"].some(k => statuses.has(k))) throw new Error("The caster cannot act.");
  const components = [...new Set(profile.components ?? [])];
  if (components.some(k => !["hs", "cm", "cs", "m", "w", "nt"].includes(k))) throw new Error("Unknown jutsu component.");
  if (components.some(k => flags.noComponents?.includes(k)) || flags.maxComponents !== undefined && components.length > flags.maxComponents) throw new Error("Current conditions prevent these components.");
  if (components.includes("cm") && !canMaintain(actor)) throw new Error("Chakra molding is unavailable.");
  if (profile.keywords?.includes("dojutsu") && flags.noDojutsu) throw new Error("Dojutsu is unavailable.");
  if (profile.keywords?.includes("teleportation") && flags.noTeleportAtRanks && flags["has.sealed"] >= flags.noTeleportAtRanks) throw new Error("Sealed prevents teleportation.");
  if (components.includes("m") && (flags.cannotMove || statuses.has("restrained") || !Object.values(actor.system.attributes?.movement ?? {}).some(v => typeof v === "number" && v > 0))) throw new Error("Mobility is unavailable.");
  if (components.includes("hs") && Array.from(actor.items ?? []).some(i => i.type === "equipment" && i.system.equipped && i.system.armor?.type && i.system.proficient === false)) throw new Error("Hand seals require armor proficiency.");
  if (!options.requirementsConfirmed) throw new Error("Confirm free hands, seals, equipment, prerequisites and target eligibility.");
  const available = [...(actor.flags?.["n5e-module"]?.casting?.tags ?? []), ...classTags(actor)];
  if ((profile.requiredTags ?? []).some(tag => !available.includes(tag))) throw new Error("Missing a required affinity or source grant.");
  if (profile.known === false) throw new Error("This jutsu is not learned or granted.");
  if (profile.requiresCompletedCasting && !options.castingCompleted) throw new Error("Complete the source casting time before confirming this cast.");
  return { rank, steps, modifiers: m };
}

/** Resolve only authored options, preserving addition/subtraction before selected multiplication/division. */
export function castingCost(profile, state, options) {
  const choices = profile.costChoices ?? [];
  const selected = options.costChoices ?? [];
  if (new Set(selected).size !== selected.length || selected.some(id => !choices.some(c => c.id === id))) throw new Error("Invalid cost choice.");
  const cost = { base: profile.baseCost, mode: profile.costMode ?? "chakra", upcastRanks: state.steps, costPerRank: profile.costPerRank ?? 3, baseAdds: [state.modifiers.baseCost[profile.discipline] ?? 0], additions: [], subtractions: [], multipliers: [], divisors: [] };
  if (!Number.isSafeInteger(cost.base) || cost.base < 0) throw new Error("A reviewed Chakra cost is required.");
  for (const choice of choices.filter(c => c.automatic || selected.includes(c.id))) {
    if (!["additions", "subtractions", "multipliers", "divisors"].includes(choice.operation) || !Number.isFinite(choice.value) || choice.value < 0 || choice.operation === "divisors" && choice.value === 0) throw new Error("Invalid authored cost modifier.");
    cost[choice.operation].push(choice.value);
  }
  const result = computeJutsuCost({ ...cost, multiplierChoice: options.multiplierChoice, divisorChoice: options.divisorChoice });
  if (!Number.isSafeInteger(result.cost)) throw new Error("Chakra cost must be a whole number.");
  return result.cost;
}

/** Resolve a reviewed native activity through the shared casting contract without hard-coded jutsu names. */
export function generalPlan(activity, options) {
  const profile = castingProfile(activity);
  if (profile?.version !== 1) throw new Error("A reviewed version-one casting profile is required.");
  const mode = profile.activities?.[activity.id];
  if (!mode || !["attack", "save", "attackSave", "heal", "maintain"].includes(mode.kind)) throw new Error("Unsupported casting mode.");
  const state = eligibility(activity.actor, profile, options);
  const parts = (mode.parts ?? []).map(p => {
    if (p.dice) {
      const { base, perRank, faces } = p.dice;
      if (![base, perRank, faces].every(Number.isSafeInteger) || base < 0 || perRank < 0 || faces < 2) throw new Error("Invalid authored dice scaling.");
      return { type: p.type, formula: `${base + state.steps * perRank}d${faces}${p.bonus ? ` + (${p.bonus})` : ""}` };
    }
    if (typeof p.formula !== "string") throw new Error("A reviewed formula is required.");
    return { type: p.type, formula: p.formula.replaceAll("@upcast", String(state.steps)).replaceAll("@rank", String(ranks.indexOf(state.rank))).replaceAll("@ability", String(activity.actor.system.abilities[options.castingAbility].mod)) };
  });
  if (profile.durationSeconds !== undefined && (!Number.isSafeInteger(profile.durationSeconds) || profile.durationSeconds < 1)) throw new Error("Duration must be positive seconds.");
  return { profile, effects: mode.effects ?? null, recipient: mode.recipient ?? "targets", maxTargets: mode.maxTargets ?? null, excludeSelf: !!mode.excludeSelf, trial: { baseRank: profile.baseRank, source: { name: activity.item.name, discipline: profile.discipline, duration: "", keywords: "" } }, mode: activity.id, rank: state.rank, cost: castingCost(profile, state, options), parts, kind: mode.kind, saveAbility: mode.saveAbility ?? null, maintained: !!profile.concentration, outcomes: mode.outcomesByRank?.[state.rank] ?? mode.outcomes, durationSeconds: profile.durationSeconds ?? null, stable: !!profile.stable, efficient: !!profile.efficient };
}
