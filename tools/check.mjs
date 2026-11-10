import { readFile, writeFile } from "node:fs/promises";
import { runBounded } from "./bounded.mjs";

const file = "docs/check-ledger.json";
const ledger = JSON.parse(await readFile(file, "utf8"));
const id = "foundation-contract-and-process-lifecycle";
let scenario = ledger.scenarios.find(entry => entry.scenarioId === id);
if (!scenario) ledger.scenarios.push(scenario = { scenarioId: id, batch: "00", attempts: [], status: "pending" });
if (scenario.attempts.length >= 3) {
  scenario.status = scenario.status === "passed" ? "passed" : "bypassed-unverified";
  await writeFile(file, JSON.stringify(ledger, null, 2) + "\n");
  throw new Error("Attempt budget exhausted; existing results retained, no checks executed.");
}
// Reserve before launch so an interrupted or CI run still consumes its attempt.
const attempt = { number: scenario.attempts.length + 1, location: process.env.CI ? "CI" : "local", commit: process.env.GITHUB_SHA ?? null, startedAt: new Date().toISOString(), result: "reserved", evidence: "work/check-result.json" };
scenario.attempts.push(attempt);
await writeFile(file, JSON.stringify(ledger, null, 2) + "\n");
const result = await runBounded(process.execPath, ["--test", "--test-timeout=15000", "tests/foundation.test.mjs"], { timeoutMs: 120000, record: "work/check-result.json" });
Object.assign(attempt, { result: result.status, endedAt: result.endedAt });
scenario.status = result.status === "passed" ? "passed" : scenario.attempts.length >= 3 ? "bypassed-unverified" : "pending";
scenario.affectedBehavior = result.status === "passed" ? [] : ["Foundation acceptance unverified; gameplay is disabled."];
await writeFile(file, JSON.stringify(ledger, null, 2) + "\n");
process.exitCode = result.status === "passed" ? 0 : 1;
