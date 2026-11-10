# N5e module implementation recap

Status: interim development prerelease0.1.0-alpha.7, November10,2026; private repository https://github.com/Tommiec21/n5e-module.

## Implemented modules

| Batch | Published components | Scheduled follow-up |
| --- | --- | --- |
| 00 Foundation | Native package, pinned host guard, inherited extension strategy, bounded runner, selected CI gate, allowlisted ZIP and artifact-only releases | No installed-system/campaign changes |
| 01 Contracts | Versioned source-aware snapshots, conditions, saves, damage/spending, cast records, structural validation and NativeAdapter interface | Interface alone is not a complete native workflow adapter |
| 02 Conditions | Reused condition registry/calculations, source-specific ActiveEffects, capped additive ranks, controls/removal, immunity, inherited derived bonuses and combat lifecycle | Batch09: movement/rest behavior, multi-source decay allocation and out-of-combat condition expiry cleanup |
| 03 Damage | Reused HP/CP planners, native HP/extended Chakra fields, per-pool DR, target allocation, dynamic reduction, multipliers, temporary pools, retargeting, recovery restrictions and condition roll cards | Batches10/16/17: native/third-party integration; Batch13: resource maxima/DR progression |
| 04 Saves | Confirmed four-tier outcomes, native kept-d20 cards, explicit activity/rank/mode tables and target-specific damage/condition application | Binary saves remain native by design; Batch11: Bane suppression and exceptional clauses |
| 05 Concentration | Two maintained casts, replacement preflight, actual-spend upkeep, native consumption, owner choice cards, source cleanup, expiry and captured damage checks | Batch08: Chakra Control calculation; Batch10: casting registration |

## What has been reused

N5e condition definitions/modifiers, damage/healing planners, graded-save resolver and upkeep/DC formulas were adapted instead of rebuilding their rules.

SW5e guided model/lifecycle and point-consumption boundaries; this project does not copy its entire patch stack or promise its module compatibility.

Native dnd5e supplies documents, inherited models, ActiveEffects, rolls, dialogs, consumption and ordinary binary saves; N5e owns its rule interpretation and module-specific application paths.

## Confirmed rules carried forward

Graded saves use meet-DC success and five-point critical margins, natural20 guarantees at least success after shifts, and natural1 adds no global exception.

Condition ranks add across sources up to the cap, and removing a source does not delete another source’s records.

DR independently protects HP/Chakra, same-pool type order is chosen by the damaged creature, flat reductions precede multipliers, and opposing half/double sources cancel.

Concentration uses base15 plus actual maintained ranks versus half final combined HP/Chakra damage, includes temporary-pool absorption, and one failure ends both non-Stable casts.

The player chooses third-cast replacement and affordable upkeep selection; clones are ordinary NPCs, Combination casting is excluded and Clash remains opposed skills.

## Validation and publication

Batches00–05 each passed one selected CI run:4,4,5,6,6 and6 checks respectively, totalling31 passed with no failures/skips or bypasses.

Checks are host-independent/native-shaped automated checks, not a live Foundry multiplayer or campaign acceptance test; earlier unaffected gates were not repeatedly rerun.

Every work slice and child command was bounded below ten minutes, and private development releases reuse checked artifacts without running a second release gate.

## Scheduled additional batches

Batches06/07 delivered the six-Item integration trial and interim package; remaining work is explicitly scheduled in08–20.

The existing968-jutsu standalone-system import has not been converted into native dnd5e module compendiums, and classes/clans/backgrounds/advancement have not migrated.

No campaign/world/token/UUID migration, polished character sheet, universal Midi-QOL/DAE compatibility, full combat automation or distributed exactly-once guarantee is claimed.

Some APIs/controls already operate independently, but gameplayEnabled:false still signals that the whole N5e game integration is unfinished.

Batch05 publication: https://github.com/Tommiec21/n5e-module/releases/tag/v0.1.0-alpha.5; CI42860468142 and release42860690181 succeeded using runtime commit75aedb05c53eb1961e25bf972acb8814c1192530.

The authoritative remaining schedule is docs/REMAINING_BATCHES.md, covering08–20; earlier manual/deferred descriptions identify current runtime limitations, not user-approved permanent omissions.

## Added milestone deliveries

Batch06 connected six source-reviewed native trial Items to shared payment/roll/save/damage/concentration paths, passing three selected checks once.

Batch07 published0.1.0-alpha.7 with30 unchanged runtime files linked to that checked artifact and34 allowlisted archive entries, with no gameplay check repetition.

Total prior selected component/integration checks:34 passed; one additional packaging inspection passed, and user-led live acceptance remains pending.

The user requested a stop after07;08 is next only upon a new instruction.

## Batch10 — Gameplay System

Goal: general casting integration; role: connect reviewed native activities to rank/component eligibility, shared calculations, native payment and dual concentration without per-jutsu workflow scripts.

Delivered authored version-one profiles, level/rank limits, ability thresholds/exceptions, component/armor/mobility checks, explicit affinity/ability grants, authored costs/upcast expressions, native materials, pre-payment replacement and local overlap guards. CI42875586246 passed8 checks once; no live/user acceptance.

Remaining11–20 retain exceptions/longer casting, martial choices, progression, full content conversion, final UI, compatibility, migration, integrated checks and final supported release. Stop after10 at the user milestone.
