# Batch 03: HP and Chakra damage

## Objective

Adapt N5e damage planning and native application with one owner for each resource update.

## Dependency

Previous batches through 02 must have the required contracts/behavior available; bypassed dependencies require an explicit manual boundary.

## Work

1. Reuse damagePlan/healPlan calculations against adapter snapshots and preserve rolled components, types, source roll, pool routing and defense context.

2. Implement target-chosen DR ordering within a pool, independent HP/CP DR budgets, dynamic DR, temporary-pool absorption and confirmed multiplier cancellation.

3. Use native HP and extended Chakra fields; coordinate native damage hooks so defenses, death consequences and N5e reductions never run twice.

4. Apply confirmed results once per local operation, support manual retargeting and emit one damage event for dependent concentration handling; do not claim distributed atomicity.

5. Wire condition damage/recovery restrictions through this service and retain concise native dice presentation.

## Acceptance

- 8 Fire + 8 Chakra with DR5 yields 3HP and 3CP before other modifiers.
- 8 Fire + 8 Lightning shares one HP DR5 budget, in the selected order.
- The source roll remains associated with application; cancellation mutates neither pool.

## Ten-minute checkpoint

At 540 seconds stop starting new work, terminate pending work before 600 seconds, and save the exact next step in docs/CONTEXT.md.

Update the cumulative check ledger and hand off in at most two sentences; do not start the next numbered batch automatically.
