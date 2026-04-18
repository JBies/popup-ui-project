// js/dashboard/analytics-page.js

let cachedSites    = [];
let allElements    = [];
let filterSiteId   = '';
let analyticsReady = false;

export function initAnalyticsPage() {
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#analytics') onEnterAnalytics();
  });
  if (window.location.hash === '#analytics') onEnterAnalytics();
  window.addEventListener('refresh-elements', () => {
    if (window.location.hash === '#analytics') onEnterAnalytics();
  });
}

async function onEnterAnalytics() {
  if (!analyticsReady) {
    await Promise.all([
      fetch('/api/sites').then(r => r.ok ? r.json() : []).then(d => { cachedSites = d; }),
      fetch('/api/popups').then(r => r.ok ? r.json() : []).then(d => { allElements = d; }),
    ]);
    analyticsReady = true;
  }
  renderAnalytics();
}

function renderAnalytics() {
  const container = document.getElementById('analytics-content');
  if (!container) return;

  try {
    const elements = filterSiteId
      ? allElements.filter(el => filterSiteId === '_none' ? !el.siteId : String(el.siteId) === filterSiteId)
      : allElements;

    const totals = elements.reduce((acc, el) => {
      acc.views  += el.statistics?.views  || 0;
      acc.clicks += el.statistics?.clicks || 0;
      acc.leads  += el.statistics?.leads  || 0;
      return acc;
    }, { views: 0, clicks: 0, leads: 0 });
    const ctr = totals.views > 0 ? ((totals.clicks / totals.views) * 100).toFixed(1) : '0.0';

    const maxViews = Math.max(...elements.map(el => el.statistics?.views || 0), 1);

    const TYPE_BADGE = {
      sticky_bar: 'badge-sticky', fab: 'badge-fab', slide_in: 'badge-slidein',
      popup: 'badge-popup', social_proof: 'badge-social', scroll_progress: 'badge-scroll',
      lead_form: 'badge-lead'
    };

    // Sivuvalitsin
    const siteOpts = cachedSites.map(s =>
      `<option value="${s._id}"${filterSiteId === String(s._id) ? ' selected' : ''}>${esc(s.name)}${s.domain ? ' ('+esc(s.domain)+')' : ''}</option>`
    ).join('');
    const siteFilter = cachedSites.length ? `
      <div style="margin-bottom:20px">
        <select id="analytics-site-filter" style="font-size:13px;padding:7px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#374151;cursor:pointer">
          <option value="">Kaikki sivustot</option>
          ${siteOpts}
          <option value="_none"${filterSiteId === '_none' ? ' selected' : ''}>– Ei sivustoa –</option>
        </select>
      </div>` : '';

    container.innerHTML = `
      ${siteFilter}
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px">
        ${[
          { label: 'Näyttöjä yhteensä', value: totals.views.toLocaleString(), icon: 'fa-eye', color: '#3b82f6' },
          { label: 'Klikkauksia',        value: totals.clicks.toLocaleString(), icon: 'fa-mouse-pointer', color: '#8b5cf6' },
          { label: 'Keskimäärin CTR',    value: ctr + '%', icon: 'fa-percentage', color: '#f59e0b' },
          { label: 'Liidit kerätty',     value: totals.leads.toLocaleString(), icon: 'fa-envelope', color: '#10b981' }
        ].map(s => `
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              <div style="width:36px;height:36px;border-radius:8px;background:${s.color}18;display:flex;align-items:center;justify-content:center">
                <i class="fa ${s.icon}" style="color:${s.color};font-size:15px"></i>
              </div>
              <span style="font-size:12px;color:#64748b;font-weight:500">${s.label}</span>
            </div>
            <div style="font-size:28px;font-weight:700;color:#0f172a">${s.value}</div>
          </div>`).join('')}
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:14px">Elementtien suorituskyky</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0">
              <th style="text-align:left;padding:10px 20px;font-weight:600;color:#475569">Elementti</th>
              <th style="text-align:left;padding:10px 12px;font-weight:600;color:#475569">Tyyppi</th>
              <th style="text-align:right;padding:10px 12px;font-weight:600;color:#475569">Näytöt</th>
              <th style="text-align:right;padding:10px 12px;font-weight:600;color:#475569">Klikkaukset</th>
              <th style="text-align:right;padding:10px 12px;font-weight:600;color:#475569">CTR</th>
              <th style="text-align:right;padding:10px 20px;font-weight:600;color:#475569">Liidit</th>
            </tr>
          </thead>
          <tbody>
            ${elements
              .sort((a, b) => (b.statistics?.views || 0) - (a.statistics?.views || 0))
              .map(el => {
                const v = el.statistics?.views || 0;
                const c = el.statistics?.clicks || 0;
                const l = el.statistics?.leads || 0;
                const elCtr = v > 0 ? ((c / v) * 100).toFixed(1) : '0.0';
                const pct = Math.round((v / maxViews) * 100);
                const badge = TYPE_BADGE[el.elementType] || 'badge-popup';
                return `<tr style="border-bottom:1px solid #f1f5f9">
                  <td style="padding:12px 20px">
                    <div style="font-weight:500;color:#0f172a">${el.name || 'Nimetön'}</div>
                    <div style="height:4px;background:#f1f5f9;border-radius:2px;margin-top:6px;width:120px">
                      <div style="height:4px;background:#3b82f6;border-radius:2px;width:${pct}%"></div>
                    </div>
                  </td>
                  <td style="padding:12px"><span class="badge ${badge}">${el.elementType}</span></td>
                  <td style="padding:12px;text-align:right;color:#0f172a;font-weight:500">${v.toLocaleString()}</td>
                  <td style="padding:12px;text-align:right;color:#0f172a">${c.toLocaleString()}</td>
                  <td style="padding:12px;text-align:right;color:${parseFloat(elCtr) > 5 ? '#16a34a' : '#64748b'}">${elCtr}%</td>
                  <td style="padding:12px 20px;text-align:right;color:#0f172a">${l > 0 ? l : '–'}</td>
                </tr>`;
              }).join('')}
          </tbody>
        </table>
      </div>`;
    document.getElementById('analytics-site-filter')?.addEventListener('change', e => {
      filterSiteId = e.target.value;
      renderAnalytics();
    });
  } catch (e) {
    container.innerHTML = '<div style="color:#ef4444;padding:24px">Tilastojen lataus epäonnistui.</div>';
  }
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
