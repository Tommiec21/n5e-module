# Module context

Updated November 10, 2026; repository owner Tommiec21, project n5e-module, visibility private.

Current milestone: Batch05 dual concentration published privately as v0.1.0-alpha.5; shared services exist and complete item/activity integration remains for Batch06.

Current scope: reusable prompts, private repository, version history and bounded future implementation batches for ranked conditions, HP/Chakra damage, graded saves and dual concentration.

## Batch status

| Batch | Status | Checkpoint |
| --- | --- | --- |
| Planning baseline | Published | 88e8193, annotated tag v0.0.0-plan.1 |
| 00 Foundation | Published | v0.1.0-alpha.0; first CI attempt, 4 passed; no live verification |
| 01 Contracts | Published | v0.1.0-alpha.1; 4 first-attempt contract checks passed; pending rulings remain explicit |
| 02 Conditions | Published with disclosed manual paths | v0.1.0-alpha.2; 5 checks passed once, no live verification |
| 03 Damage | Published | v0.1.0-alpha.3; 6 first-attempt checks passed; user live acceptance outstanding |
| 04 Saves | Published | v0.1.0-alpha.4; 6 first-attempt checks passed; manual exceptional clauses disclosed |
| 05 Concentration | Published | v0.1.0-alpha.5; 6 first-attempt checks, explicit manual skill/permission boundaries |
| 06 Integration | Not started | Representative jutsu only |
| 07 Packaging | Not started | Verified or explicitly limited prerelease |

## Expanded remaining schedule

User requested every outstanding item be assigned an additional batch; docs/REMAINING_BATCHES.md is authoritative for06–20, all not started.

Published00–05 are completed component deliveries, not claims that their scheduled integration/lifecycle follow-ups are implemented.

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

## Batch03 completed checkpoint

Codex slice16:33–16:41UTC, under ten minutes; runtime067826d05eab7307b314ef6327a081c146b9d547, branch batch/03-damage.

Reused original damagePlan/healPlan, extended native creature models by inheritance with n5e.chakra and DR, and added one owner-checked resource application path with per-actor local queues and bounded receipts.

Implemented independent HP/CP DR, user-selected same-pool ordering, dynamic reduction, confirmed multiplier cancellation, temporary pools, original-roll association, explicit retargeting, recovery restrictions and native zero-HP updates.

Condition requests now roll native cards with manual Apply/Retarget; final combined HP/Chakra damage including temporary absorption emits n5e-module.damageApplied for future concentration.

CI42856612727 passed6 selected checks on first attempt with0 failures/skips; release42856818354 reused the19-file artifact without retesting.

Private v0.1.0-alpha.3 includes module.json888bytes and n5e-module.zip62753bytes; no local installation, live verification or bypasses.

Scope boundaries: ordinary host/third-party cards remain native, resource maxima/DR need explicit configuration until progression/UI integration, and unsupported type-to-pool conversion fails rather than guessing.

Next: Batch04 graded saves; do not start it automatically.

## Batch04 completed checkpoint

Codex slice16:46–16:53UTC, under ten minutes; runtime193ea0e9f4afbd6bc9a8208418fd2529ef721503, branch batch/04-graded-saves.

Reused the approved degree resolver, added explicit activity/mode/rank tables, native kept-d20 save cards, per-target consequences and bounded local duplicate protection.

Shared damage/condition services apply selected consequences, retaining the original unscaled damage roll; binary saves delegate to the native method.

Bane demonstrates local S-rank outcome remapping only, with bonus/suppression effects manual; no full compendium conversion or native/third-party card interception is claimed.

CI42858609483 passed6 selected checks on first attempt with0 failures/skips; release42858863302 reused the24-file artifact without repeating tests.

Private v0.1.0-alpha.4 assets: module.json872bytes, n5e-module.zip74291bytes; no local installation, live verification or bypasses.

Next: Batch05 dual concentration and upkeep using the confirmed single-check/non-Stable failure and combined-final-damage policies; do not start automatically.

## Batch05 completed checkpoint

Codex slice16:53–17:03UTC, under ten minutes; runtime75aedb05c53eb1961e25bf972acb8814c1192530, branch batch/05-concentration.

Implemented two source-linked casts, player-selected replacement/upkeep, actual-rank/cost retention, native attribute consumption, Stable/Efficient distinction, captured damage checks and source-scoped cleanup.

User confirmed third-cast replacement selection and player choice when upkeep is insufficient; no initial cast payment is duplicated by beginCast.

CI42860468142 passed6 selected checks on first attempt with0 failures/skips; release42860690181 reused the29-file artifact without a second test gate.

Private v0.1.0-alpha.5: module.json889bytes and n5e-module.zip92071bytes; recap in docs/IMPLEMENTATION_RECAP.md.

Full Chakra Control calculation is not converted: a configured native skill is used if present, otherwise the user supplies a full modifier for native dice; linked effect permission failures require owner/GM reconciliation.

No full Item/activity pipeline, compendium/world migration, local installation or live verification; next is Batch06 representative integration.

## Backlog classification correction

Former agent-deferred limitations now have explicit owners:08 skills,09 conditions,10 casting,11 exceptional effects,12 martial sequences,13 progression,14 Jutsu,15 other content,16 UI,17 compatibility,18 migration,19 regression/performance and20 final release.

Original06 representative integration and07 interim packaging remain in place; all future omissions require a numbered batch/sub-batch rather than an unowned boundary.

Docs/prompts update only; no implementation or validation rerun.
