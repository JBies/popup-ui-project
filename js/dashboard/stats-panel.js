// js/dashboard/stats-panel.js
import { showToast } from './dashboard-main.js';

const TYPE_LABELS = {
  sticky_bar: 'Sticky Bar', fab: 'Floating Button', slide_in: 'Slide-in',
  popup: 'Popup', social_proof: 'Social Proof', scroll_progress: 'Scroll Progress', lead_form: 'Lead Form'
};

function getTimingStatus(el) {
  const now = new Date();
  const timing = el.timing || {};
  const start = timing.startDate && timing.startDate !== 'default' ? new Date(timing.startDate) : null;
  const end   = timing.endDate   && timing.endDate   !== 'default' ? new Date(timing.endDate)   : null;
  if (el.active === false) return { label: '● Ei käytössä',         color: '#ef4444' };
  if (end   && now > end)   return { label: '● Kampanja päättynyt', color: '#f59e0b' };
  if (start && now < start) return { label: `● Alkaa ${start.toLocaleDateString('fi-FI')}`, color: '#64748b' };
  return { label: '● Aktiivinen', color: '#10b981' };
}

export function openStats(el) {
  const root = document.getElementById('modal-root');
  if (!root) return;

  root.innerHTML = buildStatsHTML(el);
  loadStats(el._id, el);
  renderStatusRow(el);

  const cfg = el.elementConfig || {};
  if (cfg.trackPageLinks || cfg.trackScroll) loadPageTrackingStats(el._id, cfg);

  root.querySelectorAll('#close-stats').forEach(btn => btn.addEventListener('click', () => { root.innerHTML = ''; }));
  root.querySelector('#reset-stats')?.addEventListener('click', () => resetStats(el._id, el));
  root.querySelector('#stats-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'stats-overlay') root.innerHTML = '';
  });
}

function buildStatsHTML(el) {
  const cfg = el.elementConfig || {};
  const hasTracking = cfg.trackPageLinks || cfg.trackScroll;

  return `
    <div class="modal-overlay" id="stats-overlay">
      <div class="modal" style="max-width:560px">
        <div class="modal-header">
          <h2><i class="fa fa-chart-bar" style="color:var(--primary);margin-right:8px"></i>${escHtml(el.name)}</h2>
          <button class="modal-close" id="close-stats">✕</button>
        </div>

        <div id="s-status" style="margin-bottom:14px"></div>
        <div id="stats-cards" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
          <div class="stat-card"><div class="stat-value" id="s-views">–</div><div class="stat-label">Näytöt</div></div>
          <div class="stat-card"><div class="stat-value" id="s-clicks">–</div><div class="stat-label">Klikkaukset</div></div>
          <div class="stat-card"><div class="stat-value" id="s-ctr">–</div><div class="stat-label">CTR</div></div>
        </div>
        <div style="font-size:12px;color:#94a3b8;margin-bottom:16px" id="s-dates"></div>

        ${hasTracking ? `<div id="s-page-tracking" style="margin-bottom:20px"></div>` : ''}

        <div style="display:flex;justify-content:space-between;align-items:center">
          <button class="btn btn-danger btn-sm" id="reset-stats">
            <i class="fa fa-redo"></i> Nollaa tilastot
          </button>
          <button class="btn btn-secondary" id="close-stats">Sulje</button>
        </div>
      </div>
    </div>

    <style>
      .stat-card { background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center; }
      .stat-card .stat-value { font-size:24px;font-weight:700;color:#0f172a; }
      .stat-card .stat-label { font-size:11px;color:#64748b;margin-top:2px; }
    </style>`;
}

function renderStatusRow(el) {
  const sd = document.getElementById('s-status');
  if (!sd) return;
  const status = getTimingStatus(el);
  const typeLabel = TYPE_LABELS[el.elementType] || el.elementType || 'Popup';
  const timing = el.timing || {};
  const start = timing.startDate && timing.startDate !== 'default' ? new Date(timing.startDate) : null;
  const end   = timing.endDate   && timing.endDate   !== 'default' ? new Date(timing.endDate)   : null;
  let dateRange = '';
  if (start && end) dateRange = `Voimassa: ${start.toLocaleDateString('fi-FI')}–${end.toLocaleDateString('fi-FI')}`;
  else if (start)   dateRange = `Alkaa: ${start.toLocaleDateString('fi-FI')}`;
  else if (end)     dateRange = `Päättyy: ${end.toLocaleDateString('fi-FI')}`;
  sd.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;flex-wrap:wrap">
      <span style="color:${status.color};font-size:13px;font-weight:600">${status.label}</span>
      <span style="color:#94a3b8;font-size:12px">·</span>
      <span style="color:#64748b;font-size:12px">${typeLabel}</span>
      ${dateRange ? `<span style="color:#94a3b8;font-size:12px">·</span><span style="color:#64748b;font-size:12px">${dateRange}</span>` : ''}
    </div>`;
}

async function loadStats(id, el) {
  try {
    const r = await fetch('/api/popups/stats/' + id);
    if (!r.ok) return;
    const s = await r.json();
    const sv = document.getElementById('s-views');
    const sc = document.getElementById('s-clicks');
    const sctr = document.getElementById('s-ctr');
    const sd = document.getElementById('s-dates');
    if (sv) sv.textContent = s.views ?? 0;
    if (sc) sc.textContent = s.clicks ?? 0;
    if (sctr) sctr.textContent = (s.clickThroughRate ?? '0.00') + '%';
    if (sd) {
      const parts = [];
      if (s.leads > 0)     parts.push(`📋 Liidejä: ${s.leads} kpl`);
      if (s.lastViewed)    parts.push('Viimeksi nähty: ' + new Date(s.lastViewed).toLocaleString('fi-FI'));
      if (s.lastClicked)   parts.push('Viimeksi klikattu: ' + new Date(s.lastClicked).toLocaleString('fi-FI'));
      if (s.statsResetAt)  parts.push('🔄 Nollattu: ' + new Date(s.statsResetAt).toLocaleString('fi-FI'));
      sd.innerHTML = parts.map(p => `<span>${p}</span>`).join(' <span style="color:#e2e8f0">·</span> ');
    }
  } catch {}
}

async function resetStats(id, el) {
  if (!confirm('Nollataan kaikki tilastot? Tätä ei voi peruuttaa.')) return;
  try {
    const r = await fetch('/api/popups/stats/' + id + '/reset', { method: 'POST' });
    if (!r.ok) throw new Error();
    showToast('Tilastot nollattu');
    loadStats(id, el);
    window.dispatchEvent(new CustomEvent('refresh-elements'));
  } catch {
    showToast('Nollaus epäonnistui', 'error');
  }
}

async function loadPageTrackingStats(popupId, cfg) {
  const container = document.getElementById('s-page-tracking');
  if (!container) return;

  let html = '';

  if (cfg.trackPageLinks) {
    try {
      const r = await fetch('/api/popups/page-elements/' + popupId);
      if (r.ok) {
        const elements = await r.json();
        if (elements.length) {
          const rows = elements.slice(0, 10).map(el => {
            const icon = el.type === 'link' ? 'fa-link' : 'fa-hand-pointer';
            const text = escHtml((el.text || el.cssSelector || '').slice(0, 50));
            const href = el.href ? `<span style="font-size:10px;color:#94a3b8;margin-left:4px">${escHtml(el.href.slice(0, 35))}</span>` : '';
            return `<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid #f1f5f9">
              <i class="fa ${icon}" style="color:#64748b;width:12px;font-size:11px"></i>
              <span style="flex:1;font-size:12px;color:#1e293b">${text}</span>${href}
              <span style="font-size:12px;font-weight:700;color:#3b82f6;white-space:nowrap">${el.clicks} klikk.</span>
            </div>`;
          }).join('');
          html += `<div style="margin-bottom:16px">
            <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px;display:flex;align-items:center;gap:6px">
              <i class="fa fa-mouse-pointer" style="color:#3b82f6"></i> Sivun elementit (top ${Math.min(elements.length, 10)})
            </div>
            <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">${rows}</div>
          </div>`;
        }
      }
    } catch {}
  }

  if (cfg.trackScroll) {
    try {
      const r = await fetch('/api/popups/scroll/' + popupId);
      if (r.ok) {
        const data = await r.json();
        const summary = data.summary || {};
        if (summary.sessions > 0) {
          const b = data.buckets || {};
          const buckets = [
            { label: '0–10%',   val: b.d10  || 0 },
            { label: '10–25%',  val: b.d25  || 0 },
            { label: '25–50%',  val: b.d50  || 0 },
            { label: '50–75%',  val: b.d75  || 0 },
            { label: '75–90%',  val: b.d90  || 0 },
            { label: '90–100%', val: b.d100 || 0 }
          ];
          const max = Math.max(...buckets.map(bk => bk.val), 1);
          const bars = buckets.map(bk => {
            const pct = Math.round((bk.val / max) * 100);
            return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="width:50px;font-size:11px;color:#64748b;text-align:right">${bk.label}</span>
              <div style="flex:1;background:#f1f5f9;border-radius:3px;height:12px">
                <div style="width:${pct}%;background:#3b82f6;height:100%;border-radius:3px"></div>
              </div>
              <span style="width:36px;font-size:11px;color:#374151;font-weight:600">${bk.val}</span>
            </div>`;
          }).join('');
          html += `<div>
            <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px;display:flex;align-items:center;gap:6px">
              <i class="fa fa-arrows-alt-v" style="color:#3b82f6"></i> Vierityskäyttäytyminen
              <span style="font-weight:400;color:#94a3b8;margin-left:4px">${summary.sessions} käyntiä · ka. ${summary.avgDepth}%</span>
            </div>
            ${bars}
          </div>`;
        }
      }
    } catch {}
  }

  if (html) {
    container.innerHTML = `<div style="border-top:1px solid #f1f5f9;padding-top:16px">${html}</div>`;
  }
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
