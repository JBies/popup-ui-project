// js/dashboard/leads-panel.js
import { showToast } from './dashboard-main.js';

let allLeads = [];
let filterPopupId = 'all';
let searchQ = '';

export function initLeadsPanel() {
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#leads') loadLeads();
  });
  if (window.location.hash === '#leads') loadLeads();
}

async function loadLeads() {
  const container = document.getElementById('leads-content');
  if (!container) return;
  container.innerHTML = '<div style="padding:40px;text-align:center;color:#94a3b8"><i class="fa fa-spinner fa-spin"></i> Ladataan...</div>';

  try {
    const r = await fetch('/api/leads');
    if (!r.ok) throw new Error('Virhe');
    allLeads = await r.json();
    render(container);
  } catch {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:#ef4444">Liidien lataus epäonnistui.</div>';
  }
}

function getFieldKeys(leads) {
  const keys = new Set();
  leads.forEach(l => Object.keys(l.data || {}).forEach(k => keys.add(k)));
  return [...keys];
}

function render(container) {
  if (!allLeads.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 24px">
        <div style="font-size:48px;margin-bottom:16px">📋</div>
        <h3 style="font-size:17px;font-weight:600;color:#1e293b;margin:0 0 8px">Ei liidejä vielä</h3>
        <p style="color:#64748b;font-size:14px;margin:0 0 20px">Luo Lead Form -elementti ja aktivoi se sivustollasi. Täytetyt lomakkeet näkyvät tässä.</p>
      </div>`;
    return;
  }

  const fieldKeys = getFieldKeys(allLeads);

  // Ryhmitellään popup-nimien mukaan suodatukseen
  const popupIds = [...new Set(allLeads.map(l => l.popupId))];

  // Suodatus
  let filtered = allLeads.filter(l => {
    const matchPop = filterPopupId === 'all' || l.popupId === filterPopupId;
    const matchQ   = !searchQ || JSON.stringify(l.data || {}).toLowerCase().includes(searchQ);
    return matchPop && matchQ;
  });

  container.innerHTML = `
    <div style="max-width:1000px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
        <div>
          <h2 style="font-size:18px;font-weight:700;margin:0 0 2px">Liidit</h2>
          <p style="color:#64748b;font-size:13px;margin:0">${allLeads.length} liidiä yhteensä</p>
        </div>
        <button id="leads-csv" style="background:#3b82f6;color:#fff;border:none;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px">
          <i class="fa fa-download"></i> Lataa CSV
        </button>
      </div>

      <!-- Suodatus -->
      <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
        <div style="position:relative;flex:1;min-width:180px">
          <i class="fa fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:13px"></i>
          <input id="leads-search" type="text" placeholder="Hae liideistä…"
            style="width:100%;padding:8px 10px 8px 32px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none" value="${esc(searchQ)}">
        </div>
        <select id="leads-filter-popup" style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none">
          <option value="all">Kaikki elementit</option>
          ${popupIds.map(id => `<option value="${id}" ${filterPopupId===id?'selected':''}>${id}</option>`).join('')}
        </select>
      </div>

      <!-- Taulukko -->
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0">
              <th style="padding:10px 12px;text-align:left;font-weight:600;color:#374151;white-space:nowrap">Päivämäärä</th>
              ${fieldKeys.map(k => `<th style="padding:10px 12px;text-align:left;font-weight:600;color:#374151;text-transform:capitalize">${esc(k)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filtered.length ? filtered.map(lead => `
              <tr style="border-bottom:1px solid #f1f5f9;transition:background 0.1s" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                <td style="padding:10px 12px;color:#64748b;white-space:nowrap">${new Date(lead.submittedAt).toLocaleString('fi-FI')}</td>
                ${fieldKeys.map(k => `<td style="padding:10px 12px;color:#0f172a;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(lead.data?.[k]||'')}">${esc(lead.data?.[k] || '–')}</td>`).join('')}
              </tr>`).join('') : `<tr><td colspan="${fieldKeys.length + 1}" style="padding:40px;text-align:center;color:#94a3b8">Ei liidejä haulla.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;

  // Events
  document.getElementById('leads-search')?.addEventListener('input', e => {
    searchQ = e.target.value.toLowerCase().trim();
    render(container);
  });
  document.getElementById('leads-filter-popup')?.addEventListener('change', e => {
    filterPopupId = e.target.value;
    render(container);
  });
  document.getElementById('leads-csv')?.addEventListener('click', () => downloadCSV(filtered, fieldKeys));
}

function downloadCSV(leads, fieldKeys) {
  if (!leads.length) { showToast('Ei liidejä vietäväksi', 'error'); return; }
  const headers = ['Päivämäärä', ...fieldKeys];
  const rows = leads.map(l => [
    new Date(l.submittedAt).toLocaleString('fi-FI'),
    ...fieldKeys.map(k => l.data?.[k] || ''),
  ]);
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `liidit_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV ladattu!');
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
