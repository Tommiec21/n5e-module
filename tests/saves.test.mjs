import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSave } from "../scripts/saves/planner.mjs";
import { applySaveOutcome } from "../scripts/saves/service.mjs";
import { rollSave, keptNatural } from "../scripts/saves/native.mjs";
import { baneExample } from "../scripts/saves/examples.mjs";

const source = { id: "cast-1", kind: "jutsu", actorUuid: "Actor.caster", itemUuid: "Actor.caster.Item.jutsu", castId: "cast-1" };
const row = (damage = "none", conditions = []) => ({ damage, conditions, manual: [] });

/** A complete authored fixture exercises mode separation without guessing a real jutsu's rules. */
function request() {
  return { version: 1, id: "save-1", source, activityId: "test-save", ability: "str", dc: 15, rank: "D", graded: true, mode: "normal", modes: { normal: { outcomes: { critSuccess: row(), success: row("half"), failure: row("full", [{ key: "concussed", ranks: 1 }]), critFailure: row("full", [{ key: "concussed", ranks: 2 }]) } }, finisher: { outcomes: { critSuccess: row(), success: row(), failure: row("full", [{ key: "concussed", ranks: 3 }]), critFailure: row("double", [{ key: "concussed", ranks: 4 }]) } } }, damagePacket: { version: 1, id: "damage-original", kind: "damage", targetUuid: "Actor.target", source, critical: false, rollUuid: "ChatMessage.damage", components: [{ id: "fire", type: "fire", pool: "hp", amount: 20 }] } };
}

/** Native-shaped resource/effect methods keep integration checks independent of a live game. */
function actor(uuid = "Actor.target") {
  const effects = [];
  effects.get = id => effects.find(e => e.id === id);
  return { uuid, isOwner: true, type: "character", effects, flags: {}, system: { attributes: { hp: { value: 100, max: 100, temp: 0 }, death: { failure: 0 } }, n5e: { chakra: { value: 20, max: 20, temp: 0 }, dr: 0 }, traits: { dr: { value: new Set() }, di: { value: new Set() }, dv: { value: new Set() } } }, async update(updates) { for (const [path, value] of Object.entries(updates)) { const parts = path.split("."); const last = parts.pop(); let target = this; for (const part of parts) target = target[part] ??= {}; target[last] = value; } }, async createEmbeddedDocuments(_type, records) { for (const data of records) { const effect = { ...data, id: `effect-${effects.length}` }; effect.update = async patch => Object.assign(effect, patch); effects.push(effect); } }, async toggleStatusEffect() {} };
}

const roll = (total, natural = 10) => ({ total, natural, rollUuid: "ChatMessage.save" });

test("confirmed boundaries, natural results and tier shifts retain their exact precedence", () => {
  for (const [total, outcome] of [[9, "critFailure"], [10, "critFailure"], [11, "failure"], [14, "failure"], [15, "success"], [19, "success"], [20, "critSuccess"]]) assert.equal(resolveSave(request(), "Actor.target", roll(total)).outcome.outcome, outcome);
  assert.equal(resolveSave({ ...request(), shift: -3 }, "Actor.target", roll(0, 20)).outcome.outcome, "success");
  assert.equal(resolveSave(request(), "Actor.target", roll(25, 1)).outcome.outcome, "critSuccess");
});

test("targets and modes have independent consequences without changing the source damage", async () => {
  globalThis.Hooks = { callAll() {} };
  const req = request(), original = structuredClone(req);
  const first = actor(), second = actor("Actor.second");
  await applySaveOutcome(first, req, roll(15));
  await applySaveOutcome(second, { ...req, mode: "finisher" }, roll(12));
  assert.equal(first.system.attributes.hp.value, 90);
  assert.equal(first.effects.length, 0);
  assert.equal(second.system.attributes.hp.value, 80);
  assert.equal(second.effects[0].flags["n5e-module"].condition.ranks, 3);
  assert.deepEqual(req, original);
});

test("save multiplier is applied once and repeated outcome application is locally idempotent", async () => {
  const a = actor(), req = request();
  a.system.traits.dr.value.add("fire");
  const first = await applySaveOutcome(a, req, roll(15));
  const duplicate = await applySaveOutcome(a, req, roll(15));
  assert.equal(a.system.attributes.hp.value, 90);
  assert.equal(duplicate.duplicate, true);
  assert.equal(first.outcome.rollUuid, "ChatMessage.save");
  await assert.rejects(applySaveOutcome(actor(), { ...req, damageOptions: { multiplier: 0.5 } }, roll(15)), /already have/);
});

test("Bane's S-rank remapping is local and does not change other outcome tables", () => {
  const base = resolveSave(baneExample(source), "Actor.target", roll(12));
  const higher = resolveSave(baneExample(source, "S"), "Actor.target", roll(12));
  assert.equal(base.effect.manual.length, 1);
  assert.equal(higher.effect.manual.length, 2);
  assert.equal(resolveSave(baneExample(source, "S"), "Actor.target", roll(1)).outcome.outcome, "failure");
  assert.equal(resolveSave(request(), "Actor.target", roll(1)).outcome.outcome, "critFailure");
});

test("native graded rolls preserve the kept d20/message while binary saves stay native", async () => {
  let created = 0, nativeArgs;
  const a = actor();
  const nativeRoll = { total: 15, dice: [{ faces: 20, results: [{ result: 3, discarded: true }, { result: 12, active: true }] }] };
  a.rollSavingThrow = async (...args) => { nativeArgs = args; return [nativeRoll]; };
  globalThis.ChatMessage = { getSpeaker: () => ({}), create: async data => { created++; assert.equal(data.rolls[0], nativeRoll); return { uuid: "ChatMessage.native-save" }; } };
  const result = await rollSave(a, request());
  assert.equal(nativeArgs[2].create, false);
  assert.equal(result.outcome.rollUuid, "ChatMessage.native-save");
  assert.equal(keptNatural(nativeRoll), 12);
  assert.equal(a.system.attributes.hp.value, 100);
  await rollSave(a, { graded: false, ability: "str", dc: 15 });
  assert.equal(nativeArgs.length, 1); assert.equal(created, 1);
  assert.throws(() => keptNatural({ dice: [{ faces: 20, results: [{ result: 1 }, { result: 2 }] }] }));
});

test("unknown conditions and malformed tables fail before damage or effect writes", async () => {
  const a = actor(), req = request();
  req.modes.normal.outcomes.failure.conditions = [{ key: "not-a-condition", ranks: 1 }];
  await assert.rejects(applySaveOutcome(a, req, roll(12)), /Unknown condition/);
  assert.equal(a.system.attributes.hp.value, 100);
  assert.equal(a.effects.length, 0);
});
