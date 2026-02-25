"""
AoR Item Data Miner
Extracts item definitions from Age of Reforging: The Freelands Unity asset bundles.

Requirements:
    pip install UnityPy

Usage:
    python mine_items.py                     # Auto-detect game install, output to stdout
    python mine_items.py --out items.json    # Write to file
    python mine_items.py --game-dir "D:/..."  # Custom game directory

The output JSON matches the format used by the save editor's data/items.json:
    { "766": {"en": "Amnesia Potion", "ja": ""}, ... }
"""

import UnityPy
import os
import sys
import json
import argparse
from pathlib import Path


def find_game_dir():
    """Auto-detect the game's data directory."""
    candidates = []

    # Steam default paths
    for base in [
        os.environ.get("ProgramFiles(x86)", ""),
        os.environ.get("ProgramFiles", ""),
        "D:",
        "E:",
    ]:
        candidates.append(
            os.path.join(
                base,
                "Steam",
                "steamapps",
                "common",
                "Age of Reforging The Freelands",
                "Age of Reforging The Freelands_Data",
            )
        )

    # Steam library folders
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
                        candidates.append(
                            os.path.join(
                                line,
                                "steamapps",
                                "common",
                                "Age of Reforging The Freelands",
                                "Age of Reforging The Freelands_Data",
                            )
                        )
        except Exception:
            pass

    for c in candidates:
        if os.path.isdir(c):
            return c

    return None


def mine_items(game_dir):
    """Extract all item definitions from asset bundles."""
    bundle_dir = os.path.join(game_dir, "StreamingAssets", "aa", "StandaloneWindows64")
    if not os.path.isdir(bundle_dir):
        print(f"Error: Bundle directory not found: {bundle_dir}", file=sys.stderr)
        sys.exit(1)

    bundles = [f for f in os.listdir(bundle_dir) if f.endswith(".bundle")]
    print(f"Scanning {len(bundles)} asset bundles...", file=sys.stderr)

    items = {}
    scanned = 0

    for bf in bundles:
        fp = os.path.join(bundle_dir, bf)

        # Skip very large bundles (> 100MB) - item data is in smaller ones
        if os.path.getsize(fp) > 100 * 1024 * 1024:
            continue

        try:
            env = UnityPy.load(fp)
        except Exception:
            continue

        for path, obj in env.container.items():
            # Only process item database assets
            if not path.startswith("Assets/Data/Databases/items/"):
                continue
            # Skip prefabs, only want .asset (ScriptableObject) data
            if path.endswith(".prefab"):
                continue
            if obj.type.name != "MonoBehaviour":
                continue

            try:
                tree = obj.read_typetree()
                if not isinstance(tree, dict):
                    continue

                item_id = tree.get("ID")
                item_name = tree.get("m_Name")

                if item_id is not None and item_name:
                    items[str(item_id)] = {"en": item_name, "ja": ""}
            except Exception:
                # Some assets may not have type trees, skip them
                continue

        scanned += 1
        if scanned % 2000 == 0:
            print(
                f"  ...scanned {scanned}/{len(bundles)} bundles ({len(items)} items found)",
                file=sys.stderr,
            )

    print(
        f"Done. Extracted {len(items)} items from {scanned} bundles.", file=sys.stderr
    )
    return items


def main():
    parser = argparse.ArgumentParser(
        description="Extract item data from Age of Reforging: The Freelands"
    )
    parser.add_argument(
        "--game-dir", help="Path to the game's _Data directory", default=None
    )
    parser.add_argument(
        "--out", help="Output file path (default: stdout)", default=None
    )
    args = parser.parse_args()

    game_dir = args.game_dir or find_game_dir()
    if not game_dir:
        print(
            "Error: Could not find game installation. Use --game-dir to specify the path.",
            file=sys.stderr,
        )
        print(
            '  Example: python mine_items.py --game-dir "C:/Program Files (x86)/Steam/steamapps/common/Age of Reforging The Freelands/Age of Reforging The Freelands_Data"',
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"Game directory: {game_dir}", file=sys.stderr)
    items = mine_items(game_dir)

    # Sort by numeric ID
    sorted_items = dict(
        sorted(items.items(), key=lambda x: int(x[0]) if x[0].isdigit() else 99999)
    )

    output = json.dumps(sorted_items, indent=2, ensure_ascii=False)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(output + "\n")
        print(f"Written to {args.out}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
