// js/dashboard/template-library.js
import { openEditor } from './element-editor.js';

const CATEGORY_ORDER = ['Sticky Bars', 'Floating Buttons', 'Slide-ins', 'Popups'];
const CATEGORY_ICONS = {
  'Sticky Bars':     'fa-minus',
  'Floating Buttons':'fa-circle',
  'Slide-ins':       'fa-comment-dots',
  'Popups':          'fa-square'
};

export function initTemplateLibrary() {
  window.addEventListener('open-templates', openTemplateModal);
  document.getElementById('nav-templates')?.addEventListener('click', e => {
    e.preventDefault();
    openTemplateModal();
  });
}

async function openTemplateModal() {
  let templates = [];
  try {
    const r = await fetch('/api/popups/templates');
    if (r.ok) templates = await r.json();
  } catch { templates = []; }

  const grouped = {};
  templates.forEach(t => {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  });

  const root = document.getElementById('modal-root');
  if (!root) return;

  root.innerHTML = `
    <div class="modal-overlay" id="template-overlay">
      <div class="modal" style="max-width:760px">
        <div class="modal-header">
          <h2><i class="fa fa-magic" style="color:var(--primary);margin-right:8px"></i>Valitse template</h2>
          <button class="modal-close" id="close-templates">✕</button>
        </div>
        <p style="color:#64748b;font-size:14px;margin-bottom:24px">
          Aloita valmiista templatesta – muokkaa tarpeen mukaan.
        </p>
        ${CATEGORY_ORDER.filter(c => grouped[c]).map(cat => `
          <div style="margin-bottom:28px">
            <h3 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin-bottom:12px;display:flex;align-items:center;gap:8px">
              <i class="fa ${CATEGORY_ICONS[cat]}"></i> ${cat}
            </h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
              ${(grouped[cat] || []).map(t => templateCardHTML(t)).join('')}
            </div>
          </div>`).join('')}
        ${templates.length === 0 ? '<div style="text-align:center;padding:40px;color:#94a3b8">Templates ladataan...</div>' : ''}
      </div>
    </div>`;

  root.querySelectorAll('[data-template-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.templateId;
      const template = templates.find(t => t.id === id);
      if (template) {
        closeTemplateModal();
        openEditor(templateToElement(template));
      }
    });
  });

  document.getElementById('close-templates')?.addEventListener('click', closeTemplateModal);
  document.getElementById('template-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'template-overlay') closeTemplateModal();
  });
}

function templateCardHTML(t) {
  const colorBar = t.backgroundColor ? `background:${t.backgroundColor};` : 'background:#f1f5f9;';
  return `
    <button data-template-id="${t.id}" style="
      border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;
      background:#fff;cursor:pointer;text-align:left;
      transition:box-shadow 0.2s,border-color 0.2s;padding:0
    " onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)';this.style.borderColor='#2563eb'"
       onmouseout="this.style.boxShadow='none';this.style.borderColor='#e2e8f0'">
      <div style="height:56px;${colorBar}display:flex;align-items:center;justify-content:center;padding:8px">
        ${previewMiniHTML(t)}
      </div>
      <div style="padding:10px 12px">
        <div style="font-size:13px;font-weight:600;color:#0f172a">${t.name}</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px">
          ${t.elementConfig?.barText?.substring(0,40) || t.content?.replace(/<[^>]*>/g,'').substring(0,40) || ''}
        </div>
      </div>
    </button>`;
}

function previewMiniHTML(t) {
  const type = t.elementType;
  const cfg = t.elementConfig || {};
  const bg = t.backgroundColor || '#1a56db';
  const color = t.textColor || '#fff';
  if (type === 'sticky_bar') {
    return `<div style="background:${bg};color:${color};padding:4px 8px;border-radius:4px;font-size:10px;font-weight:600;width:100%;text-align:center">${cfg.barText?.substring(0,30) || 'Teksti tähän'}</div>`;
  }
  if (type === 'fab') {
    return `<div style="width:34px;height:34px;border-radius:50%;background:${cfg.fabColor||bg};display:flex;align-items:center;justify-content:center"><i class="fa ${cfg.fabIcon||'fa-comment'}" style="color:#fff;font-size:14px"></i></div>`;
  }
  if (type === 'slide_in') {
    return `<div style="background:${bg};color:${color};padding:6px 10px;border-radius:6px;font-size:10px;width:80%;text-align:center">Slide-in</div>`;
  }
  return `<div style="background:${bg};color:${color};padding:8px 12px;border-radius:6px;font-size:10px;font-weight:600">Popup</div>`;
}

function templateToElement(t) {
  return {
    elementType:     t.elementType,
    elementConfig:   t.elementConfig || {},
    popupType:       t.popupType || 'rectangle',
    backgroundColor: t.backgroundColor || '#ffffff',
    textColor:       t.textColor || '#000000',
    content:         t.content || '',
    width:           t.width || 400,
    name:            t.name
  };
}

function closeTemplateModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
}
