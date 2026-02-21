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
  { key: 'precision',    bs: 'BSprecision',    label: 'Precision' },
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

const WEAPON_TYPES = ['Unarmed', 'One-Handed', 'Two-Handed', 'Polearm', 'Blunt', 'Ranged', 'Short Blade', 'Staff'];

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
      <td>Base</td>
      <td>Current</td>
      <td>Exp</td>
    </tr>
  `;

  ATTRIBUTES.forEach((attr, i) => {
    const bsVal = npc.humanAttribute ? npc.humanAttribute[attr.bs] : 0;
    const curVal = npc[attr.key];
    const expVal = npc.humanAttribute && npc.humanAttribute.attEXP ? npc.humanAttribute.attEXP[i] : 0;

    rows += `
      <tr>
        <td class="stat-label">${attr.label}</td>
        <td class="stat-value">
          <input class="stat-input" type="number" value="${bsVal}"
            onchange="onNpcNested(this, ${idx}, 'humanAttribute', '${attr.bs}')">
        </td>
        <td class="stat-value">
          <input class="stat-input" type="number" value="${curVal}"
            onchange="onNpcNum(this, ${idx}, '${attr.key}')">
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
      <td>Base</td>
      <td>Current</td>
      <td>Exp</td>
    </tr>
  `;

  SKILLS.forEach((sk, i) => {
    const bsVal = npc.humanTalent ? npc.humanTalent[sk.bs] : 0;
    const curVal = npc[sk.key];
    const expVal = npc.humanTalent && npc.humanTalent.skillEXP ? npc.humanTalent.skillEXP[i] : 0;

    rows += `
      <tr>
        <td class="stat-label">${sk.label}</td>
        <td class="stat-value">
          <input class="stat-input" type="number" value="${bsVal}"
            onchange="onNpcNested(this, ${idx}, 'humanTalent', '${sk.bs}')">
        </td>
        <td class="stat-value">
          <input class="stat-input" type="number" value="${curVal}"
            onchange="onNpcNum(this, ${idx}, '${sk.key}')">
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
  const mastery = npc.weaponMastery || [0,0,0,0,0,0,0,0];
  const masteryExp = npc.weaponMasteryEXP || [0,0,0,0,0,0,0,0];
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
        const attrLabel = addonAttrName(a.id) || ('Attr #' + a.id);
        return `<span class="item-attr-chip" title="ID: ${a.id}">${escHtml(attrLabel)}: ${a.value}</span>`;
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
            <span class="inv-field-value">${dur}</span>
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
    durability: -1,
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
  const val = Number(input.value);
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
  const val = Number(input.value);
  npc[parent][key] = val;
  const path = `npc.${npc.id}.${parent}.${key}`;
  trackChange(path, old, val);
  markInput(input, old, val);
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
    durability: -1,
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
    durability: -1,
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
