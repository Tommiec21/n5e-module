import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { skills } from "../scripts/skills/registry.mjs";

const selected = ["scout-nin", "ninjutsu-specialist", "taijutsu-specialist"];
const skillKey = key => ({ cha: "n5eChakraControl", nin: "n5eNinshou", mar: "n5eMartialArts", ill: "n5eIllusions" }[key] ?? key);
const id = key => createHash("sha256").update(`n5e-module.classes.${key}`).digest("hex").slice(0, 16);
const slug = value => value.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase().replace(/[^a-z0-9]+/g, "-");
const armor = { light: "lgt", medium: "med", heavy: "hvy", shield: "shl" };
const weapon = value => ({ simple: "sim", martial: "mar" }[value] ?? `n5e-${slug(value)}`);
const tool = value => ({ disguise: "disg", alchemist: "alchemist" }[value] ?? `n5e-${slug(value)}`);

/** Follow structural grant/choice/subclass references only, keeping unrelated classes outside this selection. */
export async function snapshotClasses(root) {
  const index = new Map();
  for (const pack of ["classes", "features", "stances"]) {
    const dir = resolve(root, "packs/_source", pack);
    for (const path of (await readdir(dir, { recursive: true })).filter(p => p.endsWith(".json")).sort()) {
      const bytes = await readFile(resolve(dir, path)); const data = JSON.parse(bytes);
      if (data.type === "Item") continue;
      const sourceId = `Compendium.n5e.${pack}.Item.${data._id}`;
      index.set(sourceId, { sourceId, sourcePath: `packs/_source/${pack}/${path.replaceAll("\\", "/")}`, hash: createHash("sha256").update(bytes).digest("hex"), data });
    }
  }
  const roots = [...index.values()].filter(r => r.data.type === "class" && selected.includes(r.data.system.identifier));
  if (roots.length !== 3) throw new Error("The three selected source classes are required.");
  const records = new Map();
  for (const root of roots) {
    const queue = [root.sourceId], visited = new Set();
    for (let i = 0; i < queue.length; i++) {
      const key = queue[i]; if (visited.has(key)) continue; visited.add(key);
      const record = index.get(key); if (!record) throw new Error(`Missing class dependency: ${key}`);
      const saved = records.get(key) ?? { ...record, owners: [] };
      if (!saved.owners.includes(root.data.system.identifier)) saved.owners.push(root.data.system.identifier);
      records.set(key, saved);
      queue.push(...(JSON.stringify([record.data.system.advancement, record.data.system.subclasses]).match(/Compendium\.n5e\.[\w-]+\.Item\.[A-Za-z0-9]+/g) ?? []));
    }
  }
  return { version: 1, classes: selected, records: [...records.values()].sort((a, b) => a.sourceId.localeCompare(b.sourceId)) };
}

/** Create one native advancement with an unspent value, retaining native reversal and ownership. */
const advancement = (key, type, title, level, configuration, extra = {}) => ({ _id: id(key), type, title, level, configuration, value: {}, ...extra });

/** Translate a source level grant or choice into the pinned host's native advancement schema. */
function itemAdvancements(record, lookup) {
  return (record.data.system.advancement ?? []).filter(a => ["feature", "itemChoice"].includes(a.type) && a.uuids?.length).map(a => {
    const refs = a.uuids.map(uuid => { if (!lookup.has(uuid)) throw new Error(`Missing advancement target: ${uuid}`); return { uuid: `Item.${id(uuid)}` }; });
    return a.type === "feature" ? advancement(`${record.sourceId}:${a.id}`, "ItemGrant", a.title, a.level, { items: refs.map(r => ({ ...r, optional: false })), optional: false, spell: null }) : advancement(`${record.sourceId}:${a.id}`, "ItemChoice", a.title, a.level, { allowDrops: false, choices: { [a.level]: { count: a.count ?? 1, replacement: false } }, pool: refs, restriction: { level: "", list: [], type: "", subtype: "" }, spell: null, type: "feat" });
  });
}

/** Native scale values expose the preserved twenty-level tables to sheets and resource formulas. */
function scale(key, label, values, type = "number") {
  return advancement(`scale:${key}`, "ScaleValue", label, 0, { identifier: slug(key.split(":").at(-1)), type, scale: Object.fromEntries(values.map((value, i) => [i + 1, { value: type === "number" ? Number(value) : String(value) }])) });
}

/** Native Trait advancements supply fixed proficiencies and explicit player choices. */
function traits(record) {
  const s = record.data.system;
  const grants = [...s.saves.map(k => `saves:${k}`), ...(s.skills.fixed ?? []).map(k => `skills:${skillKey(k)}`), ...s.armorProficiencies.map(k => `armor:${armor[k]}`), ...s.weaponProficiencies.map(k => `weapon:${weapon(k)}`), ...(s.tools.fixed ?? []).map(k => `tool:${tool(k)}`)];
  const choices = [];
  if (s.skills.choose) choices.push({ count: s.skills.choose, pool: (s.skills.from.length ? s.skills.from.map(skillKey) : Object.keys(skills)).map(k => `skills:${k}`) });
  if (s.tools.choose) choices.push({ count: s.tools.choose, pool: ["tool:*"] });
  return advancement(`${record.sourceId}:traits`, "Trait", "Starting proficiencies", 1, { allowReplacements: false, mode: "default", grants, choices }, { classRestriction: "primary" });
}

/** Convert complete source records while leaving extensive active mechanics explicitly manual. */
export function convertClasses(snapshot) {
  const lookup = new Map(snapshot.records.map(r => [r.sourceId, r]));
  const classNames = Object.fromEntries(snapshot.records.filter(r => r.data.type === "class").map(r => [r.data.system.identifier, r.data.name]));
  const items = snapshot.records.map(record => {
    const d = record.data, s = d.system;
    const type = d.type === "stance" ? "feat" : d.type;
    const owner = record.owners.length === 1 ? classNames[record.owners[0]] : "Shared Options";
    const category = type === "class" ? "Class" : type === "subclass" ? "Subclasses" : d.type === "stance" ? "Stances" : "Features and Options";
    const meta = { sourceId: record.sourceId, sourceHash: record.hash, sourcePath: record.sourcePath, originalType: d.type, owners: record.owners, clan: null, folderPath: ["N5e Classes", owner, category], deferredAdvancements: (s.advancement ?? []).filter(a => !["feature", "itemChoice", "mastery", "trait"].includes(a.type)), automation: { status: "manual", owner: "class-followup", reasons: ["Source text and native acquisition are preserved; extensive active or conditional mechanics remain manual."] } };
    const system = { identifier: s.identifier, description: { value: s.description ?? "", chat: "" }, source: { book: s.source?.book ?? "N5e", page: s.source?.page ?? "", custom: s.source?.custom ?? "" }, advancement: itemAdvancements(record, lookup) };
    if (type === "class") {
      Object.assign(system, { levels: 1, hd: { denomination: s.hitDie, spent: 0, additional: "" }, spellcasting: { progression: "none", ability: "" } });
      system.advancement.unshift(advancement(`${record.sourceId}:hp`, "HitPoints", "Hit Points", 0, {}), traits(record));
      system.advancement.push(scale(`${s.identifier}:jutsu-known`, "Jutsu Known", s.jutsuKnown), scale(`${s.identifier}:max-rank`, "Maximum Jutsu Rank", s.maxRank, "string"), ...(s.columns ?? []).map(c => scale(`${s.identifier}:${c.key}`, c.label, c.values, c.values.every(v => /^\d+$/.test(v)) ? "number" : "string")));
      if (s.subclasses?.length) system.advancement.push(advancement(`${record.sourceId}:subclass`, "Subclass", "Subclass", s.subclassLevel, {}));
      meta.classRules = { chakraDie: s.chakraDie, maxRank: s.maxRank, jutsuKnown: s.jutsuKnown, resourcePools: s.resourcePools, stanceGrant: s.stanceGrant, subclasses: s.subclasses?.map(uuid => `Item.${id(uuid)}`) ?? [] };
      meta.automation = { status: "native-class", owner: "classes-01", reasons: ["Chakra maximum rolls, custom recovery, maneuvers, molding modifiers and complex subclass behavior are deferred."], automated: ["native HP/Hit Dice", "starting proficiency grants/choices", "level feature grants/choices", "subclass selection", "native progression scales"] };
    } else if (type === "subclass") {
      system.classIdentifier = s.classIdentifier ?? record.owners[0];
      system.spellcasting = { progression: "none", ability: "" };
      meta.automation.automated = ["native subclass feature grants/choices"];
    } else {
      system.type = { value: "class", subtype: "" }; system.activities = {};
      system.requirements = typeof s.requirement === "string" ? s.requirement : [s.requirement?.level ? `Level ${s.requirement.level}` : "", s.requirement?.class ?? ""].filter(Boolean).join("; ");
      const uses = s.uses;
      if (uses?.max && !/lvl\(|@scale|@pools|@resources/.test(String(uses.max))) system.uses = { max: String(uses.max).replaceAll("@level", "@details.level"), spent: 0, recovery: [] };
    }
    const mastery = [...new Map((s.advancement ?? []).filter(a => a.type === "mastery").map(a => [`${a.level}:${a.key}`, { level: a.level, target: a.key.replace(/^skill\.([^.]*)$/, (_m, key) => `skill.${skillKey(key)}`), source: `${s.identifier}:${a.level}:${a.key}` }])).values()];
    const tags = (s.advancement ?? []).filter(a => a.type === "trait" && a.key === "affinity").flatMap(a => a.uuids.map(tag => ({ level: a.level, tag })));
    if (s.identifier === "refined-focus") {
      system.uses = { max: "1 + @prof", spent: 0, recovery: [{ period: "lr", type: "recoverAll", formula: "" }] };
      system.activities.spendFocus000001 = { _id: "spendFocus000001", name: "Spend Focus", type: "utility", consumption: { targets: [{ type: "itemUses", target: "", value: "1", scaling: { mode: "", formula: "" } }] } };
      meta.automation = { status: "partial", automated: ["native Focus counter", "native long-rest recovery"], reasons: ["Molding rules and conditional short-rest recovery remain manual."] };
    }
    return { _id: id(record.sourceId), name: d.name, type, img: d.img, system, effects: [], flags: { "n5e-module": { selected: meta, classProgression: { mastery, tags } } } };
  });
  for (const item of items) item.system.description.value = item.system.description.value.replace(/@UUID\[(Compendium\.n5e\.[\w-]+\.Item\.[A-Za-z0-9]+)\]/g, (full, uuid) => lookup.has(uuid) ? `@UUID[Item.${id(uuid)}]` : full);
  return { version: 1, id: "selected-classes", items };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const snapshot = process.argv[2] === "--snapshot" ? await snapshotClasses(resolve(process.argv[3] ?? "../n5e-system")) : JSON.parse(await readFile("content/class-source.json", "utf8"));
  if (process.argv[2] === "--snapshot") await writeFile("content/class-source.json", JSON.stringify(snapshot, null, 2) + "\n");
  const bundle = convertClasses(snapshot);
  await writeFile("content/class-content.json", JSON.stringify(bundle, null, 2) + "\n");
  console.log(`Converted ${bundle.items.length} records for the three selected classes.`);
}
