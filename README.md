# N5e module

Private, staged adaptation of Naruto 5e to dnd5e, guided by SW5e's extension approach and existing N5e rules code.

Status: Batch00 foundation module; gameplay automation is disabled and live Foundry acceptance has not been performed.

## Starting a batch

Paste prompts/COMMON.md followed by exactly one numbered prompt into the implementation chat.

Read docs/CONTEXT.md first and resume the next unfinished checkpoint instead of restarting completed work.

## Batch order

00 foundation → 01 rule contracts → 02 conditions → 03 damage → 04 graded saves → 05 concentration → 06 representative integration → 07 packaging.

A numbered batch may span multiple separately bounded ten-minute work slices, with a saved checkpoint after each slice.

## Versions

Initial tag: v0.0.0-plan.1, documentation only.

Use one topic branch per batch and annotated version tags for reviewed milestones; runtime prereleases begin only after module scaffolding exists.

The runtime validation workflow must execute checks once per selected gate and reuse its artifact for release, rather than rerunning the same checks during packaging.

## References

- Existing system: https://github.com/Tommiec21/n5e-system at 6c17e1a8bb764911c743d5615aaaedbac657d5f6.
- SW5e guidance: installed sw5e-module 1.4.3, declaring dnd5e 5.2.5 verified.
- Inspected host: dnd5e 5.3.3; this is an inspection baseline, not a compatibility certification.

No original campaign migration, full content conversion, removed Clan Feats or optional automation integrations are authorized by the initial batches.

## Foundation commands

Use npm run check for the selected cumulative gate and npm run package for an allowlisted archive without repeating checks.

Every executable launched by the runner has a deadline of at most590seconds plus at most5seconds of cleanup; CI jobs stop at10minutes.

The package contains only module.json, runtime scripts, README, LICENSE and CHANGELOG; source installations, planning documents and campaign data stay outside it.
