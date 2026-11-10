import { readFile, writeFile } from "node:fs/promises";
import { runBounded } from "./bounded.mjs";

const file = "docs/check-ledger.json";
const ledger = JSON.parse(await readFile(file, "utf8"));
const selected = process.argv[2] ?? "selectedBuffs";
const gates = { selectedBuffs: { id: "selected-buffs-native-dependency-stacking-and-expiry", batch: "selected-04b", file: "tests/selected-buffs.test.mjs" }, selectedClans: { id: "selected-clan-grants-flexibility-and-source-condition-expiry", batch: "selected-04a", file: "tests/selected-clans.test.mjs" }, selectedMechanics: { id: "selected-content-casting-and-reviewed-d-rank-mechanics", batch: "selected-02", file: "tests/selected-mechanics.test.mjs" }, selectedContent: { id: "selected-content-native-shape-scope-and-import", batch: "selected-01", file: "tests/selected-content.test.mjs" }, casting: { id: "general-casting-eligibility-payment-and-concentration", batch: "10", file: "tests/casting.test.mjs" }, conditionLifecycle: { id: "complete-condition-movement-rest-decay-expiry", batch: "09", file: "tests/condition-lifecycle.test.mjs" }, skills: { id: "skills-proficiency-mastery-and-concentration-integration", batch: "08", file: "tests/skills.test.mjs" }, integration: { id: "native-trial-jutsu-vertical-slice", batch: "06", file: "tests/integration.test.mjs" }, concentration: { id: "dual-concentration-upkeep-and-damage-check", batch: "05", file: "tests/concentration.test.mjs" }, saves: { id: "graded-save-outcomes-and-consequences", batch: "04", file: "tests/saves.test.mjs" }, damage: { id: "dual-pool-damage-application", batch: "03", file: "tests/damage.test.mjs" }, conditions: { id: "ranked-condition-source-and-lifecycle", batch: "02", file: "tests/conditions.test.mjs" }, foundation: { id: "foundation-contract-and-process-lifecycle", batch: "00", file: "tests/foundation.test.mjs" }, contracts: { id: "shared-contract-identity-and-boundaries", batch: "01", file: "tests/contracts.test.mjs" } };
if (!Object.hasOwn(gates, selected)) throw new Error("Unknown selected gate.");
const gate = gates[selected];
const id = gate.id;
let scenario = ledger.scenarios.find(entry => entry.scenarioId === id);
if (!scenario) ledger.scenarios.push(scenario = { scenarioId: id, batch: gate.batch, attempts: [], status: "pending" });
if (scenario.attempts.length >= 3) {
  scenario.status = scenario.status === "passed" ? "passed" : "bypassed-unverified";
  await writeFile(file, JSON.stringify(ledger, null, 2) + "\n");
  throw new Error("Attempt budget exhausted; existing results retained, no checks executed.");
}
// Reserve before launch so an interrupted or CI run still consumes its attempt.
const attempt = { number: scenario.attempts.length + 1, location: process.env.CI ? "CI" : "local", commit: process.env.GITHUB_SHA ?? null, startedAt: new Date().toISOString(), result: "reserved", evidence: "work/check-result.json" };
scenario.attempts.push(attempt);
await writeFile(file, JSON.stringify(ledger, null, 2) + "\n");
const result = await runBounded(process.execPath, ["--test", "--test-timeout=15000", gate.file], { timeoutMs: 120000, record: "work/check-result.json" });
Object.assign(attempt, { result: result.status, endedAt: result.endedAt });
scenario.status = result.status === "passed" ? "passed" : scenario.attempts.length >= 3 ? "bypassed-unverified" : "pending";
scenario.affectedBehavior = result.status === "passed" ? [] : ["Selected batch acceptance unverified; gameplay is disabled."];
await writeFile(file, JSON.stringify(ledger, null, 2) + "\n");
process.exitCode = result.status === "passed" ? 0 : 1;
