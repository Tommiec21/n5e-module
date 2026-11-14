## 0.1.0-alpha.20: Condition removal from the shared core (SHARED1b)

- `removalResult` in `scripts/conditions/planner.mjs` now uses the shared core's removal check, keeping the module's record shape (ranks left, escalating Sealed `removalDC`). A parity test checks every registry removal option against the previous formula.
- Turn-start damage, durations and turn-end decay stay module-native: they work on native effects, stacking policies and world-time expiry, which the System-shaped core functions don't model.
- New `coreRemoval` gate. No live Foundry verification.

## 0.1.0-alpha.19: Chakra cost and upkeep from the shared core (SHARED1b)

- `scripts/integration/cost.mjs` and `scripts/concentration/calculation.mjs` now re-export the shared core's `computeJutsuCost`, `upkeepCost` and `concentrationDC`. The function bodies were identical, so results don't change.
- New `coreCost` gate.
- Known issue, not from this change: one test in `tests/casting.test.mjs` fails on main (`ChatMessage` is not stubbed); it is logged in `docs/CONTEXT.md`. No live Foundry verification.

## 0.1.0-alpha.18: Damage calculation from the shared core (SHARED1b)

- `scripts/damage/calculation.mjs` now re-exports the shared core's `damagePlan`, `healPlan` and `deathSaveResult`. Results are unchanged: the module snapshot passes no condition penalties, so the core's Bruised, Petrified and source-penalty steps stay off.
- `concentrationOnDamage` stays off in the module, as before; the module's concentration lifecycle owns those checks.
- New `coreDamage` gate. No live Foundry verification.

## 0.1.0-alpha.17 — Condition modifiers from the shared core (SHARED1b)

- `scripts/conditions/modifiers.mjs` now uses the shared core's `emptyPenalties`, `clampRanks` and `aggregatePenalties` (it was an identical copy); the module's condition registry stays the default.
- New `coreConditions` gate: adoption, conditions and condition-lifecycle tests plus the core's own tests. No live Foundry verification.

## 0.1.0-alpha.16 — Shared rules core (SHARED1b, first slice)

- Vendors the N5e shared rules core 0.26.0-alpha.1 from n5e-system into `scripts/core/` (`tools/sync-core.mjs`; version recorded in `module.json` flags) and ships it in the module package.
- New `scripts/integration/core-adapter.mjs` registers at init: core rules read `n5e-module` settings, else the core defaults.
- `scripts/saves/degree.mjs` now re-exports the core resolver (it was an identical copy).
- Daily `Core sync` workflow opens a PR when a newer core is released. GitHub's "Allow GitHub Actions to create and approve pull requests" repository setting must be on for it to open the PR.
- New `core` gate: the core's own tests, the adoption tests and the saves tests. No live Foundry verification.

## 0.1.0-alpha.15

Three native N5e classes with20 subclasses,355 features/options and24 stances; native HP/proficiencies/grants/choices/scales, Scholar Mastery, affinity stages and Focus counter/recovery.

## 0.1.0-alpha.14

S04b:native dependent source effects, same-source strongest suppression, six buff automations and scoped expiry;12 complete items toward100.

## 0.1.0-alpha.13

Selected S04a:source-owned native clan proficiency/speed effects, Hijutsu ability choices, Wisdom of the Court and source-specific condition expiration; six complete entries toward the user cap100.

## 0.1.0-alpha.12

Selected S02:242 source-cost casting profiles,12 reviewed base-rank combat/healing modes, explicit manual riders, test-actor resources and opt-in library updates.

## 0.1.0-alpha.11

Selected-content S01:377 native records, portable source snapshot, organized idempotent GM import and source-preserving actor import; mechanics review pending.

## 0.1.0-alpha.10

General reviewed casting profiles, rank and component eligibility, discipline grants, authored upcasts/costs and native payment with pre-payment concentration selection.

# Changelog

## 0.1.0-alpha.9

- Complete condition expiry, oldest-source decay and capped-source storage without latent overflow.
- Add willing-movement Chilled requests and automatic ending outside combat.
- Integrate Envenomed rest blocking and food/drink-dependent Exhaustion recovery with native rest hooks.

## 0.1.0-alpha.8

- Reuse N5e skill/proficiency/Mastery tables through inherited native preparation and rolls.
- Register Chakra Control, Illusions, Martial Arts and Ninshou with native skill data; concentration no longer needs a manual modifier on prepared actors.
- Apply source-unique additive Mastery, untrained-save half proficiency and one physical/mental condition contribution per skill roll.

## 0.1.0-alpha.7 — Interim milestone

- Package the unchanged Batch06 runtime with updated version and milestone documentation.
- Link runtime byte hashes to the previously checked artifact, inspect archive allowlisting/version agreement and retain provenance.
- Publish an annotated milestone version without rerunning gameplay checks; remaining work stays assigned to08–20.

## 0.1.0-alpha.6

- Add six opt-in native trial jutsu Items and a scoped activity-use bridge.
- Join native payment/rolls with shared saves, conditions, damage/healing and maintained-cast registration.
- Preserve source IDs/text and explicit mode/rank choices, with named follow-up batches for broader rule coverage.

## 0.1.0-alpha.5

- Add two source-linked maintained casts with player-selected replacement and upkeep choices.
- Reuse actual-cost upkeep/DC formulas and native attribute consumption; damage checks preserve Stable casts and captured identities.
- Add source-scoped ending/expiry controls and an implementation recap with outstanding integration limits.

## 0.1.0-alpha.4

- Reuse the confirmed N5e graded-save resolver with native kept-d20 rolls.
- Apply explicit per-target, per-mode and per-rank outcome tables through shared damage/condition services.
- Preserve unscaled source damage and binary native saves; include a Bane local-remapping fixture with manual exceptions.

## 0.1.0-alpha.3

- Reuse N5e damage/healing planners against native HP and inherited Chakra fields.
- Add per-pool DR allocation, manual damage cards/retargeting, owner-checked application and bounded local receipts.
- Connect condition damage to native roll cards and emit combined final-damage events for later concentration handling.

## 0.1.0-alpha.2

- Reuse N5e condition definitions and modifiers with native source-aware ActiveEffects.
- Add owner-checked rank/removal controls, inherited derived preparation and bounded combat lifecycle processing.
- Emit condition damage requests for Batch03; disclose manual decay allocation and deferred behavioral integrations.

## 0.1.0-alpha.1

- Define versioned source-aware condition, save, damage, resource and maintained-cast contracts.
- Add a host-independent NativeAdapter interface, explicit mutation ownership and unresolved-rule ledger.
- Select the contracts gate without repeating the unaffected foundation checks; gameplay remains disabled.

## 0.1.0-alpha.0

- Add a host-pinned native module shell with gameplay disabled.
- Add bounded process execution, cumulative checks, one Windows CI gate and artifact-only publishing.
- Build an allowlisted ZIP without copying the old system or SW5e code.

## 0.0.0-plan.1

- Establish private project, implementation prompts, reuse map, approved rulings and cumulative check ledger.
- No runtime gameplay or installable module is included.
