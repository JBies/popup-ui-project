// editors/fab-editor.js
const ICONS = [
  { icon: 'fa-comment',       label: 'Chat' },
  { icon: 'fa-phone',         label: 'Puhelin' },
  { icon: 'fa-envelope',      label: 'Sähköposti' },
  { icon: 'fa-arrow-up',      label: 'Ylös' },
  { icon: 'fa-shopping-cart', label: 'Ostoskori' },
  { icon: 'fa-calendar',      label: 'Kalenteri' },
  { icon: 'fa-star',          label: 'Tähti' },
  { icon: 'fa-heart',         label: 'Sydän' },
  { icon: 'fa-info',          label: 'Info' },
  { icon: 'fa-question',      label: 'Kysymys' },
  { icon: 'fa-gift',          label: 'Lahja' },
  { icon: 'fa-bolt',          label: 'Salama' },
];

function buildModalHtml(f) {
  let h = '';
  if (f.heading) h += `<h3 style="margin:0 0 8px;font-size:16px;font-weight:700">${f.heading}</h3>`;
  if (f.body)    h += `<p style="margin:0 0 12px;font-size:14px;line-height:1.5;opacity:0.85">${f.body}</p>`;
  if (f.btnText) h += `<a${f.btnUrl ? ` href="${f.btnUrl}"` : ''} style="display:inline-block;padding:9px 20px;background:#1a56db;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">${f.btnText}</a>`;
  return h;
}

function parseModalHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return {
    heading: d.querySelector('h1,h2,h3')?.textContent?.trim() || '',
    body:    d.querySelector('p')?.textContent?.trim()         || '',
    btnText: d.querySelector('a')?.textContent?.trim()         || '',
    btnUrl:  d.querySelector('a')?.getAttribute('href')        || '',
  };
}

export function renderFabFields(container, cfg = {}) {
  const selectedIcon   = cfg.fabIcon || 'fa-comment';
  const isModal        = cfg.fabAction === 'modal';
  const existingModal  = cfg.fabModalContent || '';
  const startHtml      = !!existingModal.trim();
  const parsed         = existingModal ? parseModalHtml(existingModal) : { heading: '', body: '', btnText: '', btnUrl: '' };

  container.innerHTML = `
    <div class="section-title">FAB-asetukset</div>
    <div class="form-row">
      <div class="form-group">
        <label>Sijainti</label>
        <select name="fabPosition">
          <option value="bottom-right" ${cfg.fabPosition === 'bottom-right' || !cfg.fabPosition ? 'selected':''}>Alh. oikealla</option>
          <option value="bottom-left"  ${cfg.fabPosition === 'bottom-left'  ? 'selected':''}>Alh. vasemmalla</option>
          <option value="top-right"    ${cfg.fabPosition === 'top-right'    ? 'selected':''}>Ylh. oikealla</option>
          <option value="top-left"     ${cfg.fabPosition === 'top-left'     ? 'selected':''}>Ylh. vasemmalla</option>
        </select>
      </div>
      <div class="form-group">
        <label>Koko</label>
        <select name="fabSize">
          <option value="sm" ${cfg.fabSize === 'sm' ? 'selected':''}>Pieni (44px)</option>
          <option value="md" ${cfg.fabSize === 'md' || !cfg.fabSize ? 'selected':''}>Normaali (56px)</option>
          <option value="lg" ${cfg.fabSize === 'lg' ? 'selected':''}>Suuri (68px)</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label>Väri</label>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="color" name="fabColor" value="${cfg.fabColor || '#1a56db'}"
          style="width:44px;height:36px;padding:2px;border-radius:6px;border:1px solid #e2e8f0;cursor:pointer">
        <input type="text" name="fabColorHex" value="${cfg.fabColor || '#1a56db'}" style="flex:1" placeholder="#1a56db">
      </div>
    </div>

    <div class="form-group">
      <label>Ikoni</label>
      <div id="icon-grid" style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:4px">
        ${ICONS.map(({icon, label}) => `
          <button type="button" class="icon-btn ${icon === selectedIcon ? 'selected' : ''}" data-icon="${icon}" title="${label}"
            style="padding:10px 6px;border-radius:7px;cursor:pointer;transition:all 0.15s;
                   border:2px solid ${icon === selectedIcon ? 'var(--primary)' : '#e2e8f0'};
                   background:${icon === selectedIcon ? '#eff6ff' : '#fff'}">
            <i class="fa ${icon}" style="font-size:18px;color:${icon === selectedIcon ? 'var(--primary)' : '#64748b'}"></i>
          </button>`).join('')}
      </div>
      <input type="hidden" name="fabIcon" value="${selectedIcon}">
    </div>

    <div class="section-title" style="margin-top:4px">Toiminto klikatessa</div>
    <div class="form-group">
      <label>Tyyppi</label>
      <select name="fabAction" id="fabAction">
        <option value="link"  ${!isModal ? 'selected':''}>Avaa linkki</option>
        <option value="modal" ${isModal  ? 'selected':''}>Avaa ponnahdusikkuna</option>
      </select>
    </div>

    <!-- Linkki-tila -->
    <div id="fab-link-group" class="form-group" style="${isModal ? 'display:none' : ''}">
      <label>URL</label>
      <input type="text" name="fabUrl" value="${cfg.fabUrl || ''}" placeholder="https://wa.me/358... tai https://...">
      <small style="color:#64748b;font-size:11px;margin-top:3px;display:block">
        Chat-nappi: syötä WhatsApp-linkki (wa.me/358XXXXXXXXX) tai Tawk.to-URL
      </small>
    </div>

    <!-- Modaali-tila -->
    <div id="fab-modal-group" style="${isModal ? '' : 'display:none'}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <label style="margin:0">Ponnahdusikkunan sisältö</label>
        <div style="display:flex;gap:6px">
          <button type="button" id="fab-to-template" class="btn btn-secondary btn-sm" style="${startHtml ? '' : 'display:none'}">
            <i class="fa fa-magic"></i> Muokkaa kentillä
          </button>
          <button type="button" id="fab-to-html" class="btn btn-secondary btn-sm" style="${startHtml ? 'display:none' : ''}">
            <i class="fa fa-code"></i> HTML-tila
          </button>
        </div>
      </div>

      <!-- Template-kentät -->
      <div id="fab-template-fields" style="${startHtml ? 'display:none' : ''}">
        <div class="form-group">
          <label>Otsikko <span style="font-size:11px;color:#94a3b8">(valinnainen)</span></label>
          <input type="text" id="fab-f-heading" value="${parsed.heading}" placeholder="esim. Ota yhteyttä">
        </div>
        <div class="form-group">
          <label>Teksti</label>
          <textarea id="fab-f-body" rows="3" placeholder="Kirjoita lyhyt viesti...">${parsed.body}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Napin teksti <span style="font-size:11px;color:#94a3b8">(valinnainen)</span></label>
            <input type="text" id="fab-f-btntext" value="${parsed.btnText}" placeholder="Soita nyt">
          </div>
          <div class="form-group">
            <label>Napin linkki</label>
            <input type="text" id="fab-f-btnurl" value="${parsed.btnUrl}" placeholder="https://...">
          </div>
        </div>
      </div>

      <!-- HTML-tila -->
      <div id="fab-html-fields" style="${startHtml ? '' : 'display:none'}">
        <textarea id="fab-raw-html" rows="5" placeholder="<h3>Otsikko</h3>&#10;<p>Teksti...</p>">${existingModal}</textarea>
      </div>
    </div>

    <!-- Piilotettu modaalin sisältö -->
    <input type="hidden" name="fabModalContent" id="fab-modal-final" value="${existingModal}">

    <div class="form-check" style="margin-top:8px">
      <input type="checkbox" name="pulseAnimation" id="pulseAnim" ${cfg.pulseAnimation ? 'checked':''}>
      <label for="pulseAnim">Pulssi-animaatio (herättää huomiota)</label>
    </div>
  `;

  // ── Modaalin sync ─────────────────────────────────────────────────────────
  function syncModal() {
    const htmlMode = container.querySelector('#fab-html-fields').style.display !== 'none';
    const val = htmlMode
      ? container.querySelector('#fab-raw-html').value
      : buildModalHtml({
          heading: container.querySelector('#fab-f-heading')?.value || '',
          body:    container.querySelector('#fab-f-body')?.value    || '',
          btnText: container.querySelector('#fab-f-btntext')?.value || '',
          btnUrl:  container.querySelector('#fab-f-btnurl')?.value  || '',
        });
    container.querySelector('#fab-modal-final').value = val;
    container.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Template ↔ HTML toggle
  container.querySelector('#fab-to-html')?.addEventListener('click', () => {
    syncModal();
    container.querySelector('#fab-raw-html').value = container.querySelector('#fab-modal-final').value;
    container.querySelector('#fab-template-fields').style.display = 'none';
    container.querySelector('#fab-html-fields').style.display     = '';
    container.querySelector('#fab-to-html').style.display         = 'none';
    container.querySelector('#fab-to-template').style.display     = '';
  });
  container.querySelector('#fab-to-template')?.addEventListener('click', () => {
    const p = parseModalHtml(container.querySelector('#fab-raw-html').value);
    container.querySelector('#fab-f-heading').value = p.heading;
    container.querySelector('#fab-f-body').value    = p.body;
    container.querySelector('#fab-f-btntext').value = p.btnText;
    container.querySelector('#fab-f-btnurl').value  = p.btnUrl;
    container.querySelector('#fab-template-fields').style.display = '';
    container.querySelector('#fab-html-fields').style.display     = 'none';
    container.querySelector('#fab-to-html').style.display         = '';
    container.querySelector('#fab-to-template').style.display     = 'none';
    syncModal();
  });

  ['#fab-f-heading','#fab-f-body','#fab-f-btntext','#fab-f-btnurl'].forEach(sel => {
    container.querySelector(sel)?.addEventListener('input', syncModal);
  });
  container.querySelector('#fab-raw-html')?.addEventListener('input', syncModal);

  if (!existingModal.trim()) syncModal();

  // ── Ikoninappi-logiikka ───────────────────────────────────────────────────
  container.querySelectorAll('.icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.icon-btn').forEach(b => {
        b.style.borderColor = '#e2e8f0'; b.style.background = '#fff';
        b.querySelector('i').style.color = '#64748b';
      });
      btn.style.borderColor = 'var(--primary)'; btn.style.background = '#eff6ff';
      btn.querySelector('i').style.color = 'var(--primary)';
      container.querySelector('[name="fabIcon"]').value = btn.dataset.icon;
      container.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  // ── Värisynkronointi ──────────────────────────────────────────────────────
  const colorIn = container.querySelector('[name="fabColor"]');
  const hexIn   = container.querySelector('[name="fabColorHex"]');
  colorIn?.addEventListener('input', () => {
    hexIn.value = colorIn.value;
    container.dispatchEvent(new Event('change', { bubbles: true }));
  });
  hexIn?.addEventListener('input', () => {
    if (/^#[0-9a-f]{6}$/i.test(hexIn.value)) colorIn.value = hexIn.value;
  });

  // ── Toiminto toggle ───────────────────────────────────────────────────────
  container.querySelector('#fabAction')?.addEventListener('change', e => {
    const modal = e.target.value === 'modal';
    container.querySelector('#fab-link-group').style.display  = modal ? 'none' : '';
    container.querySelector('#fab-modal-group').style.display = modal ? '' : 'none';
  });
}

export function getFabData(container) {
  const g = n => container.querySelector(`[name="${n}"]`);
  return {
    fabPosition:     g('fabPosition')?.value  || 'bottom-right',
    fabSize:         g('fabSize')?.value      || 'md',
    fabIcon:         g('fabIcon')?.value      || 'fa-comment',
    fabColor:        g('fabColor')?.value     || '#1a56db',
    fabAction:       g('fabAction')?.value    || 'link',
    fabUrl:          g('fabUrl')?.value?.trim()                        || '',
    fabModalContent: container.querySelector('#fab-modal-final')?.value || '',
    pulseAnimation:  g('pulseAnimation')?.checked ?? false,
  };
}
