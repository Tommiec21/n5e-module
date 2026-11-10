import { readFile, writeFile, mkdir } from "node:fs/promises";

// Only these runtime files may enter the archive, so local credentials and campaign data cannot leak in.
const files = ["scripts/content/selected.mjs", "content/selected-content.json","scripts/integration/casting.mjs", "scripts/integration/payment.mjs", "module.json", "scripts/module.mjs", "scripts/compatibility.mjs", "scripts/contracts.mjs", "scripts/conditions/registry.mjs", "scripts/conditions/modifiers.mjs", "scripts/conditions/planner.mjs", "scripts/conditions/service.mjs", "scripts/conditions/actor.mjs", "scripts/conditions/controls.mjs", "scripts/conditions/lifecycle.mjs", "scripts/damage/calculation.mjs", "scripts/damage/schema.mjs", "scripts/damage/planner.mjs", "scripts/damage/service.mjs", "scripts/damage/controls.mjs", "scripts/saves/degree.mjs", "scripts/saves/planner.mjs", "scripts/saves/service.mjs", "scripts/saves/native.mjs", "scripts/saves/examples.mjs", "scripts/concentration/calculation.mjs", "scripts/concentration/planner.mjs", "scripts/concentration/service.mjs", "scripts/concentration/controls.mjs", "scripts/concentration/lifecycle.mjs", "scripts/integration/cost.mjs", "scripts/integration/planner.mjs", "scripts/integration/bridge.mjs", "scripts/integration/content.mjs", "content/trial-jutsu.json", "scripts/skills/registry.mjs", "scripts/skills/calculation.mjs", "scripts/skills/native.mjs", "scripts/conditions/completion.mjs", "scripts/conditions/completion-hooks.mjs", "scripts/conditions/policy.mjs", "README.md", "LICENSE", "CHANGELOG.md"];

/** Compute the ZIP integrity checksum without a packaging dependency. */
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Store deterministic file entries with a central directory readable by standard ZIP tools. */
function archive(entries) {
  const local = [], central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const filename = Buffer.from(name);
    const crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt16LE(33, 12);
    header.writeUInt32LE(crc, 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(filename.length, 26);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6); directory.writeUInt16LE(33, 14);
    directory.writeUInt32LE(crc, 16); directory.writeUInt32LE(data.length, 20); directory.writeUInt32LE(data.length, 24); directory.writeUInt16LE(filename.length, 28); directory.writeUInt32LE(offset, 42);
    local.push(header, filename, data); central.push(directory, filename);
    offset += header.length + filename.length + data.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

const manifest = await readFile("module.json");
const pkg = JSON.parse(await readFile("package.json", "utf8"));
if (JSON.parse(manifest).version !== pkg.version) throw new Error("Manifest/package version mismatch.");
const entries = await Promise.all(files.map(async name => ({ name, data: await readFile(name) })));
await mkdir("dist", { recursive: true });
await writeFile("dist/n5e-module.zip", archive(entries));
await writeFile("dist/module.json", manifest);
await writeFile("dist/source.json", JSON.stringify({ version: pkg.version, commit: process.env.GITHUB_SHA ?? "local", files }, null, 2));
console.log(`Packaged ${files.length} allowlisted files for ${pkg.version}.`);
