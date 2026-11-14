/** Module adapter for the N5e shared rules core (SHARED1b): rules come from n5e-module settings, else core defaults. */
import { setRuleProvider } from "../core/module/rules/settings.mjs";
import { setHost } from "../core/module/rules/host.mjs";

/** Register before any core rule runs; unregistered module settings fall back to the core default. */
export function registerCoreAdapter(settings = globalThis.game?.settings) {
  setRuleProvider(key => {
    try { return settings?.get?.("n5e-module", key); } catch { return undefined; }
  });
  setHost({ config: () => undefined });
}
