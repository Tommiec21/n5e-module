# Module context

Updated November 10, 2026; repository owner Tommiec21, project n5e-module, visibility private.

Current milestone: Batch02 ranked-condition services published privately as v0.1.0-alpha.2; casting and damage integration remain disabled.

Current scope: reusable prompts, private repository, version history and bounded future implementation batches for ranked conditions, HP/Chakra damage, graded saves and dual concentration.

## Batch status

| Batch | Status | Checkpoint |
| --- | --- | --- |
| Planning baseline | Published | 88e8193, annotated tag v0.0.0-plan.1 |
| 00 Foundation | Published | v0.1.0-alpha.0; first CI attempt, 4 passed; no live verification |
| 01 Contracts | Published | v0.1.0-alpha.1; 4 first-attempt contract checks passed; pending rulings remain explicit |
| 02 Conditions | Published with disclosed manual paths | v0.1.0-alpha.2; 5 checks passed once, no live verification |
| 03 Damage | In progress | Codex, batch/03-damage; slice started16:33UTC |
| 04 Saves | Not started | Native rolls and graded outcomes |
| 05 Concentration | Not started | Two casts, upkeep and damage checks |
| 06 Integration | Not started | Representative jutsu only |
| 07 Packaging | Not started | Verified or explicitly limited prerelease |

## Handoff record format

Record batch, owner, start/end time, changed files, completed slice, next checkpoint, decisions, check attempt IDs and bypassed limitations.

A tool yielding output does not stop its underlying process; enforce the ten-minute ceiling using actual process and job timeouts.

## Source priority

Explicit user rulings override conflicting book/code text; preserve source provenance and ask about unresolved contradictions.

Research findings are design evidence, not a claim of live compatibility; no live verification is permitted.

## Publication record

Private repository https://github.com/Tommiec21/n5e-module created with user-selected private visibility; initial commit and annotated planning tag pushed successfully.

Eight batch prompts plus COMMON, rules, reuse map and ledger are versioned; no gameplay tests or live verification ran, and no command approached the 600-second ceiling.

## Batch00 completed checkpoint

Codex work slice: 2026-11-10 13:55–14:02 UTC, under ten minutes; runtime commit e688636a1c8333056ec4ac713b0c07199935c8ab, branch batch/00-foundation.

Added module.json, host compatibility guard and init/ready status API without model replacement or gameplay hooks; supported inspection target is Foundry13.347+ within v13 and dnd5e5.3.3.

Added bounded process runner with cancellation/child-tree cleanup, cumulative gate ledger, four foundation checks, deterministic allowlisted ZIP packaging and artifact-only release workflow.

CI42829555459 passed four checks on its first attempt with no failures or skips; publication42829787396 reused that artifact without retesting.

Private development prerelease v0.1.0-alpha.0 contains module.json (755 bytes) and n5e-module.zip (5255 bytes); native Foundry acceptance remains unverified and private assets require authenticated access.

No live instance, campaign migration, installed package changes or gameplay automation; no bypassed checks.

Next: Batch01 contracts and pending rule questions only when requested; do not begin another batch automatically.

## Batch01 completed checkpoint

Codex slice: 2026-11-10 14:20–14:26 UTC, under ten minutes; runtime commit18abc0aa1375ac73d1b2326d85412dd66c5d2731, branch batch/01-contracts.

Defined version1 condition/save/damage/maintained-cast/resource-spend/actor-snapshot contracts, pure structural validators and native adapter method declarations; no native gameplay adapter or rule planner is activated.

Documented exact function reuse and mutation ownership in docs/CONTRACTS.md; unanswered save-tier and concentration failure/damage-amount questions are tracked in docs/DECISIONS.md.

CI42833821694 passed4 contract checks on first attempt with0 failures/skips; unaffected foundation checks were not repeated.

Release42833951034 published v0.1.0-alpha.1 using the same artifact: module.json879bytes, n5e-module.zip12918bytes; no bypassed checks or live verification.

Next: Batch02 ranked conditions, limited to source-settled behaviors; ask about condition-specific stacking only where source and existing rulings do not settle it.

## User rulings received after Batch01

Save tiers retain the existing five-point margins, meet-DC success and natural20 floor after shifts; natural1 has no extra effect unless specified.

One failed concentration check ends both non-Stable maintained jutsu; concentration damage combines final HP/Chakra damage after defenses including temporary pools.

Docs-only update; no gameplay implementation or check rerun.

## Batch02 completed checkpoint

Codex slice16:23–16:32UTC, under ten minutes; runtime f7b0e9116f60ace6c423dae9549be20f08a58ba8, branch batch/02-conditions.

Reused original registry/modifier code, added native ActiveEffect source storage, explicit rank controls/removal, additive capped aggregation, native Actor inheritance and active-GM combat processing.

User confirmed different-source ranks add up to the cap; setCondition records that policy, while source-specific records remain independently removable.

CI42855037496:5 passed,0 failed/skipped, first attempt; release42855267960 reused the same14-file artifact without retesting.

Private prerelease v0.1.0-alpha.2: module.json884bytes and n5e-module.zip41045bytes; no local installation or live verification.

Manual/deferred paths are explicit: multi-source decay allocation, movement/rest behavior and out-of-combat expiry cleanup; casting costs/DC/DR/behavior flags are exposed for later adapters, not fully integrated now.

Native status picker entries are icons only unless applied through the ranked-condition API/dialog; documentation corrects this distinction without claiming rank-aware native status toggling.

Next: Batch03 HP/Chakra damage and condition-damage request consumption; do not start it automatically.
