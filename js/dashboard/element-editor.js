// js/dashboard/element-editor.js
import { renderStickyBarFields, getStickyBarData } from './editors/sticky-bar-editor.js';
import { renderFabFields, getFabData }             from './editors/fab-editor.js';
import { renderSlideInFields, getSlideInData }     from './editors/slide-in-editor.js';
import { renderPopupFields, getPopupData }         from './editors/popup-editor.js';
import { renderLeadFormFields, getLeadFormData }   from './editors/lead-form-editor.js';
import { renderCookieConsentFields, getCookieConsentData } from './editors/cookie-consent-editor.js';
import { renderPreview }  from './live-preview.js';
import { showToast }      from './dashboard-main.js';

let currentElement = null;
let currentType = 'sticky_bar';
let cachedSites = null;

const TYPE_LABELS = {
  sticky_bar: 'Sticky Bar', fab: 'Floating Button', slide_in: 'Slide-in', popup: 'Popup',
  lead_form: 'Lead Form', stats_only: 'Tilastojen kerääjä', cookie_consent: 'Cookie Consent'
};

export function initEditor() {}

async function loadSites() {
  if (cachedSites) return cachedSites;
  try {
    const r = await fetch('/api/sites');
    if (r.ok) cachedSites = await r.json();
    else cachedSites = [];
  } catch { cachedSites = []; }
  window.addEventListener('sites-updated', () => { cachedSites = null; });
  return cachedSites;
}

export async function openEditor(data = {}) {
  currentElement = data._id ? data : null;
  currentType = data.elementType || data.type || 'sticky_bar';

  const panel = document.getElementById('editor-panel');
  if (!panel) return;
  panel.classList.add('open');

  const sites = await loadSites();
  panel.innerHTML = buildEditorHTML(currentType, data, sites);

  const siteSelect = document.getElementById('el-site');
  if (siteSelect && data.siteId) siteSelect.value = String(data.siteId);

  const fieldsContainer = document.getElementById('type-fields');
  renderTypeFields(fieldsContainer, currentType, data);

  initTargetingEditor(data);

  if (currentType !== 'stats_only') updatePreview();

  panel.querySelectorAll('#editor-cancel').forEach(btn => btn.addEventListener('click', closeEditor));
  panel.querySelector('#editor-save')?.addEventListener('click', saveElement);
  panel.addEventListener('change', () => setTimeout(updatePreview, 50));
  panel.addEventListener('input',  () => setTimeout(updatePreview, 200));

  // Ajastus: radiobuttonit
  panel.querySelectorAll('input[name="timing-mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const delayOptions = panel.querySelector('#delay-options');
      if (delayOptions) delayOptions.style.display = radio.value === 'delay' ? 'block' : 'none';
    });
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildEditorHTML(type, data = {}, sites = []) {
  const isNew = !data._id;
  const title = isNew ? 'Uusi ' + (TYPE_LABELS[type] || type) : 'Muokkaa: ' + (data.name || '');
  const timing = data.timing || {};
  const delay = timing.delay || 0;
  const frequency = timing.frequency || 'always';

  // Tunnista ajastustila tallennettua dataa varten
  let timingMode = 'immediate';
  if (delay > 0) timingMode = 'delay';

  const siteOptions = sites.map(s =>
    `<option value="${s._id}">${escHtml(s.name)}${s.domain ? ' (' + escHtml(s.domain) + ')' : ''}</option>`
  ).join('');
  const siteSelectHTML = `
    <div class="form-group">
      <label>Sivusto <span style="font-size:11px;color:#94a3b8;font-weight:400">(vapaaehtoinen)</span></label>
      <select id="el-site">
        <option value="">– Ei sivustoa (globaali) –</option>
        ${siteOptions}
      </select>
    </div>`;

  const timingHTML = type !== 'stats_only' && type !== 'slide_in' ? `
    <div class="section-title" style="margin-top:20px">Milloin näytetään?</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
      <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:2px solid ${timingMode==='immediate'?'#3b82f6':'#e2e8f0'};border-radius:9px;cursor:pointer;background:${timingMode==='immediate'?'#eff6ff':'#fff'}">
        <input type="radio" name="timing-mode" value="immediate" ${timingMode==='immediate'?'checked':''} style="accent-color:#3b82f6">
        <div>
          <div style="font-weight:600;font-size:13px;color:#0f172a">Heti</div>
          <div style="font-size:11px;color:#64748b">Näkyy heti kun sivu latautuu</div>
        </div>
      </label>
      <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:2px solid ${timingMode==='delay'?'#3b82f6':'#e2e8f0'};border-radius:9px;cursor:pointer;background:${timingMode==='delay'?'#eff6ff':'#fff'}">
        <input type="radio" name="timing-mode" value="delay" ${timingMode==='delay'?'checked':''} style="accent-color:#3b82f6">
        <div>
          <div style="font-weight:600;font-size:13px;color:#0f172a">Viiveen jälkeen</div>
          <div style="font-size:11px;color:#64748b">Näkyy muutaman sekunnin kuluttua</div>
        </div>
      </label>
    </div>
    <div id="delay-options" style="display:${timingMode==='delay'?'block':'none'};margin-bottom:16px">
      <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Viive sekunteina</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${[3,5,10,15,30].map(s => `<button type="button" class="delay-btn${delay===s?' active':''}" data-delay="${s}"
          style="padding:7px 14px;border:2px solid ${delay===s?'#3b82f6':'#e2e8f0'};border-radius:8px;background:${delay===s?'#eff6ff':'#fff'};font-size:13px;font-weight:600;color:${delay===s?'#1d4ed8':'#374151'};cursor:pointer">
          ${s}s
        </button>`).join('')}
      </div>
      <input type="hidden" id="el-delay" value="${delay > 0 ? delay : 5}">
    </div>
    <div class="form-group">
      <label>Kuinka usein?</label>
      <div style="display:flex;gap:8px">
        <label style="flex:1;display:flex;align-items:center;gap:8px;padding:9px 12px;border:2px solid ${frequency==='always'?'#3b82f6':'#e2e8f0'};border-radius:8px;cursor:pointer;background:${frequency==='always'?'#eff6ff':'#fff'}">
          <input type="radio" name="el-frequency" value="always" ${frequency==='always'?'checked':''} style="accent-color:#3b82f6">
          <span style="font-size:13px;font-weight:500;color:#0f172a">Joka kerta</span>
        </label>
        <label style="flex:1;display:flex;align-items:center;gap:8px;padding:9px 12px;border:2px solid ${frequency==='once'?'#3b82f6':'#e2e8f0'};border-radius:8px;cursor:pointer;background:${frequency==='once'?'#eff6ff':'#fff'}">
          <input type="radio" name="el-frequency" value="once" ${frequency==='once'?'checked':''} style="accent-color:#3b82f6">
          <span style="font-size:13px;font-weight:500;color:#0f172a">Kerran per istunto</span>
        </label>
      </div>
    </div>
    <div class="form-row" style="margin-top:8px">
      <div class="form-group" style="margin-bottom:0">
        <label>Näytä alkaen <span style="font-size:11px;color:#94a3b8;font-weight:400">(vapaaehtoinen)</span></label>
        <input type="date" id="el-start-date" value="${timing.startDate || ''}">
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label>Näytä saakka <span style="font-size:11px;color:#94a3b8;font-weight:400">(vapaaehtoinen)</span></label>
        <input type="date" id="el-end-date" value="${timing.endDate || ''}">
      </div>
    </div>` : '';

  return `
    <div class="editor-header">
      <h2>${title}</h2>
      <button class="btn btn-secondary btn-sm" id="editor-cancel">
        <i class="fa fa-times"></i> Sulje
      </button>
    </div>
    <div class="editor-body">
      <div class="editor-form">
        <div class="form-group">
          <label>Elementin nimi</label>
          <input type="text" id="el-name" value="${data.name || ''}" placeholder="esim. Etusivun sticky bar">
        </div>

        ${siteSelectHTML}

        <div id="type-fields"></div>

        ${timingHTML}

        <!-- Kohdistus -->
        <div style="margin-top:20px">
          <div class="section-title">Kohdistus</div>
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:10px;user-select:none">
            <input type="checkbox" id="el-targeting-enabled" style="width:16px;height:16px;accent-color:#3b82f6;cursor:pointer">
            <div>
              <div style="font-size:13px;font-weight:600;color:#0f172a">Rajoita kohderyhmä</div>
              <div style="font-size:11px;color:#64748b">Näytetään vain tietyllä sivulla, laitteella tai aikana</div>
            </div>
          </label>
          <div id="el-targeting-rules-wrap" style="display:none">
            <div id="el-targeting-match" style="display:flex;gap:6px;margin-bottom:10px">
              <button type="button" class="tgt-match-btn" data-match="all"
                style="flex:1;padding:6px;border:2px solid #3b82f6;border-radius:7px;background:#eff6ff;font-size:12px;font-weight:700;color:#1d4ed8;cursor:pointer">
                Kaikki ehdot täyttyy (JA)
              </button>
              <button type="button" class="tgt-match-btn" data-match="any"
                style="flex:1;padding:6px;border:2px solid #e2e8f0;border-radius:7px;background:#fff;font-size:12px;font-weight:600;color:#64748b;cursor:pointer">
                Jokin ehto täyttyy (TAI)
              </button>
            </div>
            <div id="el-rules-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px"></div>
            <button type="button" id="el-add-rule"
              style="width:100%;padding:8px;border:2px dashed #cbd5e1;border-radius:8px;background:transparent;font-size:12px;font-weight:600;color:#64748b;cursor:pointer">
              + Lisää sääntö
            </button>
          </div>
        </div>
      </div>
      ${type !== 'stats_only' ? `<div class="editor-preview-pane">
        <div class="preview-toolbar">
          <button class="btn btn-secondary btn-sm active" id="btn-desktop" title="Desktop">
            <i class="fa fa-desktop"></i>
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-mobile" title="Mobiili">
            <i class="fa fa-mobile-alt"></i>
          </button>
          <span style="flex:1"></span>
          <span style="font-size:11px;color:#94a3b8">Live preview</span>
        </div>
        <div class="preview-frame" id="preview-frame">
          <div class="preview-inner" id="preview-inner">
            <div class="preview-placeholder">
              <i class="fa fa-eye"></i>
              <span>Preview päivittyy automaattisesti</span>
            </div>
          </div>
        </div>
      </div>` : ''}
    </div>
    <div class="editor-footer">
      <button class="btn btn-secondary" id="editor-cancel">Peruuta</button>
      <button class="btn btn-primary" id="editor-save">
        <i class="fa fa-save"></i> Tallenna
      </button>
    </div>`;
}

// ─── Targeting ────────────────────────────────────────────────────────────────

const RULE_TYPES = [
  { value: 'url',              label: 'Sivun osoite' },
  { value: 'device',           label: 'Laite' },
  { value: 'referrer',         label: 'Viittaava sivu' },
  { value: 'day_of_week',      label: 'Viikonpäivä' },
  { value: 'hour_of_day',      label: 'Kellonaika' },
];

const RULE_OPERATORS = {
  url:          [{ value: 'contains', label: 'sisältää' }, { value: 'equals', label: 'on täsmälleen' }, { value: 'starts_with', label: 'alkaa' }],
  referrer:     [{ value: 'contains', label: 'sisältää' }, { value: 'equals', label: 'on täsmälleen' }],
  hour_of_day:  [{ value: 'greater_than', label: 'suurempi kuin' }, { value: 'less_than', label: 'pienempi kuin' }],
};

const RULE_VALUE_OPTIONS = {
  device:      [{ value: 'mobile', label: 'Mobiili' }, { value: 'tablet', label: 'Tabletti' }, { value: 'desktop', label: 'Tietokone' }],
  day_of_week: [{ value: 'monday', label: 'Maanantai' }, { value: 'tuesday', label: 'Tiistai' }, { value: 'wednesday', label: 'Keskiviikko' },
                { value: 'thursday', label: 'Torstai' }, { value: 'friday', label: 'Perjantai' }, { value: 'saturday', label: 'Lauantai' }, { value: 'sunday', label: 'Sunnuntai' }],
};

function buildRuleRow(rule = {}) {
  const ruleType = rule.type || 'url';
  const ops      = RULE_OPERATORS[ruleType] || [];
  const valOpts  = RULE_VALUE_OPTIONS[ruleType] || [];
  const hasOp    = ops.length > 0;
  const hasSelect = valOpts.length > 0;

  const typeOpts = RULE_TYPES.map(t =>
    `<option value="${t.value}" ${t.value === ruleType ? 'selected' : ''}>${t.label}</option>`
  ).join('');

  const opOpts = ops.map(o =>
    `<option value="${o.value}" ${o.value === (rule.operator || '') ? 'selected' : ''}>${o.label}</option>`
  ).join('');

  const valSelectOpts = valOpts.map(v =>
    `<option value="${v.value}" ${v.value === (rule.value || '') ? 'selected' : ''}>${v.label}</option>`
  ).join('');

  const row = document.createElement('div');
  row.className = 'tgt-rule-row';
  row.style.cssText = 'display:flex;gap:6px;align-items:center';
  row.innerHTML = `
    <select class="tgt-type" style="flex:1.2;padding:6px 8px;border:1px solid #e2e8f0;border-radius:7px;font-size:12px;background:#fff">${typeOpts}</select>
    <select class="tgt-op" style="flex:1;padding:6px 8px;border:1px solid #e2e8f0;border-radius:7px;font-size:12px;background:#fff;display:${hasOp?'block':'none'}">${opOpts}</select>
    ${hasSelect
      ? `<select class="tgt-val" style="flex:1.2;padding:6px 8px;border:1px solid #e2e8f0;border-radius:7px;font-size:12px;background:#fff">${valSelectOpts}</select>`
      : `<input type="text" class="tgt-val" placeholder="${ruleType === 'hour_of_day' ? '0–23' : '/sivusto-polku'}"
           value="${escHtml(rule.value || '')}"
           style="flex:1.2;padding:6px 8px;border:1px solid #e2e8f0;border-radius:7px;font-size:12px">`
    }
    <button type="button" class="tgt-remove" style="background:none;border:none;color:#ef4444;font-size:16px;cursor:pointer;padding:0 4px;flex-shrink:0" title="Poista">✕</button>`;

  // Tyyppi vaihtuu → päivitä operaattori + arvo
  row.querySelector('.tgt-type').addEventListener('change', e => {
    const newType = e.target.value;
    const newRow  = buildRuleRow({ type: newType });
    row.replaceWith(newRow);
  });

  row.querySelector('.tgt-remove').addEventListener('click', () => row.remove());
  return row;
}

function initTargetingEditor(data) {
  const targeting = data.targeting || {};
  const enabled   = targeting.enabled === true;
  const matchType = targeting.matchType || 'all';
  const rules     = Array.isArray(targeting.rules) ? targeting.rules : [];

  const cb   = document.getElementById('el-targeting-enabled');
  const wrap = document.getElementById('el-targeting-rules-wrap');
  const list = document.getElementById('el-rules-list');
  if (!cb || !wrap || !list) return;

  cb.checked = enabled;
  wrap.style.display = enabled ? 'block' : 'none';

  // AND/OR toggle
  document.querySelectorAll('.tgt-match-btn').forEach(btn => {
    const active = btn.dataset.match === matchType;
    btn.dataset.active     = active ? 'true' : 'false';
    btn.style.borderColor  = active ? '#3b82f6' : '#e2e8f0';
    btn.style.background   = active ? '#eff6ff' : '#fff';
    btn.style.color        = active ? '#1d4ed8' : '#64748b';
    btn.style.fontWeight   = active ? '700' : '600';
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tgt-match-btn').forEach(b => {
        const a = b.dataset.match === btn.dataset.match;
        b.dataset.active    = a ? 'true' : 'false';
        b.style.borderColor = a ? '#3b82f6' : '#e2e8f0';
        b.style.background  = a ? '#eff6ff' : '#fff';
        b.style.color       = a ? '#1d4ed8' : '#64748b';
        b.style.fontWeight  = a ? '700' : '600';
      });
    });
  });

  // Esitäytä säännöt
  rules.forEach(r => list.appendChild(buildRuleRow(r)));

  // + Lisää sääntö
  document.getElementById('el-add-rule')?.addEventListener('click', () => {
    list.appendChild(buildRuleRow({ type: 'url', operator: 'contains', value: '' }));
  });

  // Checkbox toggle
  cb.addEventListener('change', () => {
    wrap.style.display = cb.checked ? 'block' : 'none';
  });
}

function readTargetingFromUI() {
  const cb = document.getElementById('el-targeting-enabled');
  const enabled = cb?.checked === true;
  if (!enabled) return { enabled: false, matchType: 'all', rules: [] };

  const matchBtn  = document.querySelector('.tgt-match-btn[data-active="true"]') ||
                    document.querySelector('.tgt-match-btn[data-match="all"]');
  const matchType = matchBtn?.dataset.match || 'all';

  const rules = [];
  document.querySelectorAll('.tgt-rule-row').forEach(row => {
    const type     = row.querySelector('.tgt-type')?.value || 'url';
    const operator = row.querySelector('.tgt-op')?.value   || 'contains';
    const value    = row.querySelector('.tgt-val')?.value?.trim() || '';
    if (value) rules.push({ type, operator, value });
  });

  return { enabled: rules.length > 0, matchType, rules };
}

function proLockHTML(feature) {
  const contact = `mailto:tuki@uimanager.fi?subject=Pro-tili%20päivitys&body=Haluaisin%20käyttää%20ominaisuutta%3A%20${encodeURIComponent(feature)}`;
  return `
    <div style="text-align:center;padding:32px 20px;background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px">
      <div style="font-size:32px;margin-bottom:10px">🔒</div>
      <div style="font-weight:600;color:#1e293b;margin-bottom:6px">${feature} on Pro-ominaisuus</div>
      <div style="font-size:13px;color:#64748b;margin-bottom:16px">Ota yhteyttä päivittääksesi tilisi ja saat käyttöön kaikki ominaisuudet.</div>
      <a href="${contact}" style="background:#3b82f6;color:#fff;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none">Ota yhteyttä →</a>
    </div>`;
}

function renderTypeFields(container, type, data) {
  const cfg = data.elementConfig || {};
  const user = window.__currentUser__;

  if (type === 'stats_only') {
    container.innerHTML = `
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:20px 24px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <span style="font-size:24px">📊</span>
          <div>
            <div style="font-weight:700;font-size:15px;color:#14532d">Tilastojen kerääjä</div>
            <div style="font-size:13px;color:#166534">Kerää kävijätilastoja näyttämättä mitään sivustolla</div>
          </div>
        </div>
        <div style="font-size:13px;color:#15803d;line-height:1.6">
          Tämä elementti <strong>ei näytä mitään</strong> sivustosi kävijöille — se ainoastaan rekisteröi näyttökerran kun skripti suoritetaan.
        </div>
      </div>`;
    return;
  }

  if (type === 'lead_form') {
    const leadLimit = user?.limits?.lead_form ?? 0;
    if (user && user.role !== 'admin' && leadLimit === 0) {
      container.innerHTML = proLockHTML('Lead Form');
      return;
    }
    renderLeadFormFields(container, cfg);
    return;
  }
  if (type === 'cookie_consent') { renderCookieConsentFields(container, cfg, data); return; }
  if (type === 'sticky_bar')    renderStickyBarFields(container, cfg, data);
  else if (type === 'fab')      renderFabFields(container, cfg);
  else if (type === 'slide_in') renderSlideInFields(container, cfg, data);
  else                          renderPopupFields(container, cfg, data);
}

function getTypeData() {
  const fieldsContainer = document.getElementById('type-fields');
  if (!fieldsContainer) return {};
  if (currentType === 'stats_only') return { popupType: 'stats_only', content: '', width: 0, height: 0 };
  if (currentType === 'sticky_bar') {
    const d = getStickyBarData(fieldsContainer);
    return { elementConfig: d.config, backgroundColor: d.backgroundColor, textColor: d.textColor };
  }
  if (currentType === 'fab')        return { elementConfig: getFabData(fieldsContainer) };
  if (currentType === 'lead_form')     return { elementConfig: getLeadFormData(fieldsContainer) };
  if (currentType === 'cookie_consent') { const d = getCookieConsentData(fieldsContainer); return { elementConfig: d.elementConfig, backgroundColor: d.backgroundColor, textColor: d.textColor }; }
  if (currentType === 'slide_in') {
    const d = getSlideInData(fieldsContainer);
    return { elementConfig: d.config, content: d.content, backgroundColor: d.backgroundColor, textColor: d.textColor };
  }
  const d = getPopupData(fieldsContainer);
  return { elementConfig: d.config, popupType: d.popupType, position: d.position, animation: d.animation, width: d.width, content: d.content, imageUrl: d.imageUrl, imageFirebasePath: d.imageFirebasePath, linkUrl: d.linkUrl, backgroundColor: d.backgroundColor, textColor: d.textColor };
}

function buildPayload() {
  const name = document.getElementById('el-name')?.value?.trim() || 'Nimetön elementti';
  const siteId = document.getElementById('el-site')?.value || null;
  const typeData = getTypeData();

  // Ajastus: lue radiobuttoneista
  const timingMode = document.querySelector('input[name="timing-mode"]:checked')?.value || 'immediate';
  const delay = timingMode === 'delay' ? (parseInt(document.getElementById('el-delay')?.value) || 5) : 0;
  const frequency = document.querySelector('input[name="el-frequency"]:checked')?.value || 'always';

  return {
    name,
    elementType: currentType,
    popupType: typeData.popupType || 'rectangle',
    delay, frequency,
    targeting: readTargetingFromUI(),
    abTest: { enabled: false },
    siteId: siteId || null,
    startDate: document.getElementById('el-start-date')?.value || '',
    endDate:   document.getElementById('el-end-date')?.value   || '',
    ...typeData
  };
}

async function saveElement() {
  const btn = document.getElementById('editor-save');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Tallennetaan...'; }

  try {
    const payload = buildPayload();
    const url = currentElement ? '/api/popups/' + currentElement._id : '/api/popups';
    const method = currentElement ? 'PUT' : 'POST';
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) {
      const err = await r.json();
      if (err.limitReached) {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> Tallenna'; }
        if (typeof window.__dashboardUpgrade === 'function') window.__dashboardUpgrade('limit');
        else showToast(err.message, 'error');
        return;
      }
      if (err.feature === 'custom_scripts' || err.feature === 'targeting') {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> Tallenna'; }
        if (typeof window.__dashboardUpgrade === 'function') window.__dashboardUpgrade('pro');
        else showToast(err.message, 'error');
        return;
      }
      throw new Error(err.message || 'Tallennusvirhe');
    }
    showToast(currentElement ? 'Elementti päivitetty!' : 'Elementti luotu!');
    closeEditor();
    window.dispatchEvent(new CustomEvent('refresh-elements'));
  } catch (e) {
    showToast(e.message || 'Tallennus epäonnistui', 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> Tallenna'; }
  }
}

function closeEditor() {
  const panel = document.getElementById('editor-panel');
  if (panel) { panel.classList.remove('open'); panel.innerHTML = ''; }
  currentElement = null;
}

function updatePreview() {
  try {
    const payload = buildPayload();
    renderPreview('preview-inner', payload);
  } catch {}
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Desktop/mobile toggle
document.addEventListener('click', e => {
  // Delay-napit
  if (e.target.closest('.delay-btn')) {
    const btn = e.target.closest('.delay-btn');
    const panel = document.getElementById('editor-panel');
    if (panel) {
      panel.querySelectorAll('.delay-btn').forEach(b => {
        const active = b === btn;
        b.style.borderColor = active ? '#3b82f6' : '#e2e8f0';
        b.style.background  = active ? '#eff6ff' : '#fff';
        b.style.color       = active ? '#1d4ed8' : '#374151';
      });
      const delayInput = document.getElementById('el-delay');
      if (delayInput) delayInput.value = btn.dataset.delay;
    }
    return;
  }
  // Radio border highlight – timing-mode
  const timingRadio = e.target.closest('label')?.querySelector('input[name="timing-mode"]');
  if (timingRadio) {
    document.querySelectorAll('input[name="timing-mode"]').forEach(r => {
      const lbl = r.closest('label');
      if (!lbl) return;
      lbl.style.borderColor = r.checked ? '#3b82f6' : '#e2e8f0';
      lbl.style.background  = r.checked ? '#eff6ff' : '#fff';
    });
  }
  // Radio border highlight – frequency
  const freqRadio = e.target.closest('label')?.querySelector('input[name="el-frequency"]');
  if (freqRadio) {
    document.querySelectorAll('input[name="el-frequency"]').forEach(r => {
      const lbl = r.closest('label');
      if (!lbl) return;
      lbl.style.borderColor = r.checked ? '#3b82f6' : '#e2e8f0';
      lbl.style.background  = r.checked ? '#eff6ff' : '#fff';
    });
  }
  if (e.target.closest('#btn-desktop')) {
    document.getElementById('preview-frame')?.classList.remove('mobile');
    document.getElementById('btn-desktop')?.classList.add('active');
    document.getElementById('btn-mobile')?.classList.remove('active');
  }
  if (e.target.closest('#btn-mobile')) {
    document.getElementById('preview-frame')?.classList.add('mobile');
    document.getElementById('btn-mobile')?.classList.add('active');
    document.getElementById('btn-desktop')?.classList.remove('active');
  }
});
