// editors/sticky-bar-editor.js

const MSG_PRESETS = [
  { emoji: '🎉', text: 'Erikoistarjous! Tilaa nyt ja säästä 20%. Koodi: TARJOUS' },
  { emoji: '📦', text: 'Ilmainen toimitus kaikille yli 50 € tilauksille tänään!' },
  { emoji: '🕐', text: 'Rajoitettu aika – tarjous päättyy tänään puoliltaöin!' },
  { emoji: '🔔', text: 'Uutuus: Katso uusin tuotevalikoimamme – nyt saatavilla!' },
  { emoji: '🎁', text: 'Rekisteröidy tänään ja saat ensimmäisen kuukauden ilmaiseksi.' },
  { emoji: '🍀', text: 'Hyvää Black Fridayta! Kaikki tuotteet -30% koko viikonlopun.' },
];

export function renderStickyBarFields(container, cfg = {}) {
  container.innerHTML = `
    <div class="section-title">Sticky Bar -asetukset</div>
    <div class="form-group">
      <label>Sijainti</label>
      <select name="barPosition">
        <option value="top"    ${cfg.barPosition === 'top' ? 'selected' : ''}>Ylhäällä</option>
        <option value="bottom" ${cfg.barPosition !== 'top' ? 'selected' : ''}>Alhaalla</option>
      </select>
    </div>
    <div class="form-group">
      <label>Teksti</label>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
        ${MSG_PRESETS.map((p, i) => `
          <button type="button" class="bar-preset" data-idx="${i}"
            style="padding:5px 10px;border-radius:6px;border:1px solid #e2e8f0;background:#f8fafc;
                   font-size:12px;cursor:pointer;transition:all 0.15s" title="${p.text}">
            ${p.emoji} Malli ${i + 1}
          </button>`).join('')}
      </div>
      <textarea name="barText" rows="2" placeholder="Kirjoita viesti palkkiin...">${cfg.barText || ''}</textarea>
      <div style="font-size:11px;color:#94a3b8;margin-top:4px">💡 Klikkaa mallia yllä tai kirjoita oma teksti</div>
    </div>

    <div class="section-title" style="margin-top:16px">Toimintanapit <span style="font-size:11px;font-weight:400;color:#94a3b8">(max 3, valinnainen)</span></div>
    ${[0,1,2].map(i => {
      const btn = (cfg.ctaButtons || [])[i] || {};
      return `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:8px">
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
              <option value="primary"   ${btn.style !== 'outline' && btn.style !== 'secondary' ? 'selected':''}>Täytetty</option>
              <option value="outline"   ${btn.style === 'outline'   ? 'selected':''}>Reunustettu</option>
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
      <label>Muista sulkeminen</label>
      <select name="dismissCookieDays">
        <option value="0"   ${(cfg.dismissCookieDays||0) == 0   ? 'selected':''}>Vain tämä vierailu</option>
        <option value="1"   ${cfg.dismissCookieDays == 1         ? 'selected':''}>1 päivä</option>
        <option value="7"   ${cfg.dismissCookieDays == 7         ? 'selected':''}>1 viikko</option>
        <option value="30"  ${cfg.dismissCookieDays == 30        ? 'selected':''}>1 kuukausi</option>
        <option value="365" ${cfg.dismissCookieDays == 365       ? 'selected':''}>1 vuosi</option>
      </select>
    </div>`;

  // Preset-napit
  const textarea = container.querySelector('[name="barText"]');
  container.querySelectorAll('.bar-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      textarea.value = MSG_PRESETS[idx].text;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
}

export function getStickyBarData(container) {
  const g = n => container.querySelector(`[name="${n}"]`);
  const ctaButtons = [0,1,2].map(i => ({
    label: g(`cta_label_${i}`)?.value?.trim() || '',
    url:   g(`cta_url_${i}`)?.value?.trim()   || '',
    style: g(`cta_style_${i}`)?.value         || 'primary',
  })).filter(b => b.label);

  return {
    barPosition:       g('barPosition')?.value       || 'bottom',
    barText:           g('barText')?.value?.trim()   || '',
    ctaButtons,
    showDismiss:       g('showDismiss')?.checked      ?? true,
    dismissCookieDays: parseInt(g('dismissCookieDays')?.value) || 0,
  };
}
