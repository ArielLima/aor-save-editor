"""
AoR Full Item Data Miner
Extracts COMPLETE item definitions from Age of Reforging: The Freelands Unity asset bundles.

For each item, extracts every field: base fields, equipment fields (weapons/armor),
consumable fields, and recipe fields. Cross-references with item-sprites.json for
sprite filenames.

Requirements:
    pip install UnityPy

Usage:
    python mine_items_full.py                     # Auto-detect game install
    python mine_items_full.py --game-dir "D:/..."  # Custom game directory

Outputs:
    data/items-full.json   - Complete item database with all stats
    data/items.json        - Updated with any new items found
"""

import UnityPy
import os
import sys
import json
import argparse
from pathlib import Path


# ---------------------------------------------------------------------------
# Base fields present on ALL items (BaseItemInfo ScriptableObject)
# ---------------------------------------------------------------------------
BASE_FIELDS = [
    "ID", "Name", "isCommonEquipment", "Description", "readContent",
    "itemType", "Quality", "tier", "value", "weight", "durability",
    "dropRate", "isUnique", "noRandomQuality", "stackable", "noDurability",
    "cannotRepair", "intDurability", "throwable", "notForSell", "canSellup",
    "touchAutoPick", "skipPickMessage", "learnSkillSet", "isLearningBook",
    "ignoreMagician", "learnTime", "RequiredLevel", "StartAudioType",
]

# ---------------------------------------------------------------------------
# Equipment fields (shared by weapons, armor, ornaments - EquipmentInfo)
# ---------------------------------------------------------------------------
EQUIPMENT_FIELDS = [
    "EquipType", "forbidSlots", "gender", "race",
    "attributeRquire", "personRquire", "addAttrs", "hitSFX",
]

# ---------------------------------------------------------------------------
# Weapon-specific fields (WeaponInfo)
# ---------------------------------------------------------------------------
WEAPON_FIELDS = [
    "WeaponType", "WeaponType_Secondary", "weaponClass",
    "AnimationType", "AnimationSubType", "swingSFX", "materialSFX",
    "equipSFX", "disableAttack", "damage", "resistPen",
    "strFactor", "agiFactor", "AttackSpeed", "AttackRange", "AttackAngle",
    "BlockRate", "BlockAngle", "Force", "spCost", "areaAttack", "isTorch",
]

# ---------------------------------------------------------------------------
# Armor-specific fields (ArmorInfo / WearingInfo)
# ---------------------------------------------------------------------------
ARMOR_FIELDS = [
    "armourType", "armourClass", "damageDR",
    "UMArecipesName_M", "UMArecipesName_F",
]

# ---------------------------------------------------------------------------
# Consumable-specific fields (ConsumableInfo)
# ---------------------------------------------------------------------------
CONSUMABLE_FIELDS = [
    "consumableType", "canUseup", "destroyAfterUseUp", "isMaterial",
    "pickAutoUse", "vigorRestore", "hungryRestore", "healthRestore",
    "moraleRestore", "alcohol", "expGain", "allowWeaponClass",
    "isBlindBox",
]

# ---------------------------------------------------------------------------
# Recipe-specific fields (CraftRecipeInfo)
# ---------------------------------------------------------------------------
RECIPE_FIELDS = [
    "id", "productNum", "requireLv", "cost",
]

# Internal / reference fields to skip entirely
SKIP_FIELDS = {
    "m_GameObject", "m_Enabled", "m_Script", "m_Name",
    "Icon",           # resolved via item-sprites.json instead
    "learnTrait",     # internal reference
    "spell",          # internal reference
    "PrefabReference",# internal reference
    "set",            # internal reference (set bonus ref)
    "bindTalent",     # internal reference
    "buff",           # internal reference
    "missiletype",    # internal reference
    "product",        # internal reference (recipe product ref)
    "materials",      # internal reference list (recipe materials)
    "goodsList",      # internal reference list (blind box contents)
    "UMArecipes_M",   # internal reference list
    "UMArecipes_F",   # internal reference list
}

# All known fields combined (for sanity checking)
ALL_KNOWN_FIELDS = set(BASE_FIELDS) | set(EQUIPMENT_FIELDS) | set(WEAPON_FIELDS) | \
                   set(ARMOR_FIELDS) | set(CONSUMABLE_FIELDS) | set(RECIPE_FIELDS) | SKIP_FIELDS


def find_game_dir():
    """Auto-detect the game's data directory."""
    candidates = []
    for base in [
        os.environ.get("ProgramFiles(x86)", ""),
        os.environ.get("ProgramFiles", ""),
        "D:", "E:",
    ]:
        candidates.append(os.path.join(
            base, "Steam", "steamapps", "common",
            "Age of Reforging The Freelands",
            "Age of Reforging The Freelands_Data",
        ))
    steam_root = os.path.join(
        os.environ.get("ProgramFiles(x86)", ""), "Steam", "steamapps"
    )
    libraryfolders = os.path.join(steam_root, "libraryfolders.vdf")
    if os.path.exists(libraryfolders):
        try:
            with open(libraryfolders, "r") as f:
                for line in f:
                    line = line.strip().strip('"')
                    if os.path.isdir(line):
                        candidates.append(os.path.join(
                            line, "steamapps", "common",
                            "Age of Reforging The Freelands",
                            "Age of Reforging The Freelands_Data",
                        ))
        except Exception:
            pass
    for c in candidates:
        if os.path.isdir(c):
            return c
    return None


def extract_category(path):
    """Extract item category from asset path.

    e.g. "Assets/Data/Databases/items/Equipments/Weapons/..." -> "Weapons"
         "Assets/Data/Databases/items/Consumables/Foods/..." -> "Foods"
         "Assets/Data/Databases/items/Materials/..." -> "Materials"
    """
    prefix = "Assets/Data/Databases/items/"
    rest = path[len(prefix):]
    parts = rest.split("/")

    # For Equipments, use the second-level dir (Weapons, Wearing, Ornaments, Shield)
    if parts[0] == "Equipments" and len(parts) > 1:
        return parts[1]
    # For Craftrecipes, label as "Craftrecipes"
    if parts[0] == "Craftrecipes":
        return "Craftrecipes"
    # For Consumables, use second-level if available (Foods, Books, Potions, etc.)
    if parts[0] == "Consumables" and len(parts) > 1:
        sub = parts[1]
        # If the sub is a file (has .asset), use parent
        if ".asset" in sub:
            return "Consumables"
        return sub
    # Otherwise use top-level
    return parts[0]


def clean_value(v):
    """Clean a value for JSON output - handle Unity references, nested dicts, etc."""
    if isinstance(v, dict):
        # Unity object reference - skip if it's just {m_FileID, m_PathID}
        if set(v.keys()) == {"m_FileID", "m_PathID"}:
            return None
        # Nested dict with data - keep it
        return {k: clean_value(val) for k, val in v.items() if clean_value(val) is not None}
    if isinstance(v, list):
        cleaned = []
        for item in v:
            cv = clean_value(item)
            if cv is not None:
                cleaned.append(cv)
        return cleaned
    return v


def process_item(tree, path, sprite_map):
    """Process a single item tree into a clean dict."""
    item_id = tree.get("ID")
    if item_id is None:
        return None, None

    result = {}

    # Name - use m_Name as the "name" field (the English name)
    result["name"] = tree.get("m_Name", "")

    # Localization key
    name_key = tree.get("Name", "")
    if name_key:
        result["nameKey"] = name_key

    # Description key
    desc = tree.get("Description", "")
    if desc:
        result["description"] = desc

    # Read content key (for readable items, effect text for equipment)
    read_content = tree.get("readContent", "")
    if read_content:
        result["readContent"] = read_content

    # Sprite from item-sprites.json
    sid = str(item_id)
    if sid in sprite_map:
        result["sprite"] = sprite_map[sid]

    # Category from path
    result["category"] = extract_category(path)

    # Base fields
    for field in BASE_FIELDS:
        if field in ("ID", "Name", "Description", "readContent"):
            continue  # Already handled above
        if field in tree:
            val = tree[field]
            # Convert booleans stored as int
            if field in ("isCommonEquipment", "isUnique", "noRandomQuality", "stackable",
                         "noDurability", "cannotRepair", "intDurability", "throwable",
                         "notForSell", "canSellup", "touchAutoPick", "skipPickMessage",
                         "isLearningBook", "ignoreMagician"):
                result[field] = bool(val)
            else:
                result[field] = val

    # Equipment fields
    has_equip = "EquipType" in tree
    if has_equip:
        for field in EQUIPMENT_FIELDS:
            if field in tree:
                val = tree[field]
                if field == "addAttrs":
                    # List of {type, value, levelAlter} dicts - keep as-is
                    result[field] = val
                elif field == "attributeRquire":
                    # Nested dict with stat requirements
                    result[field] = val
                elif field == "forbidSlots":
                    result[field] = val
                else:
                    result[field] = val

    # Weapon fields
    has_weapon = "WeaponType" in tree
    if has_weapon:
        for field in WEAPON_FIELDS:
            if field in tree:
                val = tree[field]
                if field == "damage":
                    # damage dict contains a 'damage' list of {damageType, minDamage, maxDamage}
                    result[field] = val
                elif field == "resistPen":
                    result[field] = val
                elif field in ("disableAttack", "areaAttack", "isTorch"):
                    result[field] = bool(val)
                else:
                    result[field] = val

    # Armor fields
    has_armor = "armourType" in tree
    if has_armor:
        for field in ARMOR_FIELDS:
            if field in tree:
                result[field] = tree[field]

    # Consumable fields
    has_consumable = "consumableType" in tree
    if has_consumable:
        for field in CONSUMABLE_FIELDS:
            if field in tree:
                val = tree[field]
                if field in ("canUseup", "destroyAfterUseUp", "isMaterial",
                             "pickAutoUse", "isBlindBox"):
                    result[field] = bool(val)
                else:
                    result[field] = val

    # Recipe fields
    has_recipe = "id" in tree and "materials" in tree
    if has_recipe:
        for field in RECIPE_FIELDS:
            if field in tree:
                result[field] = tree[field]

    # Check for any unknown fields we might have missed
    for k in tree:
        if k not in ALL_KNOWN_FIELDS:
            val = clean_value(tree[k])
            if val is not None:
                result[k] = val

    return str(item_id), result


def mine_items_full(game_dir, sprite_map):
    """Extract all item definitions with full stats from asset bundles."""
    bundle_dir = os.path.join(game_dir, "StreamingAssets", "aa", "StandaloneWindows64")
    if not os.path.isdir(bundle_dir):
        print(f"Error: Bundle directory not found: {bundle_dir}", file=sys.stderr)
        sys.exit(1)

    bundles = [f for f in os.listdir(bundle_dir) if f.endswith(".bundle")]
    print(f"Scanning {len(bundles)} asset bundles...", file=sys.stderr)

    items = {}
    scanned = 0
    unknown_fields = set()

    for bf in bundles:
        fp = os.path.join(bundle_dir, bf)

        # Skip very large bundles (> 100MB)
        if os.path.getsize(fp) > 100 * 1024 * 1024:
            continue

        try:
            env = UnityPy.load(fp)
        except Exception:
            continue

        for path, obj in env.container.items():
            if not path.startswith("Assets/Data/Databases/items/"):
                continue
            if path.endswith(".prefab"):
                continue
            if obj.type.name != "MonoBehaviour":
                continue

            try:
                tree = obj.read_typetree()
                if not isinstance(tree, dict):
                    continue

                item_id, item_data = process_item(tree, path, sprite_map)
                if item_id is not None and item_data:
                    items[item_id] = item_data

                    # Track any unknown fields
                    for k in tree:
                        if k not in ALL_KNOWN_FIELDS:
                            unknown_fields.add(k)

            except Exception as e:
                continue

        scanned += 1
        if scanned % 2000 == 0:
            print(
                f"  ...scanned {scanned}/{len(bundles)} bundles ({len(items)} items found)",
                file=sys.stderr,
            )

    if unknown_fields:
        print(f"WARNING: Unknown fields found: {unknown_fields}", file=sys.stderr)

    print(
        f"Done. Extracted {len(items)} items from {scanned} bundles.", file=sys.stderr
    )
    return items


def main():
    parser = argparse.ArgumentParser(
        description="Extract full item data from Age of Reforging: The Freelands"
    )
    parser.add_argument(
        "--game-dir", help="Path to the game's _Data directory", default=None
    )
    args = parser.parse_args()

    game_dir = args.game_dir or find_game_dir()
    if not game_dir:
        print(
            "Error: Could not find game installation. Use --game-dir to specify the path.",
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"Game directory: {game_dir}", file=sys.stderr)

    # Resolve paths relative to the project root
    script_dir = Path(__file__).resolve().parent
    project_dir = script_dir.parent
    data_dir = project_dir / "data"

    # Load sprite map
    sprite_file = data_dir / "item-sprites.json"
    sprite_map = {}
    if sprite_file.exists():
        with open(sprite_file, "r", encoding="utf-8") as f:
            sprite_map = json.load(f)
        print(f"Loaded {len(sprite_map)} sprite mappings", file=sys.stderr)
    else:
        print(f"WARNING: {sprite_file} not found, sprites will be missing", file=sys.stderr)

    # Mine items
    items = mine_items_full(game_dir, sprite_map)

    # Sort by numeric ID
    sorted_items = dict(
        sorted(items.items(), key=lambda x: int(x[0]) if x[0].lstrip('-').isdigit() else 99999)
    )

    # Write items-full.json
    full_output = data_dir / "items-full.json"
    with open(full_output, "w", encoding="utf-8") as f:
        json.dump(sorted_items, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"Written {len(sorted_items)} items to {full_output}", file=sys.stderr)

    # Update items.json with any missing items
    items_file = data_dir / "items.json"
    existing_items = {}
    if items_file.exists():
        with open(items_file, "r", encoding="utf-8") as f:
            existing_items = json.load(f)

    added = 0
    for item_id, item_data in sorted_items.items():
        if item_id not in existing_items:
            existing_items[item_id] = {
                "en": item_data.get("name", ""),
                "ja": "",
            }
            added += 1

    if added > 0:
        sorted_existing = dict(
            sorted(existing_items.items(),
                   key=lambda x: int(x[0]) if x[0].lstrip('-').isdigit() else 99999)
        )
        with open(items_file, "w", encoding="utf-8") as f:
            json.dump(sorted_existing, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"Added {added} new items to {items_file}", file=sys.stderr)
    else:
        print(f"No new items to add to {items_file}", file=sys.stderr)

    # Print some stats
    categories = {}
    for item in sorted_items.values():
        cat = item.get("category", "Unknown")
        categories[cat] = categories.get(cat, 0) + 1
    print(f"\nItem categories:", file=sys.stderr)
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}", file=sys.stderr)

    weapons = sum(1 for i in sorted_items.values() if "WeaponType" in i)
    armors = sum(1 for i in sorted_items.values() if "armourType" in i)
    consumables = sum(1 for i in sorted_items.values() if "consumableType" in i)
    recipes = sum(1 for i in sorted_items.values() if "id" in i and "cost" in i)
    print(f"\nWeapons: {weapons}, Armors: {armors}, Consumables: {consumables}, Recipes: {recipes}",
          file=sys.stderr)


if __name__ == "__main__":
    main()
