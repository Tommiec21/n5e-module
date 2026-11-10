import { modifiers } from "./planner.mjs";
import { emptyPenalties } from "./modifiers.mjs";

/** Inherit the native actor lifecycle and adjust only freshly prepared condition-derived values. */
export function conditionActorClass(Base) {
  return class N5eConditionActor extends Base {
    prepareData() {
      super.prepareData();
      try { this.n5eConditions = modifiers(this); this.n5eConditionError = null; }
      catch (error) { this.n5eConditions = emptyPenalties(); this.n5eConditionError = error.message; }
      const m = this.n5eConditions;
      if (this.system.attributes?.ac && Number.isFinite(this.system.attributes.ac.value)) this.system.attributes.ac.value += m.ac;
      const append = (value, bonus) => bonus ? `(${value || 0}) + (${bonus})` : value;
      const bonuses = this.system.bonuses;
      if (bonuses?.abilities) {
        bonuses.abilities.check = append(bonuses.abilities.check, m.allDice + m.checksAndAttacks);
        bonuses.abilities.save = append(bonuses.abilities.save, m.allDice);
      }
      for (const kind of ["mwak", "rwak", "msak", "rsak"]) if (bonuses?.[kind]) bonuses[kind].attack = append(bonuses[kind].attack, m.allDice + m.checksAndAttacks);
      for (const skill of Object.values(this.system.skills ?? {})) if (skill.bonuses) skill.bonuses.check = append(skill.bonuses.check, ["str", "dex", "con"].includes(skill.ability) ? m.d20Physical : m.d20Mental);
      if (Number.isFinite(this.system.skills?.prc?.passive)) this.system.skills.prc.passive += m.perception;
      for (const [key, ability] of Object.entries(this.system.abilities ?? {})) {
        if (!ability.bonuses) continue;
        const physical = ["str", "dex", "con"].includes(key) ? m.d20Physical : m.d20Mental;
        for (const type of ["check", "save"]) {
          const bonus = physical + (!bonuses?.abilities ? m.allDice + (type === "check" ? m.checksAndAttacks : 0) : 0);
          if (bonus) ability.bonuses[type] = `(${ability.bonuses[type] || 0}) + (${bonus})`;
        }
      }
    }
  };
}
