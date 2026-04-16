// editors/slide-in-editor.js

// ── HTML-entiteettien escape ──────────────────────────────────────────────────
function e(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── 5 mallipohjaa ─────────────────────────────────────────────────────────────
const SLIDE_TEMPLATES = [
  {
    id:       'announcement',
    name:     'Ilmoitus',
    emoji:    '🔔',
    hint:     'Otsikko + teksti + nappi',
    showBig:  false,
    defaults: { heading: 'Tärkeä ilmoitus', body: 'Kirjoita viestisi tähän.', btn: 'Lue lisää →', url: '#' },
    html(f) {
      const btn = f.btn ? `<a href="${e(f.url||'#')}" style="display:inline-block;background:#2563eb;color:#fff;padding:8px 18px;border-radius:7px;font-size:13px;font-weight:600;text-decoration:none">${e(f.btn)}</a>` : '';
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="font-size:20px">🔔</span><strong style="font-size:15px">${e(f.heading)}</strong></div>${f.body?`<p style="font-size:13px;margin:0 0 12px;opacity:.8">${e(f.body)}</p>`:''}${btn}`;
    }
  },
  {
    id:       'offer',
    name:     'Tarjous',
    emoji:    '🎉',
    hint:     'Iso alennusteksti + nappi',
    showBig:  true,
    bigLabel: 'Iso teksti (esim. -20% tai "3+1")',
    defaults: { heading: 'Erikoistarjous!', big: '-20%', body: 'Kaikista tilauksista tänään.', btn: 'Tilaa nyt →', url: '#' },
    html(f) {
      const btn = f.btn ? `<a href="${e(f.url||'#')}" style="display:inline-block;background:#dc2626;color:#fff;padding:8px 18px;border-radius:7px;font-size:13px;font-weight:600;text-decoration:none">${e(f.btn)}</a>` : '';
      return `<div style="font-size:13px;font-weight:600;color:#dc2626;margin-bottom:4px">🎉 ${e(f.heading)}</div><div style="font-size:28px;font-weight:800;line-height:1.1;margin-bottom:6px">${e(f.big||'-20%')}</div>${f.body?`<div style="font-size:12px;opacity:.7;margin-bottom:12px">${e(f.body)}</div>`:''}${btn}`;
    }
  },
  {
    id:       'cta',
    name:     'Kehotus',
    emoji:    '👆',
    hint:     'Selkeä toimintakehote',
    showBig:  false,
    defaults: { heading: 'Ota yhteyttä tänään', body: 'Autamme sinua mielellämme!', btn: 'Ota yhteyttä →', url: '#' },
    html(f) {
      const btn = f.btn ? `<a href="${e(f.url||'#')}" style="display:block;background:#2563eb;color:#fff;padding:10px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;text-align:center">${e(f.btn)}</a>` : '';
      return `<div style="font-size:15px;font-weight:700;margin-bottom:${f.body?'8px':'14px'}">${e(f.heading)}</div>${f.body?`<div style="font-size:13px;opacity:.8;margin-bottom:12px">${e(f.body)}</div>`:''}${btn}`;
    }
  },
  {
    id:       'exit_intent',
    name:     'Exit Intent',
    emoji:    '⏱️',
    hint:     'Pidätä poistuva kävijä',
    showBig:  false,
    defaults: { heading: 'Odota hetki!', body: 'Meillä on erikoistarjous juuri sinulle.', btn: 'Näytä tarjous →', url: '#' },
    html(f) {
      const btn = f.btn ? `<a href="${e(f.url||'#')}" style="display:inline-block;background:#f59e0b;color:#fff;padding:8px 18px;border-radius:7px;font-size:13px;font-weight:600;text-decoration:none">${e(f.btn)}</a>` : '';
      return `<div style="font-size:12px;color:#b45309;font-weight:600;margin-bottom:4px">⏱️ Ennen kuin lähdet</div><div style="font-size:15px;font-weight:700;margin-bottom:8px">${e(f.heading)}</div>${f.body?`<div style="font-size:13px;opacity:.8;margin-bottom:14px">${e(f.body)}</div>`:''}${btn}`;
    }
  },
  {
    id:       'trust',
    name:     'Luottamus',
    emoji:    '⭐',
    hint:     'Asiakasarvio / sosiaalinen todiste',
    showBig:  false,
    defaults: { heading: '"Paras palvelu mitä olen käyttänyt!"', body: '— Matti M., Helsinki', btn: 'Tutustu →', url: '#' },
    html(f) {
      const btn = f.btn ? `<a href="${e(f.url||'#')}" style="display:inline-block;background:#2563eb;color:#fff;padding:7px 16px;border-radius:7px;font-size:12px;font-weight:600;text-decoration:none">${e(f.btn)}</a>` : '';
      return `<div style="font-size:16px;margin-bottom:8px">⭐⭐⭐⭐⭐</div><div style="font-size:13px;font-style:italic;margin-bottom:6px">${e(f.heading)}</div>${f.body?`<div style="font-size:12px;opacity:.6;margin-bottom:10px">${e(f.body)}</div>`:''}${btn}`;
    }
  }
];

// ── Generoi HTML mallipohjan kentistä ────────────────────────────────────────
function generateHtml(tplId, fields) {
  const tpl = SLIDE_TEMPLATES.find(t => t.id === tplId);
  if (!tpl) return '';
  return tpl.html(fields);
}

// ── Lue kenttien arvot lomakkeelta ───────────────────────────────────────────
function readFields(container) {
  const g = id => container.querySelector('#' + id)?.value || '';
  return {
    heading: g('tpl-heading'),
    big:     g('tpl-big'),
    body:    g('tpl-body'),
    btn:     g('tpl-btn'),
    url:     g('tpl-url')
  };
}

// ── Päivitä piilotettu slideContent-tekstikenttä ─────────────────────────────
function syncContent(container, tplId) {
  const fields  = readFields(container);
  const html    = generateHtml(tplId, fields);
  const out     = container.querySelector('[name="slideContent"]');
  if (out) out.value = html;
}

// ── Renderöi editori ──────────────────────────────────────────────────────────
export function renderSlideInFields(container, cfg = {}, el = {}) {
  // Jos tallennettuja tpl-kenttiä löytyy, käytetään aina mallipohja-tilaa (linkin muokkaus toimii)
  const hasTplFields = !!(cfg.tplFields && (cfg.tplFields.heading || cfg.tplFields.btn || cfg.tplFields.url));
  // HTML-tila vain jos sisältöä on eikä tplFields:iä ole tallennettuna
  const hasExistingContent = !!(el.content && el.content.trim()) && !hasTplFields;
  const activeTplId = cfg.lastTemplate || SLIDE_TEMPLATES[0].id;

  container.innerHTML = `
    <div class="section-title">Sijainti ja koko</div>
    <div class="form-row">
      <div class="form-group">
        <label>Sijainti</label>
        <select name="slideInPosition">
          <option value="bottom-right" ${(cfg.slideInPosition||'bottom-right') === 'bottom-right' ? 'selected':''}>↘ Oik. alanurkka</option>
          <option value="bottom-left"  ${cfg.slideInPosition === 'bottom-left'  ? 'selected':''}>↙ Vas. alanurkka</option>
          <option value="top-right"    ${cfg.slideInPosition === 'top-right'    ? 'selected':''}>↗ Oik. ylänurkka</option>
          <option value="top-left"     ${cfg.slideInPosition === 'top-left'     ? 'selected':''}>↖ Vas. ylänurkka</option>
        </select>
      </div>
      <div class="form-group">
        <label>Leveys (px)</label>
        <input type="number" name="slideInWidth" min="200" max="500" value="${cfg.slideInWidth || 320}">
      </div>
    </div>

    <div class="section-title">Milloin ilmestyy</div>
    <div class="form-row">
      <div class="form-group">
        <label>Triggeri</label>
        <select name="slideInTrigger" id="slideInTrigger">
          <option value="time"        ${cfg.slideInTrigger === 'time'        || !cfg.slideInTrigger ? 'selected':''}>Aikaviive</option>
          <option value="scroll"      ${cfg.slideInTrigger === 'scroll'      ? 'selected':''}>Scroll-prosentti</option>
          <option value="exit_intent" ${cfg.slideInTrigger === 'exit_intent' ? 'selected':''}>Exit intent</option>
        </select>
      </div>
      <div class="form-group" id="trigger-value-group" style="${cfg.slideInTrigger === 'exit_intent' ? 'display:none':''}">
        <label id="trigger-value-label">${cfg.slideInTrigger === 'scroll' ? 'Scroll (%)' : 'Viive (s)'}</label>
        <input type="number" name="slideInTriggerValue" min="0" max="100" value="${cfg.slideInTriggerValue ?? 5}">
      </div>
    </div>

    <div class="section-title">Sisältö</div>

    <!-- Mallipohjat -->
    <div id="tpl-picker" style="${hasExistingContent ? 'display:none' : ''}">
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:16px">
        ${SLIDE_TEMPLATES.map(t => `
          <button type="button" data-tpl="${t.id}" style="border:2px solid ${activeTplId===t.id?'#2563eb':'#e2e8f0'};border-radius:10px;padding:10px 6px;background:${activeTplId===t.id?'#eff6ff':'#fff'};cursor:pointer;text-align:center;transition:all .15s">
            <div style="font-size:22px;margin-bottom:4px">${t.emoji}</div>
            <div style="font-size:11px;font-weight:700;color:${activeTplId===t.id?'#2563eb':'#1e293b'}">${t.name}</div>
            <div style="font-size:10px;color:#94a3b8;line-height:1.3;margin-top:2px">${t.hint}</div>
          </button>`).join('')}
      </div>

      <!-- Kentät -->
      <div id="tpl-fields">
        <div class="form-row">
          <div class="form-group" style="flex:2">
            <label id="tpl-heading-label">Otsikko</label>
            <input type="text" id="tpl-heading" placeholder="Otsikko" value="">
          </div>
        </div>
        <div class="form-group" id="tpl-big-group" style="display:none">
          <label id="tpl-big-label">Iso teksti</label>
          <input type="text" id="tpl-big" placeholder="-20%">
        </div>
        <div class="form-group">
          <label>Teksti</label>
          <textarea id="tpl-body" rows="2" placeholder="Lyhyt kuvaus..." style="resize:vertical"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Napin teksti <span style="font-size:11px;color:#94a3b8">(tyhjä = ei nappia)</span></label>
            <input type="text" id="tpl-btn" placeholder="Lue lisää →">
          </div>
          <div class="form-group">
            <label>Napin linkki</label>
            <input type="url" id="tpl-url" placeholder="https://...">
          </div>
        </div>
      </div>

      <button type="button" id="btn-html-mode" class="btn btn-secondary btn-sm" style="margin-top:6px">
        <i class="fa fa-code"></i> Muokkaa HTML:ää
      </button>
    </div>

    <!-- HTML-tila -->
    <div id="html-mode-section" style="${hasExistingContent ? '' : 'display:none'}">
      ${hasExistingContent ? '' : '<div style="font-size:12px;color:#64748b;margin-bottom:8px">Vapaa HTML-muokkaus. Voit käyttää mitä tahansa HTML:ää.</div>'}
      <textarea name="slideContent" rows="5" placeholder="<h3>Otsikko</h3><p>Teksti...</p>" style="font-family:monospace;font-size:12px">${e(el.content || '')}</textarea>
      ${hasExistingContent ? `<button type="button" id="btn-tpl-mode" class="btn btn-secondary btn-sm" style="margin-top:6px"><i class="fa fa-magic"></i> Käytä mallipohjia</button>` : ''}
    </div>

    <!-- Piilotettu, mallipohja-tilassa aina ajan tasalla -->
    <input type="hidden" name="slideContent" id="tpl-content-output" style="${hasExistingContent ? 'display:none' : ''}">

    <div class="form-row" style="margin-top:14px">
      <div class="form-group">
        <label>Taustaväri</label>
        <input type="color" name="backgroundColor" value="${el.backgroundColor || '#ffffff'}">
      </div>
      <div class="form-group">
        <label>Tekstiväri</label>
        <input type="color" name="textColor" value="${el.textColor || '#1f2937'}">
      </div>
    </div>
    <div class="form-check">
      <input type="checkbox" name="showCloseButton" id="showClose" ${cfg.showCloseButton !== false ? 'checked':''}>
      <label for="showClose">Näytä sulkemisnappi</label>
    </div>

    <!-- Tallenna viimeksi käytetty mallipohja -->
    <input type="hidden" name="lastTemplate" id="last-template" value="${activeTplId}">`;

  // ── Event-kuuntelijat ────────────────────────────────────────────────────

  // Trigger-vaihto
  container.querySelector('#slideInTrigger')?.addEventListener('change', e => {
    const v = e.target.value;
    const grp = container.querySelector('#trigger-value-group');
    const lbl = container.querySelector('#trigger-value-label');
    if (grp) grp.style.display = v === 'exit_intent' ? 'none' : '';
    if (lbl) lbl.textContent   = v === 'scroll' ? 'Scroll (%)' : 'Viive (s)';
  });

  // ── Mallipohja-tila ──────────────────────────────────────────────────────

  let currentTpl = activeTplId;

  // Aseta oletusarvot valitulle mallille
  function applyTemplate(tplId) {
    const tpl = SLIDE_TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;
    currentTpl = tplId;
    container.querySelector('#last-template').value = tplId;

    // Päivitä korttien tyylit
    container.querySelectorAll('[data-tpl]').forEach(card => {
      const active = card.dataset.tpl === tplId;
      card.style.borderColor  = active ? '#2563eb' : '#e2e8f0';
      card.style.background   = active ? '#eff6ff' : '#fff';
      card.querySelector('div:nth-child(2)').style.color = active ? '#2563eb' : '#1e293b';
    });

    // Täytä kentät oletusarvoilla vain jos tyhjät tai vaihdetaan uuteen malliin
    const headingEl = container.querySelector('#tpl-heading');
    const bodyEl    = container.querySelector('#tpl-body');
    const btnEl     = container.querySelector('#tpl-btn');
    const urlEl     = container.querySelector('#tpl-url');
    const bigEl     = container.querySelector('#tpl-big');
    const bigGrp    = container.querySelector('#tpl-big-group');
    const bigLbl    = container.querySelector('#tpl-big-label');

    if (!headingEl.value) headingEl.value = tpl.defaults.heading || '';
    if (!bodyEl.value)    bodyEl.value    = tpl.defaults.body    || '';
    if (!btnEl.value)     btnEl.value     = tpl.defaults.btn     || '';
    if (!urlEl.value)     urlEl.value     = tpl.defaults.url     || '#';

    // "Iso teksti" -kenttä
    if (bigGrp) bigGrp.style.display = tpl.showBig ? '' : 'none';
    if (tpl.showBig) {
      if (!bigEl.value) bigEl.value = tpl.defaults.big || '';
      if (bigLbl)       bigLbl.textContent = tpl.bigLabel || 'Iso teksti';
    }

    syncContent(container, currentTpl);
  }

  // Mallipohjakorttien klikkauskuuntelijat
  container.querySelectorAll('[data-tpl]').forEach(card => {
    card.addEventListener('click', () => applyTemplate(card.dataset.tpl));
  });

  // Kenttämuutokset → päivitä HTML
  ['tpl-heading','tpl-big','tpl-body','tpl-btn','tpl-url'].forEach(id => {
    container.querySelector('#' + id)?.addEventListener('input', () => syncContent(container, currentTpl));
  });

  // HTML-tilaan siirtyminen
  container.querySelector('#btn-html-mode')?.addEventListener('click', () => {
    // Kopioi generoitu HTML textarea:an
    const generated = container.querySelector('#tpl-content-output')?.value || '';
    const textarea  = container.querySelector('[name="slideContent"]:not(#tpl-content-output)');
    if (textarea && generated) {
      textarea.value         = generated;
      textarea.style.display = '';
    }
    container.querySelector('#tpl-picker').style.display        = 'none';
    container.querySelector('#html-mode-section').style.display = '';
    if (textarea) textarea.style.display = '';
    // Poista piilotettu (duplikaatti)
    const hidden = container.querySelector('#tpl-content-output');
    if (hidden) hidden.name = '';  // Poistetaan name jotta ei lähetä duplikaattia
  });

  // Takaisin mallipohja-tilaan
  container.querySelector('#btn-tpl-mode')?.addEventListener('click', () => {
    container.querySelector('#html-mode-section').style.display = 'none';
    container.querySelector('#tpl-picker').style.display        = '';
    const hidden = container.querySelector('#tpl-content-output');
    if (hidden) hidden.name = 'slideContent';
  });

  // Alusta valittu mallipohja — uusille tai kun tplFields on tallennettu
  if (!hasExistingContent) {
    applyTemplate(activeTplId);
    // Palauta tallennetut kenttien arvot (muokkaus — linkit, tekstit jne.)
    if (cfg.tplFields) {
      const f = cfg.tplFields;
      const headingEl = container.querySelector('#tpl-heading');
      const bodyEl    = container.querySelector('#tpl-body');
      const btnEl     = container.querySelector('#tpl-btn');
      const urlEl     = container.querySelector('#tpl-url');
      const bigEl     = container.querySelector('#tpl-big');
      if (headingEl && f.heading !== undefined) headingEl.value = f.heading;
      if (bodyEl    && f.body    !== undefined) bodyEl.value    = f.body;
      if (btnEl     && f.btn     !== undefined) btnEl.value     = f.btn;
      if (urlEl     && f.url     !== undefined) urlEl.value     = f.url;
      if (bigEl     && f.big     !== undefined) bigEl.value     = f.big;
      syncContent(container, currentTpl);
    }
  }
}

// ── Lue data lomakkeelta ──────────────────────────────────────────────────────
export function getSlideInData(container) {
  const g = n => container.querySelector(`[name="${n}"]`);
  // Lue sisältö — suosi ei-tyhjää arvoa (mallipohja vs HTML-tila)
  const allContent = Array.from(container.querySelectorAll('[name="slideContent"]'));
  const contentEl  = allContent.find(el => el.value) || allContent[0];
  // Tallenna myös mallipohjakenttien arvot jotta linkkiä voi aina muokata
  const tplFields = {
    heading: container.querySelector('#tpl-heading')?.value || '',
    big:     container.querySelector('#tpl-big')?.value     || '',
    body:    container.querySelector('#tpl-body')?.value    || '',
    btn:     container.querySelector('#tpl-btn')?.value     || '',
    url:     container.querySelector('#tpl-url')?.value     || '',
  };
  return {
    config: {
      slideInPosition:     g('slideInPosition')?.value || 'bottom-right',
      slideInWidth:        parseInt(g('slideInWidth')?.value) || 320,
      slideInTrigger:      g('slideInTrigger')?.value || 'time',
      slideInTriggerValue: parseInt(g('slideInTriggerValue')?.value) || 5,
      showCloseButton:     g('showCloseButton')?.checked ?? true,
      lastTemplate:        g('lastTemplate')?.value || 'announcement',
      tplFields,
    },
    content:         contentEl?.value || '',
    backgroundColor: g('backgroundColor')?.value || '#ffffff',
    textColor:       g('textColor')?.value || '#1f2937'
  };
}
