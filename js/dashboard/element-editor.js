// js/dashboard/element-editor.js
import { renderStickyBarFields, getStickyBarData }           from './editors/sticky-bar-editor.js';
import { renderFabFields, getFabData }                       from './editors/fab-editor.js';
import { renderSlideInFields, getSlideInData }               from './editors/slide-in-editor.js';
import { renderPopupFields, getPopupData }                   from './editors/popup-editor.js';
import { renderSocialProofFields, getSocialProofData }       from './editors/social-proof-editor.js';
import { renderScrollProgressFields, getScrollProgressData } from './editors/scroll-progress-editor.js';
import { renderTargetingFields, getTargetingData }           from './editors/targeting-editor.js';
import { renderLeadFormFields, getLeadFormData }             from './editors/lead-form-editor.js';
import { renderAbTestFields, getAbTestData }                 from './editors/ab-test-editor.js';
import { renderPreview }  from './live-preview.js';
import { showToast }      from './dashboard-main.js';

let currentElement = null;
let currentType = 'sticky_bar';
let cachedSites = null;

const TYPE_LABELS = {
  sticky_bar: 'Sticky Bar', fab: 'Floating Button', slide_in: 'Slide-in', popup: 'Popup',
  social_proof: 'Social Proof', scroll_progress: 'Scroll Progress', lead_form: 'Lead Form',
  stats_only: 'Tilastojen kerääjä'
};

export function initEditor() {}

async function loadSites() {
  if (cachedSites) return cachedSites;
  try {
    const r = await fetch('/api/sites');
    if (r.ok) cachedSites = await r.json();
    else cachedSites = [];
  } catch { cachedSites = []; }
  // Tyhjennä cache sivustojen muuttuessa
  window.addEventListener('sites-updated', () => { cachedSites = null; });
  return cachedSites;
}

export async function openEditor(data = {}) {
  currentElement = data._id ? data : null;
  currentType = data.elementType || data.type || 'sticky_bar';

  const panel = document.getElementById('editor-panel');
  if (!panel) return;
  panel.classList.add('open');

  // Lataa sivustot ennen HTML:n rakentamista
  const sites = await loadSites();
  panel.innerHTML = buildEditorHTML(currentType, data, sites);

  // Aseta valittu sivusto
  const siteSelect = document.getElementById('el-site');
  if (siteSelect && data.siteId) siteSelect.value = String(data.siteId);

  // Render type-specific fields
  const fieldsContainer = document.getElementById('type-fields');
  renderTypeFields(fieldsContainer, currentType, data);

  // Targeting – tarkista oikeus
  const targetingSection = document.getElementById('targeting-section');
  if (targetingSection) {
    const user = window.__currentUser__;
    const canTarget = !user || user.role === 'admin' || user.limits?.canUseTargeting;
    if (!canTarget) {
      const contact = `mailto:tuki@uimanager.fi?subject=Pro-tili%20päivitys`;
      targetingSection.innerHTML = `
        <div style="padding:12px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:9px;display:flex;align-items:center;gap:12px;margin-top:8px">
          <span style="font-size:20px">🔒</span>
          <div style="flex:1;font-size:13px;color:#92400e"><strong>Targeting</strong> on Pro-ominaisuus.</div>
          <a href="${contact}" style="background:#f59e0b;color:#fff;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap">Päivitä →</a>
        </div>`;
    } else {
      renderTargetingFields(targetingSection, data.targeting || {});
    }
  }

  // A/B test
  const abSection = document.getElementById('ab-test-section');
  if (abSection) renderAbTestFields(abSection, data.abTest || {});

  // Preview initialisointi
  updatePreview();

  // Event-kuuntelijat
  panel.querySelectorAll('#editor-cancel').forEach(btn => btn.addEventListener('click', closeEditor));
  panel.querySelector('#editor-save')?.addEventListener('click', saveElement);
  panel.addEventListener('change', () => setTimeout(updatePreview, 50));
  panel.addEventListener('input',  () => setTimeout(updatePreview, 200));

  // Scroll sivun alkuun jotta sticky editor näkyy heti
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildEditorHTML(type, data = {}, sites = []) {
  const isNew = !data._id;
  const title = isNew ? 'Uusi ' + (TYPE_LABELS[type] || type) : 'Muokkaa: ' + (data.name || '');
  const timing = data.timing || {};
  const siteOptions = sites.map(s =>
    `<option value="${s._id}">${escHtml(s.name)}${s.domain ? ' (' + escHtml(s.domain) + ')' : ''}</option>`
  ).join('');
  const siteSelectHTML = `
    <div class="form-group">
      <label>Sivusto <span style="font-size:11px;color:#94a3b8;font-weight:400">(vapaaehtoinen – rajaa mille sivustolle elementti näkyy)</span></label>
      <select id="el-site">
        <option value="">– Ei sivustoa (globaali) –</option>
        ${siteOptions}
      </select>
    </div>`;

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

        <div id="targeting-section" style="margin-top:20px"></div>

        <div id="ab-test-section" style="margin-top:12px"></div>

        <div class="section-title" style="margin-top:20px">Ajoitus</div>
        <div class="form-row">
          <div class="form-group" ${type === 'slide_in' ? 'style="display:none"' : ''}>
            <label>Viive (sekuntia)</label>
            <input type="number" id="el-delay" min="0" value="${timing.delay || 0}">
          </div>
          <div class="form-group">
            <label>Näytä aina / kerran</label>
            <select id="el-frequency">
              <option value="always" ${(timing.frequency||'always') === 'always' ? 'selected':''}>Aina</option>
              <option value="once"   ${timing.frequency === 'once' ? 'selected':''}>Kerran per sessio</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Aloituspäivä (vapaaehtoinen)</label>
            <input type="date" id="el-start" value="${timing.startDate && timing.startDate !== 'default' ? (() => { try { return new Date(timing.startDate).toISOString().slice(0,10); } catch(e) { return ''; } })() : ''}">
          </div>
          <div class="form-group">
            <label>Lopetuspäivä (vapaaehtoinen)</label>
            <input type="date" id="el-end" value="${timing.endDate && timing.endDate !== 'default' ? (() => { try { return new Date(timing.endDate).toISOString().slice(0,10); } catch(e) { return ''; } })() : ''}">
          </div>
        </div>
      </div>
      <div class="editor-preview-pane">
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
      </div>
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

  // Tilastojen kerääjä – ei visuaalista elementtiä, vain tilastonkeruu
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
          Tämä elementti <strong>ei näytä mitään</strong> sivustosi kävijöille — se ainoastaan rekisteröi näyttökerran kun skripti suoritetaan. Hyödyllinen kun haluat seurata tietyn sivun kävijämäärää ennen kuin aktivoit varsinaisen elementin, tai kun tarvitset puhdasta kävijädataa ilman visuaalisia elementtejä.
        </div>
        <div style="margin-top:14px;padding:10px 14px;background:#dcfce7;border-radius:7px;font-size:12px;color:#14532d">
          💡 <strong>Käyttö:</strong> Lisää asennuskoodi sivulle ja tilastot näkyvät dashboardissa normaalisti (näyttökerrat, klikkaukset).
        </div>
      </div>`;
    return;
  }

  // Lead Form – tarkista onko sallittu
  if (type === 'lead_form') {
    const leadLimit = user?.limits?.lead_form ?? 0;
    if (user && user.role !== 'admin' && leadLimit === 0) {
      container.innerHTML = proLockHTML('Lead Form');
      return;
    }
    renderLeadFormFields(container, cfg);
    return;
  }
  if (type === 'sticky_bar')     renderStickyBarFields(container, cfg);
  else if (type === 'fab')       renderFabFields(container, cfg);
  else if (type === 'slide_in')  renderSlideInFields(container, cfg, data);
  else if (type === 'social_proof')    renderSocialProofFields(container, cfg);
  else if (type === 'scroll_progress') renderScrollProgressFields(container, cfg);
  else renderPopupFields(container, cfg, data);
}

function getTypeData() {
  const fieldsContainer = document.getElementById('type-fields');
  if (!fieldsContainer) return {};
  if (currentType === 'stats_only') return { popupType: 'stats_only', content: '', width: 0, height: 0 };
  if (currentType === 'sticky_bar')     return { elementConfig: getStickyBarData(fieldsContainer) };
  if (currentType === 'fab')            return { elementConfig: getFabData(fieldsContainer) };
  if (currentType === 'social_proof')   return { elementConfig: getSocialProofData(fieldsContainer) };
  if (currentType === 'scroll_progress') return { elementConfig: getScrollProgressData(fieldsContainer) };
  if (currentType === 'lead_form') return { elementConfig: getLeadFormData(fieldsContainer) };
  if (currentType === 'slide_in') {
    const d = getSlideInData(fieldsContainer);
    return { elementConfig: d.config, content: d.content, backgroundColor: d.backgroundColor, textColor: d.textColor };
  }
  const d = getPopupData(fieldsContainer);
  return { elementConfig: d.config, popupType: d.popupType, position: d.position, animation: d.animation, width: d.width, content: d.content, imageUrl: d.imageUrl, imageFirebasePath: d.imageFirebasePath, linkUrl: d.linkUrl, backgroundColor: d.backgroundColor, textColor: d.textColor };
}

function buildPayload() {
  const name = document.getElementById('el-name')?.value?.trim() || 'Nimetön elementti';
  const delay = parseInt(document.getElementById('el-delay')?.value) || 0;
  const frequency = document.getElementById('el-frequency')?.value || 'always';
  const startDate = document.getElementById('el-start')?.value || null;
  const endDate = document.getElementById('el-end')?.value || null;
  const siteId = document.getElementById('el-site')?.value || null;
  const typeData = getTypeData();
  const targetingSection = document.getElementById('targeting-section');
  const targeting = targetingSection ? getTargetingData(targetingSection) : { enabled: false, matchType: 'all', rules: [] };
  const abSection = document.getElementById('ab-test-section');
  const abTest = abSection ? getAbTestData(abSection) : { enabled: false };

  return {
    name,
    elementType: currentType,
    popupType: typeData.popupType || 'rectangle',
    delay, frequency,
    targeting,
    abTest,
    siteId: siteId || null,
    startDate: startDate || '',
    endDate: endDate || '',
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
