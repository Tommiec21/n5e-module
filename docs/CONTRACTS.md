# Shared contracts, version 1

Runtime structure checks are in scripts/contracts.mjs; the adapter interface and full field names are in scripts/native-adapter.d.ts.

These contracts define data exchange, not a new game rules engine or a working Foundry adapter.

## Identity and units

Every payload has version, id and targetUuid; id identifies the operation or stored application, while targetUuid identifies the actual actor or unlinked-token actor document.

Source identifies the originating actor, item and particular cast independently; environmental sources explicitly use null document references rather than invented item IDs.

Resource amounts and condition ranks are nonnegative safe integers; world-time expiry is measured in seconds, with null meaning no timestamp has been assigned.

Native document UUIDs remain opaque to planners, so target resolution belongs to the adapter and never assumes every target is a world Actor.

## Data boundaries

| Contract | Purpose | Rules not implied |
| --- | --- | --- |
| ActorSnapshot | HP/Chakra values, maxima, temporary pools and active record IDs | No direct Foundry documents or old actor paths |
| ConditionApplication | Per-source ranks, inflicting rank, expiry and stacking-policy identity | Null stacking policy is unresolved, not automatic addition |
| SaveOutcome | Original roll, target, tier, policy ID and consequence references | No default natural-result/equality/tier-shift ruling |
| DamagePacket | Original rolled components, types, pool destinations and source | Resource spending cannot masquerade as damage |
| DamageResult | Before/after pools, defended components and explicit concentration interpretation | Null concentration fields mean uncomputed, not no check |
| MaintainedCast | Cast identity, base rank, actual cast rank, actual paid cost and linked effects | No third-cast, upkeep-order or failure-ending policy |
| ResourceSpend | Chakra amount and cast/upkeep/feature reason | It does not emit a damage event |

Structural validation is not authorization, transport authentication or complete arithmetic validation; later planners must enforce game rules and application preconditions before updates.

Do not infer a concentration damage amount by summing fields until the selected damage policy is confirmed; record original components so no information is lost while that decision is pending.

## NativeAdapter boundary

| Method | Responsibility | Implementation owner |
| --- | --- | --- |
| readActor | Resolve target and return a normalized snapshot | Native document reader, no side effects |
| rollSave | Use native activity/roll flow and retain kept d20 plus roll reference | Native roll lifecycle |
| consumeResource | Apply an approved point spend through native consumption | One consumption path; no parallel old cast deduction |
| applyMutation | Apply approved damage/effect/concentration changes from one operation bundle | One application path; not an atomic distributed transaction |

The interface methods are declarations only; gameplay remains disabled until native implementations and their batch checks exist.

Native damage and N5e reductions cannot both own the same defended damage, and native single-spell concentration cannot independently clean up maintained N5e casts.

## Existing code adaptation

| Existing function | Later batch | Required adaptation |
| --- | --- | --- |
| clampRanks / aggregatePenalties | 02 | Source-resolved applications in; native derived modifiers out |
| defaultDuration / conditionTurnStart / conditionTurnEnd | 02 | Native effect timing and condition-damage requests |
| removalOptions / removalResult | 02 | Source-specific removal state, explicit confirmed policy |
| damagePlan / healPlan | 03 | Native HP and extended Chakra snapshots; one write owner |
| degreeOfSuccess | 04 | Confirmed policy and native kept-d20 result |
| upkeepCost / concentrationDC | 05 | Actual paid cost and actual maintained cast ranks |
| concentrationOnDamage | 05 | Cast records rather than item base rank; confirmed ending/damage policy |

No original rules function has been copied or activated in this batch, because this batch defines the boundary those functions will use.

Keep host Actors, Items and ActiveEffects intact; later native subclasses should inherit supported behavior and call super rather than replacing complete models or transplanting the old system.

SW5e supplies the extension pattern for model additions and activity consumption, not authority for N5e mechanics or a reason to copy its internal prototype replacements.
