# Batch02 ranked conditions

Native ActiveEffect source storage, capped additive ranks, inherited derived modifiers, owner-checked controls, removal checks and active-GM turn lifecycle are implemented.

Condition damage is a labelled request only until Batch03; multi-source rank-decay allocation, movement damage and automated rest/complex behavioral flags remain manual.

Open controls through game.modules.get("n5e-module").api.conditions.open(actor), or use native token statuses; API-managed conditions contain the ranked source records.

Casting-specific cost/DC/DR modifiers are exposed through the condition aggregate for later adapters, not claimed integrated into absent casting/damage handlers.

No live verification or local installation; private release download requires authentication.
