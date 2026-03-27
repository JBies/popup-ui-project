// editors/social-proof-editor.js
const ICONS = ['👥','🔥','⚡','✅','🛒','📣','💬','👀','🎯','💡'];

export function renderSocialProofFields(container, cfg = {}) {
  container.innerHTML = `
    <div class="section-title">Social Proof -asetukset</div>
    <div class="form-group">
      <label>Viesti ({count} = lukumäärä)</label>
      <input type="text" name="proofText" value="${cfg.proofText || '{count} henkilöä katsoo nyt tätä sivua'}"
        placeholder="{count} henkilöä juuri varasi ajan">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Lukumäärä (0 = oikeat tilastot)</label>
        <input type="number" name="proofCount" min="0" value="${cfg.proofCount ?? 0}">
      </div>
      <div class="form-group">
        <label>Näytetään (sekuntia)</label>
        <input type="number" name="proofDuration" min="1" max="30" value="${cfg.proofDuration || 5}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Väli näyttöjen välillä (s)</label>
        <input type="number" name="proofInterval" min="3" value="${cfg.proofInterval || 8}">
      </div>
      <div class="form-group">
        <label>Sijainti</label>
        <select name="proofPosition">
          <option value="bottom-left"  ${(cfg.proofPosition||'bottom-left') === 'bottom-left' ? 'selected':''}>Alh. vasemmalla</option>
          <option value="bottom-right" ${cfg.proofPosition === 'bottom-right' ? 'selected':''}>Alh. oikealla</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Ikoni</label>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
        ${ICONS.map(ic => `
          <button type="button" class="proof-icon-btn" data-icon="${ic}"
            style="font-size:20px;padding:6px 8px;border-radius:7px;cursor:pointer;
                   border:2px solid ${(cfg.proofIcon||'👥') === ic ? 'var(--primary)' : '#e2e8f0'};
                   background:${(cfg.proofIcon||'👥') === ic ? '#eff6ff' : '#fff'}">
            ${ic}
          </button>`).join('')}
      </div>
      <input type="hidden" name="proofIcon" value="${cfg.proofIcon || '👥'}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Taustaväri</label>
        <input type="color" name="backgroundColor" value="${cfg.backgroundColor || '#1f2937'}">
      </div>
      <div class="form-group">
        <label>Tekstiväri</label>
        <input type="color" name="textColor" value="${cfg.textColor || '#ffffff'}">
      </div>
    </div>`;

  container.querySelectorAll('.proof-icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.proof-icon-btn').forEach(b => {
        b.style.borderColor = '#e2e8f0'; b.style.background = '#fff';
      });
      btn.style.borderColor = 'var(--primary)'; btn.style.background = '#eff6ff';
      container.querySelector('[name="proofIcon"]').value = btn.dataset.icon;
      container.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}

export function getSocialProofData(container) {
  const g = n => container.querySelector(`[name="${n}"]`);
  return {
    proofText:       g('proofText')?.value || '{count} henkilöä katsoo nyt',
    proofCount:      parseInt(g('proofCount')?.value) || 0,
    proofDuration:   parseInt(g('proofDuration')?.value) || 5,
    proofInterval:   parseInt(g('proofInterval')?.value) || 8,
    proofPosition:   g('proofPosition')?.value || 'bottom-left',
    proofIcon:       g('proofIcon')?.value || '👥',
    backgroundColor: g('backgroundColor')?.value || '#1f2937',
    textColor:       g('textColor')?.value || '#ffffff'
  };
}
