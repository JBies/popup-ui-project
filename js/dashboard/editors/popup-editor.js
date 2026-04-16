// editors/popup-editor.js – yksinkertaistettu kuva-ensin
import { openImagePicker } from '../image-library-panel.js';

export function renderPopupFields(container, cfg = {}, el = {}) {
  const hasImage  = !!(el.imageUrl && el.imageUrl.trim());
  const mode      = hasImage ? 'image' : (cfg.popupSubtype === 'image' ? 'image' : 'text');
  const existing  = el.content || '';
  const heading   = existing ? (existing.match(/<h[123][^>]*>(.*?)<\/h[123]>/)?.[1] || '') : '';
  const body      = existing ? (existing.match(/<p[^>]*>(.*?)<\/p>/)?.[1] || '') : '';
  const btnText   = existing ? (existing.match(/<a[^>]*>(.*?)<\/a>/)?.[1] || '') : '';
  const btnUrl    = existing ? (existing.match(/<a[^>]*href="([^"]*)"/) ?.[1] || '') : '';

  container.innerHTML = `
    <!-- Tapa: Kuva tai Teksti -->
    <div class="section-title">Popup-sisältö</div>
    <div style="display:flex;gap:8px;margin-bottom:20px">
      <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;border:2px solid ${mode==='image'?'#3b82f6':'#e2e8f0'};border-radius:9px;cursor:pointer;background:${mode==='image'?'#eff6ff':'#fff'};font-size:13px;font-weight:600;color:${mode==='image'?'#1d4ed8':'#374151'}">
        <input type="radio" name="popup-mode" value="image" ${mode==='image'?'checked':''} style="accent-color:#3b82f6">
        📸 Kuva
      </label>
      <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;border:2px solid ${mode==='text'?'#3b82f6':'#e2e8f0'};border-radius:9px;cursor:pointer;background:${mode==='text'?'#eff6ff':'#fff'};font-size:13px;font-weight:600;color:${mode==='text'?'#1d4ed8':'#374151'}">
        <input type="radio" name="popup-mode" value="text" ${mode==='text'?'checked':''} style="accent-color:#3b82f6">
        ✏️ Teksti
      </label>
    </div>

    <!-- KUVA-TILA -->
    <div id="popup-image-section" style="display:${mode==='image'?'block':'none'}">
      <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:20px;text-align:center;margin-bottom:12px" id="popup-drop-zone">
        <div id="popup-img-preview" style="${hasImage?'':'display:none'};margin-bottom:12px">
          <img id="popup-img-tag" src="${el.imageUrl || ''}" alt="Esikatselu"
            style="max-width:100%;max-height:220px;object-fit:contain;border-radius:8px;display:block;margin:0 auto"
            onerror="this.parentElement.style.display='none'">
        </div>
        <div id="popup-img-placeholder" style="${hasImage?'display:none':''}">
          <div style="font-size:36px;margin-bottom:8px">🖼️</div>
          <div style="font-size:13px;color:#64748b;margin-bottom:12px">Lataa kuva tai valitse kuvakirjastosta</div>
        </div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <label class="btn btn-primary btn-sm" style="cursor:pointer">
            <i class="fa fa-upload"></i> Lataa kuva
            <input type="file" id="popup-img-upload" accept="image/*" style="display:none">
          </label>
          <button type="button" id="popup-img-library" class="btn btn-secondary btn-sm">
            <i class="fa fa-images"></i> Kirjastosta
          </button>
          <button type="button" id="popup-img-remove" class="btn btn-danger btn-sm" style="${hasImage?'':'display:none'}">
            <i class="fa fa-times"></i> Poista
          </button>
        </div>
        <div id="popup-img-uploading" style="display:none;font-size:12px;color:#3b82f6;margin-top:8px">
          <i class="fa fa-spinner fa-spin"></i> Ladataan...
        </div>
      </div>
      <div class="form-group">
        <label>Linkki-URL <span style="font-size:11px;color:#94a3b8;font-weight:400">(minne klikkaaja menee – valinnainen)</span></label>
        <input type="text" name="linkUrl" value="${el.linkUrl || ''}" placeholder="https://...">
      </div>
    </div>

    <!-- TEKSTI-TILA -->
    <div id="popup-text-section" style="display:${mode==='text'?'block':'none'}">
      <div class="form-group">
        <label>Otsikko</label>
        <input type="text" id="pf-heading" value="${escHtml(heading)}" placeholder="esim. Erikoistarjous!">
      </div>
      <div class="form-group">
        <label>Teksti</label>
        <textarea id="pf-body" rows="3" placeholder="Popup-teksti...">${escHtml(body)}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Napin teksti <span style="font-size:11px;color:#94a3b8;font-weight:400">(valinnainen)</span></label>
          <input type="text" id="pf-btntext" value="${escHtml(btnText)}" placeholder="Lue lisää">
        </div>
        <div class="form-group">
          <label>Napin linkki</label>
          <input type="text" id="pf-btnurl" value="${escHtml(btnUrl)}" placeholder="https://...">
        </div>
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
    </div>

    <!-- Piilokentät -->
    <input type="hidden" name="popupSubtype" value="${mode}">
    <input type="hidden" name="imageUrl" value="${el.imageUrl || ''}">
    <input type="hidden" name="imageFirebasePath" value="${el.imageFirebasePath || ''}">
    <input type="hidden" name="content" id="popup-content-final" value="${escHtml(existing)}">
  `;

  // ── Tila-vaihto ────────────────────────────────────────────────────────────
  container.querySelectorAll('input[name="popup-mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isImage = radio.value === 'image';
      container.querySelector('#popup-image-section').style.display = isImage ? 'block' : 'none';
      container.querySelector('#popup-text-section').style.display  = isImage ? 'none' : 'block';
      container.querySelector('[name="popupSubtype"]').value = isImage ? 'image' : 'announcement';
      // Visuaalinen highlight
      container.querySelectorAll('input[name="popup-mode"]').forEach(r => {
        const lbl = r.closest('label');
        if (!lbl) return;
        lbl.style.borderColor = r.checked ? '#3b82f6' : '#e2e8f0';
        lbl.style.background  = r.checked ? '#eff6ff' : '#fff';
        lbl.style.color       = r.checked ? '#1d4ed8' : '#374151';
      });
      syncContent();
    });
  });

  // ── Sisällön synkronointi ───────────────────────────────────────────────────
  function syncContent() {
    const isImage = container.querySelector('[name="popupSubtype"]').value === 'image';
    let val = '';
    if (!isImage) {
      const h  = container.querySelector('#pf-heading')?.value || '';
      const b  = container.querySelector('#pf-body')?.value    || '';
      const bt = container.querySelector('#pf-btntext')?.value || '';
      const bu = container.querySelector('#pf-btnurl')?.value  || '';
      if (h)  val += `<h2 style="margin:0 0 8px;font-size:20px;font-weight:700">${h}</h2>`;
      if (b)  val += `<p style="margin:6px 0 16px;opacity:0.85;font-size:14px">${b}</p>`;
      if (bt) val += `<a${bu ? ` href="${bu}"` : ''} style="display:inline-block;padding:10px 24px;background:rgba(0,0,0,0.15);color:inherit;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">${bt}</a>`;
    }
    container.querySelector('#popup-content-final').value = val;
    container.dispatchEvent(new Event('change', { bubbles: true }));
  }

  ['#pf-heading','#pf-body','#pf-btntext','#pf-btnurl'].forEach(sel => {
    container.querySelector(sel)?.addEventListener('input', syncContent);
  });
  if (!existing.trim()) syncContent();

  // ── Kuvan käsittely ─────────────────────────────────────────────────────────
  function setImage(url, firebasePath) {
    container.querySelector('[name="imageUrl"]').value          = url;
    container.querySelector('[name="imageFirebasePath"]').value = firebasePath || '';
    const preview     = container.querySelector('#popup-img-preview');
    const tag         = container.querySelector('#popup-img-tag');
    const placeholder = container.querySelector('#popup-img-placeholder');
    const removeBtn   = container.querySelector('#popup-img-remove');
    if (url) {
      if (tag) tag.src = url;
      if (preview)     preview.style.display     = '';
      if (placeholder) placeholder.style.display = 'none';
      if (removeBtn)   removeBtn.style.display   = '';
    } else {
      if (preview)     preview.style.display     = 'none';
      if (placeholder) placeholder.style.display = '';
      if (removeBtn)   removeBtn.style.display   = 'none';
    }
    container.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function handleFileUpload(file) {
    const status = container.querySelector('#popup-img-uploading');
    if (status) status.style.display = 'block';
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
        // PNG ignoreoi quality-parametrin → muunnetaan aina JPEG:ksi pakkauksen yhteydessä
        const fmt  = 'image/jpeg';
        const blob = await new Promise(r => canvas.toBlob(r, fmt, 0.88));
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
      if (status) status.style.display = 'none';
    }
  }

  // Drag & drop kuva-alueelle
  const dropZone = container.querySelector('#popup-drop-zone');
  if (dropZone) {
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = '#3b82f6'; });
    dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = '#cbd5e1'; });
    dropZone.addEventListener('drop', async e => {
      e.preventDefault();
      dropZone.style.borderColor = '#cbd5e1';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) await handleFileUpload(file);
    });
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
  const mode = g('popupSubtype')?.value || 'announcement';
  return {
    config:            { popupSubtype: mode },
    popupType:         mode === 'image' ? 'image' : 'rectangle',
    position:          'center',
    animation:         'none',
    width:             400,
    content:           container.querySelector('#popup-content-final')?.value || '',
    imageUrl:          g('imageUrl')?.value?.trim()           || '',
    imageFirebasePath: g('imageFirebasePath')?.value?.trim()  || '',
    linkUrl:           g('linkUrl')?.value?.trim()            || '',
    backgroundColor:   g('backgroundColor')?.value           || '#ffffff',
    textColor:         g('textColor')?.value                  || '#000000',
  };
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
