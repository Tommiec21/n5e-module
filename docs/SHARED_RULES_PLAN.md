# N5e module shared rules implementation plan

Status: planning only, November 10, 2026. Target architecture: a module for the inspected dnd5e 5.3.3 framework, with a pinned supported Foundry/dnd5e version pair before implementation. No code changes, tests, migrations or releases are authorized by this document.

## Scope and boundaries

Implement four reusable capabilities: ranked conditions, graded saves, up to two maintained jutsu, and HP/Chakra damage. Reuse native documents, ActiveEffects, roll presentation, activities, attribute consumption and document updates. Retain N5e rules calculations through adapters. Do not transplant the old system’s sheets, socket transport or entire actor model.

Clones are ordinary NPCs. Combination casting is excluded. Clash is an opposed skill comparison. Automatic reactions remain limited to successful hits and rolled damage; other timing stays manual. Complex exceptional jutsu can use manual resolution without creating further engines.

The implementation must preserve these confirmed user rulings: addition/subtraction before multiplication/division; opposing half/double damage sources cancel; static and rolled DR follow the same rules; one DR budget independently protects each of HP and Chakra, while the damaged creature chooses allocation across damage types sharing a pool. No new visibility, recovery or nested-reaction project is included.

## Common architecture

Use four small rules planners behind a thin dnd5e adapter, not a macro per condition or jutsu:

- **Condition planner:** given current conditions and an event, returns rank changes, derived modifiers, removals or damage requests.
- **Save planner:** given the native roll, DC, activity and target, returns an outcome and an explicit consequence bundle.
- **Damage planner:** given rolled components, target defenses and choices, returns final HP/CP changes and follow-up events.
- **Concentration planner:** given active casts and a cast/turn/damage/end event, returns upkeep, check requirements and ending changes.

Native activities create the roll and supply context. N5e planners decide meaning. One application path writes the resulting changes, so native damage defenses and old N5e processing cannot both apply. Preserve native presentation: ordinary dice, concise outcome, minimal buttons. Internal provenance is available for diagnosis without generating verbose calculation prose in chat.

Store persistent N5e state under a module namespace, with validated fields and a schema version. Use existing native HP fields; add Chakra value/max/temp as an extension rather than a second Actor type. Effects reference the originating cast and item. Keep actor/token UUIDs, source rank, originating turn and effect identity where required. No second point-spending ledger: native attribute consumption applies approved Chakra costs.

## 1. Ranked conditions

### Data and behavior

Keep a condition registry with key, categories, rank limit, stacking policy, per-rank modifiers, immunities, duration/decay, removal options and event behavior. Adapt existing `config/conditions.mjs`, `rules/conditions.mjs` and `rules/condition-lifecycle.mjs` rather than rediscover their rules.

Store applications as native ActiveEffects with N5e metadata: condition key, ranks, source/cast identity, inflicting rank when relevant, timing and removal state. Preserve separate sources when their durations or removal rules differ; calculate effective ranks through the registry instead of allowing every effect to independently apply the same derived penalty. Reapplication and same-source stacking follow the specific approved condition rule—not an automatic sum of all applications.

Expose Add, Remove, Adjust Ranks and applicable removal checks through the sheet/status controls. Display one effective token status with a rank badge where supported; multiple source records must not produce contradictory duplicate icons.

Apply numeric consequences through one derived-modifier adapter. Use shared event handlers for start/end-of-turn decay, damage over time, recovery restrictions and component restrictions. Condition damage goes through the common damage planner with its source flags; it must not bypass the shared damage rules by directly changing HP.

### Acceptance

Representative coverage: Burned damage by rank; Sealed cost changes/removal state; a decaying condition; an unranked state; immunity; multiple sources and selective source removal. Rank changes update calculations without permanently modifying base actor statistics. A newly inflicted next-turn condition does not expire immediately on that same turn. Unsupported special removal remains manual.

Effort: **high**, because the shared lifecycle influences casting, saves, damage and recovery; ordinary registry entries become relatively cheap afterward.

## 2. Graded saves

Reuse the native saving-throw roll and its selected d20 result. Add an N5e resolver with four named outcomes, configurable per activity; ordinary binary saves continue using binary behavior.

Adapt existing `rules/degree.mjs`. Its current behavior uses margins of five, meeting the DC as success, and natural 20 guaranteeing at least success. Treat this as implementation evidence, not final authority where the source/rulings remain unresolved. Confirm equality, natural-one behavior, tier shifts and precedence before coding the final specification.

Each authored activity stores explicit consequences for each tier: damage/no damage, multiplier, conditions/ranks, durations and other supported effects. Resolve per target. Keep normal, Finisher and rank-specific outcome tables separate. Bane’s S-rank changes its authored table; it must not change the global resolver for every jutsu.

Save consequences produce commands for the common damage/condition services. Do not let a native save apply half damage and then apply an N5e half multiplier again. Retain the actual rolled damage as the input; a save selects how that existing roll applies, rather than generating an unrelated total.

### Acceptance

Boundary totals around DC−5, DC and DC+5; natural results and tier shifts; binary saves unchanged; different targets receive different outcomes from the same damage roll; failed-save ranks correct; normal and Finisher effects stay separate; outcome remapping affects only its activity.

Effort: **medium** for the resolver and native-roll integration; content authoring and conditional effects add work but do not require a new resolver for each jutsu.

## 3. HP and Chakra damage

Use a typed damage packet: rolled amount and type for each component, explicit destination pool, source and critical context, defense exceptions, chosen reductions and multipliers. Preserve the source roll reference. Chakra damage targets temporary Chakra then Chakra; other damage targets temporary HP then HP unless an explicit feature specifies otherwise. Resource spending is not damage and does not silently become damage-triggered concentration loss.

Adapt `rules/damage.mjs` and its existing allocation logic through a native actor snapshot. Resolve in a single pipeline:

1. Confirm target/retarget and source components.
2. Resolve applicable additive/subtractive modifiers and DR, respecting explicit bypass/Pierce rules. Static plus rolled DR follows the same shared policy.
3. Apply immunity and approved multiplier rules. Opposing half/double sources cancel; do not multiply duplicate halves repeatedly by accident. Explicitly group roll formulas where Foundry’s arithmetic differs from N5e precedence.
4. Route final amounts through temporary and ordinary pools, with no implicit Chakra overflow into HP.
5. Commit the planned actor update once through the chosen execution path, then raise damage/zero-HP/concentration events once.

If several eligible types hit HP, ask the damaged creature to order DR allocation; GM can make the choice where necessary. Calculate choices before applying damage. Preserve native HP/death behavior only where it matches N5e; avoid processing both native and N5e zero-HP consequences.

Examples: 8 Fire + 8 Chakra with DR 5 becomes 3 HP and 3 CP before further modifiers. 8 Fire + 8 Lightning shares one HP DR budget of 5: chosen Fire-first allocation leaves 3 Fire + 8 Lightning. With Fire resistance, that becomes 1 Fire + 8 Lightning after rounding; choosing the other order can therefore matter. A dynamic DR roll uses these same allocation rules.

### Acceptance

Mixed HP/CP and mixed HP-only types; temporary pools; resistance/vulnerability cancellation; immunity; rolled DR; allocation choices; condition damage bypass where specified; retargeting; critical/zero-HP consequences; cancellation leaves pools unchanged. Damage must remain tied to the source roll. Do not claim distributed exactly-once guarantees—prevent duplicate local application and use existing verified transport boundaries without expanding multiplayer scope.

Effort: **high**, principally because native damage application and N5e defenses must have one clear owner.

## 4. Dual concentration and upkeep

Represent each maintained cast as a source-linked native effect record, not just a boolean Concentrating status. Record cast identity, item UUID, actual cast rank, actual Chakra paid, duration, Stable/Efficient flags and dependent effects. Recasting the same item must not overwrite a different cast’s identity accidentally.

Reuse native lifecycle/UI pieces while replacing its single-spell concentration assumptions for N5e activities. Use one N5e concentration owner. Do not leave both native automatic concentration ending and N5e ending active.

Support two records. On attempting a third, ask which existing jutsu to end before charging the new cast; cancellation changes neither maintained state nor Chakra. Confirm this replacement policy against source/user expectations before implementation.

At combat turn start, compute upkeep as half actual casting spend, rounded down; Efficient pays zero. Stable is protected against damage-induced concentration loss, not automatically against every other ending reason. Let the player choose which effects to keep/pay when funds are insufficient, rather than silently choosing an order. Payment and ending use the same native resource-consumption/application boundary. Out-of-combat upkeep is not automatically taxed each round under the supplied guidance.

After eligible HP or Chakra damage, request the appropriate Chakra Control check using DC = max(15 + combined maintained jutsu ranks, half damage). Keep its result and the maintained cast list separate from ordinary saving throws. End only eligible casts, remove only their dependent effects and retain unrelated effects. Handle expiry, deliberate ending, incapacity/death and loss of required Chakra Molding through the same ending operation.

### Acceptance

Two maintained jutsu; third-cast choice and cancellation; actual upcast rank retained; upkeep based on actual paid cost; Efficient/Stable distinctions; insufficient Chakra choice; duration/source cleanup; separate damage instances; no duplicate native concentration roll; no out-of-combat upkeep spam.

Effort: **high**, because it joins activity use, effects, turns, spending and damage—not because two entries are difficult to store.

## Delivery order and checks

| Batch | Deliverable | Dependency / completion gate |
| --- | --- | --- |
| 0 | Confirm rule boundaries, source precedence and state contracts | Resolve pending decisions below; define supported host version |
| 1 | Native adapter and condition registry/state; read/write snapshots | One source of each modifier; conditions can be manually adjusted without changing base data |
| 2 | HP/CP damage and recovery restrictions | Correct mixed-pool results, source-roll association, no double application |
| 3 | Graded saves connected to damage and conditions | Per-target tier consequences applied once; basic saves preserved |
| 4 | Dual concentration, upkeep and shared lifecycle | Damage events and condition restrictions integrate without parallel native processing |
| 5 | Representative content acceptance and supported release | User-led in-game check; document manual features and limits |

Condition definitions and damage contracts are specified together in Batch 0 so their mutual event dependencies do not become circular implementations. A batch can use explicit manual controls until its dependent event handling exists. Do not broaden this into clones, Combination casting, nested reactions or a universal automation engine.

Use bounded meaningful automated checks, count local and CI executions together, never exceed three attempts per scenario, and after the third unresolved attempt record bypassed-unverified and continue independent work under the newer user policy. Do not repeat passing gates without a new change or reason. No agent-run live verification. Publish only when the agreed batch is complete and checks pass; do not alter the local Foundry installation.

## Decisions and unresolved rules

Confirmed user rulings:

- Concentration DC = max(15 + combined maintained jutsu ranks, half damage). The base is 15, not 12.
- Damage to either HP or Chakra can trigger a concentration check. Chakra resource spending is not damage.

These rulings supersede conflicting reference text for this module plan.

Additional specification points must be settled before their affected implementation: exact graded-save natural/equality/shift precedence; whether one failed concentration check ends both eligible maintained jutsu or resolves them separately; which damage amount and temporary-pool absorption count for concentration; third-cast replacement and insufficient-upkeep choice policy; source-specific rank stacking. Some are already described in code, but code alone is not a substitute for a confirmed rule.

Implementation should ask only where the supplied rules and prior user rulings do not settle the point. Pending decisions do not prevent drafting schemas or reviewing existing pure planners, but dependent gameplay behavior must remain unimplemented until resolved.

## Evidence

- Jiraiya’s Jutsu Compendium, concentration and keywords: `_source/jutsu/jiraiya-full.md`, lines 341–391; conditions lines 527–711.
- Existing N5e: `module/config/conditions.mjs`, `module/rules/conditions.mjs`, `condition-lifecycle.mjs`, `degree.mjs`, `damage.mjs` and `cost.mjs`.
- dnd5e 5.3.3 native integration boundaries previously inspected: [activity lifecycle](https://github.com/foundryvtt/dnd5e/blob/release-5.3.3/module/documents/activity/mixin.mjs), [resource consumption](https://github.com/foundryvtt/dnd5e/blob/release-5.3.3/module/data/activity/fields/consumption-targets-field.mjs), [actor damage](https://github.com/foundryvtt/dnd5e/blob/release-5.3.3/module/documents/actor/actor.mjs). These support the architecture; they are not runtime certification.
