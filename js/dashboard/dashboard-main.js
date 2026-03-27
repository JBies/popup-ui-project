// js/dashboard/dashboard-main.js
import { initSidebar } from './sidebar.js';
import { initElementList } from './element-list.js';
import { initTemplateLibrary } from './template-library.js';
import { openEditor } from './element-editor.js';

let currentView = 'elements';

async function init() {
  // Auth-tarkistus
  let user;
  try {
    const r = await fetch('/api/user');
    if (!r.ok) { window.location.href = '/'; return; }
    user = await r.json();
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

  // Asennuskoodi
  const installEl = document.getElementById('install-code');
  if (installEl) {
    installEl.textContent = `<!-- Liitä tämä </body>-tagin yläpuolelle -->
<script src="https://popupmanager.net/ui-embed.js"><\/script>`;
  }
  window.copyInstallCode = function () {
    const code = installEl ? installEl.textContent : '';
    navigator.clipboard.writeText(code).then(() => showToast('Koodi kopioitu!'));
  };

  initSidebar(user);
  initElementList();
  initTemplateLibrary();
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

  const titles = { elements: 'Omat elementit', analytics: 'Tilastot', settings: 'Asennuskoodi' };
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
