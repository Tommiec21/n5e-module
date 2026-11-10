# Batch 00: Foundation

## Objective

Create the smallest native dnd5e module shell and bounded developer tooling, without gameplay handlers.

## Dependency

Planning baseline is available.

## Work

1. Inspect the exact installed host version and record its compatibility range; add module.json, a minimal entry point and explicit lifecycle registrations without replacing host document classes.

2. Create a bounded command runner with cancellation/child cleanup and a hard ceiling of 600 seconds; use shorter command limits where possible and never invoke a shell that leaves timed-out descendants running.

3. Create one selected validation gate and CI jobs with timeout-minutes: 10; do not configure duplicate automatic tests on both push and release.

4. Prepare Git branches, version metadata and a package builder that excludes credentials, original campaign data and local source installations.

## Acceptance

- Module is recognized only on the declared host; no N5e gameplay changes yet.
- A timed-out process is terminated, recorded and not silently restarted.
- No mandatory live instance; disclose unverified runtime acceptance.

## Ten-minute checkpoint

At 540 seconds stop starting new work, terminate pending work before 600 seconds, and save the exact next step in docs/CONTEXT.md.

Update the cumulative check ledger and hand off in at most two sentences; do not start the next numbered batch automatically.
