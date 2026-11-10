# Ranked conditions: Batch02

Open the manual control dialog with game.modules.get("n5e-module").api.conditions.open(actor), supplying an owned actor document.

Use api.conditions.add for adding ranks to one source, set for absolute source ranks, remove for one source, and resolveRemoval for an already-rolled source-defined check.

Native status-picker entries alone are display icons, not ranked applications; use the module dialog/API for mechanical source records.

Derived native AC, ability/skill check, save and attack bonuses are prepared through native inheritance; condition cost/DC/DR and behavioral flags remain aggregate data for later adapters.

Burned/Bleed requests are available as actor.n5eConditionDamageRequests and through the n5e-module.conditionDamageRequested hook; they cannot change HP until Batch03.

Single-source turn decay and expiry are processed by the active GM for outgoing combat actors; multi-source decay allocation, movement/rest handling and out-of-combat expiry cleanup remain manual.

No permission to spend an action or bypass a required tool is implied by entering a removal roll total; the user must meet those requirements.

No live Foundry acceptance has been performed; unsupported or malformed condition combinations fail closed in derived preparation instead of crashing native actor preparation.
