# Batch 01: Rule contracts and decision log

## Objective

Define shared snapshots, event payloads and source precedence before writing interdependent handlers.

## Dependency

Previous batches through 00 must have the required contracts/behavior available; bypassed dependencies require an explicit manual boundary.

## Work

1. Read RULINGS.md and ask only unresolved rule questions; separate contracts that can proceed from gameplay choices that must wait.

2. Define ConditionApplication, SaveOutcome, DamagePacket, DamageResult and MaintainedCast contracts with version, UUID/source identity, units and required fields.

3. Define NativeAdapter interfaces for actor snapshots, native rolls, consumption and effect/document updates; planners must not depend directly on Foundry globals.

4. Record exactly which N5e functions will be extracted or adapted, what host inheritance supplies and which operation owns each mutation.

## Acceptance

- No unresolved rule is encoded as an unannounced default.
- HP and Chakra events differ from resource spending; cast rank differs from item base rank.
- Contracts support per-source effects and per-target outcomes without a new rules engine.

## Ten-minute checkpoint

At 540 seconds stop starting new work, terminate pending work before 600 seconds, and save the exact next step in docs/CONTEXT.md.

Update the cumulative check ledger and hand off in at most two sentences; do not start the next numbered batch automatically.
