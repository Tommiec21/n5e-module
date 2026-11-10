/** Bane remaps only its own S-rank table; bonuses and effect suppression remain explicit manual clauses. */
export function baneExample(source, rank = "D") {
  const none = { damage: "none", conditions: [], manual: [] };
  const failure = { damage: "none", conditions: [], manual: ["Apply Bane's 1d4 penalty to attacks and saves for its duration."] };
  const critical = { damage: "none", conditions: [], manual: [...failure.manual, "Suppress qualifying jutsu benefits under Bane's printed rank restrictions."] };
  return { version: 1, id: "bane-example", activityId: "bane-save", source, ability: "cha", dc: 15, rank, mode: "normal", graded: true, modes: { normal: { outcomes: { critSuccess: none, success: none, failure, critFailure: critical }, ranks: { S: { critSuccess: none, success: failure, failure: critical, critFailure: { ...critical, outcome: "failure" } } } } } };
}
