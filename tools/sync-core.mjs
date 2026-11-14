/** Vendor the N5e shared rules core from an n5e-system release into scripts/core (SHARED1b, M1). */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { inflateRawSync } from "node:zlib";

const REPO = "Tommiec21/n5e-system";
const TARGET = "scripts/core";
const PREFIX = "n5e-core/";

/** Read every file entry of a ZIP buffer (stored or deflated) from its central directory. */
export function unzip(buffer) {
  let end = buffer.length - 22;
  while (end >= 0 && buffer.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error("Not a ZIP archive.");
  const count = buffer.readUInt16LE(end + 10);
  let pos = buffer.readUInt32LE(end + 16);
  const files = [];
  for (let i = 0; i < count; i++) {
    if (buffer.readUInt32LE(pos) !== 0x02014b50) throw new Error("Corrupt ZIP central directory.");
    const method = buffer.readUInt16LE(pos + 10), size = buffer.readUInt32LE(pos + 20);
    const nameLength = buffer.readUInt16LE(pos + 28), extra = buffer.readUInt16LE(pos + 30), comment = buffer.readUInt16LE(pos + 32);
    const local = buffer.readUInt32LE(pos + 42);
    const name = buffer.toString("utf8", pos + 46, pos + 46 + nameLength);
    pos += 46 + nameLength + extra + comment;
    if (name.endsWith("/")) continue;
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const raw = buffer.subarray(start, start + size);
    if (method !== 0 && method !== 8) throw new Error(`Unsupported ZIP method ${method} for ${name}.`);
    files.push({ name, data: method === 8 ? inflateRawSync(raw) : Buffer.from(raw) });
  }
  return files;
}

/** Latest n5e-system release tag (vX.Y.Z), or the given version as a tag. */
export async function resolveTag(version) {
  if (version && version !== "latest") return version.startsWith("v") ? version : `v${version}`;
  const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { accept: "application/vnd.github+json" } });
  if (!response.ok) throw new Error(`Release lookup failed: ${response.status}.`);
  return (await response.json()).tag_name;
}

/** Replace scripts/core with the core from that release and record its version in module.json. */
export async function syncCore(version = "latest") {
  const tag = await resolveTag(version);
  const response = await fetch(`https://github.com/${REPO}/releases/download/${tag}/n5e-core.zip`);
  if (!response.ok) throw new Error(`Core download failed for ${tag}: ${response.status}.`);
  const files = unzip(Buffer.from(await response.arrayBuffer())).filter(f => f.name.startsWith(PREFIX));
  if (!files.some(f => f.name === `${PREFIX}index.mjs`)) throw new Error(`${tag} has no core index.`);
  await rm(TARGET, { recursive: true, force: true });
  for (const { name, data } of files) {
    const rel = normalize(name.slice(PREFIX.length));
    if (rel.startsWith("..")) throw new Error(`Unsafe path in core archive: ${name}.`);
    await mkdir(dirname(join(TARGET, rel)), { recursive: true });
    await writeFile(join(TARGET, rel), data);
  }
  const manifest = JSON.parse(await readFile("module.json", "utf8"));
  const coreVersion = JSON.parse(await readFile(join(TARGET, "package.json"), "utf8")).version;
  manifest.flags = { ...(manifest.flags ?? {}), n5eCore: { version: coreVersion, tag } };
  await writeFile("module.json", JSON.stringify(manifest, null, 2) + "\n");
  return { tag, version: coreVersion, files: files.length };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("sync-core.mjs")) {
  const result = await syncCore(process.argv[2]);
  console.log(`Core ${result.version} (${result.tag}): ${result.files} files in ${TARGET}.`);
}
