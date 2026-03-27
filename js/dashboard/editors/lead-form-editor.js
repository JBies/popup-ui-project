// js/dashboard/editors/lead-form-editor.js

const FTYPES = [
  { v: 'text',     l: 'Teksti' },
  { v: 'email',    l: 'Sähköposti' },
  { v: 'tel',      l: 'Puhelin' },
  { v: 'textarea', l: 'Pitkä teksti' }
];

export function renderLeadFormFields(container, cfg = {}) {
  const fields = cfg.leadFields?.length
    ? cfg.leadFields
    : [{ type: 'text', label: 'Nimi', required: true }, { type: 'email', label: 'Sähköposti', required: true }];

  container.innerHTML = `
    <div class="section-title">Lead Form -asetukset</div>
    <div class="form-group">
      <label>Lomakkeen kentät</label>
      <div id="lf-fields" style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px">
        ${fields.map(f => fieldRow(f)).join('')}
      </div>
      <button type="button" id="lf-add" class="btn btn-secondary btn-sm"><i class="fa fa-plus"></i> Lisää kenttä</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Lähetä-nappi</label>
        <input type="text" name="leadSubmitText" value="${cfg.leadSubmitText || 'Lähetä'}">
      </div>
    </div>
    <div class="form-group">
      <label>Onnistumisviesti</label>
      <input type="text" name="leadSuccessMsg" value="${cfg.leadSuccessMsg || 'Kiitos! Olemme yhteydessä pian.'}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Taustaväri</label>
        <input type="color" name="lfBg" value="${cfg.backgroundColor || '#ffffff'}">
      </div>
      <div class="form-group">
        <label>Tekstiväri</label>
        <input type="color" name="lfText" value="${cfg.textColor || '#1f2937'}">
      </div>
    </div>`;

  const list = container.querySelector('#lf-fields');
  container.querySelector('#lf-add').addEventListener('click', () => {
    list.insertAdjacentHTML('beforeend', fieldRow({ type: 'text', label: '', required: false }));
    attachRemove(container);
  });
  attachRemove(container);
}

function fieldRow(f) {
  return `<div class="lf-row" style="display:flex;gap:6px;align-items:center">
    <select class="lf-type" style="padding:6px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;flex:0.8">
      ${FTYPES.map(t => `<option value="${t.v}" ${f.type===t.v?'selected':''}>${t.l}</option>`).join('')}
    </select>
    <input type="text" class="lf-label" value="${f.label||''}" placeholder="Kentän otsikko"
      style="flex:1;padding:6px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px">
    <label style="font-size:11px;color:#64748b;white-space:nowrap;display:flex;align-items:center;gap:4px">
      <input type="checkbox" class="lf-req" ${f.required?'checked':''}> Pakol.
    </label>
    <button type="button" class="lf-remove" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px;padding:2px 4px">✕</button>
  </div>`;
}

function attachRemove(container) {
  container.querySelectorAll('.lf-remove').forEach(btn => {
    btn.onclick = () => btn.closest('.lf-row').remove();
  });
}

export function getLeadFormData(container) {
  const g = n => container.querySelector(`[name="${n}"]`);
  const fields = [...container.querySelectorAll('.lf-row')].map(row => ({
    type:     row.querySelector('.lf-type')?.value    || 'text',
    label:    row.querySelector('.lf-label')?.value   || '',
    required: row.querySelector('.lf-req')?.checked   ?? false
  })).filter(f => f.label.trim());
  return {
    leadFields:     fields,
    leadSubmitText: g('leadSubmitText')?.value || 'Lähetä',
    leadSuccessMsg: g('leadSuccessMsg')?.value || 'Kiitos!',
    backgroundColor: g('lfBg')?.value   || '#ffffff',
    textColor:       g('lfText')?.value || '#1f2937'
  };
}
