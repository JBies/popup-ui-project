// js/dashboard/dashboard-main.js
import { initSidebar } from './sidebar.js';
import { initElementList } from './element-list.js';
import { initTemplateLibrary } from './template-library.js';
import { openEditor } from './element-editor.js';
import { initAnalyticsPage }  from './analytics-page.js';
import { initCampaignsPanel } from './campaigns-panel.js';
import { initHelpPanel }      from './help-panel.js';
import { initLeadsPanel }     from './leads-panel.js';

let currentView = 'elements';

async function init() {
  // Auth-tarkistus
  let user;
  try {
    const r = await fetch('/api/user');
    if (!r.ok) { window.location.href = '/'; return; }
    const data = await r.json();
    user = data.user || data;  // unwrap { user: {...} } wrapper
    if (!user || !user._id) { window.location.href = '/'; return; }
    if (user.role === 'pending') { window.location.href = '/pending'; return; }
  } catch {
    window.location.href = '/';
    return;
  }

  // Käyttäjätiedot sidebariin
  const nameEl = document.getElementById('user-name');
  const roleEl = document.getElementById('user-role');
  const avatarEl = document.getElementById('user-avatar');
  if (nameEl) nameEl.textContent = user.displayName || user.email || '';
  if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Admin' : 'Käyttäjä';
  if (avatarEl && user.profilePicture) avatarEl.src = user.profilePicture;
  if (user.role === 'admin') {
    const adminLink = document.getElementById('nav-admin');
    if (adminLink) adminLink.style.display = 'flex';
  }

  // Asennuskoodi – site token + selkeä ohjeistus
  renderInstallSection(user);

  window.__currentUser__ = user;  // tarvitaan editor + list komponenteissa
  initSidebar(user);
  initElementList(user);
  initTemplateLibrary();
  initAnalyticsPage();
  initCampaignsPanel();
  initHelpPanel();
  initLeadsPanel();
  setupWebhooks();
  setupCreateDropdown();
  setupNavigation();
  setupLogout();

  // Kuuntele editor-avauksia
  window.addEventListener('open-editor', e => {
    showView('elements');
    openEditor(e.detail || {});
  });

  // Hash-reititys
  handleHash(window.location.hash);
  window.addEventListener('hashchange', () => handleHash(window.location.hash));
}

function handleHash(hash) {
  const view = (hash.replace('#', '') || 'elements');
  showView(view);
}

export function showView(name) {
  currentView = name;
  document.querySelectorAll('[id^="view-"]').forEach(el => el.style.display = 'none');
  const target = document.getElementById('view-' + name);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.view === name || a.getAttribute('href') === '#' + name);
  });

  const titles = { elements: 'Omat elementit', analytics: 'Tilastot', settings: 'Asennuskoodi', campaigns: 'Kampanjat', webhooks: 'Webhooks', help: 'Ohjeet', leads: 'Liidit' };
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = titles[name] || 'UI Manager';
}

function setupNavigation() {
  document.querySelectorAll('.nav-link[data-view]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const view = a.dataset.view;
      window.location.hash = '#' + view;
    });
  });

  document.getElementById('btn-refresh')?.addEventListener('click', () => {
    if (currentView === 'elements') window.dispatchEvent(new CustomEvent('refresh-elements'));
  });
}

function setupCreateDropdown() {
  const btn = document.getElementById('btn-create');
  const dd = document.getElementById('create-dropdown');
  if (!btn || !dd) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('click', () => { dd.style.display = 'none'; });

  document.querySelectorAll('.dropdown-item[data-type]').forEach(item => {
    item.addEventListener('click', () => {
      dd.style.display = 'none';
      showView('elements');
      window.dispatchEvent(new CustomEvent('open-editor', { detail: { elementType: item.dataset.type } }));
    });
  });
}

function setupLogout() {
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await fetch('/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });
}

async function setupWebhooks() {
  const container = document.getElementById('webhooks-content');
  if (!container) return;

  async function loadWebhooks() {
    const r = await fetch('/api/user/webhooks');
    if (!r.ok) return;
    const whs = await r.json();
    const list = document.getElementById('wh-list');
    if (!list) return;
    list.innerHTML = whs.length ? whs.map(wh => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px">
        <div style="flex:1">
          <div style="font-weight:500;font-size:13px">${wh.name || wh.url}</div>
          <div style="font-size:11px;color:#64748b">${wh.url} · events: ${(wh.events||[]).join(', ')}</div>
        </div>
        <button class="wh-delete" data-id="${wh._id}" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px">✕</button>
      </div>`).join('') : '<p style="color:#94a3b8;font-size:13px">Ei webhookeja</p>';

    list.querySelectorAll('.wh-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        await fetch('/api/user/webhooks/' + btn.dataset.id, { method: 'DELETE' });
        loadWebhooks();
      });
    });
  }

  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#webhooks') loadWebhooks();
  });
  if (window.location.hash === '#webhooks') loadWebhooks();

  document.getElementById('wh-add-btn')?.addEventListener('click', async () => {
    const url    = document.getElementById('wh-url')?.value?.trim();
    const name   = document.getElementById('wh-name')?.value?.trim();
    const events = [...document.querySelectorAll('.wh-event:checked')].map(cb => cb.value);
    if (!url) return;
    await fetch('/api/user/webhooks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url, events: events.length ? events : ['click'] })
    });
    if (document.getElementById('wh-url')) document.getElementById('wh-url').value = '';
    if (document.getElementById('wh-name')) document.getElementById('wh-name').value = '';
    loadWebhooks();
  });
}

function renderInstallSection(user) {
  const container = document.getElementById('install-section');
  if (!container) return;

  const siteToken = user?.siteToken || '';
  const universalCode = siteToken
    ? `<script src="https://popupmanager.net/ui-embed.js" data-site="${siteToken}"><\/script>`
    : `<!-- Kirjaudu uudelleen niin site-token generoidaan -->`;

  container.innerHTML = `
    <!-- Suositeltava: Yleinen asennuskoodi -->
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:18px 20px;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="font-size:16px">⭐</span>
        <span style="font-size:14px;font-weight:700;color:#1e40af">Suositeltava: Yleinen asennuskoodi</span>
      </div>
      <p style="font-size:13px;color:#1e40af;margin:0 0 12px">Lisää <strong>kerran</strong> sivustollesi – kaikki luomasi elementit latautuvat automaattisesti. Ei tarvitse koskea sivustokoodiin kun lisäät tai poistat elementtejä.</p>
      <div style="background:#1e293b;border-radius:8px;padding:14px;position:relative">
        <pre id="install-universal" style="color:#e2e8f0;font-family:monospace;font-size:12px;white-space:pre-wrap;word-break:break-all;margin:0">${escHtml(universalCode)}</pre>
        <button onclick="copyUniversal()" style="position:absolute;top:8px;right:8px;background:#334155;border:none;color:#94a3b8;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:12px"><i class="fa fa-copy"></i> Kopioi</button>
      </div>
      <p style="font-size:12px;color:#3b82f6;margin:8px 0 0">Liitä tämä sivustosi <code>&lt;/body&gt;</code>-tagin yläpuolelle. Vain yksi koodi koko sivustolle.</p>
    </div>

    <!-- Yksittäinen elementti -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 20px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="font-size:16px">📌</span>
        <span style="font-size:14px;font-weight:700;color:#374151">Yksittäinen elementti</span>
      </div>
      <p style="font-size:13px;color:#64748b;margin:0 0 12px">Voit myös aktivoida elementtejä yksitellen. Embed-koodi löytyy jokaisen elementin <strong>tilasto-painikkeesta (📊)</strong>. Useita elementtejä voi laittaa samaan scriptilohkoon:</p>
      <div style="background:#1e293b;border-radius:8px;padding:14px">
        <pre style="color:#e2e8f0;font-family:monospace;font-size:12px;white-space:pre-wrap;margin:0">${escHtml('<script src="https://popupmanager.net/ui-embed.js"><\/script>\n<script>\n  ShowElement(\'ELEMENT_ID_1\');\n  ShowElement(\'ELEMENT_ID_2\');  // useita elementtejä = OK\n<\/script>')}</pre>
      </div>
      <p style="font-size:12px;color:#94a3b8;margin:8px 0 0">⚠️ Yllä olevat ID:t ovat esimerkkejä – oikeat ID:t löytyvät kunkin elementin tilastoista.</p>
    </div>`;

  window.copyUniversal = function () {
    const code = document.getElementById('install-universal')?.textContent || '';
    navigator.clipboard.writeText(code).then(() => showToast('Koodi kopioitu!'));
  };
  // Legacy support
  window.copyInstallCode = window.copyUniversal;
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
    background: type === 'error' ? '#ef4444' : '#1e293b',
    color: '#fff', padding: '10px 20px', borderRadius: '8px',
    fontSize: '13px', fontWeight: '500', zIndex: '99999',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

init();
