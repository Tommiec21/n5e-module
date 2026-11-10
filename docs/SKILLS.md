# Batch08 skills and Mastery

Goal: make N5e skill/ability/proficiency/Mastery calculations drive native rolls and concentration, rather than asking for the full Chakra Control modifier.

The N5e registry has20 skills; cha maps to native n5eChakraControl, ill to n5eIllusions, mar to n5eMartialArts and nin to n5eNinshou, while shared native keys remain unchanged.

Native Arcana/Religion fields are retained for migration safety, but are not part of the canonical N5e list; final display filtering belongs to16 and data mapping to13/18.

Proficiency uses the source bands3/4/5/6/7/8/9 at levels1/4/7/10/13/16/19, applied during inherited native base preparation.

Mastery counts distinct explicit sources, adds2/4/6 independently of training, and caps rank at1 before7,2 before12 and3 thereafter.

Native skill training is proficiency once, not native Expertise as a substitute for Mastery; set explicit Mastery grants through api.skills.setMasterySources or source-linked item/effect metadata.

Save training supplies full proficiency and untrained saves half, while ordinary ability checks retain their native ability modifier; initiative receives source half proficiency and explicit Mastery.

Actor, item and active-effect masterySources use target/source records, such as skill.cha and a stable feature ID; ASI-labelled sources are limited to skill/tool targets.

Native skill.value fields remain the training controls; class/clan automatic grants and ASI assignment flows belong to13 rather than being claimed imported here.

Chakra Control uses the native concentration roll path automatically once actor data is prepared; the old manual fallback is retained only for legacy/unprepared actors.

The inherited condition adapter adds physical/mental penalties through the ability-check channel only, since native skills already include that channel.

Core N5e discipline attack/DC calculations are available to trial casting when inputs are blank; alternative class/clan casting abilities and conditional feature bonuses remain10/13.

N5e armor/AC formula selection remains owned by13’s character formulas, and final sheet controls remain16; no hidden omission is treated as a user exclusion.
