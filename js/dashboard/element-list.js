// js/dashboard/element-list.js
import { showToast } from './dashboard-main.js';
import { openStats } from './stats-panel.js';

const TYPE_META = {
  sticky_bar: { label: 'Sticky Bar',      icon: 'fa-minus',        badge: 'badge-sticky' },
  fab:        { label: 'Floating Button', icon: 'fa-circle',       badge: 'badge-fab' },
  slide_in:   { label: 'Slide-in',        icon: 'fa-comment-dots', badge: 'badge-slidein' },
  popup:      { label: 'Popup',           icon: 'fa-square',       badge: 'badge-popup' },
  lead_form:  { label: 'Lead Form',       icon: 'fa-envelope',     badge: 'badge-lead' },
  stats_only: { label: 'Tilastot',        icon: 'fa-chart-bar',    badge: 'badge-sticky' },
};

let allElements = [];
let searchQuery = '';
let siteFilter = '';  // '_none' = ei sivustoa, '' = kaikki, muuten siteId
let currentUser = null;
let cachedSites = [];
let pendingDeleteId = null;

export function initElementList(user) {
  currentUser = user || null;
  loadElements();
  loadSitesFilter();
  window.addEventListener('refresh-elements', loadElements);
  window.addEventListener('sites-updated', loadSitesFilter);
}

async function loadSitesFilter() {
  try {
    const r = await fetch('/api/sites');
    if (r.ok) cachedSites = await r.json();
    else cachedSites = [];
  } catch { cachedSites = []; }
  renderSiteFilter();
}

function renderSiteFilter() {
  const bar = document.getElementById('elements-filter-bar');
  if (!bar) return;
  if (!cachedSites.length) { bar.innerHTML = ''; return; }
  const options = cachedSites.map(s =>
    `<option value="${s._id}">${escHtml(s.name)}${s.domain ? ' (' + escHtml(s.domain) + ')' : ''}</option>`
  ).join('');
  bar.innerHTML = `
    <select id="site-filter-select" style="font-size:12px;padding:5px 10px;border:1px solid #e2e8f0;border-radius:7px;background:#fff;color:#374151;cursor:pointer">
      <option value="">Kaikki sivustot</option>
      ${options}
      <option value="_none">– Ei sivustoa –</option>
    </select>`;
  document.getElementById('site-filter-select')?.addEventListener('change', e => {
    siteFilter = e.target.value;
    renderList();
  });
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
  if (user.role === 'admin') return '';
  const used = elements.length;
  const max  = user.popupLimit || 2;
  const pct  = Math.min(100, Math.round((used / max) * 100));
  const full = used >= max;
  const contact = `mailto:joni.bies@gmail.com?subject=Pro-tili%20päivitys&body=Hei%2C%20haluaisin%20päivittää%20Pro-tiliin.`;
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

  const filtered = allElements.filter(el => {
    if (searchQuery && !el.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (siteFilter === '_none') return !el.siteId;
    if (siteFilter) return String(el.siteId) === siteFilter;
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;max-width:640px;margin:0 auto;padding:32px 16px">

        <!-- Otsikko -->
        <div style="text-align:center;margin-bottom:28px">
          <div style="font-size:44px;margin-bottom:12px">🚀</div>
          <h3 style="font-size:18px;font-weight:700;color:#1e293b;margin:0 0 6px">Tervetuloa UI Manageriin!</h3>
          <p style="color:#64748b;font-size:14px;margin:0">Näin pääset käyntiin kolmessa askeleessa</p>
        </div>

        <!-- 3 askelta -->
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:28px">

          <div style="display:flex;gap:14px;align-items:flex-start;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px">
            <div style="width:28px;height:28px;border-radius:50%;background:#3b82f6;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">1</div>
            <div>
              <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px">Luo elementti</div>
              <div style="font-size:12px;color:#64748b;margin-bottom:10px">Valitse tyyppi alta, mukauta ja tallenna. Voit luoda niin monta kuin haluat.</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="btn btn-primary btn-sm" data-quick="sticky_bar" style="font-size:12px"><i class="fa fa-minus"></i> Sticky Bar</button>
                <button class="btn btn-primary btn-sm" data-quick="popup" style="font-size:12px"><i class="fa fa-square"></i> Popup</button>
                <button class="btn btn-primary btn-sm" data-quick="lead_form" style="font-size:12px"><i class="fa fa-envelope"></i> Lead Form</button>
              </div>
            </div>
          </div>

          <div style="display:flex;gap:14px;align-items:flex-start;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px">
            <div style="width:28px;height:28px;border-radius:50%;background:#3b82f6;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">2</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px">Lisää sivustosi ja kopioi asennuskoodi</div>
              <div style="font-size:12px;color:#64748b;margin-bottom:8px">Luo sivusto ja kopioi <strong>yksi koodi</strong> sivustosi &lt;head&gt;-osioon. Se riittää kaikille elementeille.</div>
              <a href="#settings" id="goto-settings-link" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#3b82f6;text-decoration:none">
                <i class="fa fa-code"></i> Asennuskoodi-välilehti →
              </a>
            </div>
          </div>

          <div style="display:flex;gap:14px;align-items:flex-start;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px">
            <div style="width:28px;height:28px;border-radius:50%;background:#3b82f6;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">3</div>
            <div>
              <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px">Aktivoi elementti togglella</div>
              <div style="font-size:12px;color:#64748b">Elementtikortin toggle = päällä → elementti on heti live sivustollasi. Toggle = pois → elementti piilotetaan.</div>
            </div>
          </div>

        </div>

        <!-- Vinkki -->
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 14px;display:flex;align-items:flex-start;gap:8px">
          <span style="font-size:16px;flex-shrink:0">💡</span>
          <span style="font-size:12px;color:#1d4ed8"><strong>Yksi koodi riittää kaikelle:</strong> Kun asennuskoodi on sivustolla, kaikki luomasi elementit aktivoituvat automaattisesti ilman lisäkoodia. Voit luoda sticky barin, popupin ja lead formin – ne kaikki toimivat samalla yhdellä koodirivillä.</span>
        </div>

      </div>`;
    grid.querySelectorAll('[data-quick]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('open-editor', { detail: { elementType: btn.dataset.quick } }));
      });
    });
    // Asennuskoodi-linkki navigoi settings-näkymään
    grid.querySelector('#goto-settings-link')?.addEventListener('click', e => {
      e.preventDefault();
      window.location.hash = '#settings';
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
  if (end   && now > end)   return { label: '● Aikarajoitus päättyi', color: '#f59e0b' };
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
  const site = el.siteId ? cachedSites.find(s => String(s._id) === String(el.siteId)) : null;
  const siteBadge = site ? `<span style="font-size:10px;color:#3b82f6;background:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;padding:1px 6px;margin-left:6px">🌐 ${escHtml(site.name)}</span>` : '';
  const active = el.active !== false;
  let subtitle = '';
  if (type === 'sticky_bar') subtitle = cfg.barText ? cfg.barText.substring(0, 50) + (cfg.barText.length > 50 ? '…' : '') : '';
  else if (type === 'fab') subtitle = (cfg.fabPosition || '') + (cfg.fabAction ? ' · ' + cfg.fabAction : '');
  else if (type === 'slide_in') subtitle = 'Triggeri: ' + (cfg.slideInTrigger || 'time');
  else if (type === 'popup') subtitle = (cfg.popupMode || 'text') === 'image' ? '📸 Kuvapopup' : '✏️ Tekstipopup';
  else subtitle = el.content ? el.content.replace(/<[^>]*>/g, '').substring(0, 50) : '';

  const isDeleting = pendingDeleteId === el._id;

  return `
    <div class="element-card el-card" data-id="${el._id}">
      <div class="element-card-header">
        <div class="el-drag-handle" title="Järjestä vetämällä" style="cursor:grab;color:#cbd5e1;padding:0 6px 0 0;font-size:18px;line-height:1;user-select:none">⠿</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
            <span class="badge ${meta.badge}"><i class="fa ${meta.icon}"></i> ${meta.label}</span>
            <span style="font-size:11px;color:${status.color};font-weight:500">${status.label}</span>
            ${siteBadge}
          </div>
          <div class="element-card-title">${escHtml(el.name)}</div>
          <div class="element-card-meta">${escHtml(subtitle)}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
          <button data-action="toggle" data-id="${el._id}" title="${active ? 'Deaktivoi' : 'Aktivoi elementti'}"
            style="width:38px;height:22px;border-radius:11px;background:${active ? '#22c55e' : '#cbd5e1'};position:relative;cursor:pointer;border:none;padding:0;flex-shrink:0;transition:background 0.15s">
            <span style="width:18px;height:18px;border-radius:50%;background:#fff;position:absolute;top:2px;left:${active ? '18px' : '2px'};transition:left 0.15s;box-shadow:0 1px 2px rgba(0,0,0,0.2);display:block"></span>
          </button>
          <div style="font-size:11px;color:#94a3b8;white-space:nowrap">${date}</div>
        </div>
      </div>
      <div class="element-card-stats">
        <div class="stat-item">
          <div class="stat-value">${views}</div>
          <div class="stat-label">Näytöt</div>
        </div>
        ${type !== 'stats_only' ? `
        <div class="stat-item">
          <div class="stat-value">${clicks}</div>
          <div class="stat-label">Klikkaukset</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${ctr}%</div>
          <div class="stat-label">CTR</div>
        </div>` : ''}
      </div>
      <div class="element-card-actions">
        ${isDeleting ? `
          <span style="font-size:13px;color:#64748b;flex:1">Poistetaanko elementti?</span>
          <button class="btn btn-danger btn-sm" data-action="delete-confirm" data-id="${el._id}">
            <i class="fa fa-check"></i> Kyllä, poista
          </button>
          <button class="btn btn-secondary btn-sm" data-action="delete-cancel" data-id="${el._id}">
            Peruuta
          </button>
        ` : `
          <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${el._id}">
            <i class="fa fa-edit"></i> Muokkaa
          </button>
          <button class="btn btn-secondary btn-sm" data-action="stats" data-id="${el._id}">
            <i class="fa fa-chart-bar"></i> Tilastot
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${el._id}" style="margin-left:auto">
            <i class="fa fa-trash"></i>
          </button>
        `}
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
  } else if (action === 'toggle') {
    const el = allElements.find(e => e._id === id);
    if (!el) return;
    const newActive = el.active === false ? true : false;
    el.active = newActive;
    renderList();
    try {
      const r = await fetch('/api/popups/' + id + '/toggle-active', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive }),
      });
      if (!r.ok) throw new Error();
      showToast(newActive ? 'Elementti aktivoitu' : 'Elementti pois käytöstä');
    } catch {
      el.active = !newActive;
      renderList();
      showToast('Tilan muutos epäonnistui', 'error');
    }
  } else if (action === 'delete') {
    pendingDeleteId = id;
    renderList();
  } else if (action === 'delete-cancel') {
    pendingDeleteId = null;
    renderList();
  } else if (action === 'delete-confirm') {
    try {
      const r = await fetch('/api/popups/' + id, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      showToast('Elementti poistettu');
      allElements = allElements.filter(e => e._id !== id);
      pendingDeleteId = null;
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
