// js/dashboard/reports-page.js
// Reports page: time range filtering, stat cards, top elements, leads

import { showToast } from './dashboard-main.js';
import { t, getCurrentLanguage } from '../i18n.js';

let cachedSites   = [];
let cachedPopups  = [];
let currentRange  = 'week';  // 'today' | 'week' | 'month' | 'all' | 'custom'
let customFrom    = '';
let customTo      = '';
let filterPopupId = '';
let filterSiteId  = '';
let initialized   = false;

function locale() {
  return getCurrentLanguage() === 'fi' ? 'fi-FI' : 'en-GB';
}

// ─── Public init ──────────────────────────────────────────────────────────────

export function initReportsPage() {
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#reports') onEnter();
  });
  if (window.location.hash === '#reports') onEnter();
}

async function onEnter() {
  const container = document.getElementById('reports-content');
  if (!container) return;

  if (!initialized) {
    await loadSites();
    initialized = true;
  }
  await loadPopups();

  renderShell(container);
  loadReport();
}

// ─── Data loading ─────────────────────────────────────────────────────────────

async function loadSites() {
  try {
    const r = await fetch('/api/sites');
    if (r.ok) cachedSites = await r.json();
  } catch {}
}

async function loadPopups() {
  try {
    const r = await fetch('/api/popups');
    if (r.ok) cachedPopups = await r.json();
  } catch {}
}

function getDateRange() {
  const now  = new Date();
  const pad  = n => String(n).padStart(2, '0');
  const ymd  = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const today = ymd(now);

  if (currentRange === 'today') return { from: today, to: today };
  if (currentRange === 'week') {
    const day = now.getDay() || 7;
    const mon = new Date(now); mon.setDate(now.getDate() - day + 1);
    return { from: ymd(mon), to: today };
  }
  if (currentRange === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: ymd(first), to: today };
  }
  if (currentRange === 'all') return { from: '', to: '' };
  return { from: customFrom, to: customTo };
}

async function loadReport() {
  const container = document.getElementById('reports-content');
  if (!container) return;

  const resultsEl = document.getElementById('report-results');
  if (resultsEl) resultsEl.innerHTML = loadingHTML();

  const { from, to } = getDateRange();
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to)   params.set('to',   to);
  if (filterPopupId) params.set('popupId', filterPopupId);
  if (filterSiteId)  params.set('siteId',  filterSiteId);

  try {
    const r = await fetch('/api/reports?' + params.toString());
    if (!r.ok) throw new Error('error');
    const data = await r.json();
    renderResults(data, from, to);
  } catch {
    if (resultsEl) resultsEl.innerHTML = `<div style="color:#ef4444;padding:24px">${t('rpt.error')}</div>`;
  }
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function renderShell(container) {
  const sitesOpts = cachedSites.map(s =>
    `<option value="${s._id}">${esc(s.name)}${s.domain ? ' ('+esc(s.domain)+')' : ''}</option>`
  ).join('');

  const visiblePopups = cachedPopups.filter(p => {
    if (!filterSiteId) return true;
    if (filterSiteId === '_none') return !p.siteId;
    return String(p.siteId) === filterSiteId;
  });
  const popupOpts = visiblePopups.map(p =>
    `<option value="${p._id}">${esc(p.name)}${p.elementType === 'stats_only' ? ' 📊' : ''}</option>`
  ).join('');

  const rangeKeys = ['today','week','month','all','custom'];
  const rangeLabels = {
    today: t('rpt.range.today'), week: t('rpt.range.week'),
    month: t('rpt.range.month'), all: t('rpt.range.all'), custom: t('rpt.range.custom')
  };

  container.innerHTML = `
    <div style="max-width:960px">

      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div>
          <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin:0">${t('rpt.title')}</h2>
          <p style="font-size:13px;color:#64748b;margin:4px 0 0">${t('rpt.subtitle')}</p>
        </div>
        <button id="rpt-email-btn" class="btn btn-secondary btn-sm" style="gap:6px">
          <i class="fa fa-envelope"></i> ${t('rpt.emailBtn')}
        </button>
      </div>

      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        ${rangeKeys.map(k => {
          const active = currentRange === k;
          return `<button class="rpt-range-btn" data-range="${k}"
            style="padding:7px 14px;border:2px solid ${active?'#3b82f6':'#e2e8f0'};border-radius:20px;
            background:${active?'#eff6ff':'#fff'};color:${active?'#1d4ed8':'#374151'};
            font-size:13px;font-weight:${active?'700':'500'};cursor:pointer;transition:all 0.15s">
            ${rangeLabels[k]}
          </button>`;
        }).join('')}
      </div>

      <div id="rpt-custom-row" style="display:${currentRange==='custom'?'flex':'none'};gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px">
        <div style="display:flex;align-items:center;gap:8px">
          <label style="font-size:12px;font-weight:600;color:#374151">${t('rpt.from')}</label>
          <input type="date" id="rpt-from" value="${customFrom}" style="padding:7px 10px;border:1px solid #d1d5db;border-radius:7px;font-size:13px">
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <label style="font-size:12px;font-weight:600;color:#374151">${t('rpt.to')}</label>
          <input type="date" id="rpt-to" value="${customTo}" style="padding:7px 10px;border:1px solid #d1d5db;border-radius:7px;font-size:13px">
        </div>
        <button id="rpt-apply-custom" class="btn btn-primary btn-sm">${t('rpt.apply')}</button>
      </div>

      <div class="rpt-filter-row" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
        ${cachedSites.length ? `
        <select id="rpt-site-filter" style="font-size:13px;padding:7px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#374151;cursor:pointer">
          <option value="">${t('dash.allSites')}</option>
          ${sitesOpts}
          <option value="_none">${t('dash.noSite')}</option>
        </select>` : ''}
        ${cachedPopups.length ? `
        <select id="rpt-popup-filter" style="font-size:13px;padding:7px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#374151;cursor:pointer">
          <option value="">${t('dash.allElements')}</option>
          ${popupOpts}
        </select>` : ''}
      </div>

      <div id="report-results">
        ${loadingHTML()}
      </div>

    </div>`;

  container.querySelectorAll('.rpt-range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentRange = btn.dataset.range;
      renderShell(container);
      if (currentRange !== 'custom') loadReport();
    });
  });

  document.getElementById('rpt-apply-custom')?.addEventListener('click', () => {
    customFrom = document.getElementById('rpt-from')?.value || '';
    customTo   = document.getElementById('rpt-to')?.value   || '';
    loadReport();
  });

  document.getElementById('rpt-site-filter')?.addEventListener('change', e => {
    filterSiteId  = e.target.value;
    filterPopupId = '';
    updatePopupDropdown(filterSiteId);
    loadReport();
  });
  document.getElementById('rpt-popup-filter')?.addEventListener('change', e => {
    filterPopupId = e.target.value;
    loadReport();
  });

  document.getElementById('rpt-email-btn')?.addEventListener('click', sendReportEmail);

  if (filterSiteId)  { const el = document.getElementById('rpt-site-filter');  if (el) el.value = filterSiteId; }
  if (filterPopupId) { const el = document.getElementById('rpt-popup-filter'); if (el) el.value = filterPopupId; }
}

// ─── Results ──────────────────────────────────────────────────────────────────

function renderResults(data, from, to) {
  const el = document.getElementById('report-results');
  if (!el) return;

  const { period, allTime, topElements, recentLeads } = data;
  const ctr    = period.views  > 0 ? ((period.clicks  / period.views)  * 100).toFixed(1) : '0.0';
  const allCtr = allTime.views > 0 ? ((allTime.clicks / allTime.views) * 100).toFixed(1) : '0.0';

  const periodLabel = currentRange === 'all'   ? t('rpt.range.all') :
                      currentRange === 'today'  ? t('rpt.range.today') :
                      currentRange === 'week'   ? t('rpt.range.week') :
                      currentRange === 'month'  ? t('rpt.range.month') :
                      (from && to ? `${fmtDate(from)} – ${fmtDate(to)}` : t('rpt.period.custom'));

  const statsMap = {};
  topElements.forEach(e => { statsMap[String(e._id)] = e; });

  const allRows = cachedPopups
    .filter(p => {
      if (filterPopupId && String(p._id) !== filterPopupId) return false;
      if (filterSiteId === '_none' && p.siteId) return false;
      if (filterSiteId && filterSiteId !== '_none' && String(p.siteId) !== filterSiteId) return false;
      return true;
    })
    .map(p => {
      const s = statsMap[String(p._id)] || {};
      return {
        _id: p._id, name: p.name, elementType: p.elementType, siteId: p.siteId,
        views: s.views || 0, clicks: s.clicks || 0, leads: s.leads || 0,
        hasPT: !!(p.elementConfig?.trackPageLinks || p.elementConfig?.trackScroll)
      };
    })
    .sort((a, b) => b.views - a.views);

  const elLabel = filterPopupId
    ? (cachedPopups.find(p => String(p._id) === filterPopupId)?.name || t('rpt.element'))
    : `${t('rpt.elementsOf')} (${allRows.length})`;

  el.innerHTML = `
    <div style="margin-bottom:8px">
      <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:10px">${esc(periodLabel)}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px">
        ${statCard('👁️', period.views,  t('rpt.stat.views'),  '#fff', '#3b82f6')}
        ${statCard('🖱️', period.clicks, t('rpt.stat.clicks'), '#fff', '#3b82f6')}
        ${statCard('📋', period.leads,  t('rpt.stat.leads'),  '#fff', '#3b82f6')}
        ${statCard('📈', ctr + '%',     'CTR',                '#fff', '#3b82f6')}
      </div>
    </div>

    <div style="margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:10px">${t('rpt.allTimeTotal')}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">
        ${statCard('👁️', allTime.views,  t('rpt.stat.views'),  '#f8fafc', '#94a3b8')}
        ${statCard('🖱️', allTime.clicks, t('rpt.stat.clicks'), '#f8fafc', '#94a3b8')}
        ${statCard('📋', allTime.leads,  t('rpt.stat.leads'),  '#f8fafc', '#94a3b8')}
        ${statCard('📈', allCtr + '%',   'CTR',                '#f8fafc', '#94a3b8')}
      </div>
    </div>

    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:20px">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px">
        <span style="font-size:16px">📊</span>
        <span style="font-size:14px;font-weight:700;color:#0f172a">${esc(elLabel)}</span>
        <span style="font-size:11px;color:#94a3b8;margin-left:auto">${esc(periodLabel)}</span>
      </div>
      ${allRows.length ? `
      <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;min-width:500px">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:9px 16px;font-size:11px;font-weight:600;color:#94a3b8;text-align:left">${t('rpt.col.name')}</th>
            <th style="padding:9px 8px;font-size:11px;font-weight:600;color:#94a3b8;text-align:right">${t('rpt.col.views')}</th>
            <th style="padding:9px 8px;font-size:11px;font-weight:600;color:#94a3b8;text-align:right">${t('rpt.col.clicks')}</th>
            <th style="padding:9px 8px;font-size:11px;font-weight:600;color:#94a3b8;text-align:right">CTR</th>
            <th style="padding:9px 16px;font-size:11px;font-weight:600;color:#94a3b8;text-align:right">${t('rpt.col.leads')}</th>
          </tr>
        </thead>
        <tbody>
          ${allRows.map((row, i) => {
            const isStats = row.elementType === 'stats_only';
            const rowCtr = row.views > 0 ? ((row.clicks / row.views) * 100).toFixed(1) : '0.0';
            const site = cachedSites.find(s => String(s._id) === String(row.siteId));
            const siteLabel = site ? esc(site.name) : '';
            return `
            <tr style="border-top:1px solid #f1f5f9;${i%2===1?'background:#fafbfc':''}">
              <td style="padding:10px 16px">
                <div style="display:flex;align-items:center;gap:6px">
                  <div>
                    <div style="font-size:13px;font-weight:600;color:#0f172a">${esc(row.name)}</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:1px">${typeBadge(row.elementType)}${siteLabel ? ' · <span style="color:#64748b">'+siteLabel+'</span>' : ''}</div>
                  </div>
                  ${row.hasPT ? `<button type="button" class="rpt-expand-btn" data-id="${row._id}"
                    style="margin-left:6px;padding:2px 7px;border:1px solid #e2e8f0;border-radius:5px;background:#f8fafc;cursor:pointer;font-size:11px;color:#64748b">▼</button>` : ''}
                </div>
                <div class="rpt-pt-detail" id="rpt-pt-${row._id}" style="display:none;margin-top:8px"></div>
              </td>
              <td style="padding:10px 8px;font-size:13px;color:#374151;text-align:right">${row.views.toLocaleString()}</td>
              <td style="padding:10px 8px;font-size:13px;color:#94a3b8;text-align:right">${isStats ? '–' : row.clicks.toLocaleString()}</td>
              <td style="padding:10px 8px;font-size:13px;text-align:right;color:${isStats?'#94a3b8':parseFloat(rowCtr)>5?'#16a34a':'#64748b'}">${isStats ? '–' : rowCtr+'%'}</td>
              <td style="padding:10px 16px;font-size:13px;font-weight:700;color:${isStats?'#94a3b8':'#1d4ed8'};text-align:right">${isStats ? '–' : row.leads}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      </div>` : `
      <div style="padding:32px;text-align:center;color:#94a3b8;font-size:13px">
        ${t('rpt.noData')}
      </div>`}
    </div>

    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px">
        <span style="font-size:16px">📋</span>
        <span style="font-size:14px;font-weight:700;color:#0f172a">${t('rpt.recentLeads')}</span>
        ${recentLeads.length ? `<span style="font-size:11px;color:#3b82f6;font-weight:600;margin-left:auto;background:#eff6ff;padding:2px 8px;border-radius:10px">${recentLeads.length}</span>` : ''}
      </div>
      ${recentLeads.length ? `
      <div style="max-height:400px;overflow-y:auto">
        ${recentLeads.map(l => {
          const preview = Object.values(l.data || {}).filter(Boolean).slice(0, 2).join(' · ') || t('rpt.empty');
          const site = cachedSites.find(s => String(s._id) === String(l.siteId));
          const typeIcon = TYPE_ICONS[l.elementType] || '◻';
          const meta = [typeBadge(l.elementType), site ? esc(site.name) : ''].filter(Boolean).join(' · ');
          return `<div style="padding:12px 16px;border-bottom:1px solid #f8fafc">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
                  <span style="font-size:11px">${typeIcon}</span>
                  <span style="font-size:12px;font-weight:600;color:#64748b">${esc(l.popupName)}</span>
                </div>
                ${meta ? `<div style="font-size:11px;color:#94a3b8;margin-bottom:3px">${meta}</div>` : ''}
                <div style="font-size:13px;color:#0f172a;word-break:break-word">${esc(preview)}</div>
              </div>
              <div style="font-size:11px;color:#94a3b8;white-space:nowrap;flex-shrink:0">${fmtDate(l.submittedAt)}</div>
            </div>
          </div>`;
        }).join('')}
      </div>` : `
      <div style="padding:32px;text-align:center;color:#94a3b8;font-size:13px">${t('rpt.noLeads')}</div>`}
    </div>`;

  el.querySelectorAll('.rpt-expand-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const detail = document.getElementById('rpt-pt-' + id);
      if (!detail) return;
      if (detail.style.display !== 'none') {
        detail.style.display = 'none';
        btn.textContent = '▼';
        return;
      }
      btn.textContent = '▲';
      detail.style.display = 'block';
      if (detail.innerHTML) return;
      detail.innerHTML = `<span style="font-size:11px;color:#94a3b8">${t('dash.loading')}</span>`;
      await loadElementPageTracking(id, detail);
    });
  });
}

async function loadElementPageTracking(popupId, container) {
  let html = '';
  try {
    const [peRes, scrollRes] = await Promise.all([
      fetch('/api/popups/page-elements/' + popupId),
      fetch('/api/popups/scroll/' + popupId)
    ]);
    if (peRes.ok) {
      const elements = await peRes.json();
      if (elements.length) {
        const rows = elements.map(e => {
          const icon = e.type === 'link' ? '🔗' : e.type === 'manual' ? '🎯' : '🖱️';
          const text = esc((e.text || e.cssSelector || '').slice(0, 55));
          const href = e.href ? `<div style="font-size:10px;color:#94a3b8">${esc(e.href.slice(0, 50))}</div>` : '';
          return `<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;border-bottom:1px solid #f1f5f9">
            <span style="flex-shrink:0">${icon}</span>
            <div style="flex:1;min-width:0"><div style="font-size:11px;color:#374151">${text}</div>${href}</div>
            <span style="font-size:11px;font-weight:700;color:#3b82f6;white-space:nowrap">${e.clicks} ${t('rpt.clicksShort')}</span>
          </div>`;
        }).join('');
        html += `<div style="margin-bottom:10px">
          <div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:6px">📎 ${t('rpt.pageElements')} (${elements.length})</div>
          <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;max-height:240px;overflow-y:auto">${rows}</div>
        </div>`;
      }
    }
    if (scrollRes.ok) {
      const sd = await scrollRes.json();
      if (sd.summary?.sessions > 0) {
        const b = sd.buckets || {};
        const buckets = [
          { l:'0–25%', v: b.d25||0 }, { l:'25–50%', v: b.d50||0 },
          { l:'50–75%', v: b.d75||0 }, { l:'75–100%', v: b.d100||0 }
        ];
        const max = Math.max(...buckets.map(bk=>bk.v), 1);
        const bars = buckets.map(bk => {
          const pct = Math.round((bk.v / max) * 100);
          return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
            <span style="width:44px;font-size:10px;color:#64748b;text-align:right">${bk.l}</span>
            <div style="flex:1;background:#f1f5f9;border-radius:3px;height:10px">
              <div style="width:${pct}%;background:#3b82f6;height:100%;border-radius:3px"></div>
            </div>
            <span style="width:28px;font-size:10px;color:#374151;font-weight:600">${bk.v}</span>
          </div>`;
        }).join('');
        html += `<div>
          <div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:6px">📊 ${t('rpt.scroll.label')} — ${sd.summary.sessions} ${t('rpt.sessions')} ${sd.summary.avgDepth}%</div>
          ${bars}
        </div>`;
      }
    }
  } catch {}
  container.innerHTML = html || `<span style="font-size:11px;color:#94a3b8">${t('rpt.noPageTracking')}</span>`;
}

// ─── Email send ───────────────────────────────────────────────────────────────

async function sendReportEmail() {
  const btn = document.getElementById('rpt-email-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa fa-spinner fa-spin"></i> ${t('rpt.sending')}`; }

  const { from, to } = getDateRange();
  try {
    const r = await fetch('/api/reports/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, popupId: filterPopupId, siteId: filterSiteId }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'error');
    showToast(`${t('rpt.emailSent')} ${data.to}`);
  } catch (e) {
    showToast(e.message || t('rpt.emailFailed'), 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa fa-envelope"></i> ${t('rpt.emailBtn')}`; }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statCard(icon, value, label, bg, accentColor) {
  return `
    <div style="background:${bg};border:1px solid #e2e8f0;border-radius:12px;padding:18px 16px;
      box-shadow:0 1px 3px rgba(0,0,0,0.05);transition:transform 0.15s"
      onmouseenter="this.style.transform='translateY(-2px)'"
      onmouseleave="this.style.transform=''">
      <div style="font-size:22px;margin-bottom:6px">${icon}</div>
      <div style="font-size:28px;font-weight:800;color:#0f172a;line-height:1">${value}</div>
      <div style="font-size:12px;color:#64748b;margin-top:5px;font-weight:500">${label}</div>
    </div>`;
}

const TYPE_LABELS = () => ({
  sticky_bar: 'Sticky Bar', fab: 'Floating Button',
  slide_in: 'Slide-in', popup: 'Popup', lead_form: 'Lead Form',
  stats_only: t('rpt.type.stats'),
});
const TYPE_ICONS = {
  sticky_bar: '📌', fab: '🔘', slide_in: '💬',
  popup: '⬜', lead_form: '📝', stats_only: '📊',
};
function typeBadge(type) { return TYPE_LABELS()[type] || type; }

function updatePopupDropdown(siteId) {
  const select = document.getElementById('rpt-popup-filter');
  if (!select) return;

  const filtered = cachedPopups.filter(p => {
    if (!siteId) return true;
    if (siteId === '_none') return !p.siteId;
    return String(p.siteId) === siteId;
  });

  select.innerHTML = `<option value="">${t('dash.allElements')}</option>` +
    filtered.map(p => `<option value="${p._id}">${esc(p.name)}${p.elementType === 'stats_only' ? ' 📊' : ''}</option>`).join('');
  select.value = '';
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString(locale());
}

function loadingHTML() {
  return `<div style="display:flex;align-items:center;gap:10px;color:#94a3b8;padding:32px 0">
    <i class="fa fa-spinner fa-spin"></i> <span>${t('dash.loading')}</span>
  </div>`;
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
