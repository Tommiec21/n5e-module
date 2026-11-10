/** Explicit reviewed base-rank outcomes never inherit unrelated higher-rank clauses from parsed text. */
const row = (damage = "none", conditions = [], manual = []) => ({ damage, conditions, manual });
const outcomes = (failure, success = row()) => ({ critSuccess: success, success, failure, critFailure: failure });
const condition = (key, ranks = 1) => ({ key, ranks });
const save = (ability, formula, type, inflicted = [], success = "half", manual = []) => ({ kind: "save", saveAbility: ability, parts: formula ? [{ formula, type }] : [], outcomes: outcomes(row(formula ? "full" : "none", inflicted, manual), row(success)) });
const attack = (formula, type) => ({ kind: "attack", parts: [{ formula, type }] });

// Reviewed from the preserved D-rank descriptions, not from the legacy parser's inferred effects.
export const reviewedModes = {
  "chakra-bolt": { mode: attack("4d6", "force"), manual: [] },
  "fire-release-devastating-blaze": { mode: save("dex", "3d6+3", "fire", [condition("shaken")]), manual: [] },
  "fire-release-erupting-flame": { mode: save("dex", "4d8+4", "fire", [condition("dazed")], "half"), manual: [] },
  "fire-release-fireball": { mode: save("dex", "4d6+4", "fire", [condition("burned")]), manual: [] },
  "fire-release-hellfire-rejection": { mode: save("dex", "3d8+3", "fire"), manual: ["Confirm the reaction trigger and eligible creatures."] },
  "fire-release-white-flame-strike": { mode: save("dex", "3d6+3", "fire", [condition("burned")]), manual: ["Flying targets save at disadvantage and take vulnerable damage; adjust these manually."] },
  "sealing-art-fracturing-splinter": { mode: { kind: "save", saveAbility: "cha", parts: [{ formula: "2d8", type: "force" }, { formula: "2d8", type: "chakra" }], outcomes: outcomes(row("full")) }, manual: [] },
  "wind-release-raging-gale": { mode: save("str", "2d10", "wind", [], "none", ["Move the target as printed and apply Prone on failure."]), manual: ["Movement and Prone remain manual."] },
  "wind-release-violent-whirlwind": { mode: save("str", "2d8", "wind", [], "half", ["Apply Prone on failure."]), manual: ["Prone and dispersing environmental effects remain manual."] },
  "wind-release-second-wind": { mode: { kind: "heal", parts: [{ formula: "2d6 + @ability", type: "healing" }] }, manual: ["Select the caster as the healing recipient."] },
  "thunderous-screech": { mode: save("con", "2d6", "bludgeoning", [{ key: "deafened", ranks: 1, endsAt: "nextTurnEnd" }], "half"), manual: ["Construct/structure disadvantage and trap triggering remain manual."] },
  "bane": { mode: { kind: "save", saveAbility: "cha", parts: [], outcomes: { critSuccess: row(), success: row(), failure: row("none", [], ["Apply the printed 1d4 attack/save penalty for the duration."]), critFailure: row("none", [], ["Apply the printed 1d4 attack/save penalty and suppress equal/lower-rank beneficial jutsu."]) } }, manual: ["Penalty and bonus suppression remain manual; the graded save is automated."] }
};

/** Translate source duration units without guessing how a later-rank duration changes. */
function durationSeconds(duration) {
  const factors = { round: 6, rounds: 6, minute: 60, minutes: 60, hour: 3600, hours: 3600, day: 86400, days: 86400 };
  const seconds = duration.value * factors[duration.unit];
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : undefined;
}

/** Attach shared casting metadata while explicitly keeping unreviewed effect clauses manual. */
export function applySelectedMechanics(item, record) {
  if (record.data.type !== "jutsu") return item;
  const s = record.data.system, meta = item.flags["n5e-module"].selected;
  const raw = record.data.flags?.n5e?.jutsuBookImport;
  const cost = s.cost;
  if (raw?.manualCost || !Number.isSafeInteger(cost?.value) || cost.value < 0 || cost.mode === "special" && cost.value === 0) {
    meta.automation.reasons = ["Source-defined cost requires manual resolution; automatic casting is disabled."];
    return item;
  }
  const components = ["hs", "cm", "cs", "m"].filter(k => s.components?.[k]);
  if (s.components?.weapon?.required) components.push("w");
  if (s.components?.tool?.required) components.push("nt");
  const reviewed = !meta.clan ? reviewedModes[s.identifier] : null;
  const mode = structuredClone(reviewed?.mode ?? { kind: "maintain", parts: [] });
  const id = "n5eSelectedCast1";
  const time = s.activation?.unit;
  const longer = ["minute", "hour", "day"].includes(time) || /\b(?:minutes?|hours?)\b/i.test(raw?.header?.time ?? record.data.flags?.n5e?.sourceHeader?.time ?? "");
  const profile = { version: 1, baseRank: s.rank, baseCost: cost.value, costMode: cost.mode === "special" ? "special" : "chakra", discipline: s.discipline === "buki" ? "tai" : s.discipline, components, hijutsu: !!meta.clan, upcast: false, concentration: !!s.duration?.concentration, stable: s.keywords?.includes("stable") ?? false, efficient: s.keywords?.includes("efficient") ?? false, requiresCompletedCasting: longer, healingExcludedTypes: [], activities: { [id]: mode } };
  const seconds = durationSeconds(s.duration ?? {});
  if (seconds !== undefined) profile.durationSeconds = seconds;
  item.flags["n5e-module"].casting = profile;
  item.system.activities[id] = { _id: id, type: mode.kind === "attack" ? "attack" : mode.kind === "save" ? "save" : mode.kind === "heal" ? "heal" : "utility", name: reviewed ? "Cast" : "Cast — manual effects", activation: { type: ["action", "bonus", "reaction", "special"].includes(s.activation?.type) ? s.activation.type : "action", value: s.activation?.value ?? 1 }, consumption: { targets: [], scaling: { allowed: false } } };
  meta.automation = { status: reviewed && !reviewed.manual.length ? "base-rank-core" : "partial", owner: "selected-content-02", automated: ["base-rank eligibility", "Chakra cost", ...(profile.concentration ? ["dual concentration/upkeep"] : []), ...(reviewed ? ["native rolls", ...(mode.saveAbility ? ["graded save outcomes"] : []), ...(mode.parts.length ? [mode.kind === "heal" ? "HP healing" : "typed damage"] : [])] : [])], reasons: reviewed?.manual ?? ["Resolve source effects, targeting, equipment and timing manually; only casting cost/concentration are connected."], upcasting: "manual; source text retained, higher-rank automated modes not authored" };
  item.system.description.value += `<p><em>${reviewed ? "Base-rank core connected." : "Cost/concentration connected; effects manual."} Higher-rank modes require manual resolution.</em></p>`;
  return item;
}
