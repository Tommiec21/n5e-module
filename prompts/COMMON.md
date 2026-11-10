# Mandatory batch instructions

Read AGENTS.md, docs/CONTEXT.md, docs/RULINGS.md, docs/REUSE_MAP.md and docs/check-ledger.json before changing code.

- Work only on the selected batch and its declared dependencies; stop at its boundary and record a resumable checkpoint.
- Each work slice and every spawned process must end within 600 seconds; reserve the final 60 seconds for cancellation, documentation and handoff.
- Use a real process/job timeout, not merely a tool's output-yield interval; prevent orphaned children and record timed-out work before continuing in a new slice.
- Each function has one responsibility and can be reused; favor small native subclasses, inherited lifecycle methods and composition for pure rules.
- Do not force inheritance onto calculators, replace an entire host model, or duplicate the native resource-spending engine.
- Bound hooks to relevant actors/activities, avoid scanning every actor/compendium on each roll, await document changes, and cache only with explicit invalidation.
- Use plain-language comments explaining purpose, units, boundaries and non-obvious rules; every comment or description is at most two sentences, with no narrative filler.
- Reuse the original N5e planners where correct, adapting field paths and result contracts; use SW5e as guidance and retain notices for any copied third-party code.
- Never run live Foundry verification, change the installed systems/modules, or touch campaign worlds.
- Test attempts are cumulative per scenario across local runs and CI, even after renaming or a new work slice; reserve attempts before execution and allow at most three.
- After the third unresolved attempt, record bypassed-unverified with evidence, cause, affected behavior and next action; continue independent work, never mark the check passed or conceal it.
- If a failed check affects a dependent feature, expose a manual/disabled path and state the limitation instead of treating the dependent behavior as verified.
- Record skipped checks and remaining risks in release notes; publish an incomplete batch only as an explicitly unverified development prerelease with affected automation disabled.
- Use one authoritative write path for each operation; never apply native and N5e damage, costs, condition modifiers or concentration handling twice.
- Do not assume ambiguous game rulings; record a precise question and continue only unrelated work while it is unanswered.
- Do not add clone synchronization, Combination casting, elaborate Clash workflows, new recovery, or nested-reaction engines.
- Keep chat output to native rolls and concise outcomes; source/provenance diagnostics belong in stored records, not verbose cards.
- End with a maximum-two-sentence handoff naming implemented work, validation/bypasses and the next batch/checkpoint.
