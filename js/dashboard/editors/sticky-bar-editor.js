// editors/sticky-bar-editor.js
export function renderStickyBarFields(container, cfg = {}) {
  container.innerHTML = `
    <div class="section-title">Sticky Bar -asetukset</div>
    <div class="form-group">
      <label>Sijainti</label>
      <select name="barPosition">
        <option value="top" ${cfg.barPosition === 'top' ? 'selected' : ''}>Ylhäällä</option>
        <option value="bottom" ${cfg.barPosition !== 'top' ? 'selected' : ''}>Alhaalla</option>
      </select>
    </div>
    <div class="form-group">
      <label>Teksti</label>
      <textarea name="barText" rows="2" placeholder="Kirjoita viesti...">${cfg.barText || ''}</textarea>
    </div>

    <div class="section-title" style="margin-top:16px">CTA-napit (max 3)</div>
    ${[0,1,2].map(i => {
      const btn = (cfg.ctaButtons || [])[i] || {};
      return `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:10px">
          <div style="font-size:12px;font-weight:600;color:#64748b;margin-bottom:8px">Nappi ${i+1}</div>
          <div class="form-row">
            <div class="form-group" style="margin-bottom:0">
              <label>Teksti</label>
              <input type="text" name="cta_label_${i}" value="${btn.label || ''}" placeholder="esim. Tilaa nyt">
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label>URL</label>
              <input type="text" name="cta_url_${i}" value="${btn.url || ''}" placeholder="https://...">
            </div>
          </div>
          <div class="form-group" style="margin-bottom:0;margin-top:8px">
            <label>Tyyli</label>
            <select name="cta_style_${i}">
              <option value="primary" ${btn.style !== 'outline' && btn.style !== 'secondary' ? 'selected':''}>Täytetty</option>
              <option value="outline" ${btn.style === 'outline' ? 'selected':''}>Reunustettu</option>
              <option value="secondary" ${btn.style === 'secondary' ? 'selected':''}>Toissijainen</option>
            </select>
          </div>
        </div>`;
    }).join('')}

    <div class="section-title">Sulkeminen</div>
    <div class="form-check">
      <input type="checkbox" name="showDismiss" id="showDismiss" ${cfg.showDismiss !== false ? 'checked' : ''}>
      <label for="showDismiss">Näytä sulje-nappi (✕)</label>
    </div>
    <div class="form-group" style="margin-top:10px">
      <label>Muista sulkeminen (päiviä, 0 = vain sessio)</label>
      <input type="number" name="dismissCookieDays" min="0" max="365" value="${cfg.dismissCookieDays || 0}">
    </div>`;
}

export function getStickyBarData(container) {
  const g = n => container.querySelector(`[name="${n}"]`);
  const ctaButtons = [0,1,2].map(i => ({
    label: g(`cta_label_${i}`)?.value?.trim() || '',
    url:   g(`cta_url_${i}`)?.value?.trim() || '',
    style: g(`cta_style_${i}`)?.value || 'primary'
  })).filter(b => b.label);

  return {
    barPosition:       g('barPosition')?.value || 'bottom',
    barText:           g('barText')?.value?.trim() || '',
    ctaButtons,
    showDismiss:       g('showDismiss')?.checked ?? true,
    dismissCookieDays: parseInt(g('dismissCookieDays')?.value) || 0
  };
}
