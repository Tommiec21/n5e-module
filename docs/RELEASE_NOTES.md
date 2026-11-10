# S04b — Source-linked buffs

Goal: reuse native dnd5e effect dependencies for concentration cleanup and source-preserving bonuses.

Automates base-rank Body Camouflage, Body Flicker, Darkvision, Confidence, Bless and Wind Release:Lions Roar. Native effects supply skills/saves/weapon bonuses and senses; N5e attacks receive Bless dice once, and same-source overlap uses the strongest effect while retaining weaker sources.

Owner-approved effect cards support recipients the caster cannot edit. Native dependentOn cleanup is reused; active-GM source expiry is actor-indexed. No new socket/dependency engine, live Foundry verification or local installation.

The qualifying total is12/100 (11 jutsu,1 clan feature); all other partial/manual records remain excluded. CI42883561617 passed4 focused checks on cumulative attempt2; attempt1 failed on syntax before scenarios and is retained in the ledger.

# S04a — Clan grants and source condition automation

Goal: connect native clan grants, approved Hijutsu ability choices and reusable source-specific condition expiration without overwriting source documents.

Eight clan identities now grant native source-owned skill proficiency/walking-speed effects; their incomplete clan features do not count toward the stop target. Wisdom of the Court changes Persuasion/Intimidation to Wisdom through a native transferable effect. Clan jutsu expose only source-approved Hijutsu abilities.

Erupting Flame now applies Dazed through the existing condition service; Thunderous Screech applies source-timed Deafened, with construct/structure disadvantage and environmental trap handling still manual.

The honest running total is6 complete base-rank/base-level items (5 jutsu,1 clan feature), with100 as the user stop cap; imports and partial/cost-only profiles never count. Remaining automation is additional S04b onward plus named11/12/13 implementations.

Focused S04a check gate pending; no live Foundry verification or local installation.

# Selected content S02 — Gameplay/Data Conversion System

Goal: connect selected native records to existing casting services without rebuilding special gameplay engines.

242 jutsu connect source cost/components and available concentration metadata;12 have reviewed combat/healing modes,4 of those have their base-rank core fully connected.238 records are partial and135 are manual (including118 features/options/stances,8 clan identities and9 unresolved-cost jutsu); status is recorded per item.

Known manual work: feature grants/stances, higher-rank branches, martial sequencing, conditional riders, target/range/trigger confirmation, native states and consumable inventory choices. Casting menus intentionally permit only the authored base rank. Source-defined unresolved costs disable automatic casting.

GM settings include explicit level/Chakra setup for a chosen test actor and opt-in replacement of prior world-library imports; replacements overwrite edits to imported library records but never update existing actor copies. No live verification or local installation; focused S02 gate pending.

# Selected test content S01 — Data Conversion System

Goal: provide a portable native library from existing N5e records, without assuming their old custom fields are native automation.

Includes164 D-rank general jutsu and213 records across Aburame/Hyuga/Uchiha/Uzumaki/Senju/Ryu/Hebi/Kuru:8 clan identities,87 clan jutsu,63 features,46 feature choices and9 stances. Clan Feats are excluded; feature choices are retained.

Import is explicit from module settings; activation creates nothing. World folders use the native four-level limit, source identity prevents duplicates, and actor imports receive fresh embedded IDs.

This S01 release is structural: all377 records currently declare manual mechanics; S02 reviews/migrates the supported casting and feature mechanics. No live verification or local installation; selected conversion gate pending.

# Batch10 — Casting integration

Goal: join reusable casting eligibility and authored modes to native spending, rolls, graded saves, damage and dual concentration.

Implemented: reviewed version-one Item casting profiles; E–S rank limits and explicit grants; base B/A/S ability thresholds with Hijutsu/upcast exceptions; condition/component/armor/mobility checks; affinity tags; alternative discipline abilities and bonuses; authored scaling/cost choices; native material and Chakra consumption; concentration replacement before spending, duplicate and overlapping cast guards.

Physical free hands, seals, specific weapons and other prerequisites require player confirmation where native data cannot establish the fact. Batch13 supplies automatic feature/progression grants and Batch16 supplies final sheet editing; Batch11 owns exceptional effects and longer-casting interruptions, Batch12 martial sequencing, Batch14 bulk conversion. These remain scheduled work.

Validation: CI42875586246 passed8 selected checks on attempt1,0 failures/skips, with42 allowlisted package files; no live verification or local installation. Document writes across actor/items/effects are not a distributed transaction; a transport/write failure requires inspecting resources and effects before retrying.

# Batch09 condition lifecycle completion

Goal: complete condition movement/rest behavior, multi-source decay and out-of-combat expiry using the existing condition and damage services.

Oldest sources lose ranks first, excess ranks are discarded at the cap, and Chilled ends automatically outside combat under the user’s rulings.

Willing movement exceeding5feet produces one Chilled damage request per combat turn; forced/teleport movement is excluded or explicitly confirmed when native movement lacks classification.

Native rests cannot grant benefits to Envenomed actors, and confirmed food/drink enables long-rest Exhaustion recovery.

This is condition-rest integration, not conversion of all N5e HP/Chakra/Hit-Die rest resource rules, which remain owned by13; no live verification occurred.
