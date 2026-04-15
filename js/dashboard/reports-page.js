// js/dashboard/reports-page.js
// Raportit-sivu: aikavälisuodatus, tilastokortit, top-elementit, liidit

import { showToast } from './dashboard-main.js';

let cachedSites   = [];
let cachedPopups  = [];
let currentRange  = 'week';  // 'today' | 'week' | 'month' | 'all' | 'custom'
let customFrom    = '';
let customTo      = '';
let filterPopupId = '';
let filterSiteId  = '';
let initialized   = false;

// ─── Julkinen init ────────────────────────────────────────────────────────────

export function initReportsPage() {
  // Kuuntele näkymän vaihtoa
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#reports') onEnter();
  });
  if (window.location.hash === '#reports') onEnter();
}

async function onEnter() {
  const container = document.getElementById('reports-content');
  if (!container) return;

  if (!initialized) {
    // Lataa sivustot + popupit suodattimia varten
    await Promise.all([loadSites(), loadPopups()]);
    initialized = true;
  }

  renderShell(container);
  loadReport();
}

// ─── Data-lataus ─────────────────────────────────────────────────────────────

async function loadSites() {
  try {
    const r = await fetch('/api/sites');
    if (r.ok) cachedSites = await r.json();
  } catch {}
}

async function loadPopups() {
  try {
    const r = await fetch('/api/popups');
    if (r.ok) cachedPopups = await r.json(); // stats_only mukaan — ne näyttävät kävijämäärät
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
    if (!r.ok) throw new Error('Virhe');
    const data = await r.json();
    renderResults(data, from, to);
  } catch {
    if (resultsEl) resultsEl.innerHTML = `<div style="color:#ef4444;padding:24px">Raportin lataus epäonnistui.</div>`;
  }
}

// ─── Rakenne ──────────────────────────────────────────────────────────────────

function renderShell(container) {
  const sitesOpts = cachedSites.map(s =>
    `<option value="${s._id}">${esc(s.name)}${s.domain ? ' ('+esc(s.domain)+')' : ''}</option>`
  ).join('');

  // Suodata elementit nykyisen sivustosuodattimen mukaan
  const visiblePopups = cachedPopups.filter(p => {
    if (!filterSiteId) return true;
    if (filterSiteId === '_none') return !p.siteId;
    return String(p.siteId) === filterSiteId;
  });
  const popupOpts = visiblePopups.map(p =>
    `<option value="${p._id}">${esc(p.name)}${p.elementType === 'stats_only' ? ' 📊' : ''}</option>`
  ).join('');

  container.innerHTML = `
    <div style="max-width:960px">

      <!-- Otsikkorivi -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div>
          <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin:0">Raportit</h2>
          <p style="font-size:13px;color:#64748b;margin:4px 0 0">Näytöt, klikkaukset ja liidit valitulta ajanjaksolta</p>
        </div>
        <button id="rpt-email-btn" class="btn btn-secondary btn-sm" style="gap:6px">
          <i class="fa fa-envelope"></i> Lähetä sähköpostiin
        </button>
      </div>

      <!-- Aikavälipalkit -->
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        ${['today','week','month','all','custom'].map(k => {
          const labels = { today:'Tänään', week:'Tämä viikko', month:'Tämä kuukausi', all:'Kaikki aika', custom:'Muokkaa...' };
          const active = currentRange === k;
          return `<button class="rpt-range-btn" data-range="${k}"
            style="padding:7px 14px;border:2px solid ${active?'#3b82f6':'#e2e8f0'};border-radius:20px;
            background:${active?'#eff6ff':'#fff'};color:${active?'#1d4ed8':'#374151'};
            font-size:13px;font-weight:${active?'700':'500'};cursor:pointer;transition:all 0.15s">
            ${labels[k]}
          </button>`;
        }).join('')}
      </div>

      <!-- Muokkaa-aikaväli (piilotettu) -->
      <div id="rpt-custom-row" style="display:${currentRange==='custom'?'flex':'none'};gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px">
        <div style="display:flex;align-items:center;gap:8px">
          <label style="font-size:12px;font-weight:600;color:#374151">Alkaen</label>
          <input type="date" id="rpt-from" value="${customFrom}" style="padding:7px 10px;border:1px solid #d1d5db;border-radius:7px;font-size:13px">
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <label style="font-size:12px;font-weight:600;color:#374151">Saakka</label>
          <input type="date" id="rpt-to" value="${customTo}" style="padding:7px 10px;border:1px solid #d1d5db;border-radius:7px;font-size:13px">
        </div>
        <button id="rpt-apply-custom" class="btn btn-primary btn-sm">Hae</button>
      </div>

      <!-- Suodattimet -->
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
        ${cachedSites.length ? `
        <select id="rpt-site-filter" style="font-size:13px;padding:7px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#374151;cursor:pointer">
          <option value="">Kaikki sivustot</option>
          ${sitesOpts}
          <option value="_none">– Ei sivustoa –</option>
        </select>` : ''}
        ${cachedPopups.length ? `
        <select id="rpt-popup-filter" style="font-size:13px;padding:7px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#374151;cursor:pointer">
          <option value="">Kaikki elementit</option>
          ${popupOpts}
        </select>` : ''}
      </div>

      <!-- Tulokset -->
      <div id="report-results">
        ${loadingHTML()}
      </div>

    </div>`;

  // Event listeners
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
    filterPopupId = ''; // nollaa elementtisuodin kun sivusto vaihtuu
    updatePopupDropdown(filterSiteId);
    loadReport();
  });
  document.getElementById('rpt-popup-filter')?.addEventListener('change', e => {
    filterPopupId = e.target.value;
    loadReport();
  });

  document.getElementById('rpt-email-btn')?.addEventListener('click', sendReportEmail);

  // Palauta suodatinvalinnat
  if (filterSiteId)  { const el = document.getElementById('rpt-site-filter');  if (el) el.value = filterSiteId; }
  if (filterPopupId) { const el = document.getElementById('rpt-popup-filter'); if (el) el.value = filterPopupId; }
}

// ─── Tulokset ─────────────────────────────────────────────────────────────────

function renderResults(data, from, to) {
  const el = document.getElementById('report-results');
  if (!el) return;

  const { period, allTime, topElements, recentLeads } = data;
  const ctr = period.views > 0 ? ((period.clicks / period.views) * 100).toFixed(1) : '0.0';
  const allCtr = allTime.views > 0 ? ((allTime.clicks / allTime.views) * 100).toFixed(1) : '0.0';

  const periodLabel = currentRange === 'all' ? 'Kaikki aika' :
    currentRange === 'today' ? 'Tänään' :
    currentRange === 'week'  ? 'Tämä viikko' :
    currentRange === 'month' ? 'Tämä kuukausi' :
    (from && to ? `${fmtDate(from)} – ${fmtDate(to)}` : 'Valittu aikaväli');

  el.innerHTML = `
    <!-- Jakso-kortit -->
    <div style="margin-bottom:8px">
      <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:10px">
        ${esc(periodLabel)}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px">
        ${statCard('👁️', period.views,  'Näyttöä',     '#fff', '#3b82f6')}
        ${statCard('🖱️', period.clicks, 'Klikkausta',  '#fff', '#3b82f6')}
        ${statCard('📋', period.leads,  'Liidiä',       '#fff', '#3b82f6')}
        ${statCard('📈', ctr + '%',     'CTR',          '#fff', '#3b82f6')}
      </div>
    </div>

    <!-- Kaikki-aika-kortit -->
    <div style="margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:10px">
        Kaikki aika yhteensä
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">
        ${statCard('👁️', allTime.views,  'Näyttöä',    '#f8fafc', '#94a3b8')}
        ${statCard('🖱️', allTime.clicks, 'Klikkausta', '#f8fafc', '#94a3b8')}
        ${statCard('📋', allTime.leads,  'Liidiä',      '#f8fafc', '#94a3b8')}
        ${statCard('📈', allCtr + '%',   'CTR',         '#f8fafc', '#94a3b8')}
      </div>
    </div>

    <!-- Kaksi saraketta: top-elementit + liidit -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">

      <!-- Top-elementit -->
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">🏆</span>
          <span style="font-size:14px;font-weight:700;color:#0f172a">Top elementit</span>
          <span style="font-size:11px;color:#94a3b8;margin-left:auto">${esc(periodLabel)}</span>
        </div>
        ${topElements.length ? `
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:10px 16px;font-size:11px;font-weight:600;color:#94a3b8;text-align:left">Nimi</th>
              <th style="padding:10px 8px;font-size:11px;font-weight:600;color:#94a3b8;text-align:right">Näytöt</th>
              <th style="padding:10px 8px;font-size:11px;font-weight:600;color:#94a3b8;text-align:right">Klikkaukset</th>
              <th style="padding:10px 16px;font-size:11px;font-weight:600;color:#94a3b8;text-align:right">Liidit</th>
            </tr>
          </thead>
          <tbody>
            ${topElements.map((el, i) => {
              const isStats = el.type === 'stats_only';
              return `
              <tr style="border-top:1px solid #f1f5f9;${i%2===1?'background:#fafbfc':''}">
                <td style="padding:10px 16px">
                  <div style="font-size:13px;font-weight:600;color:#0f172a">${esc(el.name)}</div>
                  <div style="font-size:11px;color:#94a3b8">${typeBadge(el.type)}</div>
                </td>
                <td style="padding:10px 8px;font-size:13px;color:#374151;text-align:right">${el.views}</td>
                <td style="padding:10px 8px;font-size:13px;color:#94a3b8;text-align:right">${isStats ? '–' : el.clicks}</td>
                <td style="padding:10px 16px;font-size:13px;font-weight:700;color:${isStats?'#94a3b8':'#1d4ed8'};text-align:right">${isStats ? '–' : el.leads}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>` : `
        <div style="padding:32px;text-align:center;color:#94a3b8;font-size:13px">
          Ei dataa valitulle jaksolle.<br>
          <span style="font-size:12px">Data kertyy tästä päivästä alkaen.</span>
        </div>`}
      </div>

      <!-- Viimeisimmät liidit -->
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">📋</span>
          <span style="font-size:14px;font-weight:700;color:#0f172a">Viimeisimmät liidit</span>
          ${recentLeads.length ? `<span style="font-size:11px;color:#3b82f6;font-weight:600;margin-left:auto;background:#eff6ff;padding:2px 8px;border-radius:10px">${recentLeads.length} kpl</span>` : ''}
        </div>
        ${recentLeads.length ? `
        <div style="max-height:420px;overflow-y:auto">
          ${recentLeads.map(l => {
            const preview = Object.values(l.data || {}).filter(Boolean).slice(0, 2).join(' · ') || '(tyhjä)';
            return `<div style="padding:12px 16px;border-bottom:1px solid #f8fafc">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
                <div style="flex:1;min-width:0">
                  <div style="font-size:12px;font-weight:600;color:#64748b;margin-bottom:2px">${esc(l.popupName)}</div>
                  <div style="font-size:13px;color:#0f172a;word-break:break-word">${esc(preview)}</div>
                </div>
                <div style="font-size:11px;color:#94a3b8;white-space:nowrap;flex-shrink:0">${fmtDate(l.submittedAt)}</div>
              </div>
            </div>`;
          }).join('')}
        </div>` : `
        <div style="padding:32px;text-align:center;color:#94a3b8;font-size:13px">
          Ei liidejä valitulle jaksolle.
        </div>`}
      </div>

    </div>`;
}

// ─── Sähköpostilähetys ────────────────────────────────────────────────────────

async function sendReportEmail() {
  const btn = document.getElementById('rpt-email-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Lähetetään...'; }

  const { from, to } = getDateRange();
  try {
    const r = await fetch('/api/reports/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, popupId: filterPopupId, siteId: filterSiteId }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Virhe');
    showToast(`✓ Raportti lähetetty osoitteeseen ${data.to}`);
  } catch (e) {
    showToast(e.message || 'Lähetys epäonnistui', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-envelope"></i> Lähetä sähköpostiin'; }
  }
}

// ─── Apufunktiot ──────────────────────────────────────────────────────────────

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

const TYPE_LABELS = {
  sticky_bar: 'Sticky Bar', fab: 'Floating Button',
  slide_in: 'Slide-in', popup: 'Popup', lead_form: 'Lead Form',
  stats_only: '📊 Tilastojen kerääjä',
};
function typeBadge(type) { return TYPE_LABELS[type] || type; }

/**
 * Päivittää elementtisuodattimen dropdownin sivustosuodatuksen mukaan.
 * Jos siteId on tyhjä → kaikki elementit; '_none' → vain sivustoitta; muuten suodata siteId:llä.
 */
function updatePopupDropdown(siteId) {
  const select = document.getElementById('rpt-popup-filter');
  if (!select) return;

  const filtered = cachedPopups.filter(p => {
    if (!siteId) return true;
    if (siteId === '_none') return !p.siteId;
    return String(p.siteId) === siteId;
  });

  select.innerHTML = `<option value="">Kaikki elementit</option>` +
    filtered.map(p => `<option value="${p._id}">${esc(p.name)}${p.elementType === 'stats_only' ? ' 📊' : ''}</option>`).join('');
  select.value = ''; // nollaa valinta
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fi-FI');
}

function loadingHTML() {
  return `<div style="display:flex;align-items:center;gap:10px;color:#94a3b8;padding:32px 0">
    <i class="fa fa-spinner fa-spin"></i> <span>Ladataan...</span>
  </div>`;
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
