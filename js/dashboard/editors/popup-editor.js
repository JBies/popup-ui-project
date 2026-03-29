// editors/popup-editor.js
import { openImagePicker } from '../image-library-panel.js';

const SUBTYPES = [
  { value: 'announcement', label: 'Ilmoitus' },
  { value: 'offer',        label: 'Tarjous' },
  { value: 'image',        label: 'Kuvapopup' },
  { value: 'exit_intent',  label: 'Exit Intent' }
];

export function renderPopupFields(container, cfg = {}, el = {}) {
  const subtype = cfg.popupSubtype || el.popupType || 'announcement';
  const hasImage = !!(el.imageUrl && el.imageUrl.trim());

  container.innerHTML = `
    <div class="section-title">Popup-asetukset</div>
    <div class="form-row">
      <div class="form-group">
        <label>Tyyppi</label>
        <select name="popupSubtype">
          ${SUBTYPES.map(t => `<option value="${t.value}" ${subtype === t.value ? 'selected':''}>${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Sijainti</label>
        <select name="position">
          <option value="center"       ${(el.position||'center') === 'center' ? 'selected':''}>Keskellä</option>
          <option value="top-left"     ${el.position === 'top-left' ? 'selected':''}>Ylh. vasemmalla</option>
          <option value="top-right"    ${el.position === 'top-right' ? 'selected':''}>Ylh. oikealla</option>
          <option value="bottom-left"  ${el.position === 'bottom-left' ? 'selected':''}>Alh. vasemmalla</option>
          <option value="bottom-right" ${el.position === 'bottom-right' ? 'selected':''}>Alh. oikealla</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Leveys (px)</label>
        <input type="number" name="width" value="${el.width || 400}" min="200" max="900">
      </div>
      <div class="form-group" id="popup-height-group" style="${subtype === 'image' ? '' : 'display:none'}">
        <label>Korkeus (px) <span style="font-size:11px;color:#94a3b8;font-weight:400">kuvapopupille</span></label>
        <input type="number" name="height" value="${el.height || 300}" min="100" max="900">
      </div>
      <div class="form-group" id="popup-animation-group" style="${subtype === 'image' ? 'display:none' : ''}">
        <label>Animaatio</label>
        <select name="animation">
          <option value="none"  ${(el.animation||'none') === 'none' ? 'selected':''}>Ei animaatiota</option>
          <option value="fade"  ${el.animation === 'fade' ? 'selected':''}>Häivytys</option>
          <option value="slide" ${el.animation === 'slide' ? 'selected':''}>Liu'utus</option>
        </select>
      </div>
    </div>

    <div class="section-title" id="popup-content-title">Sisältö</div>
    <div class="form-group">
      <label>Sisältö (HTML)</label>
      <textarea name="content" rows="5" placeholder="<h2>Otsikko</h2><p>Teksti...</p>">${el.content || ''}</textarea>
    </div>

    <div class="form-group" id="popup-image-group" style="${subtype !== 'image' ? 'display:none':''}">
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
    </div>`;

  // Tyyppivaihto → näytä/piilota kuvakenttä, korkeuskenttä ja animaatiovaihtoehto
  container.querySelector('[name="popupSubtype"]')?.addEventListener('change', e => {
    const isImage = e.target.value === 'image';
    const imgGrp    = container.querySelector('#popup-image-group');
    const heightGrp = container.querySelector('#popup-height-group');
    const animGrp   = container.querySelector('#popup-animation-group');
    if (imgGrp)    imgGrp.style.display    = isImage ? '' : 'none';
    if (heightGrp) heightGrp.style.display = isImage ? '' : 'none';
    if (animGrp)   animGrp.style.display   = isImage ? 'none' : '';
  });

  // ── Apufunktiot ──────────────────────────────────────────────────────────
  function setImage(url, firebasePath) {
    container.querySelector('[name="imageUrl"]').value = url;
    container.querySelector('[name="imageFirebasePath"]').value = firebasePath || '';
    const preview = container.querySelector('#popup-img-preview');
    const tag = container.querySelector('#popup-img-tag');
    const removeBtn = container.querySelector('#popup-img-remove');
    if (url) {
      tag.src = url;
      preview.style.display = '';
      if (removeBtn) removeBtn.style.display = '';
    } else {
      preview.style.display = 'none';
      if (removeBtn) removeBtn.style.display = 'none';
    }
    // Päivitä esikatselu
    container.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function handleFileUpload(file) {
    const status = container.querySelector('#popup-img-uploading');
    status.style.display = 'block';
    try {
      const maxSize = 950 * 1024;
      let processed = file;
      if (file.size > maxSize) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        await new Promise(r => { img.onload = r; img.src = url; });
        const scale = Math.sqrt(maxSize / file.size);
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        const fmt = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await new Promise(r => canvas.toBlob(r, fmt, 0.9));
        processed = new File([blob], file.name, { type: blob.type });
      }
      const fd = new FormData();
      fd.append('image', processed);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setImage(data.imageUrl, data.imageFirebasePath || '');
    } catch (err) {
      alert('Kuvan lataus epäonnistui: ' + err.message);
    } finally {
      status.style.display = 'none';
    }
  }

  // ── Event-kuuntelijat ────────────────────────────────────────────────────

  // Valitse kirjastosta
  container.querySelector('#popup-img-library')?.addEventListener('click', async () => {
    const result = await openImagePicker();
    if (result) setImage(result.url, result.firebasePath);
  });

  // Lataa uusi kuva
  container.querySelector('#popup-img-upload')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (file) await handleFileUpload(file);
  });

  // Poista kuva
  container.querySelector('#popup-img-remove')?.addEventListener('click', () => {
    setImage('', '');
  });
}

export function getPopupData(container) {
  const g = n => container.querySelector(`[name="${n}"]`);
  return {
    config: { popupSubtype: g('popupSubtype')?.value || 'announcement' },
    popupType:          g('popupSubtype')?.value === 'image' ? 'image' : 'rectangle',
    position:           g('position')?.value || 'center',
    animation:          g('animation')?.value || 'none',
    width:              parseInt(g('width')?.value) || 400,
    height:             parseInt(g('height')?.value) || 300,
    content:            g('content')?.value || '',
    imageUrl:           g('imageUrl')?.value?.trim() || '',
    imageFirebasePath:  g('imageFirebasePath')?.value?.trim() || '',
    linkUrl:            g('linkUrl')?.value?.trim() || '',
    backgroundColor:    g('backgroundColor')?.value || '#ffffff',
    textColor:          g('textColor')?.value || '#000000'
  };
}
