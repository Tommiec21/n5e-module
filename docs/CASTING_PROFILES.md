# Casting integration contract

Batch10, Gameplay System: one reviewed Item profile selects native activities and joins the shared services; ordinary dnd5e Items are untouched.

Store `flags["n5e-module"].casting` with `version:1`, `baseRank`, `baseCost`, `discipline` (`nin`, `gen`, `tai`), `components` (`hs`, `cm`, `cs`, `m`, `w`, `nt`) and an `activities` map keyed by native activity ID.

Each activity declares `kind` (`attack`, `attackSave`, `save`, `heal`, `maintain`) and `parts`: `{type,formula}` or `{type,dice:{base,perRank,faces},bonus?}`. Formula placeholders `@upcast` and `@rank` are numeric substitutions, not a full-description parser; author parentheses for addition/subtraction before multiplication/division.

Save activities declare `saveAbility` and all four `outcomes`, or `outcomesByRank`; use the Batch04 damage/condition/manual row contract. Profiles optionally declare `concentration`, `durationSeconds`, `stable`, `efficient`, `hijutsu`, `upcast:false`, `known:false`, `requiredTags`, `keywords` and `healingExcludedTypes`.

`costChoices` contains `{id,operation,value,automatic?}`; supported operations are additions, subtractions, multipliers and divisors. The cast options select authored IDs and optional multiplier/divisor indices; existing cost calculation uses only one multiplier and divisor, with additive changes first and the source half-base floor.

`consumes:[{itemId,amount}]` links owned ammunition/tools to native material consumption, aggregating duplicate IDs. Chakra uses native attribute consumption; the activity's native resource targets must remain empty because this bridge owns consumption.

Actor `flags["n5e-module"].casting` may declare reviewed `maxRank`, `tags` and `disciplines:{nin:{ability,attackBonus,dcBonus},...}` grants. Batch13 converts feature grants; these explicit inputs do not infer permissions from item names.

Call `game.modules.get("n5e-module").api.casting.cast(activity,{rank,requirementsConfirmed:true,costChoices:[]},targets)` or use the native activity button. Components that the host cannot observe—free hands, specific required equipment, seals, printed prerequisites—and range/target eligibility require player confirmation; inventory consumables are checked by native handlers.

Replacement selection and all predictable validations precede spending; cancellation writes nothing. Overlapping casts on one actor are rejected, while other actors remain independent; this local guard does not claim distributed locking across clients.

Batch11 owns source-specific exceptions, interrupted longer casting and effect riders;12 owns martial modes;13 owns automatic grants;14 converts all entries;16 provides final sheet controls;17 owns third-party consumption coordination;19 owns integrated regression. Transport errors between actor, item and effect writes are reported without automatic retry or rollback.
