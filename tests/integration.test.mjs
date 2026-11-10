import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { trialPlan } from "../scripts/integration/planner.mjs";
import { castTrial } from "../scripts/integration/bridge.mjs";
import { applySaveOutcome } from "../scripts/saves/service.mjs";

const items = JSON.parse(await readFile("content/trial-jutsu.json", "utf8"));

/** Native-shaped documents expose writes without starting a live Foundry instance. */
function actor(uuid) {
  const effects = []; effects.get = id => effects.find(e => e.id === id);
  return { uuid, type: "character", isOwner: true, effects, flags: {}, statuses: new Set(), system: { attributes: { hp: { value: 100, max: 100, temp: 0 }, death: {} }, n5e: { chakra: { value: 100, max: 100, temp: 0 }, dr: 5 }, traits: {}, abilities: { str: { mod: 3 } } }, async update(updates) { for (const [path, value] of Object.entries(updates)) { const parts = path.split("."); const key = parts.pop(); let current = this; for (const part of parts) current = current[part] ??= {}; current[key] = value; } }, async createEmbeddedDocuments(_type, rows) { for (const row of rows) effects.push({ ...row, id: `effect-${effects.length}` }); }, async deleteEmbeddedDocuments(_t, ids) { for (let i = effects.length - 1; i >= 0; i--) if (ids.includes(effects[i].id)) effects.splice(i, 1); }, async toggleStatusEffect() {}, async rollSavingThrow() { return [{ total: 12, dice: [{ faces: 20, results: [{ result: 10, active: true }] }] }]; } };
}

/** Resolve an authored native activity and its stable trial metadata. */
function activity(name, role, caster) {
  const item = structuredClone(items.find(i => i.name === name));
  item.uuid = `${caster.uuid}.Item.${item._id}`;
  const id = Object.entries(item.flags["n5e-module"].trial.roles).find(([_id, value]) => value === role)[0];
  return { ...item.system.activities[id], id, item, actor: caster };
}

const options = { rank: "D", attackBonus: 5, dc: 20, requirementsConfirmed: true, unarmedFormula: "1d4+3" };

test("six source-preserving native Items keep mode/IDs distinct and omit native resource consumption", () => {
  assert.equal(items.length, 6); assert.equal(new Set(items.map(i => i._id)).size, 6);
  for (const item of items) {
    assert.equal(item.type, "spell");
    assert.ok(item.flags["n5e-module"].trial.sourceHash);
    for (const activity of Object.values(item.system.activities)) assert.deepEqual(activity.consumption.targets, []);
  }
  const a = actor("Actor.caster");
  const normal = trialPlan(activity("Butterfly Kick", "normal", a), options);
  const finisher = trialPlan(activity("Butterfly Kick", "finisher", a), options);
  assert.notEqual(normal.kind, finisher.kind);
  assert.match(normal.parts[0].formula, /2d6/); assert.match(finisher.parts[0].formula, /4d6/);
});

test("Adept Healing modes and Chakra Bolt rank changes remain separate source formulas", () => {
  const a = actor("Actor.caster");
  assert.equal(trialPlan(activity("Medical Release: Adept Healing", "bonus", a), { ...options, rank: "C" }).parts[0].formula, "12");
  assert.equal(trialPlan(activity("Medical Release: Adept Healing", "action", a), options).parts[0].formula, "3d8");
  assert.equal(trialPlan(activity("Chakra Bolt", "normal", a), { ...options, rank: "C" }).parts[0].formula, "5d6");
  assert.throws(() => trialPlan(activity("Butterfly Kick", "normal", a), { ...options, rank: "C" }), /Batch12/);
});

test("native payment, mixed damage, graded target result and two maintained records join end to end", async () => {
  const caster = actor("Actor.caster"), target = actor("Actor.target");
  const messages = [];
  globalThis.game = { time: { worldTime: 100 } };
  globalThis.Hooks = { callAll() {} };
  globalThis.Roll = { validate: () => true };
  globalThis.CONFIG = { Dice: { DamageRoll: class { constructor(formula) { this.formula = formula; } async evaluate() { this.total = 8; return this; } } }, DND5E: { activityConsumptionTypes: { attribute: { async consume(_config, updates) { const cost = (await this.resolveCost()).total; updates.actor["system.n5e.chakra.value"] = this.actor.system.n5e.chakra.value - cost; } } } } };
  globalThis.ChatMessage = { getSpeaker: () => ({}), create: async data => { const message = { ...data, uuid: `ChatMessage.${messages.length}` }; messages.push(message); return message; } };
  const mixed = await castTrial(activity("Sealing Art: Fracturing Splinter", "normal", caster), options, [target]);
  assert.equal(caster.system.n5e.chakra.value, 96);
  assert.deepEqual(mixed.packet.components.map(p => p.pool), ["hp", "chakra"]);
  const saveMessage = messages.at(-1), save = saveMessage.flags["n5e-module"].save;
  await applySaveOutcome(target, save.request, { ...save.roll, rollUuid: saveMessage.uuid });
  assert.deepEqual([target.system.attributes.hp.value, target.system.n5e.chakra.value], [97, 97]);
  await castTrial(activity("Bane", "normal", caster), options, []);
  await castTrial(activity("Arms of Buddha", "start", caster), options, []);
  assert.equal(caster.effects.filter(e => e.flags?.["n5e-module"]?.maintainedCast).length, 2);
  assert.equal(caster.effects[0].flags["n5e-module"].maintainedCast.actualChakraPaid, 5);
});
