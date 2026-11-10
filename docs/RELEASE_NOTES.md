# Batch09 condition lifecycle completion

Goal: complete condition movement/rest behavior, multi-source decay and out-of-combat expiry using the existing condition and damage services.

Oldest sources lose ranks first, excess ranks are discarded at the cap, and Chilled ends automatically outside combat under the user’s rulings.

Willing movement exceeding5feet produces one Chilled damage request per combat turn; forced/teleport movement is excluded or explicitly confirmed when native movement lacks classification.

Native rests cannot grant benefits to Envenomed actors, and confirmed food/drink enables long-rest Exhaustion recovery.

This is condition-rest integration, not conversion of all N5e HP/Chakra/Hit-Die rest resource rules, which remain owned by13; no live verification occurred.
