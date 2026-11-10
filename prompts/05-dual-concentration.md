# Batch 05: Dual concentration

## Objective

Implement two source-linked maintained casts, actual-cost upkeep and damage-triggered checks.

## Dependency

Previous batches through 04 must have the required contracts/behavior available; bypassed dependencies require an explicit manual boundary.

## Work

1. Reuse existing N5e upkeep/DC planners and native effect/turn interfaces; store actual cast rank, actual paid cost, Stable/Efficient flags and dependent effects.

2. Confirm third-cast replacement, insufficient-upkeep choices and failed-check cleanup semantics before implementing them.

3. Use max(15 + combined maintained ranks, half eligible damage) and trigger on eligible HP or Chakra damage, not ordinary Chakra spending.

4. Use the native consumption boundary for upkeep and ensure the host single-concentration default cannot independently end effects or roll a duplicate check.

5. Handle voluntary end, duration, incapacity/death and required molding through one source-scoped cleanup path; do not implement out-of-combat upkeep spam.

## Acceptance

- Two jutsu persist separately and source cleanup leaves unrelated effects intact.
- Stable protects against damage loss; Efficient waives upkeep, without conflating them.
- One eligible damage instance schedules only the confirmed check behavior; pending temp-pool/mixed-event rules are not guessed.

## Ten-minute checkpoint

At 540 seconds stop starting new work, terminate pending work before 600 seconds, and save the exact next step in docs/CONTEXT.md.

Update the cumulative check ledger and hand off in at most two sentences; do not start the next numbered batch automatically.
