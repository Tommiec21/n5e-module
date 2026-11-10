/** Reused from King’s N5e cost planner at commit6c17e1a; native consumption applies its calculated cost. */
export function computeJutsuCost(input) {
  const mode = input.mode ?? "chakra";
  const special = mode === "special";
  const sum = arr => (arr ?? []).reduce((a, b) => a + (Number(b) || 0), 0);

  const printed = mode === "none" ? 0 : Math.max(0, Number(input.base) || 0);
  const base = printed + (input.upcastRanks ?? 0) * (input.costPerRank ?? 0) + sum(input.baseAdds);
  const floor = Math.floor(base / 2);

  let cost = base + sum(input.additions);
  const steps = { base, afterAdd: cost };

  if ( special ) {
    // Only increases apply.
    const ups = (input.multipliers ?? []).filter(m => m > 1);
    if ( ups.length ) cost = Math.floor(cost * Math.max(...ups));
    steps.final = cost;
    return { cost, base, floor: base, special, steps };
  }

  if ( input.free ) return { cost: 0, base, floor: 0, special, steps: { ...steps, final: 0 } };

  cost -= sum(input.subtractions);
  steps.afterSub = cost;
  const pick = (list, choice, best) => (list?.length ? (list[choice] ?? best(...list)) : null);
  const mult = pick(input.multipliers, input.multiplierChoice, Math.min);
  if ( mult != null ) cost = Math.floor(cost * mult);
  steps.afterMul = cost;
  const div = pick(input.divisors, input.divisorChoice, Math.max);
  if ( div != null ) cost = Math.floor(cost / div);
  steps.afterDiv = cost;

  cost = Math.max(cost, floor, 0);
  steps.final = cost;
  const choices = {
    multipliers: (input.multipliers?.length ?? 0) > 1 ? [...input.multipliers] : null,
    divisors: (input.divisors?.length ?? 0) > 1 ? [...input.divisors] : null
  };
  return { cost, base, floor, special, steps, choices };
}


export function upkeepCost(originalCost, { efficient = false } = {}) {
  return efficient ? 0 : Math.floor((Number(originalCost) || 0) / 2);
}


export function concentrationDC({ rankValues = [], damage = 0, base = 15 }) {
  const ranks = rankValues.reduce((a, b) => a + b, 0);
  return Math.max(base + ranks, Math.floor(damage / 2));
}
