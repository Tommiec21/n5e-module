import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";

const ledgerPath = "docs/check-ledger.json";
const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
const id = "interim-artifact-provenance-and-allowlist";
let scenario = ledger.scenarios.find(entry => entry.scenarioId === id);
if (!scenario) ledger.scenarios.push(scenario = { scenarioId: id, batch: "07", attempts: [], status: "pending" });
if (scenario.attempts.length >= 3) throw new Error("Milestone inspection attempt budget exhausted.");
const attempt = { number: scenario.attempts.length + 1, location: "CI/windows-latest", commit: process.env.GITHUB_SHA, startedAt: new Date().toISOString(), result: "reserved" };
scenario.attempts.push(attempt);
await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");

/** Hash unchanged runtime bytes to link this package to its previously checked source artifact. */
function digest(data) { return createHash("sha256").update(data).digest("hex"); }

/** Read stored ZIP entries and reject extra files or an unexpected archive format. */
function zipEntries(bytes) {
  const entries = new Map();
  let offset = 0;
  while (bytes.readUInt32LE(offset) === 0x04034b50) {
    assert.equal(bytes.readUInt16LE(offset + 8), 0, "Archive entries must be stored.");
    const length = bytes.readUInt32LE(offset + 18), nameLength = bytes.readUInt16LE(offset + 26), extraLength = bytes.readUInt16LE(offset + 28);
    const name = bytes.subarray(offset + 30, offset + 30 + nameLength).toString();
    assert.ok(!entries.has(name) && !name.includes("..") && !name.startsWith("/"), "Archive path must be unique and relative.");
    const start = offset + 30 + nameLength + extraLength;
    entries.set(name, bytes.subarray(start, start + length));
    offset = start + length;
  }
  assert.equal(bytes.readUInt32LE(offset), 0x02014b50, "Central directory must follow runtime entries.");
  return entries;
}

try {
  const previous = JSON.parse(await readFile("work/prior/source.json", "utf8"));
  const run = JSON.parse(await readFile("work/prior-run.json", "utf8"));
  assert.equal(run.conclusion, "success");
  assert.equal(run.path, ".github/workflows/validate.yml");
  assert.equal(run.head_repository.full_name, process.env.GITHUB_REPOSITORY);
  assert.equal(previous.commit, run.head_sha);
  const runtimeFiles = previous.files.filter(name => name.startsWith("scripts/") || name.startsWith("content/"));
  const currentFiles = [];
  for (const directory of ["scripts", "content"]) for (const name of await readdir(directory, { recursive: true })) if (/\.(mjs|json)$/.test(name)) currentFiles.push(`${directory}/${name.replaceAll("\\", "/")}`);
  assert.deepEqual(currentFiles.sort(), [...runtimeFiles].sort(), "No runtime files may be added or removed during this packaging-only milestone.");
  const hashes = {};
  for (const name of runtimeFiles) {
    const current = await readFile(name), checked = await readFile(`work/verified-runtime/${name}`);
    assert.equal(digest(current), digest(checked), `Runtime changed since validation: ${name}`);
    hashes[name] = digest(current);
  }
  execFileSync(process.execPath, ["tools/package.mjs"], { timeout: 20000, stdio: "inherit", windowsHide: true });
  const entries = zipEntries(await readFile("dist/n5e-module.zip"));
  assert.deepEqual([...entries.keys()].sort(), [...previous.files].sort(), "Package allowlist must remain exact.");
  for (const [name, data] of entries) assert.equal(digest(data), digest(await readFile(name)), `Archive differs from source: ${name}`);
  const manifest = JSON.parse(entries.get("module.json").toString());
  const checkedManifest = JSON.parse(await readFile("work/verified-runtime/module.json", "utf8"));
  for (const key of ["id", "compatibility", "relationships", "esmodules"]) assert.deepEqual(manifest[key], checkedManifest[key], `Host/runtime binding changed: ${key}`);
  assert.equal(manifest.version, JSON.parse(await readFile("package.json", "utf8")).version);
  assert.ok(manifest.manifest.includes(`/v${manifest.version}/`) && manifest.download.includes(`/v${manifest.version}/`));
  await writeFile("dist/milestone-evidence.json", JSON.stringify({ sourceRun: run.id, checkedRuntimeCommit: previous.commit, milestoneCommit: process.env.GITHUB_SHA, version: manifest.version, runtimeHashes: hashes, archiveFiles: [...entries.keys()], gameplayTestsRepeated: false, liveVerified: false }, null, 2));
  Object.assign(attempt, { result: "passed", endedAt: new Date().toISOString(), evidence: "milestone-evidence.json" });
  scenario.status = "passed";
  console.log(`Milestone inspection passed: ${runtimeFiles.length} unchanged runtime files, ${entries.size} allowlisted package entries.`);
} catch (error) {
  Object.assign(attempt, { result: "failed", endedAt: new Date().toISOString(), cause: error.message });
  scenario.status = scenario.attempts.length >= 3 ? "bypassed-unverified" : "pending";
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
}
