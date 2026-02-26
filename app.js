// =====================================================================
// STATE
// =====================================================================
let saveData = null;
let originalJson = '';
let selectedCharId = null;
let changeCount = 0;
let trackedOriginals = {};
let activeEditorTab = 'overview';

// Data dictionaries (loaded from KKAoRMod data files)
let ITEM_DB = {};
let TRAIT_DB = {};
let ADDON_ATTR_DB = {};

// =====================================================================
// CONSTANTS
// =====================================================================
const ATTRIBUTES = [
  { key: 'strength',     bs: 'BSstrength',     label: 'Strength' },
  { key: 'endurance',    bs: 'BSendurance',    label: 'Endurance' },
  { key: 'agility',      bs: 'BSagility',      label: 'Agility' },
  { key: 'precision',    bs: 'BSprecision',    label: 'Perception' },
  { key: 'intelligence', bs: 'BSintelligence', label: 'Intelligence' },
  { key: 'willpower',    bs: 'BSwillpower',    label: 'Willpower' },
];

const SKILLS = [
  { key: 'persuade',    bs: 'BSPersuade',    label: 'Persuade' },
  { key: 'bargain',     bs: 'BSBargain',     label: 'Bargain' },
  { key: 'intimidate',  bs: 'BSIntimidate',  label: 'Intimidate' },
  { key: 'pathfind',    bs: 'BSPathfind',    label: 'Pathfinding' },
  { key: 'insight',     bs: 'BSInsight',     label: 'Insight' },
  { key: 'sneak',       bs: 'BSSneak',       label: 'Sneak' },
  { key: 'mechanics',   bs: 'BSMechanics',   label: 'Mechanics' },
  { key: 'theft',       bs: 'BSTheft',       label: 'Theft' },
  { key: 'scholarly',   bs: 'BSScholarly',   label: 'Scholarly' },
  { key: 'smithing',    bs: 'BSSmithing',    label: 'Smithing' },
  { key: 'alchemy',     bs: 'BSAlchemy',     label: 'Alchemy' },
  { key: 'cooking',     bs: 'BSCooking',     label: 'Cooking' },
  { key: 'medical',     bs: 'BSMedical',     label: 'Medical' },
  { key: 'training',    bs: 'BSTraining',    label: 'Training' },
  { key: 'torture',     bs: 'BSTorture',     label: 'Torture' },
];

const WEAPON_TYPES = ['Unarmed', 'One-Handed', 'Two-Handed', 'Shield', 'Ranged', 'Dual Wield', 'Polearm'];

const STATUS_FIELDS = [
  { key: 'health',  label: 'Health',  css: 'health',  max: 100 },
  { key: 'morale',  label: 'Morale',  css: 'morale',  max: 100 },
  { key: 'vigor',   label: 'Vigor',   css: 'vigor',   max: 100 },
  { key: 'satiety', label: 'Satiety', css: 'satiety', max: 100 },
];

const RESOURCE_FIELDS = [
  { key: 'currenthp', label: 'HP', css: 'hp' },
  { key: 'currentsp', label: 'SP', css: 'sp' },
  { key: 'currentmp', label: 'MP', css: 'mp' },
];

const CAREERS = {
  0: 'Fighter', 1: 'Guard', 2: 'Merchant', 3: 'Blacksmith', 4: 'Doctor',
  5: 'Adventurer', 6: 'Innkeeper', 7: 'Noble', 8: 'Beast Handler',
  9: 'Attendant', 10: 'Bandit', 15: 'Villager',
};

const GENDERS = { 1: 'Male', 2: 'Female' };
const RACES = { 1: 'Human', 2: 'Elf', 3: 'Dwarf', 11: 'Animal' };

const EDITOR_TABS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'abilities',  label: 'Abilities' },
  { id: 'powers',     label: 'Powers' },
  { id: 'inventory',  label: 'Inventory' },
  { id: 'builds',     label: 'Builds' },
];

const BUILD_PRESETS = [
  // =========================================================================
  // BUILD 1: IMMORTAL BLOOD KNIGHT
  // Tank + sustain + magic shields. Defender/Berserker/Battlemonk/Commander
  // passives layered with Blood/White/Earth magic shields and healing.
  // =========================================================================
  // CLASS SPELLS INCLUDED (all verified Mace/heavy plate compatible):
  //
  // -- Battlemonk (SkillSet 9, RequireWeapon includes Mace) --
  // [171] EnergyShield    - Self buff, CD 20s. Absorbs 40+10/lv damage for 8s. NO WEAPON REQ CHECK ON CAST. Core shield.
  // [170] EnergyBurst     - AoE blast around self, CD 16s, 20 MP. 4+4/lv damage. Melee AoE clear.
  // [169] EnergyBlast     - Ranged line attack, CD 15s, 12 MP. 10+10/lv damage. Gap filler vs ranged.
  // [168] ChiHeal         - Ground AoE heal, CD 30s, 16 MP. Heals 9+9/lv over 5s. Party sustain.
  // [172] LandingAttack   - Jump attack, CD 30s, 50 MP. 85+15/lv% weapon dmg AoE. Gap closer + AoE.
  //
  // -- Defender (SkillSet 3, RequireWeapon includes Mace) --
  // [68]  Fortress        - Self buff, CD 28s, 10 MP. +1+1/lv armor, +5+5/lv block for 8s. Tank steroid.
  // [70]  ImpairAttack    - Enhanced melee, CD 14s. 50+15/lv% weapon dmg, reduces enemy damage 10+10/lv for 8s.
  // [67]  FocusBlock      - Passive stance, CD 5s. +25+25/lv block value, +5+5/lv parry. Defensive posture.
  // [69]  Guardian        - Ally buff, CD 60s, 15 MP. Absorbs 20+10/lv% damage for an ally.
  // [19]  Intercept       - Dash to ally, CD 20s, 25 MP. Intercept attacks for 1+1/lv hits.
  //
  // -- Commander (SkillSet 2, no weapon requirement) --
  // [21]  FirstAid        - Heal ally, CD 30s, 12 MP. Heals 12+12/lv over 6s. Emergency heal.
  // [32]  Condemn         - Debuff enemy, CD 15s, 10 MP. -5-5/lv debuff for 9+1/lv s. Damage amplifier.
  // [43]  Stimulate       - Buff ally, CD 15s, 15 MP. +10+10/lv damage, +5+5/lv speed for 7s.
  // [24]  WarRoar         - AoE buff/debuff, CD 24s, 18 MP. +5+5/lv morale boost, 12s radius.
  // [34]  WarBanner       - Summon banner, CD 30s, 24 MP. Aura buff 4+2/lv for 10s radius.
  // [36]  Rescue          - Revive ally, CD 60s, 25 MP. Heals 5+10/lv on dead ally.
  //
  // -- Berserker (SkillSet 7, RequireWeapon includes Mace) --
  // [128] UnleashRage     - Self buff, CD 18s. +10/lv attack power for 15s when HP>50%.
  // [127] SuppressAnger   - Self buff, CD 18s. +1+1/lv DR when HP<50%, 7s. Clutch survival.
  // [125] HeadButt        - Melee stun, CD 12s, 15 MP. 25+25/lv force, stun 1.5+0.5/lv s. No weapon req.
  // [126] RecklessPosture - Toggle stance, CD 5s, 1 MP/s. +6+6/lv attack, -25% defense.
  // [124] Execute         - Enhanced melee, CD 16s. 100+10/lv% weapon dmg, +20+20/lv bonus vs <33% HP.
  //
  // -- Duelist (SkillSet 4) --
  // [55]  Challenge       - Taunt, CD 15s, 10 MP. Taunts enemy for 2+2/lv s. No weapon req.
  // [57]  BreakFree       - Self cleanse, CD 14s, 9 MP. Remove 2+1/lv debuffs, +10+10/lv DR. No weapon req.
  //
  // -- Rogue (SkillSet 5) --
  // [72]  BlindingDust    - CC, CD 15s, 5 MP. Blind for 3s at 50% chance, 2+2/lv debuff. No weapon req.
  // [73]  EnvenomedWeapon - Self buff, CD 25s. Poison 2+1/lv dmg for 15s, 5s ticks. Req Mace OK.
  // [58]  Evasion         - Dodge buff, CD 20-2/lv s, 9 MP. +20+20/lv dodge for 5s. No weapon req.
  //
  // -- Blood Magic (SkillSet 109, no weapon req unless noted) --
  // [312] BloodShield     - Self shield, CD 45s, 60 MP + 1/s. Absorbs 10+10/lv dmg for 10s. Core shield.
  // [313] BloodThirstyWeapon - Self buff, CD 10s, 15 MP. +3+2/lv life leech. Req Mace OK.
  // [310] BloodScourge    - AoE, CD 24s, 16 MP. 5+5/lv dmg + 5+5/lv bleed, 5s duration.
  // [311] BloodSeethe     - Single target, CD 24s, 16 MP. 10+5/lv dmg + 20+10/lv bleed.
  // [309] BloodReap       - Melee chain, CD 35s, 20 MP. 75+25/lv% weapon dmg.
  // [217] BloodDrain      - Life drain, CD 50s, 10 MP. Drains 5+10/lv HP.
  // [308] BloodMist       - AoE DoT, CD 40s, 30 MP. 2+2/lv dmg for 10s in 5m area.
  // [314] BloodThorn      - Root, CD 55s, 40 MP. 10+20/lv dmg, root 1+2/lv s.
  //
  // -- White Magic (SkillSet 104, no weapon req) --
  // [194] GlimmeringCloak - Self buff, CD 25s, 30 MP. +5+5/lv armor, +10+5/lv magic DR.
  // [195] HealingLight    - Heal, CD 18s, 24 MP. 2+2/lv HP + 1+1/lv regen for 5s.
  // [197] LightedWeapons  - Self buff, CD 25s, 30 MP. +3+3/lv light dmg, 30s dur, +10+5/lv.
  //
  // -- Earth Magic (SkillSet 111, no weapon req except RockFist) --
  // [285] RockArmor       - Self buff, CD 35s, 40 MP + 4/s. +25+15/lv armor, +10/lv resist, +6/lv DR.
  //
  // -- Necromancy (SkillSet 108, no weapon req) --
  // [242] BoneArmor       - Self shield, CD 30s, 32 MP + 1/s. Absorbs 20+25/lv dmg for 25s.
  //
  // WEAPON SKILLS (SkillSet 202 = Mace/TwoHand):
  // [4]  SpiralSlash  - AoE sweep, CD 8s. 88+12/lv% weapon dmg. Bread & butter AoE.
  // [1]  ChargeAttack - Gap closer, CD 13s. 120+10/lv range, 85+15/lv% dmg. Engager.
  // [0]  ArmourCrash  - Armor shred, CD 10s. -6-6/lv armor for 7+1/lv s. Debuff.
  // [2]  HiltStrike   - Stun hit, CD 12s. 20+10/lv force, stun 2+1/lv s. CC.
  // [5]  TrioSlash    - Big AoE, CD 18s. 60+10/lv% weapon dmg, large cone.
  // [3]  MightyGuard  - Defensive stance, CD 5s. +5+5/lv block, 14+1/lv parry.
  {
    name: 'Immortal Blood Knight',
    description: 'Tank + sustain + magic shields. Triple absorption layers (EnergyShield + BloodShield + BoneArmor + RockArmor), BloodThirstyWeapon leech, Fortress armor buff, dual death prevention (DeathResist + Unyielding), GlimmeringCloak + HealingLight sustain. 28 active abilities.',
    skillSets: [1, 2, 3, 4, 5, 7, 9, 104, 108, 109, 111],
    talents: [
      // Mastery nodes
      { id: 48, lv: 5 },   // Defender mastery - +2 slash/pierce/blunt resist per lv
      { id: 104, lv: 5 },  // Berserker mastery - +20% attack speed buff on rage
      { id: 146, lv: 5 },  // Battlemonk mastery - +20% phys/magic DR scaling
      { id: 18, lv: 5 },   // Fighter mastery - +3% persuasion per lv
      { id: 8, lv: 5 },    // Commander mastery - +20% aura radius
      { id: 198, lv: 5 },  // Shapeshifter mastery - +5 HealPower/lv
      { id: 216, lv: 5 },  // Blood Affinity mastery - +10 HealPower/lv
      { id: 211, lv: 5 },  // Light Affinity mastery - +3% venom magic power, +3 dark resist/lv
      { id: 207, lv: 5 },  // Earth Affinity mastery - +3% fire magic power, +3 pierce resist/lv
      { id: 206, lv: 5 },  // Death Affinity (Necromancy) mastery - +3 magic DR/lv
      // Sub-talents
      { id: 49, lv: 3 },   // Deterrent (Defender) - +10% armor per lv
      { id: 51, lv: 3 },   // Heavy Armour Expert (Defender) - +10/lv heavy armor effectiveness. Req Armour 3.
      { id: 52, lv: 3 },   // Unyielding (Defender) - Death prevention, heals 10/lv%, CD 300s
      { id: 50, lv: 3 },   // Heart of Beast (Defender) - +0.5 leadership/lv
      { id: 105, lv: 3 },  // DeathResist (Berserker) - 2nd death prevention, +1/lv heal, CD 300s
      { id: 148, lv: 3 },  // Mortify (Battlemonk) - +5 magic DR/lv, +4% carry
      { id: 178, lv: 3 },  // Bloodthirsty (Shapeshifter) - +10% life leech per lv
      { id: 181, lv: 3 },  // ThickFur (Shapeshifter) - +4 ALL resists per lv (9 types)
      { id: 19, lv: 3 },   // Kill Desire (Fighter) - +10+10/lv dmg buff on being hit
      { id: 106, lv: 3 },  // Hamstring (Berserker) - 3+2/lv% slow on hit, 75% for 2s
      // Weapon passives (TwoHand/Mace)
      { id: 68, lv: 3 },   // Overwhelming - weapon force bonus
      { id: 3, lv: 3 },    // Wild Sweep - cleave bonus
      { id: 1, lv: 3 },    // Reaper's Cleave - +4+4/lv AoE bleed
      { id: 2, lv: 3 },    // LethalStrike - +4% spell dmg/lv
    ],
    spells: [
      // Battlemonk class spells
      { id: 171 },  // EnergyShield - absorb 40+10/lv, CD 20s. Core shield #1.
      { id: 170 },  // EnergyBurst - AoE 4+4/lv around self, CD 16s
      { id: 168 },  // ChiHeal - AoE heal 9+9/lv, CD 30s
      { id: 169 },  // EnergyBlast - ranged line 10+10/lv, CD 15s
      { id: 172 },  // LandingAttack - jump AoE 85+15/lv%, CD 30s
      // Defender class spells
      { id: 68 },   // Fortress - +armor/block for 8s, CD 28s
      { id: 70 },   // ImpairAttack - debuff enemy dmg, enhanced melee, CD 14s
      { id: 67 },   // FocusBlock - +25+25/lv block stance, CD 5s
      { id: 69 },   // Guardian - absorb ally dmg 20+10/lv%, CD 60s
      { id: 19 },   // Intercept - dash to protect ally, CD 20s
      // Commander class spells
      { id: 21 },   // FirstAid - heal 12+12/lv over 6s, CD 30s
      { id: 32 },   // Condemn - debuff -5-5/lv, CD 15s
      { id: 43 },   // Stimulate - buff ally +10+10/lv dmg, CD 15s
      { id: 24 },   // WarRoar - AoE morale +5+5/lv, CD 24s
      { id: 34 },   // WarBanner - summon aura banner, CD 30s
      { id: 36 },   // Rescue - revive ally, CD 60s
      // Berserker class spells
      { id: 128 },  // UnleashRage - +10/lv attack when HP>50%, CD 18s
      { id: 127 },  // SuppressAnger - +1+1/lv DR when HP<50%, CD 18s
      { id: 125 },  // HeadButt - stun 1.5+0.5/lv s, CD 12s
      { id: 124 },  // Execute - 100+10/lv% wpn dmg, bonus vs low HP, CD 16s
      // Rogue class spells
      { id: 73 },   // EnvenomedWeapon - poison buff 2+1/lv, CD 25s. Mace OK.
      { id: 72 },   // BlindingDust - blind CC, CD 15s
      // Duelist class spells
      { id: 55 },   // Challenge - taunt 2+2/lv s, CD 15s
      { id: 57 },   // BreakFree - cleanse + DR, CD 14s
      // Blood magic spells
      { id: 312 },  // BloodShield - absorb 10+10/lv, CD 45s. Core shield #2.
      { id: 313 },  // BloodThirstyWeapon - +3+2/lv life leech, CD 10s. Mace OK.
      { id: 310 },  // BloodScourge - AoE bleed, CD 24s
      { id: 309 },  // BloodReap - 75+25/lv% wpn chain, CD 35s
      // White magic spells
      { id: 194 },  // GlimmeringCloak - +5+5/lv armor, +10+5/lv magic DR, CD 25s
      { id: 195 },  // HealingLight - heal 2+2/lv + regen, CD 18s
      // Earth magic spells
      { id: 285 },  // RockArmor - +25+15/lv armor, +10/lv resist, CD 35s
      // Necromancy spells
      { id: 242 },  // BoneArmor - absorb 20+25/lv, CD 30s. Core shield #3.
      // Weapon skills (TwoHand/Mace)
      { id: 4 },    // SpiralSlash - AoE 88+12/lv%, CD 8s
      { id: 1 },    // ChargeAttack - gap closer 85+15/lv%, CD 13s
      { id: 0 },    // ArmourCrash - -6-6/lv armor shred, CD 10s
      { id: 2 },    // HiltStrike - stun 2+1/lv s, CD 12s
      { id: 5 },    // TrioSlash - large AoE 60+10/lv%, CD 18s
      { id: 3 },    // MightyGuard - defensive stance +5+5/lv block, CD 5s
    ],
    weaponMastery: [0, 0, 50, 0, 0, 0, 0],
    books: [2273, 2271, 2275, 2272, 2279, 1119, 1267, 2082],
  },

  // =========================================================================
  // BUILD 2: ANNIHILATOR
  // Maximum DPS burst and sustained. Fighter/Duelist/Rogue/Berserker core
  // with ConcentrativeMode, BattleFuror, Execute chain. Blood weapon enchant.
  // =========================================================================
  // CLASS SPELLS INCLUDED (all verified Mace/heavy plate compatible):
  //
  // -- Gladiator/Fighter (SkillSet 1, RequireWeapon includes Mace) --
  // [40]  PowerStrike      - Enhanced melee, CD 15s. 125+25/lv% weapon dmg, 50% armor pen.
  // [23]  WhirlwindAttack  - AoE spin, CD 30s. 40+20/lv% weapon dmg. Ultimate AoE.
  // [45]  BattleFuror      - Self buff, CD 20s, 10 MP. +2/lv dmg, +1/lv speed for 7s.
  // [31]  DashAttack       - Charge through, CD 22s, 15 MP. 8+8/lv dmg, stun 1.5s.
  // [12]  KickDown         - Knockdown, CD 15s, 16 MP. Stun 1+0.5/lv s, 10+5/lv force.
  //
  // -- Duelist (SkillSet 4, RequireWeapon includes Mace) --
  // [59]  PrecisionStrike  - Enhanced melee, CD 18s. 100+20/lv% weapon dmg. Pure single-target.
  // [25]  Disarm           - Enhanced melee, CD 16s. Disarm 1+1/lv s, 40% force, 100% armor pen.
  // [56]  ConcentrativeMode - Toggle stance, CD 5s. +30% hit chance, +5+10/lv weapon dmg.
  // [55]  Challenge        - Taunt, CD 15s, 10 MP. Forced aggro 2+2/lv s.
  // [54]  AdvancedDodge    - Reactive dodge, CD 5s. 4-1/lv s enhanced dodge. No weapon req.
  // [57]  BreakFree        - Cleanse, CD 14s. Remove debuffs + DR buff.
  //
  // -- Rogue (SkillSet 5, RequireWeapon includes Mace for some) --
  // [74]  BackAttack       - Teleport behind + strike, CD 9s. 100+20/lv% weapon dmg.
  // [75]  PainSpotAttack   - Enhanced melee, CD 16s. 15+10/lv bonus dmg, 8s bleed.
  // [73]  EnvenomedWeapon  - Poison buff, CD 25s. +2+1/lv poison dmg per hit for 15s.
  // [72]  BlindingDust     - Blind CC, CD 15s, 5 MP. 2+2/lv blind debuff.
  // [58]  Evasion          - Dodge buff, CD 20s, 9 MP. +20+20/lv dodge for 5s.
  //
  // -- Berserker (SkillSet 7, RequireWeapon includes Mace) --
  // [124] Execute          - Enhanced melee, CD 16s. 100+10/lv% wpn dmg, +20+20/lv vs <33% HP.
  // [128] UnleashRage      - Self buff, CD 18s. +10/lv attack power for 15s when HP>50%.
  // [126] RecklessPosture  - Toggle, CD 5s, 1 MP/s. +6+6/lv attack, -25% defense. Glass cannon.
  // [125] HeadButt         - Stun, CD 12s, 15 MP. 25+25/lv force, 1.5+0.5/lv s stun.
  //
  // -- Blood Magic (SkillSet 109) --
  // [313] BloodThirstyWeapon - +3+2/lv life leech, CD 10s. Sustain via damage.
  // [311] BloodSeethe      - 10+5/lv dmg + 20+10/lv bleed, CD 24s.
  //
  // WEAPON SKILLS (SkillSet 202 = Mace/TwoHand):
  // [4]  SpiralSlash, [1] ChargeAttack, [0] ArmourCrash,
  // [2]  HiltStrike, [5] TrioSlash, [3] MightyGuard
  {
    name: 'Annihilator',
    description: 'Maximum burst DPS. PowerStrike 125+25/lv% + Execute bonus vs low HP + WhirlwindAttack AoE. ConcentrativeMode +5+10/lv flat weapon dmg, BattleFuror +2/lv dmg steroid, RecklessPosture +6+6/lv attack. BackAttack teleport-strike for repositioning. 27 active abilities.',
    skillSets: [1, 4, 5, 7, 109],
    talents: [
      // Mastery nodes
      { id: 18, lv: 5 },   // Fighter mastery
      { id: 40, lv: 5 },   // Duelist mastery - +3/lv weapon dmg
      { id: 56, lv: 5 },   // Rogue mastery - +5/lv crit damage
      { id: 104, lv: 5 },  // Berserker mastery - rage attack speed
      { id: 216, lv: 5 },  // Blood Affinity - +10 HealPower/lv (sustain via leech)
      // Sub-talents
      { id: 53, lv: 3 },   // Cunning (Rogue) - +4+4/lv flat melee damage
      { id: 19, lv: 3 },   // Kill Desire (Fighter) - +10+10/lv dmg buff on being hit, Mace OK
      { id: 21, lv: 3 },   // Multi Weapon Master (Fighter) - +30/lv weapon swap speed, +25+25/lv
      { id: 43, lv: 3 },   // Distance Attack (Fighter) - reduced engagement distance
      { id: 41, lv: 3 },   // Expose Weakness (Duelist) - 1+1/lv armor pen for 16s
      { id: 0, lv: 3 },    // Counter Cut (Duelist) - +10+5/lv counter dmg, Mace OK
      { id: 107, lv: 3 },  // LethalChaser (Berserker) - +10+10/lv chase speed
      { id: 106, lv: 3 },  // Hamstring (Berserker) - slow on hit, Mace OK
      { id: 108, lv: 3 },  // Torturer (Berserker) - +2+3/lv bleed dmg, Mace OK
      // Weapon passives (TwoHand/Mace)
      { id: 68, lv: 3 },   // Overwhelming
      { id: 3, lv: 3 },    // Wild Sweep
      { id: 1, lv: 3 },    // Reaper's Cleave
      { id: 2, lv: 3 },    // LethalStrike
    ],
    spells: [
      // Fighter/Gladiator class spells
      { id: 40 },   // PowerStrike - 125+25/lv% weapon dmg, CD 15s. Main nuke.
      { id: 23 },   // WhirlwindAttack - AoE 40+20/lv%, CD 30s. Ultimate AoE.
      { id: 45 },   // BattleFuror - +2/lv dmg, +1/lv speed, CD 20s
      { id: 31 },   // DashAttack - charge 8+8/lv, stun, CD 22s
      { id: 12 },   // KickDown - knockdown 1+0.5/lv s, CD 15s
      // Duelist class spells
      { id: 59 },   // PrecisionStrike - 100+20/lv% pure dmg, CD 18s
      { id: 25 },   // Disarm - disarm + 100% armor pen, CD 16s
      { id: 56 },   // ConcentrativeMode - +5+10/lv weapon dmg toggle, CD 5s
      { id: 55 },   // Challenge - taunt, CD 15s
      { id: 54 },   // AdvancedDodge - reactive dodge, CD 5s
      { id: 57 },   // BreakFree - cleanse + DR, CD 14s
      // Rogue class spells
      { id: 74 },   // BackAttack - teleport strike 100+20/lv%, CD 9s
      { id: 75 },   // PainSpotAttack - 15+10/lv bonus, bleed, CD 16s. Mace OK.
      { id: 73 },   // EnvenomedWeapon - poison buff, CD 25s. Mace OK.
      { id: 72 },   // BlindingDust - blind CC, CD 15s
      { id: 58 },   // Evasion - dodge buff, CD 20s
      // Berserker class spells
      { id: 124 },  // Execute - 100+10/lv%, bonus vs low HP, CD 16s
      { id: 128 },  // UnleashRage - +10/lv attack, CD 18s
      { id: 126 },  // RecklessPosture - +6+6/lv attack toggle, CD 5s
      { id: 125 },  // HeadButt - stun, CD 12s
      // Blood magic
      { id: 313 },  // BloodThirstyWeapon - life leech, CD 10s
      { id: 311 },  // BloodSeethe - 10+5/lv + bleed, CD 24s
      // Weapon skills (TwoHand/Mace)
      { id: 4 },    // SpiralSlash - AoE 88+12/lv%, CD 8s
      { id: 1 },    // ChargeAttack - gap closer, CD 13s
      { id: 0 },    // ArmourCrash - armor shred, CD 10s
      { id: 2 },    // HiltStrike - stun, CD 12s
      { id: 5 },    // TrioSlash - large AoE, CD 18s
      { id: 3 },    // MightyGuard - block stance, CD 5s
    ],
    weaponMastery: [0, 0, 50, 0, 0, 0, 0],
    books: [2278, 2274, 2276, 2275],
  },

  // =========================================================================
  // BUILD 3: UNDYING WARLORD
  // Summons + melee + commander auras. Skeleton army + Golem + Corpses
  // with Commander buffs amplifying everything. Necromancy + Forest + Blood.
  // =========================================================================
  // CLASS SPELLS INCLUDED:
  //
  // -- Commander (SkillSet 2, no weapon requirement) --
  // [21]  FirstAid, [32] Condemn, [43] Stimulate, [24] WarRoar,
  // [34]  WarBanner, [36] Rescue
  //
  // -- Defender (SkillSet 3, RequireWeapon includes Mace) --
  // [68]  Fortress, [70] ImpairAttack, [67] FocusBlock,
  // [69]  Guardian, [19] Intercept
  //
  // -- Berserker (SkillSet 7, RequireWeapon includes Mace) --
  // [128] UnleashRage, [127] SuppressAnger, [125] HeadButt, [124] Execute
  //
  // -- Necromancy Magic (SkillSet 108, no weapon req) --
  // [257] SummonSkeletonWarrior - Summon melee skeleton, CD 120s, 40 MP + 40 occupy.
  // [256] SummonSkeletonArcher  - Summon ranged skeleton, CD 120s, 40 MP + 40 occupy.
  // [255] SummonCorpse          - Summon corpse bomb, CD 60s, 30 MP + 30 occupy.
  // [258] SummonVengefulGhost   - Summon ghost, CD 180s, 75 MP + 75 occupy.
  // [242] BoneArmor             - Self shield 20+25/lv, CD 30s.
  // [253] EvilHaunt             - Debuff 2+2/lv + 15+15/lv DoT, CD 18s.
  // [254] SpiritForm            - Self buff +12/lv, CD 40s.
  // [243] DrainSoul             - Life drain 16+8/lv, CD 42s.
  //
  // -- Blood Magic (SkillSet 109) --
  // [312] BloodShield, [313] BloodThirstyWeapon, [310] BloodScourge
  //
  // -- Earth Magic (SkillSet 111) --
  // [293] SummonGolem    - Tanky summon, CD 150s, 50 MP + 50 occupy.
  // [285] RockArmor      - Self armor buff.
  // [286] RockSpikes     - Line AoE 4+4/lv, CD 26s.
  //
  // WEAPON SKILLS: [4] SpiralSlash, [1] ChargeAttack, [0] ArmourCrash,
  //                [2] HiltStrike, [5] TrioSlash, [3] MightyGuard
  {
    name: 'Undying Warlord',
    description: 'Summons + melee + commander auras. Skeleton Warriors/Archers + Corpses + Golem + Ghost army buffed by WarBanner/WarRoar/Stimulate auras. Power_In_Numbers scales with summon count. BoneArmor + BloodShield + RockArmor triple defense layers. 35 active abilities.',
    skillSets: [2, 3, 7, 108, 109, 111],
    talents: [
      // Mastery nodes
      { id: 8, lv: 5 },    // Commander mastery - +20% aura radius
      { id: 48, lv: 5 },   // Defender mastery - +2 phys resist/lv
      { id: 104, lv: 5 },  // Berserker mastery - rage attack speed
      { id: 206, lv: 5 },  // Death Affinity (Necromancy) - +3 magic DR/lv
      { id: 216, lv: 5 },  // Blood Affinity - +10 HealPower/lv
      { id: 207, lv: 5 },  // Earth Affinity - +3% fire magic, +3 pierce resist/lv
      // Sub-talents
      { id: 10, lv: 3 },   // Power_In_Numbers (Commander) - +1+1/lv dmg per nearby ally
      { id: 9, lv: 3 },    // Harasser (Commander) - +5+5/lv debuff on hit, 10s
      { id: 11, lv: 3 },   // Revenge Fire (Commander) - +6+6/lv counter damage
      { id: 49, lv: 3 },   // Deterrent (Defender) - +10% armor
      { id: 51, lv: 3 },   // Heavy Armour Expert (Defender) - heavy armor bonus. Req Armour 3.
      { id: 52, lv: 3 },   // Unyielding (Defender) - death prevention
      { id: 105, lv: 3 },  // DeathResist (Berserker) - 2nd death prevention
      { id: 178, lv: 3 },  // Bloodthirsty (Shapeshifter) - life leech
      { id: 181, lv: 3 },  // ThickFur (Shapeshifter) - +4 all resists/lv
      // Weapon passives
      { id: 68, lv: 3 },   // Overwhelming
      { id: 3, lv: 3 },    // Wild Sweep
      { id: 1, lv: 3 },    // Reaper's Cleave
      { id: 2, lv: 3 },    // LethalStrike
    ],
    spells: [
      // Commander class spells
      { id: 21 },   // FirstAid - heal, CD 30s
      { id: 32 },   // Condemn - debuff, CD 15s
      { id: 43 },   // Stimulate - buff ally/summons, CD 15s
      { id: 24 },   // WarRoar - AoE morale, CD 24s
      { id: 34 },   // WarBanner - aura banner buffs summons, CD 30s
      { id: 36 },   // Rescue - revive ally, CD 60s
      // Defender class spells
      { id: 68 },   // Fortress - armor/block, CD 28s
      { id: 70 },   // ImpairAttack - debuff melee, CD 14s
      { id: 67 },   // FocusBlock - block stance, CD 5s
      { id: 69 },   // Guardian - ally shield, CD 60s
      { id: 19 },   // Intercept - dash protect, CD 20s
      // Berserker class spells
      { id: 128 },  // UnleashRage - attack buff, CD 18s
      { id: 127 },  // SuppressAnger - DR when low HP, CD 18s
      { id: 125 },  // HeadButt - stun, CD 12s
      { id: 124 },  // Execute - finisher, CD 16s
      // Necromancy summons & spells
      { id: 257 },  // SummonSkeletonWarrior - melee summon, CD 120s
      { id: 256 },  // SummonSkeletonArcher - ranged summon, CD 120s
      { id: 255 },  // SummonCorpse - corpse bomb summon, CD 60s
      { id: 258 },  // SummonVengefulGhost - ghost summon, CD 180s
      { id: 242 },  // BoneArmor - self shield, CD 30s
      { id: 253 },  // EvilHaunt - debuff + DoT, CD 18s
      { id: 254 },  // SpiritForm - self buff, CD 40s
      { id: 243 },  // DrainSoul - life drain, CD 42s
      // Blood magic
      { id: 312 },  // BloodShield - absorb shield, CD 45s
      { id: 313 },  // BloodThirstyWeapon - life leech buff, CD 10s
      { id: 310 },  // BloodScourge - AoE bleed, CD 24s
      // Earth magic
      { id: 293 },  // SummonGolem - tanky summon, CD 150s
      { id: 285 },  // RockArmor - self armor buff, CD 35s
      { id: 286 },  // RockSpikes - line AoE, CD 26s
      // Weapon skills (TwoHand/Mace)
      { id: 4 },    // SpiralSlash - AoE, CD 8s
      { id: 1 },    // ChargeAttack - gap closer, CD 13s
      { id: 0 },    // ArmourCrash - armor shred, CD 10s
      { id: 2 },    // HiltStrike - stun, CD 12s
      { id: 5 },    // TrioSlash - large AoE, CD 18s
      { id: 3 },    // MightyGuard - block stance, CD 5s
    ],
    weaponMastery: [0, 0, 50, 0, 0, 0, 0],
    books: [2272, 2273, 2006, 2083],
  },

  // =========================================================================
  // BUILD 4: PURE MARTIAL
  // No magic, all combat classes stacked. Fighter/Commander/Defender/Duelist/
  // Rogue/Berserker/Ronin/Battlemonk. Maximum class spell coverage.
  // =========================================================================
  // CLASS SPELLS INCLUDED (all verified Mace/heavy plate compatible):
  //
  // -- Fighter/Gladiator (SkillSet 1) --
  // [40] PowerStrike, [23] WhirlwindAttack, [45] BattleFuror,
  // [31] DashAttack, [12] KickDown
  //
  // -- Commander (SkillSet 2) --
  // [21] FirstAid, [32] Condemn, [43] Stimulate, [24] WarRoar,
  // [34] WarBanner, [36] Rescue
  //
  // -- Defender (SkillSet 3) --
  // [68] Fortress, [70] ImpairAttack, [67] FocusBlock,
  // [69] Guardian, [19] Intercept
  //
  // -- Duelist (SkillSet 4) --
  // [59] PrecisionStrike, [25] Disarm, [56] ConcentrativeMode,
  // [55] Challenge, [54] AdvancedDodge, [57] BreakFree
  //
  // -- Rogue (SkillSet 5) --
  // [74] BackAttack, [75] PainSpotAttack, [73] EnvenomedWeapon,
  // [72] BlindingDust, [58] Evasion
  //
  // -- Berserker (SkillSet 7) --
  // [124] Execute, [128] UnleashRage, [126] RecklessPosture,
  // [127] SuppressAnger, [125] HeadButt
  //
  // -- Ronin (SkillSet 10, many have no weapon req) --
  // [185] Shuriken        - Ranged attack, CD 6s, 12 MP. 5+5/lv dmg. No weapon req.
  // [184] Caltrops         - Ground trap, CD 25s. Slow 75%, 1+1/lv dmg. No weapon req.
  // [187] Untouchable      - Self buff, CD 30s. 2+1/lv dodge, 50% melee/ranged avoid. No weapon req.
  // [186] SmokePill        - AoE smoke, CD 30s. Invis 1s, blind 2+1/lv s. No weapon req.
  // NOTE: CrossSlash/IaidoSlash/MeteorSlash require WeaponClass 22/49 (katana types) - EXCLUDED
  //
  // -- Battlemonk (SkillSet 9, RequireWeapon includes Mace) --
  // [171] EnergyShield, [170] EnergyBurst, [169] EnergyBlast,
  // [168] ChiHeal, [172] LandingAttack
  //
  // WEAPON SKILLS: all 6 TwoHand skills
  {
    name: 'Pure Martial',
    description: 'No magic required. 8 combat classes stacked: Fighter, Commander, Defender, Duelist, Rogue, Berserker, Ronin, Battlemonk. Double death prevention (Unyielding + DeathResist), ConcentrativeMode +5+10/lv weapon dmg, Cunning +4+4/lv melee, EnergyShield + Fortress defense. 42 active class abilities + 6 weapon skills.',
    skillSets: [1, 2, 3, 4, 5, 7, 9, 10],
    talents: [
      // Mastery nodes
      { id: 18, lv: 5 },   // Fighter mastery
      { id: 8, lv: 5 },    // Commander mastery
      { id: 48, lv: 5 },   // Defender mastery
      { id: 40, lv: 5 },   // Duelist mastery - +3/lv weapon dmg
      { id: 56, lv: 5 },   // Rogue mastery - +5/lv crit
      { id: 104, lv: 5 },  // Berserker mastery - rage speed
      { id: 204, lv: 5 },  // Ronin mastery - +2 phys/magic DR/lv
      { id: 146, lv: 5 },  // Battlemonk mastery - +20% DR scaling
      // Sub-talents
      { id: 53, lv: 3 },   // Cunning (Rogue) - +4+4/lv flat melee dmg
      { id: 52, lv: 3 },   // Unyielding (Defender) - death prevention #1
      { id: 105, lv: 3 },  // DeathResist (Berserker) - death prevention #2
      { id: 49, lv: 3 },   // Deterrent (Defender) - +10% armor
      { id: 51, lv: 3 },   // Heavy Armour Expert (Defender) - heavy armor bonus
      { id: 19, lv: 3 },   // Kill Desire (Fighter) - dmg on being hit, Mace OK
      { id: 41, lv: 3 },   // Expose Weakness (Duelist) - armor pen
      { id: 106, lv: 3 },  // Hamstring (Berserker) - slow on hit, Mace OK
      { id: 148, lv: 3 },  // Mortify (Battlemonk) - +5 magic DR/lv
      { id: 176, lv: 3 },  // Arbitrariness (Ronin) - +10+10/lv dmg. Req Mace OK.
      { id: 177, lv: 3 },  // DeflectArrows (Ronin) - +5+5/lv missile deflect. Req Mace OK.
      { id: 10, lv: 3 },   // Power_In_Numbers (Commander) - +1+1/lv per ally
      // Weapon passives
      { id: 68, lv: 3 },   // Overwhelming
      { id: 3, lv: 3 },    // Wild Sweep
      { id: 1, lv: 3 },    // Reaper's Cleave
      { id: 2, lv: 3 },    // LethalStrike
    ],
    spells: [
      // Fighter/Gladiator class spells
      { id: 40 },   // PowerStrike - 125+25/lv%, CD 15s
      { id: 23 },   // WhirlwindAttack - AoE spin, CD 30s
      { id: 45 },   // BattleFuror - dmg/speed buff, CD 20s
      { id: 31 },   // DashAttack - charge stun, CD 22s
      { id: 12 },   // KickDown - knockdown, CD 15s
      // Commander class spells
      { id: 21 },   // FirstAid - heal, CD 30s
      { id: 32 },   // Condemn - debuff, CD 15s
      { id: 43 },   // Stimulate - buff, CD 15s
      { id: 24 },   // WarRoar - AoE morale, CD 24s
      { id: 34 },   // WarBanner - aura, CD 30s
      { id: 36 },   // Rescue - revive, CD 60s
      // Defender class spells
      { id: 68 },   // Fortress - armor/block, CD 28s
      { id: 70 },   // ImpairAttack - debuff melee, CD 14s
      { id: 67 },   // FocusBlock - block stance, CD 5s
      { id: 69 },   // Guardian - ally shield, CD 60s
      { id: 19 },   // Intercept - dash protect, CD 20s
      // Duelist class spells
      { id: 59 },   // PrecisionStrike - 100+20/lv%, CD 18s
      { id: 25 },   // Disarm - disarm + armor pen, CD 16s
      { id: 56 },   // ConcentrativeMode - +weapon dmg toggle, CD 5s
      { id: 55 },   // Challenge - taunt, CD 15s
      { id: 54 },   // AdvancedDodge - reactive dodge, CD 5s
      { id: 57 },   // BreakFree - cleanse, CD 14s
      // Rogue class spells
      { id: 74 },   // BackAttack - teleport strike, CD 9s
      { id: 75 },   // PainSpotAttack - bleed strike, CD 16s
      { id: 73 },   // EnvenomedWeapon - poison buff, CD 25s
      { id: 72 },   // BlindingDust - blind CC, CD 15s
      { id: 58 },   // Evasion - dodge buff, CD 20s
      // Berserker class spells
      { id: 124 },  // Execute - finisher, CD 16s
      { id: 128 },  // UnleashRage - attack buff, CD 18s
      { id: 126 },  // RecklessPosture - attack toggle, CD 5s
      { id: 127 },  // SuppressAnger - DR when low HP, CD 18s
      { id: 125 },  // HeadButt - stun, CD 12s
      // Ronin class spells (no weapon req)
      { id: 185 },  // Shuriken - ranged 5+5/lv, CD 6s. No weapon req.
      { id: 184 },  // Caltrops - ground trap, CD 25s. No weapon req.
      { id: 187 },  // Untouchable - dodge self-buff, CD 30s. No weapon req.
      { id: 186 },  // SmokePill - AoE smoke/invis, CD 30s. No weapon req.
      // Battlemonk class spells (Mace compatible)
      { id: 171 },  // EnergyShield - absorb shield, CD 20s
      { id: 170 },  // EnergyBurst - AoE blast, CD 16s
      { id: 169 },  // EnergyBlast - ranged blast, CD 15s
      { id: 168 },  // ChiHeal - AoE heal, CD 30s
      { id: 172 },  // LandingAttack - jump AoE, CD 30s
      // Weapon skills (TwoHand/Mace)
      { id: 4 },    // SpiralSlash - AoE, CD 8s
      { id: 1 },    // ChargeAttack - gap closer, CD 13s
      { id: 0 },    // ArmourCrash - armor shred, CD 10s
      { id: 2 },    // HiltStrike - stun, CD 12s
      { id: 5 },    // TrioSlash - large AoE, CD 18s
      { id: 3 },    // MightyGuard - block stance, CD 5s
    ],
    weaponMastery: [0, 0, 50, 0, 0, 0, 0],
    books: [2275, 2272, 2273, 2271, 2278, 2274, 2276],
  },
];

// =====================================================================
// FILE HANDLING
// =====================================================================
function handleFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      originalJson = e.target.result;
      saveData = JSON.parse(originalJson);
      changeCount = 0;
      trackedOriginals = {};

      if (saveData.party && saveData.party.membersID && saveData.party.membersID.length > 0) {
        selectedCharId = saveData.party.membersID[0];
      } else if (saveData.npcs && saveData.npcs.length > 0) {
        selectedCharId = saveData.npcs[0].id;
      }

      document.getElementById('upload-screen').style.display = 'none';
      document.getElementById('editor-screen').style.display = 'block';
      renderAll();
    } catch (err) {
      alert('Failed to parse save file.\n\n' + err.message);
    }
  };
  reader.readAsText(file);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadSave() {
  // Download backup first, then the modified save
  const backupBlob = new Blob([originalJson], { type: 'application/octet-stream' });
  triggerDownload(backupBlob, 'backup_sav.dat');

  // Small delay so the browser handles both downloads
  setTimeout(() => {
    const json = JSON.stringify(saveData);
    const modBlob = new Blob([json], { type: 'application/octet-stream' });
    triggerDownload(modBlob, 'sav.dat');
  }, 500);
}

function downloadBackup() {
  const blob = new Blob([originalJson], { type: 'application/octet-stream' });
  triggerDownload(blob, 'backup_sav.dat');
}

function loadNewFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.dat,.json';
  input.onchange = (e) => handleFile(e.target.files[0]);
  input.click();
}

function resetChanges() {
  if (!confirm('Reset ALL changes to the original save data?')) return;
  saveData = JSON.parse(originalJson);
  changeCount = 0;
  trackedOriginals = {};
  renderAll();
}

// =====================================================================
// CHANGE TRACKING
// =====================================================================
function trackChange(path, oldVal, newVal) {
  if (!(path in trackedOriginals)) {
    trackedOriginals[path] = oldVal;
    changeCount++;
  } else if (trackedOriginals[path] === newVal) {
    delete trackedOriginals[path];
    changeCount--;
  }
  updateChangesBar();
}

function updateChangesBar() {
  const bar = document.getElementById('changes-bar');
  const count = document.getElementById('changes-count');
  if (changeCount > 0) {
    bar.classList.add('visible');
    count.textContent = changeCount + ' change' + (changeCount !== 1 ? 's' : '') + ' pending';
  } else {
    bar.classList.remove('visible');
  }
}

// =====================================================================
// HELPERS
// =====================================================================
function findNpc(id) {
  return saveData.npcs.find(n => n.id === id);
}

function findNpcIndex(id) {
  return saveData.npcs.findIndex(n => n.id === id);
}

function getPartyIds() {
  return saveData.party ? saveData.party.membersID : [];
}

function careerName(id) {
  return CAREERS[id] || ('Career ' + id);
}

function genderName(id) {
  return GENDERS[id] || ('Gender ' + id);
}

function raceName(id) {
  return RACES[id] || ('Race ' + id);
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// Clamp to 32-bit signed integer range (game uses int32 for many values)
const INT32_MAX = 2147483647;
const INT32_MIN = -2147483648;
function clampInt32(v) {
  return Math.max(INT32_MIN, Math.min(INT32_MAX, Math.round(v)));
}

function itemName(id) {
  const entry = ITEM_DB[String(id)];
  return entry ? entry.en : null;
}

function traitName(id) {
  const entry = TRAIT_DB[String(id)];
  return entry ? entry.en : null;
}

function addonAttrName(id) {
  const entry = ADDON_ATTR_DB[String(id)];
  return entry ? entry.en : null;
}

// =====================================================================
// SEARCHABLE DROPDOWN
// =====================================================================
function filterSearch(inputId, dropdownId, db) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;
  const query = input.value.toLowerCase().trim();
  if (!query || query.length < 1) {
    dropdown.innerHTML = '';
    dropdown.classList.remove('visible');
    return;
  }
  const results = [];
  for (const [id, entry] of Object.entries(db)) {
    if (entry.en.toLowerCase().includes(query) || id === query) {
      results.push({ id: Number(id), name: entry.en });
    }
    if (results.length >= 12) break;
  }
  if (results.length === 0) {
    dropdown.innerHTML = '<div class="search-no-results">No matches</div>';
    dropdown.classList.add('visible');
    return;
  }
  dropdown.innerHTML = results.map(r =>
    `<div class="search-result" onmousedown="selectSearchResult('${inputId}', ${r.id})">${escHtml(r.name)} <span class="search-result-id">#${r.id}</span></div>`
  ).join('');
  dropdown.classList.add('visible');
}

function selectSearchResult(inputId, id) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.dataset.selectedId = id;
  const db = input.dataset.db;
  let name = '';
  if (db === 'items') name = itemName(id);
  else if (db === 'traits') name = traitName(id);
  input.value = name || ('#' + id);
  const dropdownId = inputId + '-dropdown';
  const dropdown = document.getElementById(dropdownId);
  if (dropdown) {
    dropdown.classList.remove('visible');
    dropdown.innerHTML = '';
  }
}

function clearSearchDropdown(inputId) {
  const dropdown = document.getElementById(inputId + '-dropdown');
  if (dropdown) {
    setTimeout(() => {
      dropdown.classList.remove('visible');
      dropdown.innerHTML = '';
    }, 150);
  }
}

// =====================================================================
// RENDERING
// =====================================================================
function renderAll() {
  renderGameBar();
  renderPartyTabs();
  renderNpcList();
  renderCharEditor();
  updateChangesBar();
}

function renderGameBar() {
  const gt = saveData.gameTime || {};
  const html = `
    <div class="game-bar">
      <div class="game-bar-field">
        <label>Gold</label>
        <input type="number" value="${saveData.wealth}" onchange="onGameField(this, 'wealth')">
      </div>
      <div class="game-bar-field">
        <label>Reputation</label>
        <input type="number" value="${saveData.reputation}" onchange="onGameField(this, 'reputation')">
      </div>
      <div class="game-bar-field">
        <label>Day</label>
        <input type="number" value="${gt.day || 0}" onchange="onGameTimeField(this, 'day')">
      </div>
      <div class="game-bar-field">
        <label>Year</label>
        <input type="number" value="${gt.year || 0}" onchange="onGameTimeField(this, 'year')">
      </div>
      <div class="game-bar-info">
        ${saveData.npcs ? saveData.npcs.length + ' characters' : ''} &middot; v${saveData.currentVersion || '?'}
      </div>
    </div>
  `;
  document.getElementById('game-bar').innerHTML = html;
}

function renderPartyTabs() {
  const ids = getPartyIds();
  let html = '';
  ids.forEach(id => {
    const npc = findNpc(id);
    if (!npc) return;
    const active = id === selectedCharId ? ' active' : '';
    html += `
      <div class="party-tab${active}" onclick="selectChar(${id})">
        <div class="party-tab-name">${escHtml(npc.unitname)}</div>
        <div class="party-tab-info">Lv ${npc.level} ${careerName(npc.career)} &middot; Pwr ${npc.power}</div>
      </div>
    `;
  });
  document.getElementById('party-tabs').innerHTML = html;
}

function renderNpcList() {
  const query = (document.getElementById('npc-search').value || '').toLowerCase();
  const partyIds = new Set(getPartyIds());
  let filtered = saveData.npcs.filter(n => !partyIds.has(n.id));

  if (query) {
    filtered = filtered.filter(n =>
      n.unitname.toLowerCase().includes(query) ||
      String(n.id).includes(query)
    );
  }

  const shown = filtered.slice(0, 100);
  let html = '';
  shown.forEach(npc => {
    const active = npc.id === selectedCharId ? ' active' : '';
    html += `<div class="npc-chip${active}" onclick="selectChar(${npc.id})">${escHtml(npc.unitname)}<span class="npc-chip-level"> ${npc.level}</span></div>`;
  });

  document.getElementById('npc-list').innerHTML = html;
  document.getElementById('npc-count').textContent =
    (filtered.length > 100 ? '100 of ' : '') + filtered.length + ' shown';
}

function renderCharEditor() {
  const npc = findNpc(selectedCharId);
  if (!npc) {
    document.getElementById('char-editor').innerHTML = '<div style="color:var(--text-muted);padding:2rem;text-align:center;">Select a character to edit</div>';
    return;
  }

  // Save scroll positions before re-render
  const scrollY = window.scrollY;
  const invList = document.querySelector('.inv-list');
  const catalogList = document.querySelector('.inv-catalog-list');
  const invListScroll = invList ? invList.scrollTop : 0;
  const catalogListScroll = catalogList ? catalogList.scrollTop : 0;

  const idx = findNpcIndex(selectedCharId);
  const isParty = getPartyIds().includes(npc.id);

  let tabBar = '<div class="editor-tab-bar">';
  EDITOR_TABS.forEach(tab => {
    const active = tab.id === activeEditorTab ? ' active' : '';
    tabBar += `<button class="editor-tab${active}" onclick="switchEditorTab('${tab.id}')">${tab.label}</button>`;
  });
  tabBar += '</div>';

  let html = `
    <div class="char-header">
      <div class="char-name">${escHtml(npc.unitname)}</div>
      <div class="char-meta">
        <span>ID: ${npc.id}</span>
        <span>${genderName(npc.gender)}</span>
        <span>${raceName(npc.race)}</span>
        <span>${careerName(npc.career)}</span>
        ${isParty
          ? '<button class="btn btn-danger btn-sm" onclick="removeFromParty(' + npc.id + ')">Remove from Party</button>'
          : '<button class="btn btn-gold btn-sm" onclick="addToParty(' + npc.id + ')">+ Add to Party</button>'}
      </div>
    </div>
    ${tabBar}
    <div class="stat-grid">
      ${renderTabContent(npc, idx)}
    </div>
  `;

  document.getElementById('char-editor').innerHTML = html;

  // Populate catalogs after DOM is ready
  if (activeEditorTab === 'inventory') {
    filterItemCatalog(idx);
  } else if (activeEditorTab === 'powers') {
    filterTraitCatalog(idx);
  }

  // Restore scroll positions after re-render
  window.scrollTo(0, scrollY);
  const newInvList = document.querySelector('.inv-list');
  const newCatalogList = document.querySelector('.inv-catalog-list');
  if (newInvList) newInvList.scrollTop = invListScroll;
  if (newCatalogList) newCatalogList.scrollTop = catalogListScroll;
}

function renderTabContent(npc, idx) {
  switch (activeEditorTab) {
    case 'overview':
      return renderIdentityCard(npc, idx)
           + renderStatusCard(npc, idx)
           + renderResourcesCard(npc, idx)
           + renderAlignmentCard(npc, idx);
    case 'abilities':
      return renderAttributesCard(npc, idx)
           + renderSkillsCard(npc, idx)
           + renderWeaponMasteryCard(npc, idx);
    case 'powers':
      return renderSpellsCard(npc, idx)
           + renderTalentsCard(npc, idx)
           + renderTraitsCard(npc, idx);
    case 'inventory':
      return renderInventoryCard(npc, idx);
    case 'builds':
      return renderBuildsTab(npc, idx);
    default:
      return '';
  }
}

function switchEditorTab(tabId) {
  activeEditorTab = tabId;
  renderCharEditor();
}

function renderIdentityCard(npc, idx) {
  return `
    <div class="stat-card">
      <div class="stat-card-title">Identity</div>
      <table class="stat-table">
        <tr>
          <td class="stat-label">Name</td>
          <td class="stat-value">
            <input class="stat-input stat-input-wide" type="text" value="${escHtml(npc.unitname)}"
              onchange="onNpcStr(this, ${idx}, 'unitname')" style="text-align:left;width:150px;">
          </td>
        </tr>
        <tr>
          <td class="stat-label">Level</td>
          <td class="stat-value">
            <input class="stat-input" type="number" value="${npc.level}"
              onchange="onNpcNum(this, ${idx}, 'level')">
          </td>
        </tr>
        <tr>
          <td class="stat-label">Experience</td>
          <td class="stat-value">
            <input class="stat-input stat-input-wide" type="number" value="${npc.exp}"
              onchange="onNpcNum(this, ${idx}, 'exp')">
          </td>
        </tr>
        <tr>
          <td class="stat-label">Power</td>
          <td class="stat-value">
            <input class="stat-input" type="number" value="${npc.power}"
              onchange="onNpcNum(this, ${idx}, 'power')">
          </td>
        </tr>
        <tr>
          <td class="stat-label">Money</td>
          <td class="stat-value">
            <input class="stat-input stat-input-wide" type="number" value="${npc.money}"
              onchange="onNpcNum(this, ${idx}, 'money')">
          </td>
        </tr>
        <tr>
          <td class="stat-label">Potential</td>
          <td class="stat-value">
            <input class="stat-input" type="number" value="${npc.humanAttribute ? npc.humanAttribute.potential : 0}"
              onchange="onNpcNested(this, ${idx}, 'humanAttribute', 'potential')">
          </td>
        </tr>
      </table>
    </div>
  `;
}

function renderAttributesCard(npc, idx) {
  let rows = `
    <tr class="stat-header-row">
      <td>Attribute</td>
      <td>Level</td>
      <td>Exp</td>
    </tr>
  `;

  ATTRIBUTES.forEach((attr, i) => {
    const bsVal = npc.humanAttribute ? npc.humanAttribute[attr.bs] : 0;
    const curVal = npc[attr.key];
    // Show effective value: Current if non-zero, otherwise Base
    const effectiveVal = curVal || bsVal;
    const expVal = npc.humanAttribute && npc.humanAttribute.attEXP ? npc.humanAttribute.attEXP[i] : 0;
    rows += `
      <tr>
        <td class="stat-label">${attr.label}</td>
        <td class="stat-value">
          <input class="stat-input" type="number" min="0" value="${effectiveVal}"
            onchange="onAttrLevel(this, ${idx}, '${attr.key}', '${attr.bs}')">
        </td>
        <td class="stat-value">
          <input class="stat-input" type="number" step="0.01" value="${Number(expVal).toFixed(2)}"
            onchange="onNpcAttExp(this, ${idx}, ${i})">
        </td>
      </tr>
    `;
  });

  return `
    <div class="stat-card">
      <div class="stat-card-title">Attributes</div>
      <table class="stat-table">${rows}</table>
    </div>
  `;
}

function renderStatusCard(npc, idx) {
  let rows = '';
  STATUS_FIELDS.forEach(sf => {
    const val = npc[sf.key] || 0;
    const pct = Math.min(100, Math.max(0, (val / sf.max) * 100));
    rows += `
      <tr>
        <td class="stat-label">${sf.label}</td>
        <td class="stat-value" style="width:60%;">
          <div class="status-bar-wrap">
            <input class="stat-input" type="number" step="0.01" value="${Number(val).toFixed(2)}"
              onchange="onNpcNum(this, ${idx}, '${sf.key}'); renderCharEditor();">
            <div class="status-bar">
              <div class="status-bar-fill ${sf.css}" style="width:${pct}%"></div>
            </div>
          </div>
        </td>
      </tr>
    `;
  });

  return `
    <div class="stat-card">
      <div class="stat-card-title">Condition</div>
      <table class="stat-table">${rows}</table>
    </div>
  `;
}

function renderResourcesCard(npc, idx) {
  let rows = '';
  RESOURCE_FIELDS.forEach(rf => {
    const val = npc[rf.key] || 0;
    const pctKey = rf.key + 'PCT';
    const pct = (npc[pctKey] || 0) * 100;
    rows += `
      <tr>
        <td class="stat-label">${rf.label}</td>
        <td class="stat-value" style="width:60%;">
          <div class="status-bar-wrap">
            <input class="stat-input" type="number" step="0.01" value="${Number(val).toFixed(2)}"
              onchange="onNpcNum(this, ${idx}, '${rf.key}')">
            <div class="status-bar">
              <div class="status-bar-fill ${rf.css}" style="width:${pct.toFixed(0)}%"></div>
            </div>
          </div>
        </td>
      </tr>
    `;
  });

  return `
    <div class="stat-card">
      <div class="stat-card-title">Resources</div>
      <table class="stat-table">${rows}</table>
    </div>
  `;
}

function renderSkillsCard(npc, idx) {
  let rows = `
    <tr class="stat-header-row">
      <td>Skill</td>
      <td>Level</td>
      <td>Exp</td>
    </tr>
  `;

  SKILLS.forEach((sk, i) => {
    const bsVal = npc.humanTalent ? npc.humanTalent[sk.bs] : 0;
    const curVal = npc[sk.key];
    const effectiveVal = curVal || bsVal;
    const expVal = npc.humanTalent && npc.humanTalent.skillEXP ? npc.humanTalent.skillEXP[i] : 0;
    rows += `
      <tr>
        <td class="stat-label">${sk.label}</td>
        <td class="stat-value">
          <input class="stat-input" type="number" min="0" value="${effectiveVal}"
            onchange="onSkillLevel(this, ${idx}, '${sk.key}', '${sk.bs}')">
        </td>
        <td class="stat-value">
          <input class="stat-input" type="number" step="0.01" value="${Number(expVal).toFixed(2)}"
            onchange="onNpcSkillExp(this, ${idx}, ${i})">
        </td>
      </tr>
    `;
  });

  return `
    <div class="stat-card">
      <div class="stat-card-title">Skills</div>
      <table class="stat-table">${rows}</table>
    </div>
  `;
}

function renderWeaponMasteryCard(npc, idx) {
  const mastery = npc.weaponMastery || [0,0,0,0,0,0,0];
  const masteryExp = npc.weaponMasteryEXP || [0,0,0,0,0,0,0];
  // Ensure arrays are long enough for all weapon types
  while (mastery.length < WEAPON_TYPES.length) mastery.push(0);
  while (masteryExp.length < WEAPON_TYPES.length) masteryExp.push(0);
  const maxMastery = Math.max(1, ...mastery);

  let rows = `
    <tr class="stat-header-row">
      <td>Weapon</td>
      <td>Level</td>
      <td>Exp</td>
      <td></td>
    </tr>
  `;

  WEAPON_TYPES.forEach((wt, i) => {
    const val = mastery[i] || 0;
    const exp = masteryExp[i] || 0;
    const pct = maxMastery > 0 ? (val / maxMastery) * 100 : 0;
    rows += `
      <tr>
        <td class="stat-label">${wt}</td>
        <td class="stat-value">
          <input class="stat-input" type="number" value="${val}"
            onchange="onNpcArr(this, ${idx}, 'weaponMastery', ${i})">
        </td>
        <td class="stat-value">
          <input class="stat-input" type="number" step="0.01" value="${Number(exp).toFixed(2)}"
            onchange="onNpcArr(this, ${idx}, 'weaponMasteryEXP', ${i})">
        </td>
        <td style="width:30%;">
          <div class="mastery-bar"><div class="mastery-fill" style="width:${pct}%"></div></div>
        </td>
      </tr>
    `;
  });

  return `
    <div class="stat-card">
      <div class="stat-card-title">Weapon Mastery</div>
      <table class="stat-table">${rows}</table>
    </div>
  `;
}

function renderSpellsCard(npc, idx) {
  const spells = npc.spells || [];
  let rows = `
    <tr class="stat-header-row">
      <td>Spell ID</td>
      <td>Level</td>
      <td>Active</td>
      <td></td>
    </tr>
  `;

  spells.forEach((sp, i) => {
    rows += `
      <tr>
        <td class="stat-label">#${sp.id}</td>
        <td class="stat-value">
          <input class="stat-input" type="number" value="${sp.lv}"
            onchange="onSpellField(${idx}, ${i}, 'lv', Number(this.value))">
        </td>
        <td class="stat-value">
          <label class="toggle-label">
            <input type="checkbox" ${sp.isActivated ? 'checked' : ''}
              onchange="onSpellField(${idx}, ${i}, 'isActivated', this.checked)">
            <span class="toggle-text">${sp.isActivated ? 'On' : 'Off'}</span>
          </label>
        </td>
        <td class="stat-value">
          <button class="btn-remove" onclick="removeListItem(${idx}, 'spells', ${i})" title="Remove">&times;</button>
        </td>
      </tr>
    `;
  });

  return `
    <div class="stat-card">
      <div class="stat-card-title">
        Spells
        <span class="card-count">${spells.length}</span>
      </div>
      <table class="stat-table">${rows}</table>
      <div class="card-add-bar">
        <input class="stat-input" type="number" placeholder="ID" id="add-spell-id-${idx}" style="width:60px;text-align:center;">
        <button class="btn btn-sm" onclick="addSpell(${idx})">+ Add Spell</button>
      </div>
    </div>
  `;
}

function renderTalentsCard(npc, idx) {
  const talents = npc.talents || [];
  let rows = `
    <tr class="stat-header-row">
      <td>Talent ID</td>
      <td>Level</td>
      <td></td>
    </tr>
  `;

  talents.forEach((t, i) => {
    rows += `
      <tr>
        <td class="stat-label">#${t.id}</td>
        <td class="stat-value">
          <input class="stat-input" type="number" value="${t.lv}"
            onchange="onTalentField(${idx}, ${i}, 'lv', Number(this.value))">
        </td>
        <td class="stat-value">
          <button class="btn-remove" onclick="removeListItem(${idx}, 'talents', ${i})" title="Remove">&times;</button>
        </td>
      </tr>
    `;
  });

  return `
    <div class="stat-card">
      <div class="stat-card-title">
        Talents
        <span class="card-count">${talents.length}</span>
      </div>
      <table class="stat-table">${rows}</table>
      <div class="card-add-bar">
        <input class="stat-input" type="number" placeholder="ID" id="add-talent-id-${idx}" style="width:60px;text-align:center;">
        <button class="btn btn-sm" onclick="addTalent(${idx})">+ Add Talent</button>
      </div>
    </div>
  `;
}

function renderTraitsCard(npc, idx) {
  const traits = npc.traits || [];
  let chips = '';
  traits.forEach((t, i) => {
    const name = traitName(t);
    const label = name ? `${escHtml(name)}` : `#${t}`;
    const tooltip = name ? `title="ID: ${t}"` : `title="ID: ${t}"`;
    chips += `<span class="trait-chip" ${tooltip}>${label}<button class="btn-remove-inline" onclick="removeListItem(${idx}, 'traits', ${i})" title="Remove">&times;</button></span>`;
  });

  return `
    <div class="inv-layout stat-card-wide">
      <div class="inv-panel inv-panel-owned">
        <div class="stat-card-title">
          Traits
          <span class="card-count">${traits.length}</span>
        </div>
        <div class="trait-list-panel">
          ${chips || '<div class="inv-empty">No traits</div>'}
        </div>
      </div>
      <div class="inv-panel inv-panel-catalog">
        <div class="stat-card-title">Available Traits</div>
        <div class="inv-catalog-search">
          <input class="stat-input search-input" type="text" placeholder="Search traits..." id="trait-catalog-search-${idx}"
            oninput="filterTraitCatalog(${idx})" autocomplete="off">
        </div>
        <div class="inv-catalog-list" id="trait-catalog-list-${idx}"></div>
      </div>
    </div>
  `;
}

function filterTraitCatalog(npcIdx) {
  const input = document.getElementById('trait-catalog-search-' + npcIdx);
  const list = document.getElementById('trait-catalog-list-' + npcIdx);
  if (!list) return;
  const query = input ? input.value.toLowerCase().trim() : '';
  const npc = findNpc(selectedCharId);
  const ownedSet = new Set((npc && npc.traits) ? npc.traits : []);
  const results = [];
  for (const [id, entry] of Object.entries(TRAIT_DB)) {
    if (!query || entry.en.toLowerCase().includes(query) || id === query) {
      results.push({ id: Number(id), name: entry.en, owned: ownedSet.has(Number(id)) });
    }
  }
  if (results.length === 0) {
    list.innerHTML = '<div class="inv-empty">No traits match "' + escHtml(query) + '"</div>';
    return;
  }
  list.innerHTML = results.map(r =>
    `<div class="catalog-item${r.owned ? ' catalog-item-owned' : ''}" onclick="${r.owned ? '' : 'addTraitDirect(' + npcIdx + ',' + r.id + ')'}">
      <span class="catalog-item-name">${escHtml(r.name)}</span>
      <span class="catalog-item-id">#${r.id}</span>
      ${r.owned
        ? '<span class="catalog-owned-badge">Owned</span>'
        : '<button class="btn btn-sm catalog-add-btn">+ Add</button>'}
    </div>`
  ).join('');
}

function addTraitDirect(npcIdx, traitId) {
  const npc = saveData.npcs[npcIdx];
  if (!npc.traits) npc.traits = [];
  npc.traits.push(traitId);
  changeCount++;
  trackedOriginals[`npc.${npc.id}.traits.add.${traitId}`] = null;
  updateChangesBar();
  const searchInput = document.getElementById('trait-catalog-search-' + npcIdx);
  const query = searchInput ? searchInput.value : '';
  renderCharEditor();
  const newInput = document.getElementById('trait-catalog-search-' + npcIdx);
  if (newInput && query) {
    newInput.value = query;
    filterTraitCatalog(npcIdx);
  }
}

function renderInventoryCard(npc, idx) {
  const items = npc.items || [];

  // Left panel: character's current inventory
  let itemList = '';
  items.forEach((item, i) => {
    const name = itemName(item.id);
    const dur = item.durability === -1 ? 'Consumable' : Number(item.durability).toFixed(1);
    const durLabel = item.durability === -1 ? 'Consumable' : 'Durability';

    let addAttrHtml = '';
    if (item.addAttrs && item.addAttrs.length > 0) {
      const attrChips = item.addAttrs.map(a => {
        const attrType = a.type !== undefined ? a.type : a.id;
        const attrLabel = addonAttrName(attrType) || ('Attr #' + attrType);
        return `<span class="item-attr-chip" title="Type: ${attrType}">${escHtml(attrLabel)}: ${a.value}</span>`;
      }).join('');
      addAttrHtml = `<div class="item-attrs">${attrChips}</div>`;
    }

    itemList += `
      <div class="inv-item">
        <div class="inv-item-header">
          <div class="inv-item-name">
            ${name
              ? `<span class="item-name">${escHtml(name)}</span>`
              : `<span class="item-name item-name-unknown">Unknown Item</span>`}
            <span class="item-id">#${item.id}</span>
          </div>
          <button class="btn-remove" onclick="removeListItem(${idx}, 'items', ${i})" title="Remove">&times;</button>
        </div>
        <div class="inv-item-fields">
          <label class="inv-field">
            <span class="inv-field-label">Qty</span>
            <input class="stat-input" type="number" value="${item.stackNum}" style="width:50px;"
              onchange="onItemField(${idx}, ${i}, 'stackNum', Number(this.value))">
          </label>
          <label class="inv-field">
            <span class="inv-field-label">Quality</span>
            <input class="stat-input" type="number" value="${item.quality}" style="width:50px;"
              onchange="onItemField(${idx}, ${i}, 'quality', Number(this.value))">
          </label>
          <label class="inv-field">
            <span class="inv-field-label">${durLabel}</span>
            ${item.durability === -1
              ? `<span class="inv-field-value">Consumable</span>`
              : `<input class="stat-input" type="number" value="${Number(item.durability).toFixed(1)}" style="width:70px;" step="0.1"
                  onchange="onItemField(${idx}, ${i}, 'durability', Number(this.value))">`}
          </label>
        </div>
        ${addAttrHtml}
      </div>
    `;
  });

  return `
    <div class="inv-layout stat-card-wide">
      <div class="inv-panel inv-panel-owned">
        <div class="stat-card-title">
          Inventory
          <span class="card-count">${items.length}</span>
        </div>
        <div class="inv-list">
          ${itemList || '<div class="inv-empty">No items</div>'}
        </div>
      </div>
      <div class="inv-panel inv-panel-catalog">
        <div class="stat-card-title">Item Catalog</div>
        <div class="inv-catalog-search">
          <input class="stat-input search-input" type="text" placeholder="Search items by name..." id="inv-catalog-search-${idx}"
            oninput="filterItemCatalog(${idx})" autocomplete="off">
        </div>
        <div class="inv-catalog-list" id="inv-catalog-list-${idx}"></div>
      </div>
    </div>
  `;
}

function renderBuildsTab(npc, idx) {
  let cards = '';
  BUILD_PRESETS.forEach((preset, i) => {
    const classCount = preset.skillSets.filter(s => s < 100).length;
    const magicCount = preset.skillSets.filter(s => s >= 100).length;
    const talentCount = preset.talents.length;
    const spellCount = preset.spells.length;

    cards += `
      <div class="stat-card build-card">
        <div class="build-card-header">
          <div class="build-card-name">${escHtml(preset.name)}</div>
          <button class="btn btn-gold btn-sm" onclick="applyBuildPreset(${idx}, ${i})">Apply Build</button>
        </div>
        <div class="build-card-desc">${escHtml(preset.description)}</div>
        <div class="build-card-stats">
          <span class="build-stat">${classCount} classes</span>
          ${magicCount ? `<span class="build-stat">${magicCount} magic</span>` : ''}
          <span class="build-stat">${talentCount} talents</span>
          <span class="build-stat">${spellCount} spells</span>
          <span class="build-stat">Two-Hand ${preset.weaponMastery[2]}</span>
        </div>
      </div>
    `;
  });

  return `
    <div class="stat-card-wide">
      <div class="stat-card-title">Build Presets</div>
      <div class="builds-list">
        ${cards}
      </div>
    </div>
  `;
}

function applyBuildPreset(npcIdx, buildIndex) {
  const preset = BUILD_PRESETS[buildIndex];
  if (!preset) return;
  if (!confirm('Apply "' + preset.name + '" build?\n\nThis adds skillSets, talents, spells, weapon mastery, and class books.\nExisting entries are updated, not duplicated.')) return;

  const npc = saveData.npcs[npcIdx];

  // 1. SkillSets
  if (!npc.skillSet) npc.skillSet = [];
  for (const ss of preset.skillSets) {
    if (!npc.skillSet.includes(ss)) {
      npc.skillSet.push(ss);
      changeCount++;
      trackedOriginals['npc.' + npc.id + '.skillSet.add.' + ss] = null;
    }
  }

  // 2. Talents (upsert)
  if (!npc.talents) npc.talents = [];
  for (const pt of preset.talents) {
    const existing = npc.talents.find(t => t.id === pt.id);
    if (existing) {
      if (existing.lv < pt.lv) {
        trackedOriginals['npc.' + npc.id + '.talents.' + pt.id + '.lv'] = existing.lv;
        existing.lv = pt.lv;
        changeCount++;
      }
    } else {
      npc.talents.push({ id: pt.id, lv: pt.lv, cd: 0 });
      changeCount++;
      trackedOriginals['npc.' + npc.id + '.talents.add.' + pt.id] = null;
    }
  }

  // 3. Spells (upsert)
  if (!npc.spells) npc.spells = [];
  for (const ps of preset.spells) {
    const existing = npc.spells.find(s => s.id === ps.id);
    if (!existing) {
      npc.spells.push({ id: ps.id, lv: ps.lv || 3, cd: 0, isActivated: false });
      changeCount++;
      trackedOriginals['npc.' + npc.id + '.spells.add.' + ps.id] = null;
    }
  }

  // 4. Weapon mastery (only increase)
  if (!npc.weaponMastery) npc.weaponMastery = [0,0,0,0,0,0,0];
  if (!npc.weaponMasteryEXP) npc.weaponMasteryEXP = [0,0,0,0,0,0,0];
  while (npc.weaponMastery.length < 7) npc.weaponMastery.push(0);
  while (npc.weaponMasteryEXP.length < 7) npc.weaponMasteryEXP.push(0);
  for (let i = 0; i < preset.weaponMastery.length; i++) {
    if (preset.weaponMastery[i] > npc.weaponMastery[i]) {
      trackedOriginals['npc.' + npc.id + '.weaponMastery.' + i] = npc.weaponMastery[i];
      npc.weaponMastery[i] = preset.weaponMastery[i];
      changeCount++;
    }
  }

  // 5. Books (add to inventory if not owned)
  if (preset.books && preset.books.length > 0) {
    if (!npc.items) npc.items = [];
    const ownedIds = new Set(npc.items.map(it => it.id));
    const usedSlots = new Set(npc.items.map(it => it.slotIndex));
    let slot = 0;
    for (const bookId of preset.books) {
      if (ownedIds.has(bookId)) continue;
      while (usedSlots.has(slot)) slot++;
      npc.items.push({
        id: bookId, slotIndex: slot, subSlotIndex: 0,
        stackNum: 1, isNew: true, isStolen: 0,
        durability: 100, quality: 1, addAttrs: []
      });
      usedSlots.add(slot);
      changeCount++;
      trackedOriginals['npc.' + npc.id + '.items.add.' + bookId + '.' + Date.now()] = null;
      slot++;
    }
  }

  updateChangesBar();
  renderCharEditor();
}

function filterItemCatalog(npcIdx) {
  const input = document.getElementById('inv-catalog-search-' + npcIdx);
  const list = document.getElementById('inv-catalog-list-' + npcIdx);
  if (!list) return;
  const query = input ? input.value.toLowerCase().trim() : '';
  const results = [];
  for (const [id, entry] of Object.entries(ITEM_DB)) {
    if (!query || entry.en.toLowerCase().includes(query) || id === query) {
      results.push({ id: Number(id), name: entry.en });
    }
  }
  if (results.length === 0) {
    list.innerHTML = '<div class="inv-empty">No items match "' + escHtml(query) + '"</div>';
    return;
  }
  list.innerHTML = results.map(r =>
    `<div class="catalog-item" onclick="addItemDirect(${npcIdx}, ${r.id})">
      <span class="catalog-item-name">${escHtml(r.name)}</span>
      <span class="catalog-item-id">#${r.id}</span>
      <button class="btn btn-sm catalog-add-btn">+ Add</button>
    </div>`
  ).join('');
}

function addItemDirect(npcIdx, itemId) {
  const npc = saveData.npcs[npcIdx];
  if (!npc.items) npc.items = [];
  const usedSlots = new Set(npc.items.map(i => i.slotIndex));
  let slot = 0;
  while (usedSlots.has(slot)) slot++;
  npc.items.push({
    id: itemId,
    slotIndex: slot,
    subSlotIndex: 0,
    stackNum: 1,
    isNew: true,
    isStolen: 0,
    durability: 100,
    quality: 1,
    addAttrs: []
  });
  changeCount++;
  trackedOriginals[`npc.${npc.id}.items.add.${itemId}.${Date.now()}`] = null;
  updateChangesBar();
  // Preserve search query and re-render
  const searchInput = document.getElementById('inv-catalog-search-' + npcIdx);
  const query = searchInput ? searchInput.value : '';
  renderCharEditor();
  // Restore search state
  const newInput = document.getElementById('inv-catalog-search-' + npcIdx);
  if (newInput && query) {
    newInput.value = query;
    filterItemCatalog(npcIdx);
  }
}

function renderAlignmentCard(npc, idx) {
  return `
    <div class="stat-card">
      <div class="stat-card-title">Alignment &amp; Social</div>
      <table class="stat-table">
        <tr>
          <td class="stat-label">Goodness</td>
          <td class="stat-value">
            <input class="stat-input" type="number" value="${npc.goodness || 0}"
              onchange="onNpcNum(this, ${idx}, 'goodness')">
          </td>
        </tr>
        <tr>
          <td class="stat-label">Lawfulness</td>
          <td class="stat-value">
            <input class="stat-input" type="number" value="${npc.lawfulness || 0}"
              onchange="onNpcNum(this, ${idx}, 'lawfulness')">
          </td>
        </tr>
      </table>
    </div>
  `;
}

function renderCombatStatsCard(npc, idx) {
  const hc = npc.heroCareer || {};
  return `
    <div class="stat-card">
      <div class="stat-card-title">Combat Record</div>
      <table class="stat-table">
        <tr><td class="stat-label">Total Damage Dealt</td>
          <td class="stat-value"><input class="stat-input stat-input-wide" type="number" value="${hc.totalDamageDealt || 0}"
            onchange="onNpcNested(this, ${idx}, 'heroCareer', 'totalDamageDealt')"></td></tr>
        <tr><td class="stat-label">Total Damage Taken</td>
          <td class="stat-value"><input class="stat-input stat-input-wide" type="number" value="${hc.totalDamageTaken || 0}"
            onchange="onNpcNested(this, ${idx}, 'heroCareer', 'totalDamageTaken')"></td></tr>
        <tr><td class="stat-label">Kill Count</td>
          <td class="stat-value"><input class="stat-input" type="number" value="${hc.killCount || 0}"
            onchange="onNpcNested(this, ${idx}, 'heroCareer', 'killCount')"></td></tr>
        <tr><td class="stat-label">Humanoid Kills</td>
          <td class="stat-value"><input class="stat-input" type="number" value="${hc.killHumanoid || 0}"
            onchange="onNpcNested(this, ${idx}, 'heroCareer', 'killHumanoid')"></td></tr>
        <tr><td class="stat-label">Beast Kills</td>
          <td class="stat-value"><input class="stat-input" type="number" value="${hc.killBeasts || 0}"
            onchange="onNpcNested(this, ${idx}, 'heroCareer', 'killBeasts')"></td></tr>
        <tr><td class="stat-label">Fall Count</td>
          <td class="stat-value"><input class="stat-input" type="number" value="${hc.fallCount || 0}"
            onchange="onNpcNested(this, ${idx}, 'heroCareer', 'fallCount')"></td></tr>
      </table>
    </div>
  `;
}

// =====================================================================
// EVENT HANDLERS
// =====================================================================
function selectChar(id) {
  selectedCharId = id;
  renderPartyTabs();
  renderNpcList();
  renderCharEditor();
}

function addToParty(npcId) {
  if (!saveData.party || !saveData.party.membersID) return;
  if (saveData.party.membersID.includes(npcId)) return;
  saveData.party.membersID.push(npcId);
  changeCount++;
  trackedOriginals[`party.add.${npcId}`] = null;
  updateChangesBar();
  renderAll();
}

function removeFromParty(npcId) {
  if (!saveData.party || !saveData.party.membersID) return;
  const idx = saveData.party.membersID.indexOf(npcId);
  if (idx === -1) return;
  saveData.party.membersID.splice(idx, 1);
  changeCount++;
  trackedOriginals[`party.remove.${npcId}.${Date.now()}`] = npcId;
  updateChangesBar();
  renderAll();
}

function onGameField(input, key) {
  const old = saveData[key];
  const val = Number(input.value);
  saveData[key] = val;
  trackChange('game.' + key, old, val);
  markInput(input, old, val);
}

function onGameTimeField(input, key) {
  if (!saveData.gameTime) return;
  const old = saveData.gameTime[key];
  const val = Number(input.value);
  saveData.gameTime[key] = val;
  trackChange('gameTime.' + key, old, val);
  markInput(input, old, val);
}

function onNpcNum(input, npcIdx, key) {
  const npc = saveData.npcs[npcIdx];
  const old = npc[key];
  const val = clampInt32(Number(input.value));
  input.value = val;
  npc[key] = val;
  const path = `npc.${npc.id}.${key}`;
  trackChange(path, old, val);
  markInput(input, old, val);
}

function onNpcStr(input, npcIdx, key) {
  const npc = saveData.npcs[npcIdx];
  const old = npc[key];
  const val = input.value;
  npc[key] = val;
  const path = `npc.${npc.id}.${key}`;
  trackChange(path, old, val);
  markInput(input, old, val);
  if (key === 'unitname') {
    renderPartyTabs();
    renderNpcList();
  }
}

function onNpcNested(input, npcIdx, parent, key) {
  const npc = saveData.npcs[npcIdx];
  if (!npc[parent]) return;
  const old = npc[parent][key];
  const val = clampInt32(Number(input.value));
  input.value = val;
  npc[parent][key] = val;
  const path = `npc.${npc.id}.${parent}.${key}`;
  trackChange(path, old, val);
  markInput(input, old, val);
}

function onAttrLevel(input, npcIdx, curKey, bsKey) {
  const npc = saveData.npcs[npcIdx];
  const val = Math.max(0, Math.round(Number(input.value)));
  input.value = val;
  // Set both Current (npc.strength) and Base (humanAttribute.BSstrength)
  // Game overflows above 99 when equipment bonuses push total past 99
  const oldCur = npc[curKey];
  npc[curKey] = val;
  trackChange(`npc.${npc.id}.${curKey}`, oldCur, val);
  if (npc.humanAttribute) {
    const oldBs = npc.humanAttribute[bsKey];
    npc.humanAttribute[bsKey] = val;
    trackChange(`npc.${npc.id}.humanAttribute.${bsKey}`, oldBs, val);
  }
  markInput(input, oldCur, val);
}

function onSkillLevel(input, npcIdx, curKey, bsKey) {
  const npc = saveData.npcs[npcIdx];
  const val = Math.max(0, Math.round(Number(input.value)));
  input.value = val;
  // Set both Current (npc.skill) and Base (humanTalent.BSSkill)
  const oldCur = npc[curKey];
  npc[curKey] = val;
  trackChange(`npc.${npc.id}.${curKey}`, oldCur, val);
  if (npc.humanTalent) {
    const oldBs = npc.humanTalent[bsKey];
    npc.humanTalent[bsKey] = val;
    trackChange(`npc.${npc.id}.humanTalent.${bsKey}`, oldBs, val);
  }
  markInput(input, oldCur, val);
}

function onNpcAttExp(input, npcIdx, attrIndex) {
  const npc = saveData.npcs[npcIdx];
  if (!npc.humanAttribute || !npc.humanAttribute.attEXP) return;
  const old = npc.humanAttribute.attEXP[attrIndex];
  const val = Number(input.value);
  npc.humanAttribute.attEXP[attrIndex] = val;
  const path = `npc.${npc.id}.attEXP.${attrIndex}`;
  trackChange(path, old, val);
  markInput(input, old, val);
}

function onNpcSkillExp(input, npcIdx, skillIndex) {
  const npc = saveData.npcs[npcIdx];
  if (!npc.humanTalent || !npc.humanTalent.skillEXP) return;
  const old = npc.humanTalent.skillEXP[skillIndex];
  const val = Number(input.value);
  npc.humanTalent.skillEXP[skillIndex] = val;
  const path = `npc.${npc.id}.skillEXP.${skillIndex}`;
  trackChange(path, old, val);
  markInput(input, old, val);
}

function onNpcArr(input, npcIdx, arrKey, arrIndex) {
  const npc = saveData.npcs[npcIdx];
  if (!npc[arrKey]) npc[arrKey] = [];
  while (npc[arrKey].length <= arrIndex) npc[arrKey].push(0);
  const old = npc[arrKey][arrIndex];
  const val = Number(input.value);
  npc[arrKey][arrIndex] = val;
  const path = `npc.${npc.id}.${arrKey}.${arrIndex}`;
  trackChange(path, old, val);
  markInput(input, old, val);
}

function onSpellField(npcIdx, spellIdx, key, value) {
  const npc = saveData.npcs[npcIdx];
  const old = npc.spells[spellIdx][key];
  npc.spells[spellIdx][key] = value;
  const path = `npc.${npc.id}.spells.${spellIdx}.${key}`;
  trackChange(path, old, value);
  renderCharEditor();
}

function onTalentField(npcIdx, talentIdx, key, value) {
  const npc = saveData.npcs[npcIdx];
  const old = npc.talents[talentIdx][key];
  npc.talents[talentIdx][key] = value;
  const path = `npc.${npc.id}.talents.${talentIdx}.${key}`;
  trackChange(path, old, value);
  renderCharEditor();
}

function addSpell(npcIdx) {
  const npc = saveData.npcs[npcIdx];
  const input = document.getElementById('add-spell-id-' + npcIdx);
  const id = Number(input.value);
  if (isNaN(id) || id < 0) return;
  if (!npc.spells) npc.spells = [];
  npc.spells.push({ id: id, lv: 1, cd: 0, isActivated: false });
  changeCount++;
  trackedOriginals[`npc.${npc.id}.spells.add.${id}`] = null;
  updateChangesBar();
  renderCharEditor();
}

function addTalent(npcIdx) {
  const npc = saveData.npcs[npcIdx];
  const input = document.getElementById('add-talent-id-' + npcIdx);
  const id = Number(input.value);
  if (isNaN(id) || id < 0) return;
  if (!npc.talents) npc.talents = [];
  npc.talents.push({ id: id, lv: 1, cd: 0 });
  changeCount++;
  trackedOriginals[`npc.${npc.id}.talents.add.${id}`] = null;
  updateChangesBar();
  renderCharEditor();
}

function addTrait(npcIdx) {
  const npc = saveData.npcs[npcIdx];
  const input = document.getElementById('add-trait-id-' + npcIdx);
  const id = Number(input.value);
  if (isNaN(id) || id < 0) return;
  if (!npc.traits) npc.traits = [];
  npc.traits.push(id);
  changeCount++;
  trackedOriginals[`npc.${npc.id}.traits.add.${id}`] = null;
  updateChangesBar();
  renderCharEditor();
}

function addTraitFromSearch(npcIdx, inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const id = Number(input.dataset.selectedId);
  if (isNaN(id) || id < 0) return;
  const npc = saveData.npcs[npcIdx];
  if (!npc.traits) npc.traits = [];
  npc.traits.push(id);
  changeCount++;
  trackedOriginals[`npc.${npc.id}.traits.add.${id}`] = null;
  updateChangesBar();
  renderCharEditor();
}

function addItemFromSearch(npcIdx, inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const id = Number(input.dataset.selectedId);
  const qtyInput = document.getElementById('add-item-qty-' + npcIdx);
  const qty = qtyInput ? (Number(qtyInput.value) || 1) : 1;
  if (isNaN(id) || id < 0) return;
  const npc = saveData.npcs[npcIdx];
  if (!npc.items) npc.items = [];
  const usedSlots = new Set(npc.items.map(i => i.slotIndex));
  let slot = 0;
  while (usedSlots.has(slot)) slot++;
  npc.items.push({
    id: id,
    slotIndex: slot,
    subSlotIndex: 0,
    stackNum: qty,
    isNew: true,
    isStolen: 0,
    durability: 100,
    quality: 1,
    addAttrs: []
  });
  changeCount++;
  trackedOriginals[`npc.${npc.id}.items.add.${id}.${Date.now()}`] = null;
  updateChangesBar();
  renderCharEditor();
}

function onItemField(npcIdx, itemIdx, key, value) {
  const npc = saveData.npcs[npcIdx];
  const old = npc.items[itemIdx][key];
  npc.items[itemIdx][key] = value;
  const path = `npc.${npc.id}.items.${itemIdx}.${key}`;
  trackChange(path, old, value);
}

function addItem(npcIdx) {
  const npc = saveData.npcs[npcIdx];
  const idInput = document.getElementById('add-item-id-' + npcIdx);
  const qtyInput = document.getElementById('add-item-qty-' + npcIdx);
  const id = Number(idInput.value);
  const qty = Number(qtyInput.value) || 1;
  if (isNaN(id) || id < 0) return;
  if (!npc.items) npc.items = [];
  // Find next available slotIndex
  const usedSlots = new Set(npc.items.map(i => i.slotIndex));
  let slot = 0;
  while (usedSlots.has(slot)) slot++;
  npc.items.push({
    id: id,
    slotIndex: slot,
    subSlotIndex: 0,
    stackNum: qty,
    isNew: true,
    isStolen: 0,
    durability: 100,
    quality: 1,
    addAttrs: []
  });
  changeCount++;
  trackedOriginals[`npc.${npc.id}.items.add.${id}.${Date.now()}`] = null;
  updateChangesBar();
  renderCharEditor();
}

function removeListItem(npcIdx, arrKey, itemIdx) {
  const npc = saveData.npcs[npcIdx];
  if (!npc[arrKey]) return;
  const removed = npc[arrKey][itemIdx];
  npc[arrKey].splice(itemIdx, 1);
  changeCount++;
  const removedId = typeof removed === 'object' ? removed.id : removed;
  trackedOriginals[`npc.${npc.id}.${arrKey}.remove.${removedId}.${Date.now()}`] = removed;
  updateChangesBar();
  renderCharEditor();
}

function markInput(input, oldVal, newVal) {
  if (oldVal !== newVal) {
    input.classList.add('changed');
  } else {
    input.classList.remove('changed');
  }
}

// =====================================================================
// SAVE LOCATION
// =====================================================================
function copySavePath() {
  const path = '%USERPROFILE%\\AppData\\LocalLow\\PersonaeGames\\Age of Reforging The Freelands\\Save';
  navigator.clipboard.writeText(path).then(() => {
    const btn = document.getElementById('copy-path-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy Path'; }, 2000);
  }).catch(() => {});
}

// =====================================================================
// DISCLAIMER
// =====================================================================
function acceptDisclaimer() {
  try { sessionStorage.setItem('aor-disclaimer-accepted', '1'); } catch(e) {}
  document.getElementById('disclaimer-modal').classList.add('hidden');
  document.getElementById('upload-screen').style.display = '';
}

// =====================================================================
// INIT
// =====================================================================
(function init() {
  // Load data dictionaries (non-blocking)
  fetch('data/items.json').then(r => r.json()).then(d => { ITEM_DB = d; }).catch(() => {});
  fetch('data/traits.json').then(r => r.json()).then(d => { TRAIT_DB = d; }).catch(() => {});
  fetch('data/addon_attributes.json').then(r => r.json()).then(d => { ADDON_ATTR_DB = d; }).catch(() => {});

  // Check if disclaimer was already accepted this session
  try {
    if (sessionStorage.getItem('aor-disclaimer-accepted') === '1') {
      document.getElementById('disclaimer-modal').classList.add('hidden');
      document.getElementById('upload-screen').style.display = '';
    }
  } catch(e) {}

  // File input
  const fileInput = document.getElementById('file-input');
  fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

  // Drag and drop
  const dropZone = document.getElementById('drop-zone');
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  // NPC search
  const npcSearch = document.getElementById('npc-search');
  npcSearch.addEventListener('input', () => renderNpcList());
})();
