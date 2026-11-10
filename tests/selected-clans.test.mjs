import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { convertSnapshot } from "../tools/convert-selected.mjs";
import { disciplineNumbers } from "../scripts/skills/native.mjs";
import { setCondition, processTurnEnd } from "../scripts/conditions/service.mjs";
import { generalPlan } from "../scripts/integration/casting.mjs";
import { castTrial } from "../scripts/integration/bridge.mjs";

const source = JSON.parse(await readFile("content/selected-source.json", "utf8"));
const bundle = JSON.parse(await readFile("content/selected-content.json", "utf8"));

test("eight clan identities preserve native transfer grants and their source-approved Hijutsu abilities", () => {
  assert.deepEqual(convertSnapshot(source), bundle);
  const clans = bundle.items.filter(i => i.type === "race"); assert.equal(clans.length, 8);
  for (const clan of clans) {
    const effect = clan.effects.find(e => e.flags?.["n5e-module"]?.clanTraits);
    assert.equal(effect.transfer, true);
    assert.ok(effect.changes.some(c => c.key === "system.attributes.movement.walk" && c.value === "30"));
    assert.ok(effect.changes.filter(c => c.key.startsWith("system.skills.")).every(c => c.mode === 4 && c.value === "1"));
    const c = clan.flags["n5e-module"].selected.clan;
    for (const item of bundle.items.filter(i => i.flags["n5e-module"].selected.clan === c && i.flags["n5e-module"].casting)) assert.deepEqual(item.flags["n5e-module"].casting.allowedAbilities, clan.flags["n5e-module"].clanTraits.abilities);
  }
});

test("Wisdom of the Court is a source-owned passive effect and only six complete records count toward100", () => {
  const feature = bundle.items.find(i => i.system.identifier === "hyuga-bloodline-of-the-elite-wisdom-of-the-court");
  assert.deepEqual(feature.effects[0].changes.map(c => [c.key, c.value]), [["system.skills.per.ability", "wis"], ["system.skills.itm.ability", "wis"]]);
  assert.equal(feature.effects[0].transfer, true);
  const counted = bundle.items.filter(i => ["base-rank-core", "base-level-core"].includes(i.flags["n5e-module"].selected.automation.status));
  assert.equal(counted.length, 6);
  assert.ok(counted.every(i => i.type === "spell" || i.type === "feat"));
});

test("Hijutsu numbers use the selected permitted ability and reject unapproved selections before payment", async () => {
  const actor = { isOwner: true, items: [], effects: [], system: { n5e: { level: 1 }, abilities: { int: { mod: 1 }, wis: { mod: 4 } } } };
  assert.equal(disciplineNumbers(actor, "nin", { ability: "wis" }).attack, 7);
  const item = bundle.items.find(i => i.flags["n5e-module"].selected.clan === "aburame" && i.flags["n5e-module"].casting);
  const activity = { actor, item, id: Object.keys(item.flags["n5e-module"].casting.activities)[0] };
  await assert.rejects(castTrial(activity, { castingAbility: "str" }), /Choose one/);
});

test("source-specific next-turn expiration preserves the granting turn and removes only its own application", async () => {
  const effects = []; effects.get = id => effects.find(e => e.id === id);
  const actor = { uuid: "Actor.target", isOwner: true, effects, system: { traits: {} }, async createEmbeddedDocuments(_t, rows) { effects.push(...rows.map((r, i) => ({ ...r, id: `e${i}` }))); }, async deleteEmbeddedDocuments(_t, ids) { for (let i = effects.length - 1; i >= 0; i--) if (ids.includes(effects[i].id)) effects.splice(i, 1); } };
  const record = { version: 1, id: "temporary-deafened", targetUuid: actor.uuid, source: { id: "cast", kind: "jutsu", actorUuid: "Actor.caster", itemUuid: "Item.jutsu", castId: "cast" }, key: "deafened", ranks: 1, sourceRank: "D", stackingPolicyId: "add", expiresAt: null, endsAt: "nextTurnEnd" };
  await setCondition(actor, record, { worldTime: 100, turnId: "Combat.test:1:0" });
  assert.equal(effects[0].flags["n5e-module"].condition.expiresAt, null);
  await processTurnEnd(actor, "Combat.test:1:0", 100); assert.equal(effects.length, 1);
  await processTurnEnd(actor, "Combat.test:2:0", 106); assert.equal(effects.length, 0);
});

test("Erupting Flame now applies its actual Dazed condition without a manual or higher-rank rider", () => {
  const item = bundle.items.find(i => i.system.identifier === "fire-release-erupting-flame");
  const actor = { effects: [], items: [], statuses: new Set(), system: { n5e: { level: 1 }, abilities: { int: { value: 16, mod: 3 } } } };
  const plan = generalPlan({ actor, item, id: Object.keys(item.flags["n5e-module"].casting.activities)[0] }, { rank: "D", requirementsConfirmed: true, castingAbility: "int" });
  assert.deepEqual(plan.outcomes.failure.conditions, [{ key: "dazed", ranks: 1 }]);
  assert.deepEqual(plan.outcomes.success.conditions, []);
  assert.equal(plan.outcomes.success.damage, "half");
});
