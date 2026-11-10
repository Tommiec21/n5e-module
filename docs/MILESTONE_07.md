# Batch07 interim development milestone

Goal: package the existing shared services and native trial as a reproducible, accurately labelled checkpoint before further module development.

Role: establish a resumable release baseline, not declare the entire N5e module finished.

## Delivered components

Batches00–06 provide the module shell/tooling, shared contracts, ranked condition services, HP/Chakra damage, graded saves, dual concentration and six source-reviewed native trial Items.

The trial set is Chakra Bolt, Adept Healing, Butterfly Kick, Bane, Arms of Buddha and Fracturing Splinter; importing it is an explicit user action rather than an automatic world change.

## Evidence categories

| Status | Evidence |
| --- | --- |
| Implemented | Runtime files in the Batch06 checked artifact |
| Automated-checked | Seven selected CI gates,34 passing checks, each run once |
| Package-inspected | This milestone compares unchanged runtime bytes, manifest bindings and the exact archive allowlist |
| Bypassed | No exhausted or bypassed checks recorded |
| Live/user-accepted | Not performed; user-led checklist below |
| Published | Development prerelease only, with release evidence recorded in CONTEXT.md |

Prior checks are native-shaped automated checks, not certification of live Foundry behavior or every third-party module combination.

## Version and source

Milestone0.1.0-alpha.7 retains the gameplay code checked at ac042e23609e9edd285d3554010a885e12a02032 in CI42863913486.

Only package version/metadata and documentation change; the inspection compares all shipped scripts/content against that prior artifact and records SHA256 hashes in milestone-evidence.json.

The inspected target is Foundry13.347+ within v13 with dnd5e5.3.3; no broader compatibility is claimed.

## User-led acceptance checklist

1. Download the private release while signed into GitHub, inspect its files, and use a separate disposable dnd5e world if you choose to test.
2. Enable the module only on the declared versions and confirm native character sheets and existing Items still open.
3. Configure test Chakra/max/temporary values and DR explicitly, then opt in to trial.importItems(actor) for an owned test actor.
4. Check Chakra Bolt, all Adept Healing modes and D-rank Butterfly Kick modes, confirming one payment and source-linked rolls/outcomes.
5. Check Fracturing Splinter against a target with both HP/Chakra and DR, then check a repeated Apply does not immediately duplicate the recent operation.
6. Maintain Bane and Arms of Buddha, exercise upkeep selection, third-cast replacement and a concentration check with a known full Chakra Control modifier.
7. Record observed errors against the relevant batch instead of repeatedly rerunning scenarios; the cumulative three-attempt limit still applies.

These steps are instructions for the user, not actions already executed by the agent; no campaign migration or production installation is authorized by publication.

## Scheduled completion work

08 skills/Mastery;09 condition lifecycle;10 general casting;11 exceptional effects;12 martial/Clash;13 progression;14 Jutsu conversion;15 other content;16 UI;17 selected compatibility;18 migration;19 integrated checks;20 final release.

Trial limitations include explicit stat/eligibility input, source-directed hit adjudication, D-rank-only Butterfly Kick, manual Bane suppression and future full content/progression conversion.

Every remaining item has an owning batch in REMAINING_BATCHES.md; none is a hidden permanent exclusion.

## Resume checkpoint

Stop after this milestone at the user’s request; the next requested batch is08, Skills/Abilities/Mastery, classified Gameplay System.
