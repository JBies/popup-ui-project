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

const TYPE_EMBED = {
  sticky_bar: 'ui-embed.js',
  fab:        'ui-embed.js',
  slide_in:   'ui-embed.js',
  popup:      'popup-embed.js'
};
const TYPE_FN = {
  sticky_bar: 'ShowElement',
  fab:        'ShowElement',
  slide_in:   'ShowElement',
  popup:      'ShowPopup'
};

export function openStats(el) {
  const root = document.getElementById('modal-root');
  if (!root) return;

  root.innerHTML = buildStatsHTML(el);
  loadStats(el._id, el);
  renderStatusRow(el);

  root.querySelector('#close-stats')?.addEventListener('click', () => { root.innerHTML = ''; });
  root.querySelector('#reset-stats')?.addEventListener('click', () => resetStats(el._id, el));
  root.querySelector('#copy-embed')?.addEventListener('click', () => copyEmbed(el));
  root.querySelector('#stats-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'stats-overlay') root.innerHTML = '';
  });
}

function buildStatsHTML(el) {
  const type = el.elementType || 'popup';
  const embedFile = TYPE_EMBED[type] || 'ui-embed.js';
  const embedFn   = TYPE_FN[type] || 'ShowElement';
  const embedCode = `<script src="https://popupmanager.net/${embedFile}"><\/script>\n<script>\n  window.addEventListener('load', function() {\n    ${embedFn}('${el._id}');\n  });\n<\/script>`;

  return `
    <div class="modal-overlay" id="stats-overlay">
      <div class="modal" style="max-width:520px">
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
        <div style="font-size:12px;color:#94a3b8;margin-bottom:20px" id="s-dates"></div>

        <div style="margin-bottom:20px">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin-bottom:8px">Embed-koodi</div>
          <div style="background:#1e293b;border-radius:8px;padding:14px;position:relative">
            <pre id="embed-code-pre" style="color:#e2e8f0;font-family:monospace;font-size:11px;white-space:pre-wrap;word-break:break-all;margin:0">${escHtml(embedCode)}</pre>
            <button class="btn btn-secondary btn-sm" id="copy-embed" style="position:absolute;top:8px;right:8px;background:#334155;color:#94a3b8;border:none">
              <i class="fa fa-copy"></i> Kopioi
            </button>
          </div>
        </div>

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

function copyEmbed(el) {
  const pre = document.getElementById('embed-code-pre');
  if (!pre) return;
  const text = pre.textContent;
  navigator.clipboard.writeText(text).then(() => showToast('Embed-koodi kopioitu!'));
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
