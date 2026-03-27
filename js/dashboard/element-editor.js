// js/dashboard/element-editor.js
import { renderStickyBarFields, getStickyBarData }           from './editors/sticky-bar-editor.js';
import { renderFabFields, getFabData }                       from './editors/fab-editor.js';
import { renderSlideInFields, getSlideInData }               from './editors/slide-in-editor.js';
import { renderPopupFields, getPopupData }                   from './editors/popup-editor.js';
import { renderSocialProofFields, getSocialProofData }       from './editors/social-proof-editor.js';
import { renderScrollProgressFields, getScrollProgressData } from './editors/scroll-progress-editor.js';
import { renderTargetingFields, getTargetingData }           from './editors/targeting-editor.js';
import { renderPreview }  from './live-preview.js';
import { showToast }      from './dashboard-main.js';

let currentElement = null;
let currentType = 'sticky_bar';

const TYPE_LABELS = {
  sticky_bar: 'Sticky Bar', fab: 'Floating Button', slide_in: 'Slide-in', popup: 'Popup',
  social_proof: 'Social Proof', scroll_progress: 'Scroll Progress'
};

export function initEditor() {}

export function openEditor(data = {}) {
  currentElement = data._id ? data : null;
  currentType = data.elementType || data.type || 'sticky_bar';

  const panel = document.getElementById('editor-panel');
  if (!panel) return;
  panel.classList.add('open');
  panel.innerHTML = buildEditorHTML(currentType, data);

  // Render type-specific fields
  const fieldsContainer = document.getElementById('type-fields');
  renderTypeFields(fieldsContainer, currentType, data);

  // Targeting
  const targetingSection = document.getElementById('targeting-section');
  if (targetingSection) renderTargetingFields(targetingSection, data.targeting || {});

  // Preview initialisointi
  updatePreview();

  // Event-kuuntelijat
  panel.querySelector('#editor-cancel')?.addEventListener('click', closeEditor);
  panel.querySelector('#editor-save')?.addEventListener('click', saveElement);
  panel.addEventListener('change', () => setTimeout(updatePreview, 50));
  panel.addEventListener('input',  () => setTimeout(updatePreview, 200));

  // Scroll editoriin
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildEditorHTML(type, data = {}) {
  const isNew = !data._id;
  const title = isNew ? 'Uusi ' + (TYPE_LABELS[type] || type) : 'Muokkaa: ' + (data.name || '');
  const timing = data.timing || {};

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

        <div id="type-fields"></div>

        <div id="targeting-section" style="margin-top:20px"></div>

        <div class="section-title" style="margin-top:20px">Ajoitus</div>
        <div class="form-row">
          <div class="form-group">
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
            <input type="date" id="el-start" value="${timing.startDate && timing.startDate !== 'default' ? timing.startDate.slice(0,10) : ''}">
          </div>
          <div class="form-group">
            <label>Lopetuspäivä (vapaaehtoinen)</label>
            <input type="date" id="el-end" value="${timing.endDate && timing.endDate !== 'default' ? timing.endDate.slice(0,10) : ''}">
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

function renderTypeFields(container, type, data) {
  const cfg = data.elementConfig || {};
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
  if (currentType === 'sticky_bar')     return { elementConfig: getStickyBarData(fieldsContainer) };
  if (currentType === 'fab')            return { elementConfig: getFabData(fieldsContainer) };
  if (currentType === 'social_proof')   return { elementConfig: getSocialProofData(fieldsContainer) };
  if (currentType === 'scroll_progress') return { elementConfig: getScrollProgressData(fieldsContainer) };
  if (currentType === 'slide_in') {
    const d = getSlideInData(fieldsContainer);
    return { elementConfig: d.config, content: d.content, backgroundColor: d.backgroundColor, textColor: d.textColor };
  }
  const d = getPopupData(fieldsContainer);
  return { elementConfig: d.config, popupType: d.popupType, position: d.position, animation: d.animation, width: d.width, content: d.content, imageUrl: d.imageUrl, linkUrl: d.linkUrl, backgroundColor: d.backgroundColor, textColor: d.textColor };
}

function buildPayload() {
  const name = document.getElementById('el-name')?.value?.trim() || 'Nimetön elementti';
  const delay = parseInt(document.getElementById('el-delay')?.value) || 0;
  const frequency = document.getElementById('el-frequency')?.value || 'always';
  const startDate = document.getElementById('el-start')?.value || null;
  const endDate = document.getElementById('el-end')?.value || null;
  const typeData = getTypeData();
  const targetingSection = document.getElementById('targeting-section');
  const targeting = targetingSection ? getTargetingData(targetingSection) : { enabled: false, matchType: 'all', rules: [] };

  return {
    name,
    elementType: currentType,
    popupType: typeData.popupType || 'rectangle',
    delay, frequency,
    targeting,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
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
