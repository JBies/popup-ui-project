// editors/scroll-progress-editor.js
export function renderScrollProgressFields(container, cfg = {}) {
  container.innerHTML = `
    <div class="section-title">Scroll Progress Bar -asetukset</div>
    <p style="font-size:13px;color:#64748b;margin-bottom:16px">
      Näyttää käyttäjälle kuinka pitkälle sivulla on scrollattu.
    </p>
    <div class="form-row">
      <div class="form-group">
        <label>Sijainti</label>
        <select name="progressPosition">
          <option value="top"    ${(cfg.progressPosition||'top') === 'top' ? 'selected':''}>Ylhäällä</option>
          <option value="bottom" ${cfg.progressPosition === 'bottom' ? 'selected':''}>Alhaalla</option>
        </select>
      </div>
      <div class="form-group">
        <label>Paksuus (px)</label>
        <input type="number" name="progressHeight" min="2" max="12" value="${cfg.progressHeight || 4}">
      </div>
    </div>
    <div class="form-group">
      <label>Väri</label>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="color" name="progressColor" value="${cfg.progressColor || '#2563eb'}"
          style="width:44px;height:36px;padding:2px;border-radius:6px;border:1px solid #e2e8f0;cursor:pointer">
        <span style="font-size:13px;color:#64748b">Palkin väri</span>
      </div>
    </div>
    <div class="form-group">
      <label>Taustaväri (läpinäkyvä default)</label>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="color" name="backgroundColor" value="${cfg.backgroundColor || '#e2e8f0'}"
          style="width:44px;height:36px;padding:2px;border-radius:6px;border:1px solid #e2e8f0;cursor:pointer">
        <span style="font-size:13px;color:#64748b">Tausta (palkin takana)</span>
      </div>
    </div>`;
}

export function getScrollProgressData(container) {
  const g = n => container.querySelector(`[name="${n}"]`);
  return {
    progressPosition: g('progressPosition')?.value || 'top',
    progressHeight:   parseInt(g('progressHeight')?.value) || 4,
    progressColor:    g('progressColor')?.value || '#2563eb',
    backgroundColor:  g('backgroundColor')?.value || '#e2e8f0'
  };
}
