# Reuse map

## Existing N5e

Read the original implementation and relevant tests before extracting a function; preserve its provenance and review assumptions about actor fields, item.type and user rulings.

| Responsibility | Existing source under module/ | Adaptation boundary |
| --- | --- | --- |
| Condition definitions | config/conditions.mjs | Keep registry, translate statuses/effect metadata |
| Ranked modifiers | rules/conditions.mjs | Host snapshot in, modifier result out |
| Condition timing/removal | rules/condition-lifecycle.mjs | Native ActiveEffect and combat event adapter |
| Damage and healing | rules/damage.mjs | Native HP, extended Chakra, one application path |
| Graded saves | rules/degree.mjs | **Shared core since alpha.16:** `scripts/saves/degree.mjs` re-exports `scripts/core/module/rules/degree.mjs` |
| Costs and upkeep | rules/cost.mjs | Native consumption applies calculated amount |
| Jutsu content | tools/content/sources/jiraiya-jutsu.json | Preserve source, IDs and variants; no bulk copy this batch |
| Activity selection | rules/activity-parse.mjs | Prefer authored variants; never reparse full text as authority |

Original checkout: ../n5e-system; original commit: 6c17e1a8bb764911c743d5615aaaedbac657d5f6.

## SW5e guidance

Installed module: C:/FoundryData/Data/modules/sw5e-module, version 1.4.3.

Study scripts/module.mjs for lifecycle boundaries, patch/dataModels.mjs for resource extensions, patch/powercasting.mjs for native activity consumption/recovery, and data/item/maneuver.mjs for native model composition.

Prefer supported hooks and native inheritance over copying SW5e's direct prototype replacements; document every unavoidable wrapper target and supported host version.

## Host source

Installed host: C:/FoundryData/Data/systems/dnd5e, version 5.3.3; original source content is embedded in dnd5e-compiled.mjs.map.

Inspect Activity lifecycle/consumption, actor damage hooks, ActiveEffects and species advancement registries from this version rather than assuming documentation for another release is identical.

## Shared rules core (SHARED1b)

From alpha.16 the module vendors n5e-system's shared core into `scripts/core/` with `tools/sync-core.mjs <version|latest>` (never edit that folder). Replace copied planners with core imports one at a time, keeping the module's own result contracts in its service layer. Done: graded saves (degree). Next, per n5e-system `docs/SHARED1_SPEC.md`: condition modifiers, damage calculation, costs/upkeep, condition lifecycle, activity selection.
