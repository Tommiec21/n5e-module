# Module context

Updated November 10, 2026; repository owner Tommiec21, project n5e-module, visibility private.

Current milestone: Batch09 condition lifecycle published privately as v0.1.0-alpha.9; next10 is the user’s planned stop.

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
| 06 Integration | Published trial slice | v0.1.0-alpha.6; 3 first-attempt checks; native live acceptance pending |
| 07 Packaging | Published interim milestone | v0.1.0-alpha.7; unchanged-runtime/archive inspection passed once |

## Expanded remaining schedule

User requested every outstanding item be assigned an additional batch; docs/REMAINING_BATCHES.md is authoritative for08–20, all pending;06/07 are now delivered trial/interim milestones.

Published00–07 are component/trial/interim deliveries, not claims that their scheduled integration/lifecycle follow-ups are implemented.

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

## Batch categories

All00–20 prompts and the remaining schedule now carry the user-requested primary category; docs/BATCH_CATEGORIES.md is the complete categorized index.

Documentation only, with no implementation changes or check reruns.

## Batch06 completed checkpoint

Codex slice17:12–17:22UTC, under ten minutes; runtimeac042e23609e9edd285d3554010a885e12a02032, branch batch/06-integration.

Goal: join the shared services through native Items/activities for a small source-reviewed set, proving the module’s integration pattern before broad content conversion.

Delivered six opt-in trial Items with preserved source identity/text and native activity modes: Chakra Bolt, Adept Healing, Butterfly Kick, Bane, Arms of Buddha and Fracturing Splinter.

Scoped native activity interception joins one payment, native rolls, defender-owned saves, damage/healing cards and maintained-cast registration; no original installation was changed.

CI42863913486 passed3 selected integration checks first attempt with0 failures/skips; release42864068634 reused the34-file artifact.

Private v0.1.0-alpha.6 assets: module.json884bytes and n5e-module.zip142981bytes; no live verification.

Follow-up owners:08 full stat calculation,10 requirements/general casting,11 exceptions,12 martial/advanced upcast branches,14 full968-entry conversion,16 controls; the trial requires explicit stat inputs/eligibility confirmation and GM hit adjudication.

Next:07 interim milestone; final completion reports must repeat each batch goal and its module role per the user’s directive.

## Batch07 completed checkpoint and stop

Codex slice17:48–17:55UTC, under ten minutes; milestone commit4f684c2c2842ee2a9e11273eb5f844ff8fc789fc, annotated tagv0.1.0-alpha.7, branch batch/07-milestone.

Goal: package the shared-service/native-trial state into a reproducible interim baseline; its module role is a resumable checkpoint before the remaining feature/conversion batches.

Inspection42869279100 passed once:30 shipped runtime files byte-match Batch06 CI42863913486 and34 ZIP entries match the allowlist/current sources, with unchanged host bindings and matching version URLs.

No gameplay gate was repeated;34 prior component/integration checks remain evidence for their selected scopes, not a full live or final integrated certification.

Release42869498216 published private v0.1.0-alpha.7: module.json908bytes, n5e-module.zip143807bytes; package proof is retained in CI milestone-evidence.json.

Implemented/automated-checked/package-inspected/published statuses are distinct from live/user acceptance, which remains unperformed; no bypassed checks or local installation.

User asked to stop after this batch for the next few hours; do not begin08 or resume automatically, and await the next user instruction.

Next requested batch:08 Skills/Abilities/Mastery, Gameplay System; remaining list08–20 and category index are current.

## Batch08 active scope

Codex, branch batch/08-skills; slice started17:58UTC, goal native N5e skill/proficiency/Mastery calculations and automatic Chakra Control.

User plans to stop at Batch10; do not proceed beyond10 without a new instruction.

## Batch08 completed checkpoint

Codex slice17:58–18:08UTC, under ten minutes; runtimef3add722009f7731374107bb09dec7baa9db6f03, branch batch/08-skills.

Goal: reuse N5e skill/proficiency/Mastery rules with native preparation and rolls, removing the manual Chakra Control modifier from prepared actors.

Delivered canonical20 skills, four namespaced skill additions, source progression bands, independent source-unique Mastery, half-proficiency saves and native concentration routing.

Corrected duplicated physical/mental condition contributions in native skill rolls; basic trial attack/DC inputs can now derive from core discipline values.

CI42871658487:6 passed on first attempt,0 failures/skips; release42871826398 reused the37-file artifact without retesting.

Private v0.1.0-alpha.8 assets: module.json885bytes and n5e-module.zip156886bytes; no live verification or local installation.

Native training/source grants remain explicitly editable until13 automates progression; alternative casting abilities/feature bonuses remain10/13, armor formula selection13 and final sheet filtering16.

User plans to stop at10; next requested batch09, and do not proceed beyond10 without further instruction.

## Batch09 active scope

Codex, branch batch/09-condition-lifecycle; slice started18:08UTC, completing condition movement/rest/decay/expiry without opening Batch10 early.

## Batch09 completed checkpoint

Slice18:08–18:18UTC, under ten minutes; runtime73afb00194973c9bddfe30b4a4cd53f59f63045f, branch batch/09-condition-lifecycle.

Goal: complete source-preserving condition movement, rest, decay and expiry, connecting persistent effects to native lifecycle without per-jutsu scripts.

User rulings: oldest-first removal, discard excess ranks and end Chilled outside combat; native movement prompts if willingness is unspecified.

CI42873575130 passed5 selected checks once with0 failures/skips; release42873766853 reused the40-file artifact.

Private v0.1.0-alpha.9: module.json875bytes, ZIP171433bytes; no live verification or local installation.

Condition-specific rest behavior is complete for this batch; broader HP/Chakra/Hit-Die short/long/full rest resource conversion belongs13, and derived behavioral flags are owned by10/11.

Next requested batch10 completes general casting/concentration integration, then stop as requested.

## Batch10 active scope

Codex branch batch/10-casting, slice18:22UTC; general reviewed casting descriptors, eligibility, native payment and pre-payment concentration choices. Stop after10; no live testing.

## Batch10 completed checkpoint and requested stop

Slice18:22–18:31UTC, under ten minutes; runtime1ad05a3d3a21d5ba47f4ce5f59ae93047177129e, branch batch/10-casting.

Goal: complete the general reviewed casting bridge; role: connect native jutsu activities to shared eligibility, cost, rolls, damage/saves and dual-concentration services without per-jutsu workflow duplication.

Delivered rank limits and explicit overrides, base-rank ability requirements with Hijutsu/upcast exceptions, components/armor/mobility/condition checks, affinity tags, discipline ability/bonus grants, authored cost and upcast choices, native material and Chakra consumption, pre-payment replacement, duplicate/overlap guards and automatic maintained records.

CI42875586246 passed8 selected checks on attempt1,0 failures/skips; release42875721607 reused the42-file artifact without retesting. Private v0.1.0-alpha.10 assets: module.json878bytes, ZIP183498bytes.

Physical facts unavailable in native data require confirmation; exceptional effects and interrupted longer casting remain11, martial branches12, automatic progression grants13, full968-entry conversion14 and final sheet editing16. Existing sample-specific modes remain supported beside general authored profiles; no full-content or final integrated certification is claimed.

53 selected component/integration checks across00–10 plus one Batch07 package inspection are historical scoped evidence, not live/user acceptance. No tests bypassed, no live Foundry or local installation; user-led game testing remains pending.

Do not duplicate Batch10 or begin11 automatically: user asked to stop at10. The repository context/profiles are authoritative; older OneDrive planning copies were not rewritten.

## Selected testing content — user-authorized scope change

November10, slice18:42UTC, branch content/selected-01. User authorized164 D-rank general jutsu in six specified groups, plus Aburame/Hyuga/Uchiha/Uzumaki/Senju/Ryu/Hebi/Kuru with features, choices, stances and all associated clan jutsu; Clan Feats remain excluded.

This is an early selected subset of Batches13–15, not a resumption of all pending gameplay systems. S01 owns portable snapshots, native conversion, folders, import controls and coverage; S02 owns reviewed mechanics mapping across the selected data, S03 owns conversion checks, testing guide and final selected-content release. Do not duplicate the active converter or infer completed automation from successful structural import.

S01 checkpoint18:49UTC:377 native records converted, five selected checks passed once in CI42878742579; private alpha11 release42878910177 published the44-file artifact without retesting. All mechanics remain explicitly manual at this structural checkpoint; next S02 maps supported mechanics, no new gameplay engines.

S02 active18:49UTC, branch content/selected-02: connect reviewed source cost/components/duration to shared casting, author a conservative direct-effect subset, provide explicit test-actor resources, and retain exact manual effect reasons. No new reaction/conditional engines.

S02 checkpoint18:57UTC: runtimebce0827705accec08af131b10cbff545b7dd2468;5 focused checks passed once, CI42879782786; alpha12 release42880022703 reused the44-file checked artifact.242 cost/component/concentration profiles,12 reviewed direct/save/heal modes,4 base-rank-core records,238 partial and135 manual; manual includes126 clan identities/features/options/stances and9 unresolved-cost jutsu. No live verification or local installation.

The data subset is imported and source-preserved; full automation is not complete. Additional source-review batch S04 owns remaining mappings possible with existing services, alongside11 conditional effects,12 martial sequences and13 native feature/progression grants; none are user exclusions. S03 is documentation/coverage handoff only and must not rerun passed gates.

S03 documentation handoff18:58UTC: selected coverage lists all377 records, a user-led testing guide covers imports/resources/core services, and source snapshot plus converter prevent duplicate rework. S04 remains an explicit additional mapping batch; no existing passed checks were rerun.

## S04a active — user stop target100

Slice18:59UTC, branch content/selected-04a. User requests stopping at a combined100 automated jutsu and clan features; only base-rank-core/base-level-core entries count, never imports or cost-only/partial profiles. Initial qualifying total4; a converter guard prevents exceeding100.

This slice owns native source-preserving clan proficiency/speed grants, Hijutsu ability selection, Wisdom of the Court, and source-specific condition turn expiry; additional mappings remain subsequent bounded slices toward100.

S04a checkpoint19:07UTC:source409eb98dd50c279bf7ee33a550226b560ca5ad71, five focused checks passed once in CI42881714057, private alpha13 release dispatched. Qualifying count6/100 (5 jutsu,1 clan feature); partial grants to8 clan identities do not count. Next S04b reuses native dnd5e dependentOn effects for source-linked buffs and cleanup; do not build a parallel dependency/socket engine. Native source confirmed DependentDocumentMixin and ActiveEffect5e._onDelete use dnd5e.registry.dependents and activeGM cleanup.

S04b active19:07UTC: native dependentOn source effects, most-potent same-source suppression per core chapter9, and six reviewed buffs; stop target100 remains active.

User requested pause after current jutsu during S04b. Finish only the active correction/check/publication checkpoint, then pause; do not begin S04c or continue toward100 until resumed. First S04b attempt failed before scenarios due to a missing object brace in effects.mjs; correction uses cumulative attempt2, not a fresh budget.

S04b slice checkpoint19:16UTC: implementation slice19:07–19:16 ended under ten minutes; corrected source52a00e1, cumulative attempt2 running. Remaining work is a separate bounded verification/publication checkpoint only, then user-requested pause; no new jutsu.

## User-requested pause — S04b current-item completion

Final verification/publication slice began19:16UTC, separate from the saved19:07–19:16 implementation slice. Corrected runtime52a00e188119f0cec703f5da39014ddc9459921f passed4 focused checks on attempt2 in CI42883561617; first syntax failure retained. Private alpha14 release dispatched from that checked45-file artifact.

Goal of S04b:source-linked native buffs and cleanup, connecting selected jutsu to shared casting/native effects rather than creating parallel effect engines. Six buff additions bring the combined qualifying total to12/100, not100;88 remain.

PAUSED by explicit user instruction after current jutsu/buff work; do not begin another automation, resume S04c, or continue toward100 without a new instruction. Documentation and check ledger preserve exact source IDs and attempts; no live verification or local installation.

## User scope shift: three native classes

November10,slice19:21UTC,branch content/classes-01. User requests Scout-Nin/Ninjutsu Specialist/Taijutsu Specialist conversion with simple automation; extensive automation is explicitly deferred. The jutsu100 target remains paused and this class conversion must not inflate its tally or resume jutsu development.

Reuse the native-content importer and native advancement types; portable dependency closure contains402 records (3 classes,20 subclasses,355 features/options,24 stances), with no missing structural references. This slice owns native HP/proficiencies/feature grants/choices/scales, stage-aware Mastery/affinity and Focus uses; all complex source mechanics are preserved and deferred.
