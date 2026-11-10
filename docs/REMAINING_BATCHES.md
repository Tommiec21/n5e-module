# Remaining N5e module batches

Updated November10,2026; this schedule supersedes earlier descriptions of implementation boundaries.

Batches00–10 have published component/trial/interim milestones, while the additional integration and completion work below is explicitly planned, not an assumed exclusion or a claim that it already works.

## Category meanings

- **Engine Set up:** shared infrastructure, contracts, validation and release machinery.
- **Gameplay System:** rules calculations, state changes and gameplay integration.
- **Front End User System:** sheets, controls, user guidance and acceptance/handoff.
- **Data Conversion System:** converting content or campaign documents into native module structures.

Each batch has one primary category; its completion criteria can include supporting work from another category.

## Status and execution

All listed batches are not started; execute one requested batch at a time, using separate work slices capped at ten minutes and persistent checkpoints.

Number07 is the published interim milestone, and number20 is the pending full supported-release milestone; publishing an early artifact does not close the later work.

| Batch | Category | Work remaining | Depends on |
| --- | --- | --- | --- |
| 11 | Gameplay System | **Conditional effects and exceptional jutsu** — Implement shared conditional bonus/suppression, graded outcome riders, aura targeting, resource-linked modes, interrupted longer casting and source-based effect cleanup. | 09,10 |
| 12 | Gameplay System | **Martial sequences and simple Clash** — Integrate weapon/unarmed expressions, Chain, Combo/Finisher eligibility and opposed-skill Clash. | 08,10,11 |
| 13 | Data Conversion System | **Character options, progression and resources** — Convert classes, clan-as-species, backgrounds and their approved features/choices/advancements, including automatic Chakra maxima, DR contributions and source HP/Chakra/Hit-Die short/long/full rest recovery. | 08,09,10 |
| 14 | Data Conversion System | **Full Jutsu compendium conversion** — Convert the existing968 source entries into native module content with preserved identities, expressions, variants and Discipline/Group/Rank folders. | 10,11,12,13 |
| 15 | Data Conversion System | **Remaining approved content conversion** — Convert approved equipment, consumables, stances and non-excluded feats/features, including temporary jutsu-created consumables and ordinary NPC summon/clone profiles. | 11,12,13 |
| 16 | Front End User System | **Player-facing sheets and controls** — Integrate resources, ranked status controls, casting modes, concentration and damage outcomes into practical native sheets/chat/token controls. | 09,10,12,13,14,15 |
| 17 | Gameplay System | **Selected module compatibility** — Implement and document explicit compatibility profiles for the user-selected Midi-QOL, DAE and other required modules. | 10,11,16 |
| 18 | Data Conversion System | **Campaign and document migration** — Build separate-world conversion for actors, embedded content, effects, scenes, linked/unlinked tokens, ActorDeltas and UUID references. | 13,14,15,16 |
| 19 | Engine Set up | **Integrated regression and performance closure** — Check cross-batch behavior, effect-source cleanup, duplicates, permission boundaries and bounded event processing; resolve the remaining coverage ledger. | 09–18 |
| 20 | Front End User System | **Final supported release and handoff** — Publish the supported release/profile documentation, user-led acceptance checklist, migration instructions and remaining explicit limitations. | 19 |

## Completion criteria

### Published10: Complete casting and concentration integration

Category: **Gameplay System**.

Third-cast selection occurs before spending, cancelled casts leave state unchanged, and approved native jutsu use the shared services without duplicate handling.

### 11: Conditional effects and exceptional jutsu

Category: **Gameplay System**.

Bane suppression and every identified exceptional clause has an implemented handler or a concrete source-ruling task within this batch; supported effects no longer disappear into an unspecified manual category.

### 12: Martial sequences and simple Clash

Category: **Gameplay System**.

Separate modes and source-reviewed sequencing work; no Combination casting, advanced reaction engine or clone synchronization is introduced.

### 13: Character options, progression and resources

Category: **Data Conversion System**.

Approved level-up grants and choices work without duplicate bonuses or manual resource setup; excluded classes and redesigned clan content remain excluded unless the user authorizes them.

### 14: Full Jutsu compendium conversion

Category: **Data Conversion System**.

All968 entries have native-schema coverage and a mechanics coverage ledger; split import/review into discipline/rank sub-batches, never one unbounded process.

### 15: Remaining approved content conversion

Category: **Data Conversion System**.

All inventoried approved source packs are accounted for and linked correctly; removed Clan Feats are not restored.

### 16: Player-facing sheets and controls

Category: **Front End User System**.

Ordinary play no longer requires developer console/API commands, manual Chakra configuration or display-only condition icons mistaken for mechanical ranks.

### 17: Selected module compatibility

Category: **Gameplay System**.

Each selected profile has one owner for damage/saves/concentration and translated effect keys; universal compatibility is not promised.

### 18: Campaign and document migration

Category: **Data Conversion System**.

Produce a deterministic mapping/report with duplicate protection and rollback copies; do not modify or migrate the live campaign without explicit execution authorization.

### 19: Integrated regression and performance closure

Category: **Engine Set up**.

Record each supported workflow as passed or transparently bypassed-unverified under the three-attempt limit; user performs all live acceptance.

### 20: Final supported release and handoff

Category: **Front End User System**.

Versions/assets agree, unresolved checks are disclosed and every approved item is implemented or remains attached to a named open batch; no hidden deferrals.

## Explicit user exclusions and constraints

- Combination casting is excluded; clones are ordinary NPCs and Clash is opposed skill rolls.
- Advanced reaction timing and nested reaction automation remain excluded/deferred by the user, not agent-created backlog.
- Removed Clan Feats and redesigned clan tables must not be reinstated without approved replacements.
- Puppet Nin, Cooking Nin, Science Nin and Intelligence Operative retain the prior class-import exclusion unless the user changes it.
- No agent-run live verification; the user performs in-game acceptance.
- No automatic local installation, production-world change or campaign migration is authorized by this schedule.

## Completion ledger rule

Every discovered omission must identify an owning batch, its source/ruling dependency and a completion criterion; add a numbered sub-batch if that item cannot fit the existing scope.

An exhausted check is recorded as bypassed-unverified with the affected behavior retained in the owning batch, never silently marked complete.

The schedule does not promise universal third-party compatibility or distributed exactly-once execution; selected supported profiles and documented duplicate protection have concrete acceptance scope.

## Planned13C — Clan advancement

User-requested planning only; see [CLAN_ADVANCEMENT_PLAN.md](CLAN_ADVANCEMENT_PLAN.md). Ordered sub-batches13C.1–13C.6 cover source audit, shared native builders, progression/choices, player controls, opt-in reconciliation and focused offline verification; implementation remains for later.
