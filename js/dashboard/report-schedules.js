// js/dashboard/report-schedules.js
// Automatisoidut raportit -välilehti

import { showToast } from './dashboard-main.js';
import { t } from '../i18n.js';

let cachedSites  = [];
let cachedPopups = [];

export function initSchedulesTab(sites, popups) {
  cachedSites  = sites  || [];
  cachedPopups = popups || [];
  loadSchedules();
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function loadSchedules() {
  const container = document.getElementById('tab-schedules');
  if (!container) return;
  container.innerHTML = loadingHTML();
  try {
    const r = await fetch('/api/report-schedules');
    if (!r.ok) throw new Error();
    const schedules = await r.json();
    renderScheduleList(schedules);
  } catch {
    container.innerHTML = `<div style="color:#ef4444;padding:24px">${t('rpt.error')}</div>`;
  }
}

// ─── Render list ──────────────────────────────────────────────────────────────

function renderScheduleList(schedules) {
  const container = document.getElementById('tab-schedules');
  if (!container) return;

  const header = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">
      <div>
        <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin:0">⏰ Automatisoi raportit</h2>
        <p style="font-size:13px;color:#64748b;margin:4px 0 0">Aikatauluta raportteja automaattisesti asiakkaille tai tiimille</p>
      </div>
      <button id="sched-new-btn" class="btn btn-primary btn-sm">+ Uusi aikataulu</button>
    </div>`;

  const cards = schedules.length
    ? schedules.map(s => renderCard(s)).join('')
    : `<div style="padding:40px;text-align:center;color:#94a3b8;background:#f8fafc;border-radius:12px;border:1px dashed #e2e8f0">
        <div style="font-size:32px;margin-bottom:12px">⏰</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:6px">Ei aikataulutettuja raportteja</div>
        <div style="font-size:13px">Luo ensimmäinen aikataulu klikkaamalla "Uusi aikataulu"</div>
       </div>`;

  container.innerHTML = header + `<div id="sched-list">${cards}</div>`;

  document.getElementById('sched-new-btn')?.addEventListener('click', () => openModal(null));

  container.querySelectorAll('[data-sched-edit]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const r = await fetch('/api/report-schedules/' + btn.dataset.schedEdit);
      if (r.ok) openModal(await r.json());
    })
  );
  container.querySelectorAll('[data-sched-preview]').forEach(btn =>
    btn.addEventListener('click', () => doPreview(btn.dataset.schedPreview, btn))
  );
  container.querySelectorAll('[data-sched-toggle]').forEach(btn =>
    btn.addEventListener('click', () => doToggle(btn.dataset.schedToggle, btn))
  );
  container.querySelectorAll('[data-sched-delete]').forEach(btn =>
    btn.addEventListener('click', () => doDelete(btn.dataset.schedDelete))
  );
}

function renderCard(s) {
  const activeColor = s.active ? '#16a34a' : '#94a3b8';
  const activeTxt   = s.active ? '● Aktiivinen' : '○ Tauolla';

  const freqLabel = {
    daily:   'Päivittäin',
    weekly:  `Viikoittain (${['Su','Ma','Ti','Ke','To','Pe','La'][s.weekDay ?? 1]})`,
    monthly: `Kuukausittain (${s.monthDay}. pv)`,
    custom:  `Joka ${s.customIntervalDays} pv`,
  }[s.frequency] || s.frequency;

  const rangeLabel = {
    last7days:  'Viim. 7 pv', last30days: 'Viim. 30 pv',
    last90days: 'Viim. 90 pv', lastWeek: 'Ed. viikko', lastMonth: 'Ed. kuukausi',
  }[s.dataRange] || s.dataRange;

  const siteLabel = s.siteIds?.length
    ? s.siteIds.map(id => cachedSites.find(st => String(st._id) === id)?.name || id).join(', ')
    : 'Kaikki sivustot';

  const nextSend = s.nextSendAt
    ? new Date(s.nextSendAt).toLocaleString('fi-FI', { day:'numeric', month:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })
    : '—';

  const lastLog = s.deliveryLog?.slice(-1)[0];
  const lastSendTxt = lastLog
    ? `${new Date(lastLog.sentAt).toLocaleString('fi-FI', { day:'numeric', month:'numeric', hour:'2-digit', minute:'2-digit' })} ${lastLog.success ? '✓' : '✗'}`
    : '—';

  const logRows = (s.deliveryLog || []).slice().reverse().map(l => `
    <tr style="border-top:1px solid #f1f5f9">
      <td style="padding:5px 10px;font-size:11px;color:#64748b;white-space:nowrap">
        ${new Date(l.sentAt).toLocaleString('fi-FI', { day:'numeric', month:'numeric', hour:'2-digit', minute:'2-digit' })}
        ${l.isPreview ? '<span style="color:#f59e0b;font-size:10px"> (esikatselu)</span>' : ''}
      </td>
      <td style="padding:5px 10px;font-size:11px;${l.success ? 'color:#16a34a' : 'color:#ef4444'}">
        ${l.success ? `✓ ${l.recipientCount} vastaanottajaa` : `✗ ${esc(l.error || 'Epäonnistui')}`}
      </td>
    </tr>`).join('');

  const logSection = s.deliveryLog?.length
    ? `<details style="margin-top:10px">
        <summary style="font-size:11px;color:#64748b;cursor:pointer">Toimitushistoria (${s.deliveryLog.length})</summary>
        <table style="width:100%;border-collapse:collapse;margin-top:6px">${logRows}</table>
       </details>`
    : '';

  return `
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:12px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            <span style="font-size:15px;font-weight:700;color:#0f172a">${esc(s.name)}</span>
            <span style="font-size:11px;font-weight:600;color:${activeColor}">${activeTxt}</span>
          </div>
          <div style="font-size:12px;color:#64748b;display:flex;flex-wrap:wrap;gap:6px 16px">
            <span>📍 ${esc(siteLabel)}</span>
            <span>🔄 ${freqLabel} · klo ${String(s.hour).padStart(2,'0')}:${String(s.minute||0).padStart(2,'0')}</span>
            <span>📅 ${rangeLabel}</span>
            <span>✉️ ${(s.recipients||[]).join(', ')}</span>
          </div>
          <div style="font-size:11px;color:#94a3b8;margin-top:6px;display:flex;gap:16px;flex-wrap:wrap">
            <span>Seuraava: <strong style="color:#374151">${nextSend}</strong></span>
            <span>Viimeksi: <strong style="color:#374151">${lastSendTxt}</strong></span>
          </div>
          ${logSection}
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap">
          <button data-sched-edit="${s._id}" class="btn btn-secondary btn-xs">Muokkaa</button>
          <button data-sched-preview="${s._id}" class="btn btn-secondary btn-xs">Esikatsele</button>
          <button data-sched-toggle="${s._id}" class="btn btn-secondary btn-xs">${s.active ? 'Tauko' : 'Aktivoi'}</button>
          <button data-sched-delete="${s._id}" class="btn btn-xs" style="background:#fef2f2;color:#ef4444;border:1px solid #fecaca">Poista</button>
        </div>
      </div>
    </div>`;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

async function doPreview(id, btn) {
  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = '...';
  try {
    const r = await fetch('/api/report-schedules/' + id + '/preview', { method: 'POST' });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Virhe');
    showToast(`Testiraportti lähetetty (${data.recipientCount} vastaanottajaa)`);
    loadSchedules();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = orig;
  }
}

async function doToggle(id, btn) {
  btn.disabled = true;
  try {
    const r = await fetch('/api/report-schedules/' + id + '/toggle', { method: 'PATCH' });
    if (!r.ok) throw new Error();
    loadSchedules();
  } catch {
    showToast('Tilamuutos epäonnistui', 'error');
    btn.disabled = false;
  }
}

async function doDelete(id) {
  if (!confirm('Poistetaanko tämä aikataulu?')) return;
  try {
    const r = await fetch('/api/report-schedules/' + id, { method: 'DELETE' });
    if (!r.ok) throw new Error();
    showToast('Aikataulu poistettu');
    loadSchedules();
  } catch {
    showToast('Poisto epäonnistui', 'error');
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function buildElementCheckboxes(siteId, selectedPopupIds) {
  const filtered = cachedPopups.filter(p => {
    if (!siteId) return true;
    if (siteId === '_none') return !p.siteId;
    return String(p.siteId) === siteId;
  });

  if (!filtered.length) {
    return `<div style="font-size:12px;color:#94a3b8;padding:8px 0">Ei elementtejä tällä sivustolla</div>`;
  }

  const allSelected = !selectedPopupIds || selectedPopupIds.length === 0;
  const rows = filtered.map(p => {
    const checked = allSelected || selectedPopupIds.includes(String(p._id));
    const typeIcon = { popup:'⬜', sticky_bar:'📌', fab:'🔘', slide_in:'💬', lead_form:'📝', stats_only:'📊' }[p.elementType] || '◻';
    return `<label style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;cursor:pointer;transition:background 0.1s"
        onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
      <input type="checkbox" name="popupIds" value="${p._id}" ${checked ? 'checked' : ''}
        style="width:15px;height:15px;accent-color:#3b82f6;flex-shrink:0">
      <span style="font-size:12px;color:#374151">${typeIcon} ${esc(p.name)}</span>
    </label>`;
  }).join('');

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span style="font-size:12px;color:#64748b">${filtered.length} elementtiä — poista rasti jätettävistä pois</span>
      <div style="display:flex;gap:8px">
        <button type="button" id="sched-check-all" style="font-size:11px;color:#3b82f6;background:none;border:none;cursor:pointer;padding:0">Valitse kaikki</button>
        <button type="button" id="sched-uncheck-all" style="font-size:11px;color:#94a3b8;background:none;border:none;cursor:pointer;padding:0">Poista kaikki</button>
      </div>
    </div>
    <div id="sched-popup-list" style="border:1px solid #e2e8f0;border-radius:8px;max-height:180px;overflow-y:auto;padding:4px">
      ${rows}
    </div>`;
}

function openModal(schedule) {
  const isEdit = !!schedule;
  const s = schedule || {};

  // Sivusto-valinta: jos siteIds on tyhjä = kaikki, muuten ensimmäinen valittu
  const selectedSiteId = (s.siteIds && s.siteIds.length === 1) ? s.siteIds[0] : '';
  const selectedPopupIds = s.popupIds || [];

  const freq = s.frequency || 'weekly';
  const hour = s.hour ?? 8;
  const min  = s.minute ?? 0;
  const recipients = (s.recipients || ['']).join('\n');

  const sitesOpts = [
    `<option value="">Kaikki sivustot</option>`,
    ...cachedSites.map(st =>
      `<option value="${st._id}" ${selectedSiteId === String(st._id) ? 'selected' : ''}>${esc(st.name)}${st.domain ? ' ('+esc(st.domain)+')' : ''}</option>`
    ),
  ].join('');

  const modal = document.createElement('div');
  modal.id = 'sched-modal-overlay';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:28px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;position:relative">
      <button id="sched-modal-close" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8">✕</button>
      <h3 style="font-size:17px;font-weight:800;margin:0 0 20px">${isEdit ? 'Muokkaa aikataulua' : 'Uusi aikataulu'}</h3>
      <form id="sched-form">

        <label class="sched-label">Nimi *</label>
        <input name="name" value="${esc(s.name||'')}" required maxlength="120" class="sched-input" placeholder="esim. Asiakas Oy viikkoraportti">

        <label class="sched-label" style="margin-top:14px">Sivusto</label>
        ${cachedSites.length
          ? `<select name="siteId" class="sched-input" style="width:auto">${sitesOpts}</select>`
          : `<div style="font-size:12px;color:#94a3b8;padding:8px 0">Ei sivustoja</div>`}

        <div style="margin-top:14px">
          <label class="sched-label">Elementit</label>
          <div id="sched-element-list">
            ${buildElementCheckboxes(selectedSiteId, selectedPopupIds)}
          </div>
        </div>

        <label class="sched-label" style="margin-top:14px">Toistuvuus *</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
          ${['daily','weekly','monthly','custom'].map(f => `
            <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer">
              <input type="radio" name="frequency" value="${f}" ${freq===f?'checked':''}>
              ${{ daily:'Päivittäin', weekly:'Viikoittain', monthly:'Kuukausittain', custom:'Mukautettu' }[f]}
            </label>`).join('')}
        </div>

        <div id="sched-freq-extra" style="margin-bottom:10px"></div>

        <label class="sched-label">Kellonaika (Helsinki) *</label>
        <input type="time" name="time" value="${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}" required class="sched-input" style="width:140px">

        <label class="sched-label" style="margin-top:14px">Raporttijakso *</label>
        <select name="dataRange" class="sched-input" style="width:auto">
          ${[['last7days','Viim. 7 päivää'],['last30days','Viim. 30 päivää'],['last90days','Viim. 90 päivää'],['lastWeek','Edellinen viikko'],['lastMonth','Edellinen kuukausi']]
            .map(([v,l]) => `<option value="${v}" ${(s.dataRange||'last7days')===v?'selected':''}>${l}</option>`).join('')}
        </select>

        <label class="sched-label" style="margin-top:14px">Vastaanottajat * <span style="font-weight:400;color:#94a3b8">(max 5, yksi per rivi)</span></label>
        <textarea name="recipients" rows="3" class="sched-input" placeholder="asiakas@yritys.fi&#10;toinen@yritys.fi">${esc(recipients)}</textarea>

        <label class="sched-label" style="margin-top:14px">Otsikko <span style="font-weight:400;color:#94a3b8">(valinnainen)</span></label>
        <input name="customSubject" value="${esc(s.customSubject||'')}" class="sched-input" placeholder="Jätetään tyhjäksi = automaattinen otsikko">

        <label class="sched-label" style="margin-top:14px">Asiakkaan nimi <span style="font-weight:400;color:#94a3b8">(näkyy sähköpostin otsikossa)</span></label>
        <input name="clientName" value="${esc(s.clientName||'')}" class="sched-input" placeholder="esim. Asiakas Oy">

        <label class="sched-label" style="margin-top:14px">Intro-viesti <span style="font-weight:400;color:#94a3b8">(valinnainen, näkyy sähköpostin alussa)</span></label>
        <textarea name="customIntroMessage" rows="2" class="sched-input" placeholder="esim. Hei! Tässä kuukausiraporttinne...">${esc(s.customIntroMessage||'')}</textarea>

        <div style="display:flex;align-items:center;gap:10px;margin-top:14px">
          <label style="font-size:13px;font-weight:600;color:#374151">Aktiivinen</label>
          <label style="position:relative;display:inline-block;width:40px;height:22px">
            <input type="checkbox" name="active" ${s.active !== false ? 'checked' : ''} style="opacity:0;width:0;height:0">
            <span style="position:absolute;inset:0;background:#e2e8f0;border-radius:22px;transition:0.2s;cursor:pointer"
              id="sched-toggle-track"></span>
          </label>
        </div>

        <div id="sched-form-error" style="display:none;color:#ef4444;font-size:13px;margin-top:10px;padding:10px;background:#fef2f2;border-radius:8px"></div>

        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;padding-top:16px;border-top:1px solid #f1f5f9">
          <button type="button" id="sched-modal-cancel" class="btn btn-secondary">Peruuta</button>
          <button type="submit" class="btn btn-primary" id="sched-save-btn">${isEdit ? 'Tallenna' : 'Luo aikataulu'}</button>
        </div>
      </form>
    </div>`;

  // Inline styles for labels/inputs
  const style = document.createElement('style');
  style.textContent = `.sched-label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px}
    .sched-input{width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;color:#0f172a}
    .sched-input:focus{outline:none;border-color:#3b82f6}`;
  modal.appendChild(style);
  document.body.appendChild(modal);

  // Toggle track visual
  const checkBox = modal.querySelector('input[name="active"]');
  const track    = modal.querySelector('#sched-toggle-track');
  function updateTrack() { track.style.background = checkBox.checked ? '#3b82f6' : '#e2e8f0'; }
  updateTrack();
  checkBox.addEventListener('change', updateTrack);

  // Sivusto-dropdown → päivitä elementtilista
  function rebuildElementList() {
    const siteId  = modal.querySelector('select[name="siteId"]')?.value || '';
    const listEl  = modal.querySelector('#sched-element-list');
    if (listEl) listEl.innerHTML = buildElementCheckboxes(siteId, []);
    wireCheckAllButtons();
  }
  function wireCheckAllButtons() {
    modal.querySelector('#sched-check-all')?.addEventListener('click', () => {
      modal.querySelectorAll('input[name="popupIds"]').forEach(cb => cb.checked = true);
    });
    modal.querySelector('#sched-uncheck-all')?.addEventListener('click', () => {
      modal.querySelectorAll('input[name="popupIds"]').forEach(cb => cb.checked = false);
    });
  }
  modal.querySelector('select[name="siteId"]')?.addEventListener('change', rebuildElementList);
  wireCheckAllButtons();

  // Frequency extra fields
  function renderFreqExtra() {
    const f   = modal.querySelector('input[name="frequency"]:checked')?.value || 'weekly';
    const ex  = modal.querySelector('#sched-freq-extra');
    if (f === 'weekly') {
      const days = ['Su','Ma','Ti','Ke','To','Pe','La'];
      ex.innerHTML = `<label class="sched-label">Viikonpäivä *</label>
        <select name="weekDay" class="sched-input" style="width:auto">
          ${days.map((d,i) => `<option value="${i}" ${(s.weekDay??1)===i?'selected':''}>${d}</option>`).join('')}
        </select>`;
    } else if (f === 'monthly') {
      ex.innerHTML = `<label class="sched-label">Kuukauden päivä *</label>
        <input type="number" name="monthDay" min="1" max="31" value="${s.monthDay||1}" class="sched-input" style="width:80px">`;
    } else if (f === 'custom') {
      ex.innerHTML = `<label class="sched-label">Toistumisväli (päiviä) *</label>
        <input type="number" name="customIntervalDays" min="1" max="365" value="${s.customIntervalDays||7}" class="sched-input" style="width:90px">`;
    } else {
      ex.innerHTML = '';
    }
  }
  renderFreqExtra();
  modal.querySelectorAll('input[name="frequency"]').forEach(r => r.addEventListener('change', renderFreqExtra));

  // Close
  const close = () => { modal.remove(); };
  modal.querySelector('#sched-modal-close')?.addEventListener('click', close);
  modal.querySelector('#sched-modal-cancel')?.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  // Submit
  modal.querySelector('#sched-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const errEl  = modal.querySelector('#sched-form-error');
    const saveBtn = modal.querySelector('#sched-save-btn');
    errEl.style.display = 'none';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Tallennetaan...';

    const form = e.target;
    const timeVal = form.time?.value || '08:00';
    const [hourVal, minVal] = timeVal.split(':').map(Number);
    const recipientRaw = (form.recipients?.value || '').split('\n').map(s => s.trim()).filter(Boolean);

    const freq = form.frequency?.value || 'weekly';

    // Sivusto: yksittäinen dropdown → taulukko (tyhjä = kaikki)
    const siteIdVal = modal.querySelector('select[name="siteId"]')?.value || '';
    const siteIds   = siteIdVal ? [siteIdVal] : [];

    // Elementit: checkboxlista — jos kaikki on valittu, lähetä tyhjä (= kaikki)
    const allBoxes     = [...modal.querySelectorAll('input[name="popupIds"]')];
    const checkedBoxes = allBoxes.filter(cb => cb.checked);
    const popupIds     = (allBoxes.length > 0 && checkedBoxes.length < allBoxes.length)
      ? checkedBoxes.map(cb => cb.value)
      : [];

    const body = {
      name:               form.name?.value?.trim(),
      siteIds,
      popupIds,
      frequency:          freq,
      weekDay:            Number(form.weekDay?.value ?? 1),
      monthDay:           Number(form.monthDay?.value ?? 1),
      customIntervalDays: Number(form.customIntervalDays?.value ?? 7),
      hour:               hourVal,
      minute:             minVal,
      dataRange:          form.dataRange?.value || 'last7days',
      recipients:         recipientRaw,
      customSubject:      form.customSubject?.value?.trim() || '',
      clientName:         form.clientName?.value?.trim() || '',
      customIntroMessage: form.customIntroMessage?.value?.trim() || '',
      active:             checkBox.checked,
    };

    try {
      const url    = isEdit ? '/api/report-schedules/' + s._id : '/api/report-schedules';
      const method = isEdit ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Virhe');
      showToast(isEdit ? 'Aikataulu päivitetty' : 'Aikataulu luotu');
      close();
      loadSchedules();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = 'block';
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? 'Tallenna' : 'Luo aikataulu';
    }
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadingHTML() {
  return `<div style="display:flex;align-items:center;gap:10px;color:#94a3b8;padding:32px 0">
    <i class="fa fa-spinner fa-spin"></i> <span>Ladataan...</span>
  </div>`;
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
