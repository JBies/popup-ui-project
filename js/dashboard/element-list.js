// js/dashboard/element-list.js
import { showToast } from './dashboard-main.js';
import { openStats } from './stats-panel.js';

const TYPE_META = {
  sticky_bar:      { label: 'Sticky Bar',      icon: 'fa-minus',        badge: 'badge-sticky' },
  fab:             { label: 'Floating Button', icon: 'fa-circle',       badge: 'badge-fab' },
  slide_in:        { label: 'Slide-in',        icon: 'fa-comment-dots', badge: 'badge-slidein' },
  popup:           { label: 'Popup',           icon: 'fa-square',       badge: 'badge-popup' },
  social_proof:    { label: 'Social Proof',    icon: 'fa-users',        badge: 'badge-social' },
  scroll_progress: { label: 'Scroll Progress', icon: 'fa-arrows-alt-v', badge: 'badge-scroll' },
  lead_form:       { label: 'Lead Form',       icon: 'fa-envelope',     badge: 'badge-lead' }
};

let allElements = [];
let searchQuery = '';
let currentUser = null;

export function initElementList(user) {
  currentUser = user || null;
  loadElements();
  window.addEventListener('refresh-elements', loadElements);
}

function applyStoredOrder(elements) {
  try {
    const order = JSON.parse(localStorage.getItem('el_order') || '[]');
    if (!order.length) return elements;
    const indexed = Object.fromEntries(elements.map(e => [e._id, e]));
    const sorted = order.map(id => indexed[id]).filter(Boolean);
    const rest = elements.filter(e => !order.includes(e._id));
    return [...sorted, ...rest];
  } catch { return elements; }
}

async function loadElements() {
  const grid = document.getElementById('elements-grid');
  if (!grid) return;
  grid.innerHTML = '<div style="color:#64748b;font-size:14px;padding:24px">Ladataan...</div>';
  try {
    const r = await fetch('/api/popups');
    if (!r.ok) throw new Error('Virhe');
    allElements = applyStoredOrder(await r.json());
    renderList();
  } catch {
    grid.innerHTML = '<div style="color:#ef4444;padding:24px">Elementtien lataus epäonnistui.</div>';
  }
}

function quotaBarHTML(elements) {
  const user = currentUser || window.__currentUser__;
  if (!user) return '';
  const used = elements.length;
  const max  = user.popupLimit || 2;
  const pct  = Math.min(100, Math.round((used / max) * 100));
  const full = used >= max;
  const contact = `mailto:tuki@uimanager.fi?subject=Pro-tili%20päivitys&body=Hei%2C%20haluaisin%20päivittää%20Pro-tiliin.`;
  return `
    <div style="margin-bottom:16px;padding:12px 16px;background:${full?'#fef2f2':'#f8fafc'};
      border:1px solid ${full?'#fecaca':'#e2e8f0'};border-radius:10px;display:flex;align-items:center;gap:14px">
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;color:${full?'#dc2626':'#475569'};margin-bottom:5px">
          ${full ? '⚠️ Elementtiraja täynnä' : `Elementtejä käytössä: ${used} / ${max}`}
        </div>
        <div style="height:5px;background:#e2e8f0;border-radius:3px">
          <div style="height:5px;background:${full?'#ef4444':'#3b82f6'};border-radius:3px;width:${pct}%;transition:width 0.3s"></div>
        </div>
        ${full ? `<div style="font-size:11px;color:#64748b;margin-top:4px">Haluatko lisää? Ota yhteyttä ja saat Pro-tilin.</div>` : ''}
      </div>
      ${full ? `<a href="${contact}" style="flex-shrink:0;background:#3b82f6;color:#fff;padding:8px 14px;border-radius:7px;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap">Päivitä Pro →</a>` : ''}
    </div>`;
}

function renderList() {
  const grid = document.getElementById('elements-grid');
  if (!grid) return;

  // Quota bar
  const quotaEl = document.getElementById('quota-bar');
  if (quotaEl) quotaEl.innerHTML = quotaBarHTML(allElements);

  const filtered = allElements.filter(el =>
    !searchQuery || el.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:48px 24px">
        <div style="font-size:48px;margin-bottom:16px">🚀</div>
        <h3 style="font-size:18px;font-weight:600;color:#1e293b;margin:0 0 8px">Ei elementtejä vielä</h3>
        <p style="color:#64748b;font-size:14px;margin:0 0 28px">Aloita valmiilla templatella tai luo tyhjästä</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" data-quick="sticky_bar"><i class="fa fa-minus"></i> Sticky Bar</button>
          <button class="btn btn-primary" data-quick="popup"><i class="fa fa-square"></i> Ponnahdusviesti</button>
          <button class="btn btn-primary" data-quick="lead_form"><i class="fa fa-envelope"></i> Lead Form</button>
        </div>
      </div>`;
    grid.querySelectorAll('[data-quick]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('open-editor', { detail: { elementType: btn.dataset.quick } }));
      });
    });
    return;
  }

  grid.innerHTML = filtered.map(el => cardHTML(el)).join('');
  grid.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action, btn.dataset.id));
  });

  // Drag-and-drop järjestely (SortableJS)
  if (window.Sortable) {
    Sortable.create(grid, {
      animation: 150,
      handle: '.el-drag-handle',
      onEnd: () => {
        const order = [...grid.querySelectorAll('.el-card')].map(c => c.dataset.id);
        localStorage.setItem('el_order', JSON.stringify(order));
      }
    });
  }
}

function getTimingStatus(el) {
  const now = new Date();
  const timing = el.timing || {};
  const start = timing.startDate && timing.startDate !== 'default' ? new Date(timing.startDate) : null;
  const end   = timing.endDate   && timing.endDate   !== 'default' ? new Date(timing.endDate)   : null;
  if (el.active === false) return { label: '● Ei käytössä',    color: '#ef4444' };
  if (end   && now > end)   return { label: '● Kampanja päättynyt', color: '#f59e0b' };
  if (start && now < start) return { label: `● Alkaa ${start.toLocaleDateString('fi-FI')}`, color: '#64748b' };
  return { label: '● Aktiivinen', color: '#10b981' };
}

function cardHTML(el) {
  const type = el.elementType || 'popup';
  const meta = TYPE_META[type] || TYPE_META.popup;
  const stats = el.statistics || {};
  const views = stats.views || 0;
  const clicks = stats.clicks || 0;
  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0';
  const date = new Date(el.createdAt).toLocaleDateString('fi-FI');
  const cfg = el.elementConfig || {};
  const status = getTimingStatus(el);
  let subtitle = '';
  if (type === 'sticky_bar') subtitle = cfg.barText ? cfg.barText.substring(0, 50) + (cfg.barText.length > 50 ? '…' : '') : '';
  else if (type === 'fab') subtitle = (cfg.fabPosition || '') + (cfg.fabAction ? ' · ' + cfg.fabAction : '');
  else if (type === 'slide_in') subtitle = 'Triggeri: ' + (cfg.slideInTrigger || 'time');
  else subtitle = el.content ? el.content.replace(/<[^>]*>/g, '').substring(0, 50) : '';

  return `
    <div class="element-card el-card" data-id="${el._id}">
      <div class="element-card-header">
        <div class="el-drag-handle" title="Järjestä vetämällä" style="cursor:grab;color:#cbd5e1;padding:0 6px 0 0;font-size:18px;line-height:1;user-select:none">⠿</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="badge ${meta.badge}"><i class="fa ${meta.icon}"></i> ${meta.label}</span>
            <span style="font-size:11px;color:${status.color};font-weight:500">${status.label}</span>
          </div>
          <div class="element-card-title">${escHtml(el.name)}</div>
          <div class="element-card-meta">${escHtml(subtitle)}</div>
        </div>
        <div style="font-size:11px;color:#94a3b8;white-space:nowrap">${date}</div>
      </div>
      <div class="element-card-stats">
        <div class="stat-item">
          <div class="stat-value">${views}</div>
          <div class="stat-label">Näytöt</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${clicks}</div>
          <div class="stat-label">Klikkaukset</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${ctr}%</div>
          <div class="stat-label">CTR</div>
        </div>
      </div>
      <div class="element-card-actions">
        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${el._id}">
          <i class="fa fa-edit"></i> Muokkaa
        </button>
        <button class="btn btn-secondary btn-sm" data-action="stats" data-id="${el._id}">
          <i class="fa fa-chart-bar"></i> Tilastot
        </button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${el._id}" style="margin-left:auto">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    </div>`;
}

async function handleAction(action, id) {
  if (action === 'edit') {
    const el = allElements.find(e => e._id === id);
    if (el) window.dispatchEvent(new CustomEvent('open-editor', { detail: el }));
  } else if (action === 'stats') {
    const el = allElements.find(e => e._id === id);
    if (el) openStats(el);
  } else if (action === 'delete') {
    if (!confirm('Poistetaanko tämä elementti?')) return;
    try {
      const r = await fetch('/api/popups/' + id, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      showToast('Elementti poistettu');
      allElements = allElements.filter(e => e._id !== id);
      renderList();
    } catch {
      showToast('Poisto epäonnistui', 'error');
    }
  }
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function refreshList() { loadElements(); }
