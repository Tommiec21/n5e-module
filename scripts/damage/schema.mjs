/** Extend each native creature model through inheritance, preserving its complete native schema. */
export function registerDamageFields(config, fields) {
  for (const key of ["character", "npc"]) {
    const Base = config.Actor.dataModels[key];
    if (!Base) continue;
    config.Actor.dataModels[key] = class extends Base {
      static defineSchema() {
        const schema = super.defineSchema();
        const points = () => new fields.NumberField({ integer: true, min: 0, initial: 0, required: true });
        schema.n5e = new fields.SchemaField({ chakra: new fields.SchemaField({ value: points(), max: points(), temp: points() }), dr: points(), diesAtZero: new fields.BooleanField({ initial: key === "npc" }) });
        return schema;
      }
    };
  }
}
