// editors/popup-editor.js
import { openImagePicker } from '../image-library-panel.js';

const SUBTYPES = [
  { value: 'announcement', label: 'Ilmoitus',    emoji: '📢', hint: 'Tärkeä viesti' },
  { value: 'offer',        label: 'Tarjous',     emoji: '🎉', hint: 'Kampanja / koodi' },
  { value: 'image',        label: 'Kuva',        emoji: '🖼️', hint: 'Mainoskuva' },
  { value: 'exit_intent',  label: 'Exit Intent', emoji: '🚪', hint: 'Ennen poistumista' },
];

const DEFAULTS = {
  announcement: { heading: 'Tärkeä ilmoitus', bigText: '', body: 'Meillä on sinulle tärkeää tietoa.', btnText: 'Lue lisää', btnUrl: '' },
  offer:        { heading: 'Erikoistarjous!',  bigText: '-20%', body: 'Käytä koodi TARJOUS kassalla.', btnText: 'Tilaa nyt', btnUrl: '' },
  image:        { heading: '', bigText: '', body: '', btnText: '', btnUrl: '' },
  exit_intent:  { heading: 'Odota hetki!',     bigText: '', body: 'Meillä on sinulle erikoinen tarjous ennen kuin lähdet.', btnText: 'Katso tarjous', btnUrl: '' },
};

function buildHtml(subtype, f) {
  let h = '';
  if (f.heading)  h += `<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;line-height:1.2">${f.heading}</h2>`;
  if (f.bigText)  h += `<div style="font-size:48px;font-weight:900;line-height:1;margin:6px 0">${f.bigText}</div>`;
  if (f.body)     h += `<p style="margin:6px 0 16px;opacity:0.85;font-size:14px;line-height:1.5">${f.body}</p>`;
  if (f.btnText)  h += `<a${f.btnUrl ? ` href="${f.btnUrl}"` : ''} style="display:inline-block;padding:10px 24px;background:rgba(0,0,0,0.15);color:inherit;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">${f.btnText}</a>`;
  return h;
}

function parseHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  const bigEl = [...d.querySelectorAll('div,span')].find(el => {
    const fs = el.style.fontSize || '';
    return fs.includes('48') || fs.includes('40') || fs.includes('36');
  });
  return {
    heading: d.querySelector('h1,h2,h3')?.textContent?.trim() || '',
    bigText: bigEl?.textContent?.trim() || '',
    body:    d.querySelector('p')?.textContent?.trim() || '',
    btnText: d.querySelector('a')?.textContent?.trim() || '',
    btnUrl:  d.querySelector('a')?.getAttribute('href') || '',
  };
}

export function renderPopupFields(container, cfg = {}, el = {}) {
  const subtype      = cfg.popupSubtype || el.popupType || 'announcement';
  const hasImage     = !!(el.imageUrl && el.imageUrl.trim());
  const existing     = el.content || '';
  const startHtml    = !!existing.trim();
  const parsed       = existing ? parseHtml(existing) : (DEFAULTS[subtype] || DEFAULTS.announcement);

  container.innerHTML = `
    <div class="section-title">Popup-tyyppi</div>
    <div style="display:flex;gap:6px;margin-bottom:20px">
      ${SUBTYPES.map(t => `
        <button type="button" class="popup-subtype-card" data-subtype="${t.value}"
          style="flex:1;min-width:0;padding:10px 4px 8px;border-radius:10px;cursor:pointer;text-align:center;transition:all 0.15s;
                 border:2px solid ${t.value === subtype ? 'var(--primary)' : '#e2e8f0'};
                 background:${t.value === subtype ? '#eff6ff' : '#fff'}">
          <div style="font-size:20px;margin-bottom:3px">${t.emoji}</div>
          <div style="font-size:11px;font-weight:700;color:${t.value === subtype ? 'var(--primary)' : '#374151'}">${t.label}</div>
          <div style="font-size:10px;color:#94a3b8;margin-top:1px;line-height:1.2">${t.hint}</div>
        </button>`).join('')}
    </div>
    <input type="hidden" name="popupSubtype" value="${subtype}">

    <div class="form-row">
      <div class="form-group">
        <label>Sijainti</label>
        <select name="position">
          <option value="center"       ${(el.position||'center') === 'center' ? 'selected':''}>Keskellä</option>
          <option value="top-left"     ${el.position === 'top-left'     ? 'selected':''}>Ylh. vasemmalla</option>
          <option value="top-right"    ${el.position === 'top-right'    ? 'selected':''}>Ylh. oikealla</option>
          <option value="bottom-left"  ${el.position === 'bottom-left'  ? 'selected':''}>Alh. vasemmalla</option>
          <option value="bottom-right" ${el.position === 'bottom-right' ? 'selected':''}>Alh. oikealla</option>
        </select>
      </div>
      <div class="form-group">
        <label>Leveys (px)</label>
        <input type="number" name="width" value="${el.width || 400}" min="200" max="900">
      </div>
    </div>
    <div class="form-group" id="popup-animation-group" style="${subtype === 'image' ? 'display:none' : ''}">
      <label>Animaatio</label>
      <select name="animation">
        <option value="none"  ${(el.animation||'none') === 'none' ? 'selected':''}>Ei animaatiota</option>
        <option value="fade"  ${el.animation === 'fade'  ? 'selected':''}>Häivytys</option>
        <option value="slide" ${el.animation === 'slide' ? 'selected':''}>Liu'utus</option>
      </select>
    </div>
    <div class="form-group">
      <label>Linkki-URL <span style="font-size:11px;color:#94a3b8;font-weight:400">(koko popup klikattavaksi)</span></label>
      <input type="text" name="linkUrl" value="${el.linkUrl || ''}" placeholder="https://...">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Taustaväri</label>
        <input type="color" name="backgroundColor" value="${el.backgroundColor || '#ffffff'}">
      </div>
      <div class="form-group">
        <label>Tekstiväri</label>
        <input type="color" name="textColor" value="${el.textColor || '#000000'}">
      </div>
    </div>

    <!-- Kuva (image-tyyppi) -->
    <div class="form-group" id="popup-image-group" style="${subtype !== 'image' ? 'display:none' : ''}">
      <label>Kuva</label>
      <input type="hidden" name="imageUrl" value="${el.imageUrl || ''}">
      <input type="hidden" name="imageFirebasePath" value="${el.imageFirebasePath || ''}">
      <div id="popup-img-preview" style="${hasImage ? '' : 'display:none'};margin-bottom:10px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;max-height:200px;background:#f8fafc;text-align:center">
        <img id="popup-img-tag" src="${el.imageUrl || ''}" alt="Kuvaesikatselu"
          style="max-width:100%;max-height:200px;object-fit:contain;display:block;margin:0 auto"
          onerror="this.parentElement.style.display='none'">
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" id="popup-img-library" class="btn btn-secondary btn-sm">
          <i class="fa fa-images"></i> Valitse kirjastosta
        </button>
        <label class="btn btn-secondary btn-sm" style="cursor:pointer">
          <i class="fa fa-upload"></i> Lataa kuva
          <input type="file" id="popup-img-upload" accept="image/*" style="display:none">
        </label>
        <button type="button" id="popup-img-remove" class="btn btn-danger btn-sm" style="${hasImage ? '' : 'display:none'}">
          <i class="fa fa-times"></i> Poista
        </button>
      </div>
      <div id="popup-img-uploading" style="display:none;font-size:12px;color:#3b82f6;margin-top:6px">
        <i class="fa fa-spinner fa-spin"></i> Ladataan kuvaa...
      </div>
    </div>

    <!-- Sisältö (muut kuin image) -->
    <div id="popup-content-section" style="${subtype === 'image' ? 'display:none' : ''}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;margin-bottom:10px">
        <div class="section-title" style="margin:0">Sisältö</div>
        <div style="display:flex;gap:6px">
          <button type="button" id="popup-to-template" class="btn btn-secondary btn-sm" style="${startHtml ? '' : 'display:none'}">
            <i class="fa fa-magic"></i> Muokkaa kentillä
          </button>
          <button type="button" id="popup-to-html" class="btn btn-secondary btn-sm" style="${startHtml ? 'display:none' : ''}">
            <i class="fa fa-code"></i> HTML-tila
          </button>
        </div>
      </div>

      <div id="popup-template-fields" style="${startHtml ? 'display:none' : ''}">
        <div class="form-group">
          <label>Otsikko</label>
          <input type="text" id="pf-heading" value="${parsed.heading || ''}" placeholder="esim. Erikoistarjous!">
        </div>
        <div class="form-group" id="pf-bigtext-wrap" style="${subtype === 'offer' ? '' : 'display:none'}">
          <label>Iso teksti <span style="font-size:11px;color:#94a3b8">(esim. alennusprosentti)</span></label>
          <input type="text" id="pf-bigtext" value="${parsed.bigText || ''}" placeholder="-20%">
        </div>
        <div class="form-group">
          <label>Teksti</label>
          <textarea id="pf-body" rows="3" placeholder="Popup-teksti...">${parsed.body || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Napin teksti <span style="font-size:11px;color:#94a3b8">(valinnainen)</span></label>
            <input type="text" id="pf-btntext" value="${parsed.btnText || ''}" placeholder="Tilaa nyt">
          </div>
          <div class="form-group">
            <label>Napin linkki</label>
            <input type="text" id="pf-btnurl" value="${parsed.btnUrl || ''}" placeholder="https://...">
          </div>
        </div>
      </div>

      <div id="popup-html-fields" style="${startHtml ? '' : 'display:none'}">
        <textarea id="popup-raw-html" rows="6" placeholder="<h2>Otsikko</h2>&#10;<p>Teksti...</p>">${existing}</textarea>
      </div>
    </div>

    <!-- Lopullinen sisältö (aina ajantasainen) -->
    <input type="hidden" name="content" id="popup-content-final" value="${existing}">
  `;

  // ── Sync ──────────────────────────────────────────────────────────────────
  function syncContent() {
    const htmlMode = container.querySelector('#popup-html-fields').style.display !== 'none';
    let val;
    if (htmlMode) {
      val = container.querySelector('#popup-raw-html').value;
    } else {
      const st = container.querySelector('[name="popupSubtype"]').value;
      val = buildHtml(st, {
        heading: container.querySelector('#pf-heading')?.value || '',
        bigText: container.querySelector('#pf-bigtext')?.value || '',
        body:    container.querySelector('#pf-body')?.value    || '',
        btnText: container.querySelector('#pf-btntext')?.value || '',
        btnUrl:  container.querySelector('#pf-btnurl')?.value  || '',
      });
    }
    container.querySelector('#popup-content-final').value = val;
    container.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Tyyppivaihto
  container.querySelectorAll('.popup-subtype-card').forEach(card => {
    card.addEventListener('click', () => {
      const v = card.dataset.subtype;
      container.querySelectorAll('.popup-subtype-card').forEach(c => {
        const on = c.dataset.subtype === v;
        c.style.borderColor = on ? 'var(--primary)' : '#e2e8f0';
        c.style.background  = on ? '#eff6ff' : '#fff';
        c.querySelector('div:nth-child(2)').style.color = on ? 'var(--primary)' : '#374151';
      });
      container.querySelector('[name="popupSubtype"]').value = v;
      const isImg = v === 'image';
      container.querySelector('#popup-image-group').style.display      = isImg ? '' : 'none';
      container.querySelector('#popup-content-section').style.display  = isImg ? 'none' : '';
      container.querySelector('#popup-animation-group').style.display  = isImg ? 'none' : '';
      container.querySelector('#pf-bigtext-wrap').style.display        = v === 'offer' ? '' : 'none';
      // Täytä oletukset tyhjille kentille
      const headEl = container.querySelector('#pf-heading');
      if (!headEl?.value) {
        const d = DEFAULTS[v] || DEFAULTS.announcement;
        if (headEl) headEl.value = d.heading;
        const bigEl = container.querySelector('#pf-bigtext');
        if (bigEl) bigEl.value = d.bigText;
        const bodyEl = container.querySelector('#pf-body');
        if (bodyEl) bodyEl.value = d.body;
        const btnEl = container.querySelector('#pf-btntext');
        if (btnEl) btnEl.value = d.btnText;
      }
      syncContent();
    });
  });

  // Template ↔ HTML toggle
  container.querySelector('#popup-to-html')?.addEventListener('click', () => {
    syncContent();
    container.querySelector('#popup-raw-html').value =
      container.querySelector('#popup-content-final').value;
    container.querySelector('#popup-template-fields').style.display = 'none';
    container.querySelector('#popup-html-fields').style.display     = '';
    container.querySelector('#popup-to-html').style.display         = 'none';
    container.querySelector('#popup-to-template').style.display     = '';
  });
  container.querySelector('#popup-to-template')?.addEventListener('click', () => {
    const p = parseHtml(container.querySelector('#popup-raw-html').value);
    container.querySelector('#pf-heading').value = p.heading;
    container.querySelector('#pf-bigtext').value = p.bigText;
    container.querySelector('#pf-body').value    = p.body;
    container.querySelector('#pf-btntext').value = p.btnText;
    container.querySelector('#pf-btnurl').value  = p.btnUrl;
    container.querySelector('#popup-template-fields').style.display = '';
    container.querySelector('#popup-html-fields').style.display     = 'none';
    container.querySelector('#popup-to-html').style.display         = '';
    container.querySelector('#popup-to-template').style.display     = 'none';
    syncContent();
  });

  // Kenttien muutos → päivitä content
  ['#pf-heading','#pf-bigtext','#pf-body','#pf-btntext','#pf-btnurl'].forEach(sel => {
    container.querySelector(sel)?.addEventListener('input', syncContent);
  });
  container.querySelector('#popup-raw-html')?.addEventListener('input', syncContent);

  // Alusta content uusille elementeille
  if (!existing.trim()) syncContent();

  // ── Kuva-apufunktiot ──────────────────────────────────────────────────────
  function setImage(url, firebasePath) {
    container.querySelector('[name="imageUrl"]').value            = url;
    container.querySelector('[name="imageFirebasePath"]').value   = firebasePath || '';
    const preview   = container.querySelector('#popup-img-preview');
    const tag       = container.querySelector('#popup-img-tag');
    const removeBtn = container.querySelector('#popup-img-remove');
    if (url) {
      tag.src = url; preview.style.display = '';
      if (removeBtn) removeBtn.style.display = '';
    } else {
      preview.style.display = 'none';
      if (removeBtn) removeBtn.style.display = 'none';
    }
    container.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function handleFileUpload(file) {
    const status = container.querySelector('#popup-img-uploading');
    status.style.display = 'block';
    try {
      const maxSize = 950 * 1024;
      let processed = file;
      if (file.size > maxSize) {
        const url  = URL.createObjectURL(file);
        const img  = new Image();
        await new Promise(r => { img.onload = r; img.src = url; });
        const scale  = Math.sqrt(maxSize / file.size);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.floor(img.width  * scale);
        canvas.height = Math.floor(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        const fmt  = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await new Promise(r => canvas.toBlob(r, fmt, 0.9));
        processed  = new File([blob], file.name, { type: blob.type });
      }
      const fd  = new FormData();
      fd.append('image', processed);
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setImage(data.imageUrl, data.imageFirebasePath || '');
    } catch (err) {
      alert('Kuvan lataus epäonnistui: ' + err.message);
    } finally {
      status.style.display = 'none';
    }
  }

  container.querySelector('#popup-img-library')?.addEventListener('click', async () => {
    const result = await openImagePicker();
    if (result) setImage(result.url, result.firebasePath);
  });
  container.querySelector('#popup-img-upload')?.addEventListener('change', async e => {
    const file = e.target.files[0]; e.target.value = '';
    if (file) await handleFileUpload(file);
  });
  container.querySelector('#popup-img-remove')?.addEventListener('click', () => setImage('', ''));
}

export function getPopupData(container) {
  const g = n => container.querySelector(`[name="${n}"]`);
  return {
    config:            { popupSubtype: g('popupSubtype')?.value || 'announcement' },
    popupType:         g('popupSubtype')?.value === 'image' ? 'image' : 'rectangle',
    position:          g('position')?.value           || 'center',
    animation:         g('animation')?.value          || 'none',
    width:             parseInt(g('width')?.value)    || 400,
    content:           container.querySelector('#popup-content-final')?.value || '',
    imageUrl:          g('imageUrl')?.value?.trim()           || '',
    imageFirebasePath: g('imageFirebasePath')?.value?.trim()  || '',
    linkUrl:           g('linkUrl')?.value?.trim()            || '',
    backgroundColor:   g('backgroundColor')?.value           || '#ffffff',
    textColor:         g('textColor')?.value                  || '#000000',
  };
}
