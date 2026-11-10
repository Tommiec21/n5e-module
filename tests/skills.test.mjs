import { test } from "node:test";
import assert from "node:assert/strict";
import { abilityMod, proficiencyForLevel, masteryFor } from "../scripts/skills/calculation.mjs";
import { registerSkills, applyMastery, rollSkill, setMasterySources, disciplineNumbers } from "../scripts/skills/native.mjs";
import { conditionActorClass } from "../scripts/conditions/actor.mjs";
import { rollCheck } from "../scripts/concentration/controls.mjs";

/** Native proficiency semantics are preserved while the N5e wrapper supplies its own level bands. */
class Prof {
  constructor(base, multiplier) { this.base = base; this.multiplier = multiplier; }
  get flat() { return Math.floor(this.base * this.multiplier); }
  get term() { return String(this.flat); }
}

test("ability/proficiency bands and distinct Mastery sources match the reused N5e rules", () => {
  assert.deepEqual([1, 4, 7, 10, 13, 16, 19].map(proficiencyForLevel), [3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual([9, 10, 15, 20].map(abilityMod), [-1, 0, 2, 5]);
  const entries = [{ target: "skill.cha", source: "feature-a" }, { target: "skill.n5eChakraControl", source: "feature-a" }, { target: "skill.cha", source: "feature-b" }, { target: "skill.cha", source: "feature-c" }];
  assert.deepEqual([1, 7, 12].map(level => masteryFor(entries, "skill.n5eChakraControl", level).bonus), [2, 4, 6]);
});

test("native schema/base preparation inherits behavior and registers all canonical skills", () => {
  class Field { constructor(options) { this.options = options; } }
  class Native {
    static defineSchema() { return { n5e: { fields: {} }, preserved: true }; }
    prepareBaseData() { this.attributes = { prof: 2 }; this.details = { level: 7 }; }
    calculateAbilityCheckProficiency(multiplier) { return new Prof(this.attributes.prof, multiplier); }
    prepareDerivedData() {}
  }
  const config = { Actor: { dataModels: { character: Native, npc: Native } }, DND5E: { skills: {} } };
  registerSkills(config, { NumberField: Field, ArrayField: Field, SchemaField: Field, StringField: Field });
  const Derived = config.Actor.dataModels.character, model = new Derived();
  model.prepareBaseData();
  assert.equal(model.attributes.prof, 5);
  assert.ok(model instanceof Native); assert.equal(Derived.defineSchema().preserved, true);
  assert.equal(Object.keys(config.DND5E.skills).length, 20);
  assert.equal(config.DND5E.skills.n5eChakraControl.ability, "con");
  assert.equal(model.calculateAbilityCheckProficiency(2, "con", {}).flat, 5);
});

test("Mastery adds independently of proficiency and saves receive half proficiency when untrained", () => {
  const actor = { items: [], effects: [], system: { details: { level: 7 }, n5e: { masterySources: [{ target: "skill.cha", source: "feature" }] }, attributes: { prof: 5, init: { prof: new Prof(5, 0), bonus: "0", total: 2 } }, abilities: { con: { mod: 2, proficient: 0, saveProf: new Prof(5, 0), save: { value: 2 }, bonuses: { save: "0" } } }, skills: { n5eChakraControl: { ability: "con", value: 0, bonuses: { check: "0" }, total: 2, passive: 12 } } } };
  applyMastery(actor);
  assert.equal(actor.system.skills.n5eChakraControl.total, 4);
  assert.equal(actor.system.abilities.con.save.value, 4);
  assert.equal(actor.system.attributes.init.prof.flat, 2);
  assert.equal(actor.n5eMastery["skill.n5eChakraControl"].rank, 1);
});

test("physical condition penalty enters the native skill formula exactly once", () => {
  class Native { prepareData() { this.system = { attributes: { ac: { value: 15 } }, bonuses: { abilities: { check: "0", save: "0" } }, abilities: { str: { bonuses: { check: "0", save: "0" } } }, skills: { ath: { ability: "str", bonuses: { check: "0" }, total: 5, passive: 15 } } }; } }
  const a = new (conditionActorClass(Native))();
  a.effects = [{ id: "effect", flags: { "n5e-module": { condition: { id: "source", key: "shaken", ranks: 2, sourceRank: null, stackingPolicyId: "add" } } } }];
  a.prepareData();
  assert.equal(a.system.abilities.str.bonuses.check, "(0) + (-2)");
  assert.equal(a.system.skills.ath.bonuses.check, "0");
  a.prepareData(); assert.equal(a.system.abilities.str.bonuses.check, "(0) + (-2)");
});

test("automatic Chakra Control uses the native skill without requesting a manual modifier", async () => {
  let called, prompts = 0;
  globalThis.foundry = { applications: { api: { DialogV2: { prompt: async () => prompts++ } } } };
  globalThis.ChatMessage = { getSpeaker: () => ({}), create: async () => ({}) };
  const actor = { isOwner: true, effects: [], flags: {}, system: { skills: { n5eChakraControl: {} } }, rollSkill: async config => { called = config; return [{ total: 20 }]; }, update: async () => {} };
  await rollCheck(actor, "damage-1", { dc: 18, atRisk: [] });
  assert.equal(called.skill, "n5eChakraControl"); assert.equal(prompts, 0);
  await rollSkill(actor, "cha", {}, {}, {}); assert.equal(called.skill, "n5eChakraControl");
});

test("discipline calculations use N5e proficiency/conditions and reject ASI save Mastery", async () => {
  const actor = { isOwner: true, items: [], effects: [], n5eConditions: { allDice: -1, checksAndAttacks: 0, saveDC: -1 }, system: { details: { level: 7 }, n5e: { masterySources: [] }, abilities: { int: { mod: 3 } } } };
  assert.deepEqual(disciplineNumbers(actor, "Ninjutsu"), { ability: "int", attack: 7, dc: 15 });
  await assert.rejects(setMasterySources(actor, [{ target: "save.con", source: "ASI 4" }]), /Invalid Mastery/);
});
