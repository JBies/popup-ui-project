// js/dashboard/editors/ab-test-editor.js

export function renderAbTestFields(container, abTest = {}) {
  const enabled = abTest.enabled || false;
  const cfg = abTest.variantBConfig || {};
  container.innerHTML = `
    <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
      <div style="background:#f8fafc;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0">
        <div style="font-size:13px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:8px">
          <i class="fa fa-flask" style="color:#8b5cf6"></i> A/B-testi
        </div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="ab-enabled" ${enabled ? 'checked' : ''}>
          <span style="font-size:12px;color:#64748b">Aktiivinen</span>
        </label>
      </div>
      <div id="ab-body" style="${enabled ? '' : 'display:none'};padding:16px">
        <div class="form-group">
          <label>Liikenne variantille A (%)</label>
          <div style="display:flex;align-items:center;gap:10px">
            <input type="range" id="ab-traffic" min="10" max="90" step="10" value="${abTest.traffic || 50}" style="flex:1">
            <span id="ab-label" style="font-size:12px;color:#64748b;white-space:nowrap">${abTest.traffic || 50}% A / ${100-(abTest.traffic||50)}% B</span>
          </div>
        </div>
        <p style="font-size:12px;color:#64748b;margin:12px 0 8px">Variantti B ylikirjoittaa nämä kentät:</p>
        <div class="form-row">
          <div class="form-group">
            <label>B: Otsikko / teksti</label>
            <input type="text" id="ab-b-title" value="${cfg.title || ''}" placeholder="esim. Erikoistarjous!">
          </div>
          <div class="form-group">
            <label>B: CTA-nappi teksti</label>
            <input type="text" id="ab-b-cta" value="${cfg.cta || ''}" placeholder="esim. Osta nyt">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>B: Taustaväri</label>
            <input type="color" id="ab-b-bg" value="${cfg.backgroundColor || '#ef4444'}">
          </div>
          <div class="form-group">
            <label>B: Tekstiväri</label>
            <input type="color" id="ab-b-text" value="${cfg.textColor || '#ffffff'}">
          </div>
        </div>
        <p style="font-size:11px;color:#94a3b8;margin-top:4px">Muut asetukset periytyvät variantilta A.</p>
      </div>
    </div>`;

  const body = container.querySelector('#ab-body');
  const slider = container.querySelector('#ab-traffic');
  const label  = container.querySelector('#ab-label');
  container.querySelector('#ab-enabled').addEventListener('change', e => {
    body.style.display = e.target.checked ? '' : 'none';
  });
  slider?.addEventListener('input', () => {
    label.textContent = slider.value + '% A / ' + (100 - parseInt(slider.value)) + '% B';
  });
}

export function getAbTestData(container) {
  return {
    enabled: container.querySelector('#ab-enabled')?.checked ?? false,
    traffic: parseInt(container.querySelector('#ab-traffic')?.value) || 50,
    variantBConfig: {
      title:           container.querySelector('#ab-b-title')?.value || '',
      cta:             container.querySelector('#ab-b-cta')?.value   || '',
      backgroundColor: container.querySelector('#ab-b-bg')?.value    || '#ef4444',
      textColor:       container.querySelector('#ab-b-text')?.value  || '#ffffff'
    }
  };
}
