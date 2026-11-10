import { skills, sourceSkillKeys } from "./registry.mjs";
import { actorLevel, proficiencyForLevel, masteryFor, masterySources } from "./calculation.mjs";

/** Append a numeric rule contribution without replacing existing native bonus formulas. */
function append(formula, bonus) { return bonus ? `(${formula || 0}) + (${bonus})` : formula; }

/** Add the four N5e-specific skills before native MappingFields create their initial skill data. */
export function registerSkills(config, fields) {
  for (const [key, def] of Object.entries(skills)) config.DND5E.skills[key] = { ...config.DND5E.skills[key], label: def.label, ability: def.ability };
  for (const type of ["character", "npc"]) {
    const Base = config.Actor.dataModels[type];
    if (!Base) continue;
    config.Actor.dataModels[type] = class extends Base {
      static defineSchema() {
        const schema = super.defineSchema();
        schema.n5e.fields.level = new fields.NumberField({ nullable: true, integer: true, min: 1, max: 20, initial: null });
        schema.n5e.fields.masterySources = new fields.ArrayField(new fields.SchemaField({ target: new fields.StringField({ required: true, blank: false }), source: new fields.StringField({ required: true, blank: false }) }));
        return schema;
      }
      prepareBaseData() {
        super.prepareBaseData();
        this.attributes.prof = proficiencyForLevel(actorLevel(this));
      }
      calculateAbilityCheckProficiency(multiplier, ability, options) {
        return super.calculateAbilityCheckProficiency(multiplier >= 1 ? 1 : 0, ability, options);
      }
      prepareDerivedData() {
        super.prepareDerivedData();
        applyMastery(this.parent);
      }
    };
  }
}

/** Add Mastery after native preparation, retaining native Proficiency objects and source statistics. */
export function applyMastery(actor) {
  const data = actor.system, level = actorLevel(data), entries = masterySources(actor);
  const pb = proficiencyForLevel(level);
  const summary = {};
  data.attributes.prof = pb;
  for (const [key, ability] of Object.entries(data.abilities ?? {})) {
    const mastery = masteryFor(entries, `save.${key}`, level);
    const prior = ability.saveProf;
    if (prior?.constructor && prior.constructor !== Object) {
      ability.saveProf = new prior.constructor(pb, ability.proficient ? 1 : 0.5, true);
      if (Number.isFinite(ability.save?.value)) ability.save.value += ability.saveProf.flat - prior.flat + mastery.bonus;
    }
    if (ability.bonuses) ability.bonuses.save = append(ability.bonuses.save, mastery.bonus);
    summary[`save.${key}`] = mastery;
  }
  for (const [kind, collection] of [["skill", data.skills], ["tool", data.tools]]) for (const [key, skill] of Object.entries(collection ?? {})) {
    const mastery = masteryFor(entries, `${kind}.${key}`, level);
    if (skill.bonuses) skill.bonuses.check = append(skill.bonuses.check, mastery.bonus);
    if (Number.isFinite(skill.total)) skill.total += mastery.bonus;
    if (Number.isFinite(skill.passive)) skill.passive += mastery.bonus;
    summary[`${kind}.${key}`] = mastery;
  }
  const initiative = masteryFor(entries, "initiative", level);
  const init = data.attributes.init;
  if (init?.prof?.constructor && init.prof.constructor !== Object) {
    const previous = init.prof.flat;
    init.prof = new init.prof.constructor(pb, 0.5, true);
    init.bonus = append(init.bonus, initiative.bonus);
    if (Number.isFinite(init.total)) init.total += init.prof.flat - previous + initiative.bonus;
  }
  summary.initiative = initiative;
  for (const entry of entries) if (!summary[entry.target]) summary[entry.target] = masteryFor(entries, entry.target, level);
  actor.n5eMastery = summary;
}

/** Update native displayed totals for penalties already appended once to the native roll bonuses. */
export function skillActorClass(Base) {
  return class N5eSkillActor extends Base {
    prepareData() {
      super.prepareData();
      const m = this.n5eConditions;
      if (!m) return;
      for (const skill of Object.values(this.system.skills ?? {})) {
        const penalty = m.allDice + m.checksAndAttacks + (["str", "dex", "con"].includes(skill.ability) ? m.d20Physical : m.d20Mental);
        if (Number.isFinite(skill.total)) skill.total += penalty;
        if (Number.isFinite(skill.passive)) skill.passive += penalty;
      }
      for (const [key, ability] of Object.entries(this.system.abilities ?? {})) if (Number.isFinite(ability.save?.value)) ability.save.value += m.allDice + (["str", "dex", "con"].includes(key) ? m.d20Physical : m.d20Mental);
    }
  };
}

/** Supply source-default discipline numbers while later feature adapters own alternative abilities and bonuses. */
export function disciplineNumbers(actor, discipline) {
  const key = { Ninjutsu: "nin", Genjutsu: "gen", Taijutsu: "tai", Bukijutsu: "tai" }[discipline] ?? discipline;
  const ability = { nin: "int", gen: "wis", tai: "str" }[key];
  if (!ability) throw new Error("Unknown discipline.");
  const pb = proficiencyForLevel(actorLevel(actor.system));
  const mod = actor.system.abilities[ability].mod;
  const m = actor.n5eConditions;
  const mastery = masteryFor(masterySources(actor), `attack.${key}`, actorLevel(actor.system));
  return { ability, attack: mod + pb + mastery.bonus + (m?.allDice ?? 0) + (m?.checksAndAttacks ?? 0), dc: 8 + mod + pb + (m?.saveDC ?? 0) };
}

/** Expose native skill rolling with original N5e key aliases for old content references. */
export function rollSkill(actor, key, config = {}, dialog = {}, message = {}) {
  const skill = sourceSkillKeys[key] ?? key;
  if (!skills[skill]) throw new Error("Unknown N5e skill.");
  return actor.rollSkill({ ...config, skill }, dialog, message);
}

/** Store explicit Mastery source grants without pretending progression conversion has already run. */
export async function setMasterySources(actor, entries) {
  if (!actor.isOwner) throw new Error("Actor ownership is required.");
  if (!Array.isArray(entries) || entries.some(e => typeof e.target !== "string" || !e.target || typeof e.source !== "string" || !e.source || /^ASI\b/i.test(e.source) && !/^(skill|tool)\./.test(e.target))) throw new Error("Invalid Mastery source or ASI target.");
  return actor.update({ "system.n5e.masterySources": structuredClone(entries) });
}
