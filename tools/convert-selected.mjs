import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const labels = { nin: "Ninjutsu", gen: "Genjutsu", tai: "Taijutsu", buki: "Bukijutsu", nonElemental: "Non-Elemental", fire: "Fire Release", wind: "Wind Release", taijutsu: "Taijutsu", phantasm: "Phantasm", shinobiBasics: "Shinobi Basics" };
const clanNames = { aburame: "Aburame", hyuga: "Hyūga", uchiha: "Uchiha", uzumaki: "Uzumaki", senju: "Senju", ryu: "Ryu", hebi: "Hebi", kuru: "Kuru" };

/** Stable native IDs are independent of the old document type and safe for source-to-source references. */
export const nativeId = sourceId => createHash("sha256").update(`n5e-module.selected.${sourceId}`).digest("hex").slice(0, 16);

/** Keep the requested discipline/group/rank hierarchy and isolate each clan's associated records. */
function folderPath(record) {
  const d = record.data, s = d.system, clan = d.flags?.n5e?.clanPackage;
  if (clan) return ["N5e Clans", clanNames[clan], d.type === "clan" ? "Identity" : d.type === "jutsu" ? "Jutsu" : d.type === "stance" ? "Stances" : s.category === "clanOption" ? "Feature Choices" : "Features", ...(d.type === "jutsu" ? [`${s.rank}-Rank`] : [])];
  return ["N5e Jutsu", labels[s.discipline], labels[s.section], `${s.rank}-Rank`];
}

/** Convert data shape only; unsupported mechanics remain explicit instead of acquiring guessed automation. */
export function convertRecord(record) {
  const d = record.data, s = d.system, jutsu = d.type === "jutsu";
  const metadata = { sourceId: record.sourceId, sourceHash: record.hash, sourcePath: record.sourcePath, legacyId: d._id, originalType: d.type, clan: d.flags?.n5e?.clanPackage ?? null, category: s.category ?? null, rank: s.rank ?? null, discipline: s.discipline ?? null, group: s.section ?? null, keywords: s.keywords ?? [], folderPath: folderPath(record), automation: { status: "manual", owner: "selected-content-02", reasons: ["Mechanics mapping awaits source review; this record preserves its complete source description."] }, sourceLine: d.flags?.n5e?.sourceLine ?? d.flags?.n5e?.jutsuBookImport?.sourceLine ?? null, sourceExpressions: d.flags?.n5e?.jutsuBookImport?.expressions ?? [] };
  const system = { identifier: s.identifier, description: { value: s.description ?? "", chat: "" }, source: { book: s.source?.book ?? "Tsunade's Studies Compendium", page: s.source?.page ?? "", custom: s.source?.custom ?? "" }, advancement: [] };
  if (jutsu) Object.assign(system, { level: 0, activities: {}, preparation: { mode: "atwill", prepared: true }, properties: [] });
  else if (d.type !== "clan") Object.assign(system, { type: { value: "race", subtype: "" }, requirements: [s.requirement?.level ? `Level ${s.requirement.level}` : "", metadata.clan ? clanNames[metadata.clan] : ""].filter(Boolean).join("; "), activities: {} });
  return { _id: nativeId(record.sourceId), name: d.name, type: jutsu ? "spell" : d.type === "clan" ? "race" : "feat", img: d.img, system, effects: [], flags: { "n5e-module": { selected: metadata } } };
}

/** Preserve selected links as native references and list unresolved external links for later conversion. */
function linkRecords(items, records) {
  const targets = new Map(records.map(r => [r.data._id, nativeId(r.sourceId)]));
  for (const item of items) {
    const meta = item.flags["n5e-module"].selected;
    meta.unresolvedReferences = [];
    item.system.description.value = item.system.description.value.replace(/@UUID\[(Compendium\.n5e\.[^\]]+\.Item\.([A-Za-z0-9]+))\](?:\{([^}]+)\})?/g, (_m, uuid, id, label) => {
      if (targets.has(id)) return `@UUID[Item.${targets.get(id)}]${label ? `{${label}}` : ""}`;
      meta.unresolvedReferences.push(uuid); return label ?? uuid;
    });
    if (item.type === "race") {
      const related = items.filter(i => i !== item && i.flags["n5e-module"].selected.clan === meta.clan);
      item.system.description.value += `<h3>Included clan records</h3><p>${related.map(i => `@UUID[Item.${i._id}]{${i.name}}`).join("<br>")}</p>`;
      meta.relatedSourceIds = related.map(i => i.flags["n5e-module"].selected.sourceId);
    }
  }
}

/** Produce a portable native-content bundle and an explicit per-record coverage inventory. */
export function convertSnapshot(snapshot) {
  const items = snapshot.records.map(convertRecord);
  linkRecords(items, snapshot.records);
  return { version: 1, id: "selected-testing", items };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const snapshot = JSON.parse(await readFile("content/selected-source.json", "utf8"));
  const bundle = convertSnapshot(snapshot);
  await writeFile("content/selected-content.json", JSON.stringify(bundle, null, 2) + "\n");
  console.log(`Converted ${bundle.items.length} selected records to native Items.`);
}

