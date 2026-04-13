// js/dashboard/dashboard-main.js
import { initSidebar } from './sidebar.js';
import { initElementList } from './element-list.js';
import { initTemplateLibrary } from './template-library.js';
import { openEditor } from './element-editor.js';
import { initAnalyticsPage }  from './analytics-page.js';
import { initHelpPanel }      from './help-panel.js';
import { initLeadsPanel }     from './leads-panel.js';
import { initImageLibraryPanel } from './image-library-panel.js';

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
  if (avatarEl && user.profilePicture) { avatarEl.src = user.profilePicture; avatarEl.style.display = ''; }
  if (user.role === 'admin') {
    const adminLink = document.getElementById('nav-admin');
    if (adminLink) adminLink.style.display = 'flex';
  }

  // Asennuskoodi – site token + selkeä ohjeistus
  renderInstallSection(user);
  renderNotificationSettings(user);

  window.__currentUser__ = user;  // tarvitaan editor + list komponenteissa
  initSidebar(user);
  initElementList(user);
  initTemplateLibrary();
  initAnalyticsPage();
  initHelpPanel();
  initLeadsPanel();
  initImageLibraryPanel();
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

  const titles = { elements: 'Omat elementit', analytics: 'Tilastot', settings: 'Asennuskoodi', help: 'Ohjeet', leads: 'Liidit' };
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
    if (currentView === 'images') initImageLibraryPanel();
  });
}

function setupCreateDropdown() {
  const btn = document.getElementById('btn-create');
  const modal = document.getElementById('type-picker-modal');
  if (!btn || !modal) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    modal.style.display = 'flex';
  });
  document.getElementById('type-picker-close')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });

  document.querySelectorAll('.type-card[data-type]').forEach(card => {
    card.addEventListener('click', () => {
      modal.style.display = 'none';
      showView('elements');
      window.dispatchEvent(new CustomEvent('open-editor', { detail: { elementType: card.dataset.type } }));
    });
  });
}

function setupLogout() {
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await fetch('/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });
}


async function renderInstallSection(user) {
  const container = document.getElementById('install-section');
  if (!container) return;

  let sites = [];
  try {
    const r = await fetch('/api/sites');
    if (r.ok) sites = await r.json();
  } catch {}

  const renderSites = (siteList) => {
    const siteToken = user?.siteToken || '';

    // Jos sivustoja on, näytä niiden koodit; muuten näytä yleinen token
    const hasSites = siteList.length > 0;
    const primaryCode = hasSites
      ? `<script src="https://popupmanager.net/ui-embed.js" data-site="${siteList[0].token}"><\/script>`
      : (siteToken
          ? `<script src="https://popupmanager.net/ui-embed.js" data-site="${siteToken}"><\/script>`
          : `<!-- Kirjaudu uudelleen niin koodi generoidaan -->`);

    const sitesHTML = siteList.map(s => {
      const code = `<script src="https://popupmanager.net/ui-embed.js" data-site="${s.token}"><\/script>`;
      return `
        <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f8fafc">
            <span style="font-size:15px">🌐</span>
            <div style="flex:1">
              <span style="font-weight:600;font-size:13px;color:#1e293b">${escHtml(s.name)}</span>
              ${s.domain ? `<span style="font-size:11px;color:#94a3b8;margin-left:8px">${escHtml(s.domain)}</span>` : ''}
            </div>
            <button class="copy-site-btn btn btn-primary btn-sm" data-code="${escHtml(code)}" style="font-size:11px">
              <i class="fa fa-copy"></i> Kopioi koodi
            </button>
            <button class="delete-site-btn" data-id="${s._id}" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px;padding:4px 8px" title="Poista">✕</button>
          </div>
          <div style="padding:10px 14px;background:#1e293b">
            <pre style="color:#e2e8f0;font-family:monospace;font-size:11px;white-space:pre-wrap;word-break:break-all;margin:0">${escHtml(code)}</pre>
          </div>
        </div>`;
    }).join('');

    container.innerHTML = `
      <!-- 3-vaiheen ohje -->
      <div style="margin-bottom:28px">
        <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 6px">Asennusohje</h2>
        <p style="font-size:13px;color:#64748b;margin:0 0 20px">Kolme askelta ja elementtisi on live sivustollasi.</p>

        <!-- Selitys: miten toimii -->
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 18px;margin-bottom:20px">
          <div style="font-size:13px;font-weight:700;color:#1d4ed8;margin-bottom:10px">💡 Miten järjestelmä tietää mitä näyttää?</div>
          <p style="font-size:13px;color:#1e40af;margin:0 0 12px;line-height:1.6">
            Jokaiselle sivustollesi luodaan oma tunnistuskoodi. Kun koodi on sivustolla, se kertoo järjestelmälle: <em>"tämä on Kuntokeitaan sivu — näytä Kuntokeitaan elementit."</em>
          </p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
            <div style="background:#fff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;flex:1;min-width:160px">
              <div style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:4px">🌐 Joensuun Kuntokeidas</div>
              <div style="font-size:11px;color:#64748b;margin-bottom:6px">Oma koodi → omat elementit</div>
              <div style="font-size:10px;color:#10b981;font-weight:600">✓ Popup "Avaa ovi keväälle"</div>
            </div>
            <div style="background:#fff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;flex:1;min-width:160px">
              <div style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:4px">🌐 Cryostudio Joensuu</div>
              <div style="font-size:11px;color:#64748b;margin-bottom:6px">Eri koodi → eri elementit</div>
              <div style="font-size:10px;color:#10b981;font-weight:600">✓ Sticky bar "Varaa aika"</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:5px">
            <div style="font-size:12px;color:#1d4ed8"><span style="font-weight:700">✅ Koodi lisätään vain kerran</span> — kaikilla saman sivuston sivuilla (etusivu, varaussivu, yms.) toimii sama koodi.</div>
            <div style="font-size:12px;color:#1d4ed8"><span style="font-weight:700">✅ Lisää elementtejä milloin vain</span> — ne ilmestyvät automaattisesti, koodia ei tarvitse vaihtaa.</div>
            <div style="font-size:12px;color:#1d4ed8"><span style="font-weight:700">✅ Aktivoi ja sammuta togglella</span> — elementtilistasta, ei koskematta sivuston koodiin.</div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;gap:14px;align-items:flex-start;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px 16px">
            <div style="width:28px;height:28px;border-radius:50%;background:#16a34a;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">1</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700;color:#14532d;margin-bottom:4px">Kopioi asennuskoodi</div>
              <div style="font-size:12px;color:#15803d;margin-bottom:10px">Lisää sivusto alta ja kopioi sen koodi. Yksi koodi riittää kaikille elementeille!</div>
              ${hasSites ? `
                <div id="sites-list">${sitesHTML}</div>
                <button id="btn-add-site" class="btn btn-secondary btn-sm" style="margin-top:6px"><i class="fa fa-plus"></i> Lisää sivusto</button>
              ` : `
                <div style="background:#1e293b;border-radius:8px;padding:12px;position:relative;margin-bottom:10px">
                  <pre id="install-universal" style="color:#e2e8f0;font-family:monospace;font-size:11px;white-space:pre-wrap;word-break:break-all;margin:0">${escHtml(primaryCode)}</pre>
                  <button id="btn-copy-universal" style="position:absolute;top:8px;right:8px;background:#334155;border:none;color:#94a3b8;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px"><i class="fa fa-copy"></i> Kopioi</button>
                </div>
                <button id="btn-add-site" class="btn btn-primary btn-sm"><i class="fa fa-plus"></i> Lisää sivusto</button>
              `}
            </div>
          </div>

          <div style="display:flex;gap:14px;align-items:flex-start;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px">
            <div style="width:28px;height:28px;border-radius:50%;background:#3b82f6;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">2</div>
            <div>
              <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px">Avaa sivustosi asetukset</div>
              <div style="font-size:12px;color:#64748b">Etsi kohta <strong>"Lisää skripti"</strong>, <strong>"Header scripts"</strong> tai <strong>"Mukautettu HTML"</strong> — useimmissa sivustopalveluissa se löytyy kohdasta Asetukset → Koodi.</div>
            </div>
          </div>

          <div style="display:flex;gap:14px;align-items:flex-start;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px">
            <div style="width:28px;height:28px;border-radius:50%;background:#3b82f6;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">3</div>
            <div>
              <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px">Liitä koodi ja tallenna</div>
              <div style="font-size:12px;color:#64748b">Liitä koodi kenttään ja tallenna. Elementtisi ilmestyy sivustolle heti — voit aktivoida ja deaktivoida ne dashboard-listauksesta.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lisää sivusto -modaali -->
      <div id="add-site-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center">
        <div style="background:#fff;border-radius:12px;padding:28px;width:420px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
          <h3 style="font-size:16px;font-weight:700;margin:0 0 20px">Lisää sivusto</h3>
          <div style="margin-bottom:14px">
            <label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:5px">Sivuston nimi *</label>
            <input id="new-site-name" type="text" placeholder="esim. Pääsivu, Verkkokauppa…" style="width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box">
          </div>
          <div style="margin-bottom:20px">
            <label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:5px">Domain (vapaaehtoinen)</label>
            <input id="new-site-domain" type="text" placeholder="esim. paasivu.fi" style="width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box">
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button id="cancel-site-modal" class="btn btn-secondary">Peruuta</button>
            <button id="confirm-add-site" class="btn btn-primary">Luo sivusto</button>
          </div>
        </div>
      </div>`;

    // Kuuntelijat
    document.getElementById('btn-add-site')?.addEventListener('click', () => {
      const m = document.getElementById('add-site-modal');
      if (m) { m.style.display = 'flex'; document.getElementById('new-site-name')?.focus(); }
    });
    document.getElementById('cancel-site-modal')?.addEventListener('click', () => {
      document.getElementById('add-site-modal').style.display = 'none';
    });
    document.getElementById('confirm-add-site')?.addEventListener('click', async () => {
      const name = document.getElementById('new-site-name')?.value?.trim();
      const domain = document.getElementById('new-site-domain')?.value?.trim();
      if (!name) { showToast('Nimi on pakollinen', 'error'); return; }
      const r = await fetch('/api/sites', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domain })
      });
      if (!r.ok) { showToast('Sivuston luonti epäonnistui', 'error'); return; }
      document.getElementById('add-site-modal').style.display = 'none';
      document.getElementById('new-site-name').value = '';
      document.getElementById('new-site-domain').value = '';
      showToast('Sivusto luotu!');
      const newSite = await r.json();
      siteList.push(newSite);
      renderSites(siteList);
      window.dispatchEvent(new CustomEvent('sites-updated'));
    });
    document.getElementById('btn-copy-universal')?.addEventListener('click', () => {
      const code = document.getElementById('install-universal')?.textContent || '';
      navigator.clipboard.writeText(code).then(() => showToast('Koodi kopioitu!'));
    });
    container.querySelectorAll('.copy-site-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.code).then(() => showToast('Koodi kopioitu!'));
      });
    });
    container.querySelectorAll('.delete-site-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Poistetaanko sivusto? Elementit eivät katoa, mutta ne irrotetaan tästä sivustosta.')) return;
        const r = await fetch('/api/sites/' + btn.dataset.id, { method: 'DELETE' });
        if (!r.ok) { showToast('Poisto epäonnistui', 'error'); return; }
        showToast('Sivusto poistettu');
        const idx = siteList.findIndex(s => String(s._id) === btn.dataset.id);
        if (idx !== -1) siteList.splice(idx, 1);
        renderSites(siteList);
        window.dispatchEvent(new CustomEvent('sites-updated'));
      });
    });
  };

  renderSites(sites);
}

async function renderNotificationSettings(user) {
  const container = document.getElementById('notifications-section');
  if (!container) return;

  const n = user.emailNotifications || {};
  const leadAlert    = n.leadAlert    !== false;
  const weeklyReport = n.weeklyReport !== false;
  const notifyEmail  = n.notifyEmail  || '';

  container.innerHTML = `
    <div style="border-top:1px solid #e2e8f0;padding-top:28px">
      <h3 style="font-size:15px;font-weight:700;color:#1e293b;margin:0 0 4px">📧 Sähköposti-ilmoitukset</h3>
      <p style="font-size:13px;color:#64748b;margin:0 0 18px">Hallinnoi mitä sähköpostiviestejä haluat vastaanottaa.</p>

      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:18px">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none">
          <input type="checkbox" id="notif-lead-alert" ${leadAlert ? 'checked' : ''}
            style="width:16px;height:16px;cursor:pointer;accent-color:#3b82f6">
          <div>
            <div style="font-size:13px;font-weight:600;color:#1e293b">Ilmoitus uudesta liidistä</div>
            <div style="font-size:12px;color:#64748b">Saat sähköpostin heti kun lomakkeelle saapuu uusi täyttö</div>
          </div>
        </label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none">
          <input type="checkbox" id="notif-weekly-report" ${weeklyReport ? 'checked' : ''}
            style="width:16px;height:16px;cursor:pointer;accent-color:#3b82f6">
          <div>
            <div style="font-size:13px;font-weight:600;color:#1e293b">Viikkoraportti</div>
            <div style="font-size:12px;color:#64748b">Yhteenveto viikon tilastoista — joka maanantai klo 8:00</div>
          </div>
        </label>
      </div>

      <div style="margin-bottom:16px">
        <label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:5px">
          Ilmoitusosoite
          <span style="font-weight:400;color:#94a3b8;margin-left:4px">(tyhjä = käytetään tili-sähköpostia: ${escHtml(user.email)})</span>
        </label>
        <input type="email" id="notif-email" value="${escHtml(notifyEmail)}" placeholder="${escHtml(user.email)}"
          style="width:100%;max-width:360px;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box">
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button id="notif-save-btn" class="btn btn-primary btn-sm">
          <i class="fa fa-save"></i> Tallenna asetukset
        </button>
        <button id="notif-test-btn" class="btn btn-secondary btn-sm">
          <i class="fa fa-envelope"></i> Lähetä testisähköposti
        </button>
      </div>
      <div id="notif-feedback" style="margin-top:10px;font-size:13px;display:none"></div>
    </div>`;

  function showFeedback(msg, ok = true) {
    const el = document.getElementById('notif-feedback');
    if (!el) return;
    el.textContent = msg;
    el.style.color  = ok ? '#16a34a' : '#dc2626';
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3500);
  }

  document.getElementById('notif-save-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('notif-save-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Tallennetaan…';
    try {
      const body = {
        leadAlert:    document.getElementById('notif-lead-alert')?.checked,
        weeklyReport: document.getElementById('notif-weekly-report')?.checked,
        notifyEmail:  document.getElementById('notif-email')?.value?.trim() || '',
      };
      const r = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message || 'Virhe'); }
      showFeedback('✓ Asetukset tallennettu');
    } catch (e) {
      showFeedback(e.message || 'Tallennus epäonnistui', false);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa fa-save"></i> Tallenna asetukset';
    }
  });

  document.getElementById('notif-test-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('notif-test-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Lähetetään…';
    try {
      const r = await fetch('/api/user/notifications/test', { method: 'POST' });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message || 'Virhe'); }
      const data = await r.json();
      showFeedback(`✓ Testisähköposti lähetetty osoitteeseen ${data.to}`);
    } catch (e) {
      showFeedback(e.message || 'Lähetys epäonnistui — tarkista SMTP-asetukset', false);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa fa-envelope"></i> Lähetä testisähköposti';
    }
  });
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
