# Batch10 — Casting integration

Goal: join reusable casting eligibility and authored modes to native spending, rolls, graded saves, damage and dual concentration.

Implemented: reviewed version-one Item casting profiles; E–S rank limits and explicit grants; base B/A/S ability thresholds with Hijutsu/upcast exceptions; condition/component/armor/mobility checks; affinity tags; alternative discipline abilities and bonuses; authored scaling/cost choices; native material and Chakra consumption; concentration replacement before spending, duplicate and overlapping cast guards.

Physical free hands, seals, specific weapons and other prerequisites require player confirmation where native data cannot establish the fact. Batch13 supplies automatic feature/progression grants and Batch16 supplies final sheet editing; Batch11 owns exceptional effects and longer-casting interruptions, Batch12 martial sequencing, Batch14 bulk conversion. These remain scheduled work.

Validation: selected Batch10 automated gate pending; no live verification or local installation. Document writes across actor/items/effects are not a distributed transaction; a transport/write failure requires inspecting resources and effects before retrying.

# Batch09 condition lifecycle completion

Goal: complete condition movement/rest behavior, multi-source decay and out-of-combat expiry using the existing condition and damage services.

Oldest sources lose ranks first, excess ranks are discarded at the cap, and Chilled ends automatically outside combat under the user’s rulings.

Willing movement exceeding5feet produces one Chilled damage request per combat turn; forced/teleport movement is excluded or explicitly confirmed when native movement lacks classification.

Native rests cannot grant benefits to Envenomed actors, and confirmed food/drink enables long-rest Exhaustion recovery.

This is condition-rest integration, not conversion of all N5e HP/Chakra/Hit-Die rest resource rules, which remain owned by13; no live verification occurred.
