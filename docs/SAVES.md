# Graded saves: Batch04

Use api.saves.roll(actor, definition) for a native roll/card, resolve(definition, actor.uuid, result) for a pure preview, and apply(actor, definition, result) for owner-checked consequences.

Definitions require schema version1, a unique save occurrence ID, source, activity ID, ability, DC, actual rank, graded:true and an explicitly selected mode.

Each mode supplies all four outcomes; an optional exact-rank table replaces that mode’s base table without modifying global save rules.

Each outcome lists damage none/full/half/double, known ranked conditions and manual instructions; unsupported state/bonus/suppression clauses must remain manual rather than become guessed effects.

Meet DC succeeds, a margin of5 produces a critical outcome, tier shifts apply before the natural20 success floor, and natural1 has no extra global effect.

One native save roll is created without a native consequence pipeline, then its actual kept d20 and message UUID are retained on the module card.

Binary definitions with graded:false delegate directly to native saving throws; only module-authored graded definitions use this resolver.

Original damage packets must remain unscaled, with no prior native half/double multiplier; each target gets a source-linked result and the shared damage service applies its chosen factor once.

Stable condition application IDs and bounded save receipts prevent ordinary local retries from adding ranks twice; separate damage/effect updates are not a distributed transaction.

Cancelled native roll/DR choice performs no consequence updates, while post-damage failures may require manual reconciliation of a partially applied outcome.

The Bane example demonstrates S-rank local outcome remapping at an illustrative DC15; its exceptional penalty/suppression rules remain explicit manual text and it is not an installed jutsu Item.

Native activity flags and the full Jutsu conversion will be connected in Batch06; no live verification has been performed.
