# Batch05 dual concentration

Two source-linked maintained casts, player-selected replacement, actual-paid-cost upkeep and single damage checks are implemented through module APIs and native effects.

Upkeep uses the host attribute-consumption handler; insufficient Chakra produces a player-choice card, while Stable and Efficient remain separate rules.

Concentration check cards use a native Chakra Control skill when configured, otherwise request the player’s full modifier and roll native dice; full skill/progression conversion remains outstanding.

Item casting must call replacement preflight before initial payment and register the already-paid cast afterward; this connection follows in Batch06.

Linked effects require owner/GM cleanup permission, and source cleanup/payment is not a distributed transaction; no live testing or local installation occurred.
