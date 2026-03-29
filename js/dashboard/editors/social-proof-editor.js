// editors/social-proof-editor.js
const ICONS = ['👥','🔥','⚡','✅','🛒','📣','💬','👀','🎯','💡'];

const MSG_PRESETS = [
  '{count} henkilöä katsoo nyt tätä sivua',
  '{count} henkilöä osti tämän tällä viikolla',
  '{count} henkilöä varasi ajan viimeisen 24h aikana',
  '{count} henkilöä on juuri lisännyt tämän ostoskoriin',
  '{count} asiakasta suosittelee tätä palvelua',
];

export function renderSocialProofFields(container, cfg = {}) {
  container.innerHTML = `
    <div class="section-title">Social Proof -asetukset</div>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#1e40af">
      <strong>💡 Miten toimii?</strong> Sivun kulmassa vilahtelee pieni ilmoitus joka kertoo kuinka moni muu katsoo tai on ostanut saman tuotteen.
      Kasvattaa luottamusta ja ostohalua.
    </div>

    <div class="form-group">
      <label>Viesti</label>
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px">
        ${MSG_PRESETS.map((m, i) => `
          <button type="button" class="proof-preset" data-msg="${m}"
            style="padding:4px 8px;border-radius:5px;border:1px solid #e2e8f0;background:#f8fafc;font-size:11px;cursor:pointer;transition:all 0.15s">
            Malli ${i+1}
          </button>`).join('')}
      </div>
      <input type="text" name="proofText" value="${cfg.proofText || '{count} henkilöä katsoo nyt tätä sivua'}"
        placeholder="{count} henkilöä juuri varasi ajan">
      <div style="font-size:11px;color:#64748b;margin-top:4px">
        <strong>{count}</strong> korvautuu automaattisesti numerolla – voit muuttaa viestin kokonaan ilman koodia
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Näytettävä luku</label>
        <input type="number" name="proofCount" min="0" value="${cfg.proofCount ?? 0}">
        <div style="font-size:11px;color:#64748b;margin-top:3px">0 = oikeat sivustotilastot</div>
      </div>
      <div class="form-group">
        <label>Sijainti</label>
        <select name="proofPosition">
          <option value="bottom-left"  ${(cfg.proofPosition||'bottom-left') === 'bottom-left' ? 'selected':''}>Alh. vasemmalla</option>
          <option value="bottom-right" ${cfg.proofPosition === 'bottom-right' ? 'selected':''}>Alh. oikealla</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Näytetään (s)</label>
        <input type="number" name="proofDuration" min="1" max="30" value="${cfg.proofDuration || 5}">
        <div style="font-size:11px;color:#64748b;margin-top:3px">Kuinka kauan ilmoitus on näkyvissä</div>
      </div>
      <div class="form-group">
        <label>Väli (s)</label>
        <input type="number" name="proofInterval" min="3" value="${cfg.proofInterval || 8}">
        <div style="font-size:11px;color:#64748b;margin-top:3px">Kuinka usein se vilahtelee</div>
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

  // Preset-viestit
  const textIn = container.querySelector('[name="proofText"]');
  container.querySelectorAll('.proof-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      textIn.value = btn.dataset.msg;
      textIn.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  // Ikonivaihto
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
    proofText:       g('proofText')?.value       || '{count} henkilöä katsoo nyt',
    proofCount:      parseInt(g('proofCount')?.value) || 0,
    proofDuration:   parseInt(g('proofDuration')?.value) || 5,
    proofInterval:   parseInt(g('proofInterval')?.value) || 8,
    proofPosition:   g('proofPosition')?.value   || 'bottom-left',
    proofIcon:       g('proofIcon')?.value       || '👥',
    backgroundColor: g('backgroundColor')?.value || '#1f2937',
    textColor:       g('textColor')?.value       || '#ffffff',
  };
}
