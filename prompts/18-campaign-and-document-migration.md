# Batch 18: Campaign and document migration

Category: **Data Conversion System**.

Read prompts/COMMON.md and docs/REMAINING_BATCHES.md before working.

## Objective

Build separate-world conversion for actors, embedded content, effects, scenes, linked/unlinked tokens, ActorDeltas and UUID references.

## Dependencies

13,14,15,16; inspect their actual implementation and check ledger rather than treating their published status as full workflow certification.

## Acceptance

Produce a deterministic mapping/report with duplicate protection and rollback copies; do not modify or migrate the live campaign without explicit execution authorization.

## Work limits

Reuse existing N5e calculations and inherited native behavior, preserve source IDs and confirmed rulings, and ask about unresolved mechanics before implementing them.

Use separately bounded ten-minute slices, retain cumulative check attempts, and record every open item under this batch or a numbered sub-batch.

Update context, coverage and release notes, then publish the completed slice only with accurate implemented/checked/manual/unverified status.
