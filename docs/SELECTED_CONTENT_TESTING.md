# Selected N5e content: user testing

Current private release: [v0.1.0-alpha.14](https://github.com/Tommiec21/n5e-module/releases/tag/v0.1.0-alpha.14).

## Install and import

1. Use a separate testing world with Foundry13.347+ within version13 and dnd5e5.3.3. This module currently pins that host version.
2. Download the release ZIP while signed into GitHub; extract its contents into `Data/modules/n5e-module`, then enable the module in the testing world. Private GitHub download URLs require authentication.
3. In Configure Settings, find **N5e for dnd5e — Development → Import test content**. Confirm the import; it creates organized world Items, not actors.
4. If you imported alpha11, select the explicit replacement checkbox to update those library records to alpha12. Replacement overwrites edits to imported library records; existing actor copies are untouched.
5. Browse **N5e Jutsu → Discipline → Group → D-Rank**, or **N5e Clans → Clan → record category → rank**. Clan features and feature choices are present; Clan Feats are excluded.

## Prepare two test actors

1. Create a caster and target using native character/NPC sheets; set their native HP and maximum HP to100 for damage checks. Give the testing player ownership if checking player controls.
2. Use **Set test level and Chakra**, select each actor, and set explicit testing values. Level1 and100/100 Chakra suffice for D-rank general jutsu; use an appropriate higher level when testing higher-rank clan jutsu.
3. Set the caster's relevant native ability score on its sheet: Ninjutsu defaults to Intelligence, Genjutsu to Wisdom and Taijutsu/Bukijutsu to Strength. Feature-specific alternatives are not automatically granted by the imported text.
4. Drag desired Items from the imported world folders onto the caster. After updating a world-library record, replace older actor copies explicitly; library updates never overwrite owned actor Items automatically.
5. Select targets using Foundry's normal target controls before activating the jutsu. Source range, targets, equipment, free hands and reaction triggers still require confirmation.

## Focused checks

Record the Item, actor/token, module version, expected result, actual result and console error for any failure. Limit a scenario to three attempts; keep the result instead of repeatedly retrying it.

| Check | Action | Expected result |
| --- | --- | --- |
| Import and duplicates | Import the library twice without replacement | First import creates377 records; the second creates none and preserves existing records |
| Native casting | Cast Chakra Bolt against a target | One Chakra payment, native attack roll and4d6 force damage roll; applying damage uses the shared damage controls |
| Damage and condition | Cast Fireball and resolve a failed target save |4d6+4 fire damage and1 Burned; successful save uses half damage and adds no Burned |
| Corrected source outcome | Cast Erupting Flame and resolve success | Half damage; Dazed applies only on failure and expires through the existing condition lifecycle |
| Mixed pools | Cast Fracturing Splinter and resolve failure | Separate2d8 force/HP and2d8 Chakra components; D-rank does not add Sealed |
| Graded saves | Cast Bane | Native Charisma save maps to the four degrees; its penalty/suppression are explicitly manual |
| Healing | Cast Second Wind with the caster selected as recipient |2d6 plus Ninjutsu ability modifier; healing requires the explicit Apply control |
| Concentration | Start two different concentration jutsu, then a third | Choose which existing jutsu ends before payment; cancelling preserves both casts and Chakra |
| Damage concentration | Apply HP or Chakra damage to a concentrating actor | Existing shared service requests one Chakra Control check using combined final damage; failed check ends captured non-Stable casts |
| Upkeep | Advance the concentrating actor's combat turn | Shared upkeep uses half the actual paid Chakra cost; insufficient Chakra presents a choice |
| Eligibility | Attempt a base rank above the actor's permitted rank or Hand Seals while Confused | Cast is refused before spending |
| Manual records | Open a clan feature, stance or unresolved-cost jutsu | Source text remains available; no automatic feature grant or guessed cost occurs |

An ordinary owned-actor cast does not introduce a GM approval gate. A target owned by another player receives a save request for its owner/GM rather than allowing the caster to roll that actor without ownership.

## Coverage and additional work

The library contains377 records:164 general jutsu,87 clan jutsu,8 clan identities and118 features/options/stances.242 jutsu have shared cost/components/concentration profiles,12 have reviewed combat/healing modes, and12 combined jutsu/features have qualifying base-rank/base-level automation; every record has an explicit status in [SELECTED_CONTENT_COVERAGE.md](SELECTED_CONTENT_COVERAGE.md).

All higher-rank branches remain manual, and automatic casting only permits the authored base rank. Conditional effects, weapon/unarmed sequences and native clan grants remain assigned to additional S04 and Batches11–13; successful import is not evidence of their implementation.

Two focused automated gates passed once each: five structural/import checks and five selected-mechanics checks. No live Foundry verification, campaign migration or local installation was performed by the agent.

## Current pause checkpoint

Alpha14 adds source-linked buffs and eight clans’ basic native grants; twelve completed jutsu/features count toward100, while partial identities/grants remain excluded. S04a passed5 checks once; S04b passed4 checks on attempt2 after one syntax failure before scenarios. No live verification was performed.
