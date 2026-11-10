import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyCastEffect, expireCastEffects, sourceEffectClass, sourceEffectActorClass, attackEffectFormula } from "../scripts/integration/effects.mjs";
const bundle = JSON.parse(await readFile("content/selected-content.json", "utf8"));

function actor() {
  const a = { uuid: "Actor.recipient", documentName: "Actor", isOwner: true, effects: [], async createEmbeddedDocuments(_t, rows) { const docs = rows.map((r, i) => ({ ...r, id: `effect${this.effects.length + i}` })); this.effects.push(...docs); return docs; }, async deleteEmbeddedDocuments(_t, ids) { this.effects = this.effects.filter(e => !ids.includes(e.id)); } };
  return a;
}
const request = { id: "cast:recipient", name: "Bless", source: { itemUuid: "Actor.caster.Item.bless", castId: "cast" }, targetUuid: "Actor.recipient", changes: [], masteryTargets: [], attackFormula: "1d4", stackKey: "bless", potency: 1, expiresAt: 160, endsAt: null, gainedTurnId: "turn1", dependentOn: "Actor.caster.ActiveEffect.maintained" };

test("six buffs have concrete native effects and only12 complete jutsu/features count toward100", () => {
  const items = bundle.items.filter(i => Object.values(i.flags["n5e-module"].casting?.activities ?? {}).some(a => a.effects));
  assert.equal(items.length, 6);
  assert.equal(bundle.items.filter(i => ["base-rank-core", "base-level-core"].includes(i.flags["n5e-module"].selected.automation.status)).length, 12);
  const dark = items.find(i => i.system.identifier === "darkvision");
  assert.equal(Object.values(dark.flags["n5e-module"].casting.activities)[0].effects.changes[0].key, "system.attributes.senses.ranges.darkvision");
  const confidence = items.find(i => i.system.identifier === "confidence");
  assert.equal(Object.values(confidence.flags["n5e-module"].casting.activities)[0].maxTargets, 3);
  assert.equal(Object.values(confidence.flags["n5e-module"].casting.activities)[0].excludeSelf, true);
});

test("native dependency flags join effects to concentration and repeated requests do not duplicate", async () => {
  globalThis.game = { time: { worldTime: 100 } };
  globalThis.fromUuid = async () => ({ flags: { "n5e-module": { maintainedCast: { castId: "cast" } } } });
  const a = actor();
  await applyCastEffect(a, request); await applyCastEffect(a, request);
  assert.equal(a.effects.length, 1);
  assert.equal(a.effects[0].flags.dnd5e.dependentOn, request.dependentOn);
  assert.equal(a.effects[0].duration.seconds, 60);
  assert.equal(attackEffectFormula(a), "(1d4)");
  globalThis.fromUuid = async () => null;
  await assert.rejects(applyCastEffect(a, { ...request, id: "new" }), /concentration has ended/);
});

test("most-potent duplicate effects suppress without deleting weaker sources and native suppression wins", () => {
  class BaseActor { prepareData() {} }
  const Actor = sourceEffectActorClass(BaseActor); const a = new Actor(); a.documentName = "Actor";
  class BaseEffect { get isSuppressed() { return !!this.nativeSuppressed; } }
  const Effect = sourceEffectClass(BaseEffect);
  const create = (id, potency) => Object.assign(new Effect(), { id, parent: a, flags: { "n5e-module": { castEffect: { stackKey: "bless", potency } } } });
  const low = create("low", 1), high = create("high", 2); a.effects = [low, high];
  assert.equal(low.isSuppressed, true); assert.equal(high.isSuppressed, false);
  a.effects = [low]; a.prepareData(); assert.equal(low.isSuppressed, false);
  low.nativeSuppressed = true; assert.equal(low.isSuppressed, true);
});

test("source expiry and turn-end cleanup preserve unrelated effects", async () => {
  globalThis.game = { time: { worldTime: 100 } };
  const a = actor();
  await applyCastEffect(a, { ...request, dependentOn: null });
  a.effects.push({ id: "unrelated", flags: {} });
  await expireCastEffects(a, { time: 159 }); assert.equal(a.effects.length, 2);
  await expireCastEffects(a, { time: 160 }); assert.deepEqual(a.effects.map(e => e.id), ["unrelated"]);
  await applyCastEffect(a, { ...request, id: "flicker", dependentOn: null, expiresAt: null, endsAt: "turnEnd" });
  await expireCastEffects(a, { time: 100, phase: "turnEnd", turnId: null });
  assert.deepEqual(a.effects.map(e => e.id), ["unrelated"]);
});
