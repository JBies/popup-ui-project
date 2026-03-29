// editors/ab-test-editor.js

export function renderAbTestFields(container, abTest = {}) {
  const enabled = abTest.enabled || false;
  const cfg     = abTest.variantBConfig || {};
  const traffic = abTest.traffic || 50;

  container.innerHTML = `
    <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">

      <!-- Otsikkorivi -->
      <div style="background:#f8fafc;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0">
        <div style="font-size:13px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:8px">
          <i class="fa fa-flask" style="color:#8b5cf6"></i> A/B-testi
          <span style="font-size:11px;font-weight:400;color:#94a3b8">– testaa kumpi versio toimii paremmin</span>
        </div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="ab-enabled" ${enabled ? 'checked' : ''}>
          <span style="font-size:12px;color:#64748b">Aktiivinen</span>
        </label>
      </div>

      <div id="ab-body" style="${enabled ? '' : 'display:none'};padding:16px">

        <!-- Selitys -->
        <div style="background:#f5f3ff;border:1px solid #ede9fe;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#5b21b6;line-height:1.5">
          <strong>Miten se toimii?</strong> Puolet kävijöistä näkee version A (nykyinen elementti),
          puolet version B (muutokset alla). Dashboardin Tilastot-sivulla näet kumpi versio saa enemmän klikkauksia.
          Valitse voittaja ja poista testi käytöstä.
        </div>

        <!-- Liikenjako visuaalisesti -->
        <div class="form-group">
          <label>Liikenteen jako</label>
          <div style="display:flex;align-items:center;gap:12px">
            <input type="range" id="ab-traffic" min="10" max="90" step="10" value="${traffic}" style="flex:1">
            <div style="min-width:120px;text-align:right">
              <span id="ab-label-a" style="font-size:13px;font-weight:700;color:#3b82f6">${traffic}% A</span>
              <span style="color:#94a3b8;margin:0 4px">/</span>
              <span id="ab-label-b" style="font-size:13px;font-weight:700;color:#8b5cf6">${100-traffic}% B</span>
            </div>
          </div>
          <!-- Visuaalinen palkki -->
          <div style="height:8px;border-radius:4px;background:#e0e7ff;margin-top:8px;overflow:hidden">
            <div id="ab-bar-a" style="height:100%;background:#3b82f6;width:${traffic}%;transition:width 0.2s"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;margin-top:3px">
            <span>← Versio A (nykyinen)</span><span>Versio B (testiversio) →</span>
          </div>
        </div>

        <!-- Versio B muutokset -->
        <div style="border-left:3px solid #8b5cf6;padding-left:14px;margin-top:4px">
          <div style="font-size:12px;font-weight:700;color:#6d28d9;margin-bottom:10px">
            Versio B – muuta nämä kentät (muut asetukset pysyvät samana kuin A)
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Otsikko / pääteksti</label>
              <input type="text" id="ab-b-title" value="${cfg.title || ''}" placeholder="esim. Erikoistarjous!">
              <div style="font-size:10px;color:#94a3b8;margin-top:2px">Ylikirjoittaa popupin/palkin otsikon</div>
            </div>
            <div class="form-group">
              <label>Napin teksti</label>
              <input type="text" id="ab-b-cta" value="${cfg.cta || ''}" placeholder="esim. Osta nyt">
              <div style="font-size:10px;color:#94a3b8;margin-top:2px">Ylikirjoittaa ensimmäisen napin tekstin</div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Taustaväri</label>
              <input type="color" id="ab-b-bg" value="${cfg.backgroundColor || '#ef4444'}">
            </div>
            <div class="form-group">
              <label>Tekstiväri</label>
              <input type="color" id="ab-b-text" value="${cfg.textColor || '#ffffff'}">
            </div>
          </div>
        </div>

        <div style="margin-top:12px;padding:10px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:7px;font-size:12px;color:#166534">
          <i class="fa fa-chart-bar" style="margin-right:6px"></i>
          <strong>Tulokset:</strong> Dashboard → Tilastot → valitse elementti → näet A:n ja B:n CTR-prosentit vierekkäin.
        </div>
      </div>
    </div>`;

  const body   = container.querySelector('#ab-body');
  const slider = container.querySelector('#ab-traffic');

  container.querySelector('#ab-enabled').addEventListener('change', e => {
    body.style.display = e.target.checked ? '' : 'none';
  });

  slider?.addEventListener('input', () => {
    const v = parseInt(slider.value);
    container.querySelector('#ab-label-a').textContent = v + '% A';
    container.querySelector('#ab-label-b').textContent = (100-v) + '% B';
    container.querySelector('#ab-bar-a').style.width   = v + '%';
  });
}

export function getAbTestData(container) {
  return {
    enabled: container.querySelector('#ab-enabled')?.checked ?? false,
    traffic: parseInt(container.querySelector('#ab-traffic')?.value) || 50,
    variantBConfig: {
      title:           container.querySelector('#ab-b-title')?.value || '',
      cta:             container.querySelector('#ab-b-cta')?.value   || '',
      backgroundColor: container.querySelector('#ab-b-bg')?.value   || '#ef4444',
      textColor:       container.querySelector('#ab-b-text')?.value  || '#ffffff',
    },
  };
}
