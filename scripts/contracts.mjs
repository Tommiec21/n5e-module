export const CONTRACT_VERSION = 1;
export const RANKS = Object.freeze(["E", "D", "C", "B", "A", "S"]);
export const OUTCOMES = Object.freeze(["critFailure", "failure", "success", "critSuccess"]);

/** Reject invalid external values without silently coercing resource amounts or identities. */
function requireValue(valid, field) {
  if (!valid) throw new TypeError(`Invalid contract field: ${field}`);
}

/** Require a nonempty document or operation reference without guessing its document type. */
function reference(value, field) {
  requireValue(typeof value === "string" && value.trim().length > 0, field);
}

/** Resource amounts and ranks are nonnegative safe integers, never NaN or Infinity. */
function amount(value, field) {
  requireValue(Number.isSafeInteger(value) && value >= 0, field);
}

/** Every message identifies its schema, operation and target independently of the host model. */
function envelope(value) {
  requireValue(value !== null && typeof value === "object", "payload");
  requireValue(value.version === CONTRACT_VERSION, "version");
  reference(value.id, "id");
  reference(value.targetUuid, "targetUuid");
}

/** Keep originating actor, item and cast separate, including environmental effects without documents. */
function source(value) {
  requireValue(value !== null && typeof value === "object", "source");
  reference(value.id, "source.id");
  reference(value.kind, "source.kind");
  for (const field of ["actorUuid", "itemUuid", "castId"]) if (value[field] !== null) reference(value[field], `source.${field}`);
}

/** A snapshot names both resource pools without inheriting the old N5e actor paths. */
function pools(value) {
  requireValue(value !== null && typeof value === "object", "pools");
  for (const key of ["hp", "chakra"]) {
    requireValue(value[key] !== null && typeof value[key] === "object", key);
    for (const field of ["value", "max", "temp"]) amount(value[key][field], `${key}.${field}`);
  }
}

/** Damage parts retain independent types and pool destinations for target-selected DR allocation. */
function components(value, amountField) {
  requireValue(Array.isArray(value) && value.length > 0, "components");
  const ids = new Set();
  for (const part of value) {
    reference(part.id, "component.id");
    requireValue(!ids.has(part.id), "duplicate component.id");
    ids.add(part.id);
    reference(part.type, "component.type");
    requireValue(["hp", "chakra"].includes(part.pool), "component.pool");
    amount(part[amountField], `component.${amountField}`);
  }
}

/** One stored application preserves its own source even when several sources share a status icon. */
function condition(value) {
  source(value.source);
  reference(value.key, "key");
  amount(value.ranks, "ranks");
  requireValue(value.ranks > 0, "active ranks");
  requireValue(value.sourceRank === null || RANKS.includes(value.sourceRank), "sourceRank");
  requireValue(value.stackingPolicyId === null || typeof value.stackingPolicyId === "string", "stackingPolicyId");
  requireValue(value.expiresAt === null || Number.isFinite(value.expiresAt), "expiresAt world seconds");
}

/** Save outcomes hold the resolved tier rather than interpreting rules or applying consequences. */
function save(value) {
  source(value.source);
  reference(value.activityId, "activityId");
  reference(value.rollUuid, "rollUuid");
  reference(value.policyId, "policyId");
  requireValue(OUTCOMES.includes(value.outcome), "outcome");
  requireValue(Number.isFinite(value.total) && Number.isFinite(value.dc), "total/dc");
  requireValue(Number.isInteger(value.natural) && value.natural >= 1 && value.natural <= 20, "natural d20");
  for (const field of ["damagePacketIds", "conditionApplicationIds"]) {
    requireValue(Array.isArray(value[field]), field);
    value[field].forEach(entry => reference(entry, field));
  }
}

/** Spending cannot enter the damage event stream and accidentally trigger concentration. */
function spend(value) {
  source(value.source);
  requireValue(value.kind === "spend", "kind");
  requireValue(value.pool === "chakra", "pool");
  amount(value.amount, "amount");
  requireValue(["cast", "upkeep", "feature"].includes(value.reason), "reason");
}

/** A packet contains already-rolled input and never asks the adapter to roll damage again. */
function damage(value) {
  source(value.source);
  requireValue(value.kind === "damage", "kind");
  requireValue(value.rollUuid === null || typeof value.rollUuid === "string", "rollUuid");
  components(value.components, "amount");
  requireValue(typeof value.critical === "boolean", "critical");
}

/** Results record both snapshots while leaving unresolved concentration interpretation explicitly unknown. */
function damageResult(value) {
  reference(value.packetId, "packetId");
  pools(value.before);
  pools(value.after);
  components(value.components, "afterDefenses");
  requireValue(value.concentration !== null && typeof value.concentration === "object", "concentration");
  requireValue(value.concentration.damageAmount === null || Number.isSafeInteger(value.concentration.damageAmount) && value.concentration.damageAmount >= 0, "concentration.damageAmount");
  requireValue(value.concentration.policyId === null || typeof value.concentration.policyId === "string", "concentration.policyId");
}

/** Actual cast rank and paid cost remain distinct from the item's printed base values. */
function maintained(value) {
  source(value.source);
  reference(value.itemUuid, "itemUuid");
  reference(value.castId, "castId");
  requireValue(RANKS.includes(value.baseRank) && RANKS.includes(value.castRank), "baseRank/castRank");
  amount(value.actualChakraPaid, "actualChakraPaid");
  requireValue(typeof value.stable === "boolean" && typeof value.efficient === "boolean", "stable/efficient");
  requireValue(Array.isArray(value.dependentEffectUuids), "dependentEffectUuids");
  value.dependentEffectUuids.forEach(entry => reference(entry, "dependentEffectUuid"));
  requireValue(value.expiresAt === null || Number.isFinite(value.expiresAt), "expiresAt world seconds");
}

/** A snapshot carries host-independent values for pure planners without reading Foundry globals. */
function actor(value) {
  pools(value.pools);
  requireValue(Array.isArray(value.conditionApplicationIds) && Array.isArray(value.maintainedCastIds), "source records");
  for (const id of [...value.conditionApplicationIds, ...value.maintainedCastIds]) reference(id, "source record id");
}

const validators = Object.freeze({ ConditionApplication: condition, SaveOutcome: save, DamagePacket: damage, DamageResult: damageResult, MaintainedCast: maintained, ResourceSpend: spend, ActorSnapshot: actor });

/** Validate structure only; no pending ruling is resolved and no actor or effect is mutated. */
export function validateContract(name, value) {
  requireValue(Object.hasOwn(validators, name), "contract name");
  envelope(value);
  validators[name](value);
  return value;
}
