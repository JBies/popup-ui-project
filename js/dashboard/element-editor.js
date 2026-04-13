// js/dashboard/element-editor.js
import { renderStickyBarFields, getStickyBarData } from './editors/sticky-bar-editor.js';
import { renderFabFields, getFabData }             from './editors/fab-editor.js';
import { renderSlideInFields, getSlideInData }     from './editors/slide-in-editor.js';
import { renderPopupFields, getPopupData }         from './editors/popup-editor.js';
import { renderLeadFormFields, getLeadFormData }   from './editors/lead-form-editor.js';
import { renderPreview }  from './live-preview.js';
import { showToast }      from './dashboard-main.js';

let currentElement = null;
let currentType = 'sticky_bar';
let cachedSites = null;

const TYPE_LABELS = {
  sticky_bar: 'Sticky Bar', fab: 'Floating Button', slide_in: 'Slide-in', popup: 'Popup',
  lead_form: 'Lead Form', stats_only: 'Tilastojen kerääjä'
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
  if (type === 'sticky_bar')    renderStickyBarFields(container, cfg);
  else if (type === 'fab')      renderFabFields(container, cfg);
  else if (type === 'slide_in') renderSlideInFields(container, cfg, data);
  else                          renderPopupFields(container, cfg, data);
}

function getTypeData() {
  const fieldsContainer = document.getElementById('type-fields');
  if (!fieldsContainer) return {};
  if (currentType === 'stats_only') return { popupType: 'stats_only', content: '', width: 0, height: 0 };
  if (currentType === 'sticky_bar') return { elementConfig: getStickyBarData(fieldsContainer) };
  if (currentType === 'fab')        return { elementConfig: getFabData(fieldsContainer) };
  if (currentType === 'lead_form')  return { elementConfig: getLeadFormData(fieldsContainer) };
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
    targeting: { enabled: false, matchType: 'all', rules: [] },
    abTest: { enabled: false },
    siteId: siteId || null,
    startDate: '',
    endDate: '',
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
