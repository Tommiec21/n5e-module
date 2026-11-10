# Dual concentration: Batch05

Call api.concentration.chooseReplacement(actor) before casting payment, then begin(actor, castRecord, selection) after successful payment; cancellation must return before any new cast spends Chakra.

Two different item UUIDs can be maintained, and each record preserves actual cast rank, actual paid cost, Stable/Efficient flags, expiry and linked-effect UUIDs.

Use end(actor, castId) for voluntary ending; it removes only that record and the explicitly linked effects the caller may delete.

At combat turn start, affordable upkeep is paid through native attribute consumption; insufficient upkeep creates a player-owned choice card, and unselected casts end.

Efficient pays zero, while Stable only protects against damage-check failure; death/incapacity, expiry and required-molding loss still end Stable casts.

Damage checks use max(15 + combined actual maintained ranks, half combined final HP/Chakra damage including temporary pools); one failed check ends both captured non-Stable casts.

A cast begun after the damage event is not ended by that event’s captured plan, and ordinary Chakra spending never creates a concentration damage event.

Expiry scans only tracked maintained actors after one-time discovery, not every actor on each roll; out-of-combat upkeep is not automatically charged.

Native attribute consumption supplies the approved upkeep update, while source records never use native dnd5e concentration markers; flagged managed activities veto native beginConcentrating until the Batch06 adapter owns registration.

The Chakra Control skill is not yet migrated; native rolls can use a configured n5eChakraControl skill, otherwise the owner supplies a complete modifier explicitly rather than substituting a Constitution save.

Linked-effect permission failures require GM/manual reconciliation, and third-cast replacement cannot roll back a network failure after an existing effect has ended.

No complete Jutsu casting pipeline, class progression, world migration or live verification is claimed by this batch.
