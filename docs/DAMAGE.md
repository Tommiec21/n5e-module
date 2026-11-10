# HP and Chakra damage: Batch03

Use game.modules.get("n5e-module").api.damage.plan(actor, packet, options) to preview and applyWithChoice(actor, packet, options) to request DR order before applying.

The damaged creature must select type order when multiple eligible HP damage types share a DR budget; no allocation is committed on cancellation.

DamagePacket uses already-rolled integer components and a source roll UUID; post(actor, packet, rolls, options) creates a native roll card when the roll has not yet been posted.

retarget(packet, actor.uuid) preserves the original roll and components; the apply service rereads the recipient’s defenses and pools.

Actor fields are system.attributes.hp and system.n5e.chakra with value/max/temp, plus system.n5e.dr; native character/NPC models are extended through inheritance.

Set Chakra maximum/current/temp and DR through native actor.update before use; no new class progression or sheet editor is implied by these resource fields.

Static and rolled DR independently protect HP and Chakra, multipliers follow reductions, and temporary pools absorb first without hiding damage from concentration.

The damageApplied hook carries combined final damage including temporary-pool absorption; it does not roll concentration until Batch05.

Recover supports hp/cp/tempHp/tempCp, preserves Envenomed HP restrictions, and never emits a damage event.

Zero-HP outcomes are owned by this path, so it updates native resources directly rather than invoking native applyDamage and repeating defenses; failed post-update status changes require manual reconciliation.

Receipts retain the latest50 operations per actor and prevent ordinary local retries; cross-client atomicity and unlimited historical duplicate protection are not claimed.

Only module-owned damage cards use this adapter; ordinary host/third-party damage remains native, and unsupported type-to-pool conversions fail rather than guessing a feature rule.

Condition behavioral flags not consumed by these planners remain manual as documented in Batch02; casting integration follows in later batches.
