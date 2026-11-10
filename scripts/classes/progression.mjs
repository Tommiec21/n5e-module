/** Resolve subclass grants against its own parent class rather than total or test-override character level. */
export function classLevelFor(actor, item) {
  const parent = item.type === "class" ? item : Array.from(actor.items ?? []).find(c => c.type === "class" && c.system.identifier === item.system.classIdentifier);
  return Number(parent?.system.levels ?? 0);
}

/** Return deduplicated source-stage Mastery, preserving the existing shared Mastery calculator and level caps. */
export function classMasterySources(actor) {
  const result = new Map();
  for (const item of actor.items ?? []) for (const grant of item.flags?.["n5e-module"]?.classProgression?.mastery ?? []) if (classLevelFor(actor, item) >= grant.level) result.set(grant.source, { source: grant.source, target: grant.target });
  return [...result.values()];
}

/** Collect automatic subclass affinity stages without writing permanent actor flags or replacing other grants. */
export function classTags(actor) {
  const result = new Set();
  for (const item of actor.items ?? []) for (const grant of item.flags?.["n5e-module"]?.classProgression?.tags ?? []) if (classLevelFor(actor, item) >= grant.level) result.add(grant.tag);
  return [...result];
}

/** Register only custom proficiency labels needed by these three classes, retaining native trait handling. */
export function registerClassProficiencies(config) {
  const weapons = ["Combat Scrolls", "Giant Combat Scrolls", "Combat Bracers", "Iron Claws", "Nunchaku", "Tonfa", "Knuckle Blades", "Battle Wire"];
  for (const label of weapons) config.DND5E.weaponProficiencies[`n5e-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`] = label;
  config.DND5E.toolProficiencies["n5e-hackers"] = "Hacker's Kit";
  config.DND5E.toolProficiencies["n5e-trappers"] = "Trapper's Kit";
}
