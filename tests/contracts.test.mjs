import { test } from "node:test";
import assert from "node:assert/strict";
import { validateContract } from "../scripts/contracts.mjs";

const source = { id: "cast-1", kind: "jutsu", actorUuid: "Actor.caster", itemUuid: "Actor.caster.Item.jutsu", castId: "cast-1" };
const base = { version: 1, id: "operation-1", targetUuid: "Actor.target" };
const pool = { value: 10, max: 20, temp: 3 };
const pools = { hp: { ...pool }, chakra: { ...pool } };
const condition = { ...base, source, key: "burned", ranks: 2, sourceRank: "B", stackingPolicyId: null, expiresAt: null };

test("per-source applications and per-target saves retain identity without mutation", () => {
  const before = structuredClone(condition);
  assert.equal(validateContract("ConditionApplication", condition), condition);
  assert.deepEqual(condition, before);
  const other = { ...condition, id: "condition-2", source: { ...source, id: "cast-2" } };
  validateContract("ConditionApplication", other);
  assert.notEqual(condition.source.id, other.source.id);
  for (const targetUuid of ["Actor.first", "Actor.second"]) validateContract("SaveOutcome", { ...base, targetUuid, source, activityId: "normal-save", rollUuid: "ChatMessage.roll", policyId: "explicit-policy", outcome: "failure", total: 12, dc: 15, natural: 10, damagePacketIds: ["damage-1"], conditionApplicationIds: [condition.id] });
});

test("damage and spending cannot impersonate each other or collapse pool destinations", () => {
  const packet = { ...base, source, kind: "damage", rollUuid: "ChatMessage.damage", critical: false, components: [{ id: "fire", type: "fire", pool: "hp", amount: 8 }, { id: "chakra", type: "chakra", pool: "chakra", amount: 8 }] };
  validateContract("DamagePacket", packet);
  assert.throws(() => validateContract("DamagePacket", { ...packet, kind: "spend" }));
  const spend = { ...base, source, kind: "spend", pool: "chakra", amount: 8, reason: "upkeep" };
  validateContract("ResourceSpend", spend);
  assert.throws(() => validateContract("ResourceSpend", packet));
  assert.throws(() => validateContract("DamagePacket", { ...packet, components: [...packet.components, packet.components[0]] }));
});

test("maintained state retains actual cast rank, paid cost and unresolved damage policy", () => {
  const maintained = { ...base, source, itemUuid: source.itemUuid, castId: source.castId, baseRank: "D", castRank: "A", actualChakraPaid: 9, stable: false, efficient: true, dependentEffectUuids: ["Actor.target.ActiveEffect.effect"], expiresAt: null };
  validateContract("MaintainedCast", maintained);
  assert.notEqual(maintained.baseRank, maintained.castRank);
  validateContract("DamageResult", { ...base, packetId: "packet-1", before: pools, after: pools, components: [{ id: "cp", type: "chakra", pool: "chakra", afterDefenses: 4 }], concentration: { damageAmount: null, policyId: null } });
  validateContract("ActorSnapshot", { ...base, pools, conditionApplicationIds: [condition.id], maintainedCastIds: [maintained.id] });
});

test("invalid versions, missing sources and invalid point amounts fail without guessing defaults", () => {
  for (const patch of [{ version: 2 }, { ranks: NaN }, { ranks: -1 }, { source: {} }, { targetUuid: "" }]) assert.throws(() => validateContract("ConditionApplication", { ...condition, ...patch }));
  assert.throws(() => validateContract("MaintainedCast", { ...base }));
  assert.throws(() => validateContract("unknown", base));
});
