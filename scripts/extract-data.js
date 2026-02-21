#!/usr/bin/env node
//
// extract-data.js
// Reads item/trait/addon_attribute JSON files from KKAoRMod and outputs
// them in the format expected by the AoR Save Editor website.
//
// Usage:
//   node scripts/extract-data.js <path-to-KKAoRMod-KKCharaEditor-dir>
//
// Example:
//   node scripts/extract-data.js ../KKAoRMod/KKCharaEditor
//
// The script copies the three JSON data files into the website's data/ folder.
// Source: https://github.com/krois0s/KKAoRMod (MIT License)

const fs = require('fs');
const path = require('path');

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error('Usage: node scripts/extract-data.js <path-to-KKCharaEditor-dir>');
  console.error('Example: node scripts/extract-data.js ../KKAoRMod/KKCharaEditor');
  process.exit(1);
}

const destDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = ['items.json', 'traits.json', 'addon_attributes.json'];
let success = 0;

files.forEach(file => {
  const src = path.join(sourceDir, file);
  const dest = path.join(destDir, file);

  if (!fs.existsSync(src)) {
    console.warn(`  SKIP: ${file} not found at ${src}`);
    return;
  }

  // Validate JSON
  try {
    const raw = fs.readFileSync(src, 'utf8');
    const data = JSON.parse(raw);
    const count = Object.keys(data).length;

    // Write minified to save bandwidth
    fs.writeFileSync(dest, JSON.stringify(data));
    console.log(`  OK: ${file} -> ${count} entries`);
    success++;
  } catch (err) {
    console.error(`  ERR: ${file} - ${err.message}`);
  }
});

console.log(`\nDone: ${success}/${files.length} files copied to data/`);
console.log('Source: https://github.com/krois0s/KKAoRMod (MIT License)');
