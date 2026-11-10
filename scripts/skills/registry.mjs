/** Skill definitions and progression tables reused from King’s N5e core registry at commit6c17e1a. */
export const skills = {
  "acr": {
    "label": "Acrobatics",
    "ability": "dex",
    "sourceKey": "acr"
  },
  "ani": {
    "label": "Animal Handling",
    "ability": "wis",
    "sourceKey": "ani"
  },
  "ath": {
    "label": "Athletics",
    "ability": "str",
    "sourceKey": "ath"
  },
  "n5eChakraControl": {
    "label": "Chakra Control",
    "ability": "con",
    "concentration": true,
    "sourceKey": "cha"
  },
  "dec": {
    "label": "Deception",
    "ability": "cha",
    "sourceKey": "dec"
  },
  "his": {
    "label": "History",
    "ability": "int",
    "sourceKey": "his"
  },
  "n5eIllusions": {
    "label": "Illusions",
    "ability": "wis",
    "clash": "gen",
    "sourceKey": "ill"
  },
  "ins": {
    "label": "Insight",
    "ability": "wis",
    "sourceKey": "ins"
  },
  "itm": {
    "label": "Intimidation",
    "ability": "cha",
    "sourceKey": "itm"
  },
  "inv": {
    "label": "Investigation",
    "ability": "int",
    "sourceKey": "inv"
  },
  "n5eMartialArts": {
    "label": "Martial Arts",
    "ability": "str",
    "altAbilities": [
      "int",
      "dex"
    ],
    "clash": "tai",
    "sourceKey": "mar"
  },
  "med": {
    "label": "Medicine",
    "ability": "wis",
    "sourceKey": "med"
  },
  "nat": {
    "label": "Nature",
    "ability": "int",
    "sourceKey": "nat"
  },
  "n5eNinshou": {
    "label": "Ninshou",
    "ability": "int",
    "clash": "nin",
    "sourceKey": "nin"
  },
  "prc": {
    "label": "Perception",
    "ability": "wis",
    "sourceKey": "prc"
  },
  "prf": {
    "label": "Performance",
    "ability": "cha",
    "sourceKey": "prf"
  },
  "per": {
    "label": "Persuasion",
    "ability": "cha",
    "sourceKey": "per"
  },
  "slt": {
    "label": "Sleight of Hand",
    "ability": "dex",
    "sourceKey": "slt"
  },
  "ste": {
    "label": "Stealth",
    "ability": "dex",
    "sourceKey": "ste"
  },
  "sur": {
    "label": "Survival",
    "ability": "wis",
    "sourceKey": "sur"
  }
};
export const progression = {
  "proficiency": [
    [
      1,
      3
    ],
    [
      4,
      4
    ],
    [
      7,
      5
    ],
    [
      10,
      6
    ],
    [
      13,
      7
    ],
    [
      16,
      8
    ],
    [
      19,
      9
    ]
  ],
  "mastery": {
    "maxRank": 3,
    "capByLevel": [
      [
        1,
        1
      ],
      [
        7,
        2
      ],
      [
        12,
        3
      ]
    ],
    "bonusByRank": {
      "0": 0,
      "1": 2,
      "2": 4,
      "3": 6
    }
  }
};
export const sourceSkillKeys = {"cha":"n5eChakraControl","ill":"n5eIllusions","mar":"n5eMartialArts","nin":"n5eNinshou"};
