import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const root = resolve(process.argv[2] ?? "../n5e-system");
const clans = ["aburame", "hyuga", "uchiha", "uzumaki", "senju", "ryu", "hebi", "kuru"];
const groups = ["nin/nonElemental", "nin/fire", "nin/wind", "tai/taijutsu", "gen/phantasm", "buki/shinobiBasics"];

/** Snapshot only user-selected records so later conversion does not depend on another checkout. */
async function selectedRecords(pack) {
  const dir = resolve(root, "packs/_source", pack);
  const result = [];
  for (const path of (await readdir(dir, { recursive: true })).filter(p => p.endsWith(".json")).sort()) {
    const bytes = await readFile(resolve(dir, path));
    const data = JSON.parse(bytes);
    const c = data.flags?.n5e?.clanPackage;
    const included = pack === "jutsu" ? data.type === "jutsu" && data.system.rank === "D" && groups.includes(`${data.system.discipline}/${data.system.section}`) : clans.includes(c) && (data.type === "clan" || data.type === "jutsu" || data.type === "stance" || data.type === "feat" && ["clanFeature", "clanOption"].includes(data.system.category));
    if (included) result.push({ sourceId: `n5e.${pack}.${data._id}`, sourcePath: `packs/_source/${pack}/${path.replaceAll("\\", "/")}`, hash: createHash("sha256").update(bytes).digest("hex"), data });
  }
  return result;
}

const records = [...await selectedRecords("jutsu"), ...await selectedRecords("clans")];
await writeFile("content/selected-source.json", JSON.stringify({ version: 1, clans, groups, records }, null, 2) + "\n");
console.log(`Snapshotted ${records.length} selected source records.`);
