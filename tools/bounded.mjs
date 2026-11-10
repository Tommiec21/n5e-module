import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

/** Kill the complete owned process group, including descendants that outlive their parent. */
function terminateTree(pid) {
  if (process.platform !== "win32") {
    try { process.kill(-pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; }
    return Promise.resolve();
  }
  return new Promise(resolve => {
    const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    const timer = setTimeout(() => { killer.kill(); resolve(); }, 5000);
    const finish = () => { clearTimeout(timer); resolve(); };
    killer.once("error", finish);
    killer.once("exit", finish);
  });
}

/** Run one explicit executable with a deadline that reserves time for child cleanup. */
export async function runBounded(command, args = [], { timeoutMs = 120000, record = "work/process-result.json", signal, stdio = "inherit" } = {}) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 590000) throw new RangeError("Deadline must be 1–590000 milliseconds; cleanup stays within 600 seconds.");
  if (signal?.aborted) throw new Error("Operation cancelled before launch.");
  const startedAt = new Date().toISOString();
  const child = spawn(command, args, { detached: process.platform !== "win32", windowsHide: true, stdio, shell: false });
  let reason = null;
  let cleanup;
  const stop = why => { reason ??= why; cleanup ??= child.pid ? terminateTree(child.pid) : Promise.resolve(); };
  const timeout = setTimeout(() => stop("timed-out"), timeoutMs);
  const cancel = () => stop("cancelled");
  signal?.addEventListener("abort", cancel, { once: true });
  const outcome = await new Promise(resolve => {
    child.once("error", error => resolve({ code: null, error: error.message }));
    child.once("exit", (code, exitSignal) => resolve({ code, signal: exitSignal }));
  });
  clearTimeout(timeout);
  signal?.removeEventListener("abort", cancel);
  // A completed parent must not leave background descendants running after its work slice.
  cleanup ??= child.pid ? terminateTree(child.pid) : Promise.resolve();
  await cleanup;
  const result = { startedAt, endedAt: new Date().toISOString(), status: reason ?? (outcome.code === 0 ? "passed" : "failed"), ...outcome };
  await mkdir(dirname(record), { recursive: true });
  await writeFile(record, JSON.stringify(result, null, 2) + "\n");
  return result;
}

/** Convert console cancellation into the same tree cleanup used by deadline expiry. */
async function main() {
  const [limit, command, ...args] = process.argv.slice(2);
  if (!limit || !command) throw new Error("Usage: node tools/bounded.mjs <milliseconds> <executable> [arguments]");
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  try {
    const result = await runBounded(command, args, { timeoutMs: Number(limit), signal: controller.signal });
    process.exitCode = result.status === "passed" ? 0 : result.status === "timed-out" ? 124 : 1;
  } finally {
    process.removeListener("SIGINT", cancel);
    process.removeListener("SIGTERM", cancel);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
