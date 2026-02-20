// =====================================================================
// STATE
// =====================================================================
let saveData = null;
let originalJson = '';
let selectedCharId = null;
let changeCount = 0;
let trackedOriginals = {};

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

const WEAPON_TYPES = ['One-Handed', 'Two-Handed', 'Polearm', 'Blunt', 'Ranged', 'Short Blade', 'Staff'];

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

function downloadSave() {
  const json = JSON.stringify(saveData);
  const blob = new Blob([json], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'MODIFIED_sav.dat';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadBackup() {
  const blob = new Blob([originalJson], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sav_backup.dat';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

  let html = `
    <div class="char-header">
      <div class="char-name">${escHtml(npc.unitname)}</div>
      <div class="char-meta">
        <span>ID: ${npc.id}</span>
        <span>${genderName(npc.gender)}</span>
        <span>${raceName(npc.race)}</span>
        <span>${careerName(npc.career)}</span>
        ${isParty ? '<span style="color:var(--accent-gold);">&#9733; Party Member</span>' : ''}
      </div>
    </div>
    <div class="stat-grid">
      ${renderIdentityCard(npc, idx)}
      ${renderAttributesCard(npc, idx)}
      ${renderStatusCard(npc, idx)}
      ${renderResourcesCard(npc, idx)}
      ${renderSkillsCard(npc, idx)}
      ${renderWeaponMasteryCard(npc, idx)}
      ${renderAlignmentCard(npc, idx)}
      ${renderCombatStatsCard(npc, idx)}
    </div>
  `;

  document.getElementById('char-editor').innerHTML = html;
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
  const mastery = npc.weaponMastery || [0,0,0,0,0,0,0];
  const masteryExp = npc.weaponMasteryEXP || [0,0,0,0,0,0,0];
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
  if (!npc[arrKey]) return;
  const old = npc[arrKey][arrIndex];
  const val = Number(input.value);
  npc[arrKey][arrIndex] = val;
  const path = `npc.${npc.id}.${arrKey}.${arrIndex}`;
  trackChange(path, old, val);
  markInput(input, old, val);
}

function markInput(input, oldVal, newVal) {
  if (oldVal !== newVal) {
    input.classList.add('changed');
  } else {
    input.classList.remove('changed');
  }
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
