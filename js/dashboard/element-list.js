// js/dashboard/element-list.js
import { showToast } from './dashboard-main.js';
import { openStats } from './stats-panel.js';

const TYPE_META = {
  sticky_bar:      { label: 'Sticky Bar',      icon: 'fa-minus',        badge: 'badge-sticky' },
  fab:             { label: 'Floating Button', icon: 'fa-circle',       badge: 'badge-fab' },
  slide_in:        { label: 'Slide-in',        icon: 'fa-comment-dots', badge: 'badge-slidein' },
  popup:           { label: 'Popup',           icon: 'fa-square',       badge: 'badge-popup' },
  social_proof:    { label: 'Social Proof',    icon: 'fa-users',        badge: 'badge-social' },
  scroll_progress: { label: 'Scroll Progress', icon: 'fa-arrows-alt-v', badge: 'badge-scroll' }
};

let allElements = [];
let searchQuery = '';

export function initElementList() {
  loadElements();
  window.addEventListener('refresh-elements', loadElements);
}

async function loadElements() {
  const grid = document.getElementById('elements-grid');
  if (!grid) return;
  grid.innerHTML = '<div style="color:#64748b;font-size:14px;padding:24px">Ladataan...</div>';
  try {
    const r = await fetch('/api/popups');
    if (!r.ok) throw new Error('Virhe');
    allElements = await r.json();
    renderList();
  } catch {
    grid.innerHTML = '<div style="color:#ef4444;padding:24px">Elementtien lataus epäonnistui.</div>';
  }
}

function renderList() {
  const grid = document.getElementById('elements-grid');
  if (!grid) return;

  const filtered = allElements.filter(el =>
    !searchQuery || el.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <i class="fa fa-layer-group"></i>
        <h3>Ei elementtejä vielä</h3>
        <p>Luo ensimmäinen elementti "Luo uusi" -napilla.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(el => cardHTML(el)).join('');
  grid.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action, btn.dataset.id));
  });
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
  let subtitle = '';
  if (type === 'sticky_bar') subtitle = cfg.barText ? cfg.barText.substring(0, 50) + (cfg.barText.length > 50 ? '…' : '') : '';
  else if (type === 'fab') subtitle = (cfg.fabPosition || '') + (cfg.fabAction ? ' · ' + cfg.fabAction : '');
  else if (type === 'slide_in') subtitle = 'Triggeri: ' + (cfg.slideInTrigger || 'time');
  else subtitle = el.content ? el.content.replace(/<[^>]*>/g, '').substring(0, 50) : '';

  return `
    <div class="element-card">
      <div class="element-card-header">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="badge ${meta.badge}"><i class="fa ${meta.icon}"></i> ${meta.label}</span>
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
