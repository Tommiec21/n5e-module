/** Condition penalties from the N5e shared rules core (SHARED1b); the module's own registry stays the default. */
import { conditions as moduleConditions } from "./registry.mjs";
import { aggregatePenalties as coreAggregate } from "../core/module/rules/conditions.mjs";

export { emptyPenalties, clampRanks } from "../core/module/rules/conditions.mjs";

/** Aggregate active condition ranks into penalties, reading the module registry unless another is given. */
export function aggregatePenalties(active, registry = moduleConditions) {
  return coreAggregate(active, registry);
}
