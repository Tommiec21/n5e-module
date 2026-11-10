# Batch 02: Ranked conditions

Category: **Gameplay System**.

## Objective

Adapt the existing condition registry, rank calculations and lifecycle to native ActiveEffects.

## Dependency

Previous batches through 01 must have the required contracts/behavior available; bypassed dependencies require an explicit manual boundary.

## Work

1. Reuse N5e condition definitions, clamping and lifecycle planners; map applications into namespaced ActiveEffect state with source, rank and timing.

2. Implement single-purpose rank/add/remove/aggregate handlers and a native derived-modifier adapter; never permanently subtract from actor base values.

3. Provide explicit manual controls for ranks/removal and bounded turn-event processing; emit damage requests for the later damage adapter instead of writing HP directly.

4. Keep immunity, decay, per-source removal, rank caps and unranked states distinct; preserve manual paths for unapproved exceptions.

## Acceptance

- Burned, Sealed, a decaying condition and an unranked state behave through shared definitions.
- Removing one source does not remove another source or double-apply modifiers.
- Condition damage requests are source-labelled and wait for the damage integration.

## Ten-minute checkpoint

At 540 seconds stop starting new work, terminate pending work before 600 seconds, and save the exact next step in docs/CONTEXT.md.

Update the cumulative check ledger and hand off in at most two sentences; do not start the next numbered batch automatically.
