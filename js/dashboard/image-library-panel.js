// js/dashboard/image-library-panel.js
// Kuvakirjasto-näkymä ja uudelleenkäytettävä kuvavalinnan modaali

// ─── Apufunktiot ──────────────────────────────────────────────────────────────

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

async function resizeIfNeeded(file, maxBytes = 950 * 1024) {
  if (file.size <= maxBytes) return file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise(r => { img.onload = r; img.src = url; });
  const scale = Math.sqrt(maxBytes / file.size);
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(img.width * scale);
  canvas.height = Math.floor(img.height * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  const fmt = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise(r => canvas.toBlob(r, fmt, 0.9));
  return new File([blob], file.name, { type: blob.type });
}

async function doUpload(file) {
  const processed = await resizeIfNeeded(file);
  const fd = new FormData();
  fd.append('image', processed);
  const r = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!r.ok) throw new Error('Lataus epäonnistui (HTTP ' + r.status + ')');
  return r.json(); // { imageUrl, imageFirebasePath, imageId, name, size }
}

async function fetchImages() {
  const r = await fetch('/api/images', { credentials: 'include' });
  if (!r.ok) throw new Error('Kuvien haku epäonnistui');
  return r.json();
}

async function deleteImage(id) {
  const r = await fetch('/api/images/' + id, { method: 'DELETE', credentials: 'include' });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || 'Poisto epäonnistui');
  }
}

// ─── Kuvakirjasto-näkymä (sidebar view) ──────────────────────────────────────

export function initImageLibraryPanel() {
  const container = document.getElementById('images-content');
  if (!container) return;
  renderLibrary(container);
}

async function renderLibrary(container) {
  container.innerHTML = `
    <div style="max-width:900px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;gap:12px;flex-wrap:wrap">
        <div>
          <h2 style="font-size:18px;font-weight:700;margin:0 0 4px">Kuvakirjasto</h2>
          <p style="color:#64748b;font-size:13px;margin:0">Lataa ja hallinnoi kuvia joita käytät elementeissäsi.</p>
        </div>
        <label id="lib-upload-btn" class="btn btn-primary" style="cursor:pointer">
          <i class="fa fa-upload"></i> Lataa uusi kuva
          <input type="file" id="lib-file-input" accept="image/*" style="display:none">
        </label>
      </div>
      <div id="lib-upload-status" style="display:none;padding:10px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:13px;color:#1d4ed8;margin-bottom:16px">
        <i class="fa fa-spinner fa-spin"></i> Ladataan kuvaa...
      </div>
      <div id="lib-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px"></div>
    </div>`;

  const fileInput = container.querySelector('#lib-file-input');
  const status = container.querySelector('#lib-upload-status');
  const grid = container.querySelector('#lib-grid');

  fileInput.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    fileInput.value = '';
    status.style.display = 'block';
    try {
      await doUpload(file);
      await refreshGrid(grid);
    } catch (err) {
      alert('Virhe latauksessa: ' + err.message);
    } finally {
      status.style.display = 'none';
    }
  });

  await refreshGrid(grid);
}

async function refreshGrid(grid) {
  grid.innerHTML = '<p style="color:#94a3b8;font-size:13px">Ladataan...</p>';
  try {
    const images = await fetchImages();
    if (images.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:#94a3b8">
          <i class="fa fa-images" style="font-size:32px;margin-bottom:10px;display:block"></i>
          <p style="font-size:14px;margin:0">Ei kuvia vielä. Lataa ensimmäinen kuva yllä olevasta napista.</p>
        </div>`;
      return;
    }
    grid.innerHTML = images.map(img => `
      <div class="lib-card" data-id="${img._id}" style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;position:relative;transition:box-shadow 0.15s">
        <div style="aspect-ratio:4/3;overflow:hidden;background:#f8fafc;cursor:pointer" data-action="copy" title="Kopioi URL">
          <img src="${escHtml(img.url)}" alt="${escHtml(img.name)}"
            style="width:100%;height:100%;object-fit:cover"
            onerror="this.style.opacity='0.3';this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect fill=%22%23ddd%22 width=%2264%22 height=%2264%22/%3E%3C/svg%3E'">
        </div>
        <div style="padding:8px 10px">
          <div style="font-size:12px;font-weight:500;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escHtml(img.name)}">${escHtml(img.name)}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px">${formatBytes(img.size)}</div>
        </div>
        <button data-action="delete" title="Poista kuva"
          style="position:absolute;top:6px;right:6px;background:rgba(239,68,68,0.85);color:#fff;border:none;border-radius:6px;width:26px;height:26px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.15s">
          <i class="fa fa-trash"></i>
        </button>
      </div>`).join('');

    // Hover – näytä poistopainike
    grid.querySelectorAll('.lib-card').forEach(card => {
      const del = card.querySelector('[data-action="delete"]');
      card.addEventListener('mouseenter', () => { if (del) del.style.opacity = '1'; });
      card.addEventListener('mouseleave', () => { if (del) del.style.opacity = '0'; });

      // Kopioi URL
      card.querySelector('[data-action="copy"]')?.addEventListener('click', () => {
        const img = images.find(i => i._id === card.dataset.id);
        if (!img) return;
        navigator.clipboard?.writeText(img.url).then(() => {
          showLibToast('URL kopioitu leikepöydälle!');
        }).catch(() => {
          prompt('Kopioi URL:', img.url);
        });
      });

      // Poista
      del?.addEventListener('click', async e => {
        e.stopPropagation();
        if (!confirm('Poistetaanko kuva pysyvästi?')) return;
        try {
          await deleteImage(card.dataset.id);
          await refreshGrid(grid);
        } catch (err) {
          alert(err.message);
        }
      });
    });
  } catch (err) {
    grid.innerHTML = `<p style="color:#ef4444;font-size:13px">Virhe kuvien latauksessa: ${escHtml(err.message)}</p>`;
  }
}

function showLibToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;z-index:99999;pointer-events:none';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ─── Kuvavalinnan modaali (käytetään popup-editorista) ───────────────────────

/**
 * Avaa kuvavalinnan modaalin.
 * Palauttaa Promise joka resolvoituu { url, firebasePath } -objektiin
 * tai null jos käyttäjä sulkee ilman valintaa.
 */
export function openImagePicker() {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px';

    overlay.innerHTML = `
      <div style="background:#fff;border-radius:14px;width:100%;max-width:680px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
        <div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <h2 style="font-size:16px;font-weight:700;margin:0">Valitse kuva</h2>
          <button id="picker-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#64748b;line-height:1;padding:4px">&times;</button>
        </div>
        <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;flex-shrink:0;display:flex;align-items:center;gap:10px">
          <label class="btn btn-primary btn-sm" style="cursor:pointer">
            <i class="fa fa-upload"></i> Lataa uusi kuva
            <input id="picker-file" type="file" accept="image/*" style="display:none">
          </label>
          <span id="picker-upload-status" style="font-size:13px;color:#3b82f6;display:none"><i class="fa fa-spinner fa-spin"></i> Ladataan...</span>
          <span style="font-size:12px;color:#94a3b8">tai valitse alta</span>
        </div>
        <div id="picker-grid" style="padding:16px 20px;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;flex:1"></div>
      </div>`;

    document.body.appendChild(overlay);

    const close = (result = null) => {
      overlay.remove();
      resolve(result);
    };

    overlay.querySelector('#picker-close').addEventListener('click', () => close(null));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(null); });

    // Upload
    const fileInput = overlay.querySelector('#picker-file');
    const uploadStatus = overlay.querySelector('#picker-upload-status');
    fileInput.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      fileInput.value = '';
      uploadStatus.style.display = 'inline';
      try {
        const data = await doUpload(file);
        close({ url: data.imageUrl, firebasePath: data.imageFirebasePath || '' });
      } catch (err) {
        uploadStatus.style.display = 'none';
        alert('Latausvirhe: ' + err.message);
      }
    });

    // Hae kuvat ja renderöi
    const grid = overlay.querySelector('#picker-grid');
    loadPickerGrid(grid, close);
  });
}

async function loadPickerGrid(grid, onSelect) {
  grid.innerHTML = '<p style="color:#94a3b8;font-size:13px;grid-column:1/-1">Ladataan...</p>';
  try {
    const images = await fetchImages();
    if (images.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:30px 20px;color:#94a3b8">
          <i class="fa fa-images" style="font-size:28px;display:block;margin-bottom:8px"></i>
          <p style="font-size:13px;margin:0">Ei kuvia. Lataa ensimmäinen kuva yllä.</p>
        </div>`;
      return;
    }
    grid.innerHTML = images.map(img => `
      <div class="picker-item" data-id="${img._id}" data-url="${escHtml(img.url)}" data-path="${escHtml(img.firebasePath || '')}"
        style="border:2px solid #e2e8f0;border-radius:8px;overflow:hidden;cursor:pointer;transition:border-color 0.15s,transform 0.1s" title="${escHtml(img.name)}">
        <div style="aspect-ratio:4/3;overflow:hidden;background:#f8fafc">
          <img src="${escHtml(img.url)}" alt="${escHtml(img.name)}"
            style="width:100%;height:100%;object-fit:cover"
            onerror="this.style.opacity='0.3'">
        </div>
        <div style="padding:5px 7px;font-size:11px;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(img.name)}</div>
      </div>`).join('');

    grid.querySelectorAll('.picker-item').forEach(item => {
      item.addEventListener('mouseenter', () => { item.style.borderColor = '#3b82f6'; item.style.transform = 'scale(1.02)'; });
      item.addEventListener('mouseleave', () => { item.style.borderColor = '#e2e8f0'; item.style.transform = ''; });
      item.addEventListener('click', () => {
        onSelect({ url: item.dataset.url, firebasePath: item.dataset.path });
      });
    });
  } catch (err) {
    grid.innerHTML = `<p style="color:#ef4444;font-size:13px;grid-column:1/-1">Virhe: ${escHtml(err.message)}</p>`;
  }
}
