const skillKeys = { cha: "n5eChakraControl", nin: "n5eNinshou", ill: "n5eIllusions", mar: "n5eMartialArts" };

/** Native transfer effects retain their Item source, so removing a clan or feature removes its grants. */
export function applyClanTraits(item, record) {
  const s = record.data.system;
  if (record.data.type === "clan") {
    const changes = (s.skills?.fixed ?? []).map(key => ({ key: `system.skills.${skillKeys[key] ?? key}.value`, mode: 4, value: "1", priority: 40 }));
    if (s.speed) changes.push({ key: "system.attributes.movement.walk", mode: 5, value: String(s.speed), priority: 5 });
    item.effects.push({ name: `${item.name} — clan traits`, transfer: true, changes, flags: { "n5e-module": { clanTraits: true } } });
    item.flags["n5e-module"].clanTraits = { abilities: s.hijutsuAbilities ?? [], skillChoice: s.skills?.choose ? { count: s.skills.choose, from: s.skills.from.map(k => skillKeys[k] ?? k) } : null, affinities: s.affinities?.fixed ?? [] };
    item.flags["n5e-module"].selected.automation = { status: "partial", owner: "selected-content-04a", automated: ["native skill proficiency grants", "native walking speed"], reasons: ["Clan-specific feature progression, choices, senses and languages retain their source instructions."] };
  }
  if (s.identifier === "hyuga-bloodline-of-the-elite-wisdom-of-the-court") {
    item.effects.push({ name: item.name, transfer: true, changes: ["per", "itm"].map(key => ({ key: `system.skills.${key}.ability`, mode: 5, value: "wis", priority: 50 })) });
    item.flags["n5e-module"].selected.automation = { status: "base-level-core", owner: "selected-content-04a", automated: ["Wisdom for Persuasion", "Wisdom for Intimidation"], reasons: [] };
  }
  return item;
}
