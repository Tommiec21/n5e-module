/** Upkeep and concentration DC formulas reused from King’s N5e cost planner at commit6c17e1a. */
export function upkeepCost(originalCost, { efficient = false } = {}) {
  return efficient ? 0 : Math.floor((Number(originalCost) || 0) / 2);
}


export function concentrationDC({ rankValues = [], damage = 0, base = 15 }) {
  const ranks = rankValues.reduce((a, b) => a + b, 0);
  return Math.max(base + ranks, Math.floor(damage / 2));
}
