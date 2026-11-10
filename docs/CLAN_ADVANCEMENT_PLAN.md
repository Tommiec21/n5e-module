# Batch13C: Clan advancement

Status: **Planned for later; implementation not authorized by this planning request.**

Goal: let a character select a clan and receive its source-defined features and choices at the correct levels, using native species and advancement records where supported.

Module role: connect existing clan identity and feature Items to character progression without creating a second class system or duplicating manually imported features.

Scope: Aburame, Hyūga, Uchiha, Uzumaki, Senju, Ryu, Hebi and Kuru initially. Keep Clan Feats and redesigned clan tables excluded; do not resume the paused100-item automation task.

## Current reusable work

- Clan identities already use native `race` Items; the selected snapshot contains original advancement tables, branches and references.
- Class conversion already maps source grants and choices to native `ItemGrant`, `ItemChoice`, `Trait` and `ScaleValue` records.
- Native source-owned proficiency/speed effects, shared Mastery, affinity stages, Hijutsu ability selection and source-identity duplicate protection already exist.
- Content is currently delivered through world-library import; reference resolution must support that path and any compendium packaging available when implementation begins.

Do not treat successful acquisition of a feature as proof that its entire gameplay behavior is automated.

## Ordered implementation batches

Each execution slice and process must stay below ten minutes; a sub-batch may span separately documented slices. Update context and publish each completed implementation batch under the existing release policy.

| Sub-batch | Category | Work | Acceptance |
| --- | --- | --- | --- |
| 13C.1 | Data Conversion System | Audit every selected clan's source level gates, feature references, branches, options and replacement rules; create a reviewed progression manifest. | Every grant and choice has an authoritative source pointer; conflicts and missing records are explicit. |
| 13C.2 | Engine Set up | Extract shared native advancement builders from class conversion; verify the pinned host's species-level support and resolve references by stable source identity. | Classes and clans use one converter contract; references resolve in the actual delivery format. |
| 13C.3 | Gameplay System | Add first-selection and later-level grants, plus explicit clan option choices and prerequisite checks. | Eligible grants occur once; cancelling a choice preserves existing state; mutually exclusive branches never grant both paths. |
| 13C.4 | Front End User System | Expose clan selection, branch/feature choices and progression review through native sheets/advancement dialogs, with a small adapter only where necessary. | Players can review what will be gained and what remains manual without console commands. |
| 13C.5 | Data Conversion System | Add an opt-in reconciliation preview for existing characters and manually imported clan features. | Match by source identity, preserve edits/choices and never duplicate grants or delete unrelated features. |
| 13C.6 | Engine Set up | Perform focused offline progression/reference checks, write a user testing checklist and publish the completed supported subset. | Correct choices and source-owned reversal are covered; all unverified or deferred behavior is named. |

## Rules and data to review

1. Establish clan progression level from the source before implementation; character-level advancement must not accidentally depend on a single class level or a testing override.
2. Translate automatic feature grants separately from selectable options, traits, stances and Hijutsu access. Access to a list does not automatically mean learning every jutsu on that list.
3. Use source-owned identifiers for each grant and each choice slot; additional selections at later levels must preserve earlier selections and follow the source's repeatability rules.
4. Preserve branch and mutation prerequisites. Recommended ability increases must not become mandatory automatic increases without source support or a user ruling.
5. Treat level reductions, clan replacement and feature replacement as explicit reconciliation operations; remove only grants owned by the affected advancement and preserve independently acquired copies.
6. Keep acquisition and extensive feature mechanics separate: resource maxima, reactions, stance behavior and conditional bonuses remain individually tracked work rather than silently counting as completed acquisition logic.

## Known source-review cases

- **Hyūga:** the old advancement table lists both Main and Side Branch features at levels7 and11. Require a branch choice and source-validated filtering before automatic grants.
- **Senju:** the existing Verdant Bloodline feature description says3rd level, while the old clan advancement table grants it at7th. Recheck the authoritative source and request a ruling if the conflict remains.
- **Aburame:** preserve one initial Symbiotic Hive selection, with additional choices at7th,11th and15th only if confirmed by the source.
- **Uchiha:** preserve Advanced Adaptation choices and distinguish them from separately acquired Sharingan evolutions; do not infer that all referenced options are automatic grants.
- **Hebi:** two differently named Serpent's Coil stance records appear in the old progression. Determine whether they are upgrades, alternate records or duplicates before granting them.
- **Ryu, Hebi, Kuru and Uzumaki:** audit resource, stance and chosen-ability prerequisites before automatically wiring dependent options.

These are review tasks, not approved changes to the game's rules; ask the user only about conflicts the source cannot settle.

## Implementation design

- Keep a pure progression planner: clan source ID, reviewed manifest, level, existing grant identities and saved choices in; proposed grants, removals, choices and problems out.
- Keep source conversion, eligibility, reference resolution, native document writes and presentation in separate single-responsibility functions.
- Prefer native advancement tracking/reversal and Item-owned effects; inherit native models only when an actual capability gap requires it.
- Verify whether native species advancements run on subsequent character levels. If not, add one actor-scoped adapter for relevant level changes rather than scanning all actors or wrapping every roll.
- Use the shared class progression helpers where their level semantics apply; do not force class-level rules onto clans.
- Route native document changes through one authoritative path; do not combine native automatic grants with a second custom grant hook.
- Store a conversion version and source hashes so later content updates can produce a reconciliation preview rather than overwrite user edits.

## Validation and handoff

Focused scenarios: initial selection, a level increase crossing one or several gates, choice cancellation, an ineligible branch, repeated reconciliation, a manually imported feature already present, native reference resolution and source-owned level reversal.

Keep cumulative attempts at no more than three per scenario; after the third unresolved attempt, record `bypassed-unverified` with cause and affected behavior. Do not repeat already-passing scenarios without a relevant change, and do not run a live Foundry instance.

User-led acceptance should check the selected clan on a fresh actor and an existing actor. Release notes must distinguish automatic acquisition, implemented feature mechanics and manual/deferred mechanics, with no increase to the paused automation tally merely for granting Items.
