// js/dashboard/chatbots-page.js
import { showToast } from './dashboard-main.js';

let currentBotId = null;
let allBots = [];

export function initChatbotsPage() {
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#chatbots') loadBots();
  });
  if (window.location.hash === '#chatbots') loadBots();
}

// ── Lataa bottilista ──────────────────────────────────────────────────────────
async function loadBots() {
  const container = document.getElementById('chatbots-content');
  if (!container) return;

  container.innerHTML = `<div style="padding:40px;text-align:center;color:#94a3b8"><i class="fa fa-spinner fa-spin"></i> Ladataan...</div>`;

  try {
    const r = await fetch('/api/chatbots');
    if (r.status === 403) {
      container.innerHTML = renderNoAccess();
      return;
    }
    if (!r.ok) throw new Error();
    allBots = await r.json();
    if (currentBotId) {
      renderBotEditor(container, allBots.find(b => b._id === currentBotId) || allBots[0]);
    } else {
      renderBotList(container);
    }
  } catch {
    container.innerHTML = `<div style="padding:40px;text-align:center;color:#ef4444">Virhe bottien latauksessa.</div>`;
  }
}

function renderNoAccess() {
  return `
    <div style="max-width:480px;margin:80px auto;text-align:center;padding:0 24px">
      <div style="font-size:52px;margin-bottom:16px">🤖</div>
      <h3 style="font-size:18px;font-weight:700;color:#1e293b;margin:0 0 10px">Chatbot-ominaisuus ei ole käytössä</h3>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px">
        Tämä ominaisuus vaatii admin-aktivoinnin. Ota yhteyttä ylläpitäjään.
      </p>
    </div>`;
}

// ── Bottilista ────────────────────────────────────────────────────────────────
function renderBotList(container) {
  currentBotId = null;
  const html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px">
      <div>
        <h2 style="font-size:18px;font-weight:700;color:#1e293b;margin:0">Chatbotit</h2>
        <p style="font-size:13px;color:#64748b;margin:4px 0 0">Hallinnoi tekoälychatbottejasi</p>
      </div>
      <button id="cb-create-btn" style="padding:9px 20px;background:#2563EB;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px">
        <i class="fa fa-plus"></i> Uusi chatbot
      </button>
    </div>
    ${allBots.length === 0 ? renderEmptyState() : renderBotsGrid()}
  `;
  container.innerHTML = html;

  container.querySelector('#cb-create-btn')?.addEventListener('click', () => showCreateModal(container));
  container.querySelectorAll('[data-bot-id]').forEach(card => {
    card.addEventListener('click', () => {
      const bot = allBots.find(b => b._id === card.dataset.botId);
      if (bot) renderBotEditor(container, bot);
    });
  });
}

function renderEmptyState() {
  return `
    <div style="text-align:center;padding:60px 24px;border:2px dashed #e2e8f0;border-radius:16px">
      <div style="font-size:48px;margin-bottom:16px">🤖</div>
      <h3 style="font-size:16px;font-weight:600;color:#1e293b;margin:0 0 8px">Ei botteja vielä</h3>
      <p style="color:#64748b;font-size:13px;margin:0 0 20px">Luo ensimmäinen chatbot lisätäksesi sen sivustollesi.</p>
    </div>`;
}

function renderBotsGrid() {
  return `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
      ${allBots.map(bot => `
        <div data-bot-id="${bot._id}" style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:20px;cursor:pointer;transition:all 0.18s" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)';this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='';this.style.transform=''">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <div style="width:42px;height:42px;border-radius:${bot.button?.shape==='rounded'?'12px':'50%'};background:${bot.button?.color||'#2563EB'};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">
              ${bot.button?.iconType==='emoji' ? bot.button.iconValue : '💬'}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:14px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(bot.name || 'Chatbot')}</div>
              <div style="font-size:12px;color:#64748b;margin-top:2px">${bot.mode === 'qa' ? '📋 Q&A-moodi' : '🤖 AI-moodi'}</div>
            </div>
            <div style="width:8px;height:8px;border-radius:50%;background:${bot.isActive?'#22c55e':'#94a3b8'};flex-shrink:0"></div>
          </div>
          <div style="font-size:11px;color:#94a3b8">Luotu ${fmtDate(bot.createdAt)}</div>
        </div>
      `).join('')}
    </div>`;
}

// ── Luo-modaali ───────────────────────────────────────────────────────────────
function showCreateModal(container) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:18px;padding:28px;width:420px;max-width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.25)">
      <h3 style="font-size:16px;font-weight:700;color:#1e293b;margin:0 0 20px">Uusi chatbot</h3>
      <div style="margin-bottom:14px">
        <label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:6px">Botin nimi *</label>
        <input id="cb-new-name" type="text" placeholder="esim. Asiakaspalvelubotti" style="width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:9px;font-size:13px;outline:none;font-family:inherit">
      </div>
      <div style="margin-bottom:20px">
        <label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:6px">Moodi</label>
        <div style="display:flex;gap:10px">
          <label style="flex:1;display:flex;align-items:flex-start;gap:10px;padding:12px;border:2px solid #e2e8f0;border-radius:10px;cursor:pointer" id="cb-mode-ai-label">
            <input type="radio" name="cb-mode" value="ai" checked style="margin-top:2px">
            <div><div style="font-size:13px;font-weight:600;color:#1e293b">🤖 AI-chatbot</div><div style="font-size:11px;color:#64748b;margin-top:2px">RAG + tekoäly, vastaa dokumenttien perusteella</div></div>
          </label>
          <label style="flex:1;display:flex;align-items:flex-start;gap:10px;padding:12px;border:2px solid #e2e8f0;border-radius:10px;cursor:pointer" id="cb-mode-qa-label">
            <input type="radio" name="cb-mode" value="qa" style="margin-top:2px">
            <div><div style="font-size:13px;font-weight:600;color:#1e293b">📋 Q&A-only</div><div style="font-size:11px;color:#64748b;margin-top:2px">Pelkkä kysymys-vastaus, ei API-kuluja</div></div>
          </label>
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button id="cb-modal-cancel" style="padding:9px 18px;border:1px solid #e2e8f0;background:#fff;border-radius:9px;font-size:13px;cursor:pointer;font-family:inherit">Peruuta</button>
        <button id="cb-modal-create" style="padding:9px 18px;background:#2563EB;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">Luo botti</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  overlay.querySelector('#cb-modal-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('#cb-modal-create').addEventListener('click', async () => {
    const name = overlay.querySelector('#cb-new-name').value.trim();
    const mode = overlay.querySelector('input[name="cb-mode"]:checked').value;
    if (!name) { overlay.querySelector('#cb-new-name').style.borderColor = '#ef4444'; return; }

    try {
      const r = await fetch('/api/chatbots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mode })
      });
      if (!r.ok) {
        const err = await r.json();
        showToast(err.message || 'Virhe', 'error');
        return;
      }
      const bot = await r.json();
      overlay.remove();
      allBots.unshift(bot);
      renderBotEditor(container, bot);
    } catch {
      showToast('Virhe botin luonnissa', 'error');
    }
  });
}

// ── Botti-editori (5 välilehteä) ──────────────────────────────────────────────
function renderBotEditor(container, bot) {
  if (!bot) { renderBotList(container); return; }
  currentBotId = bot._id;

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap">
      <button id="cb-back" style="background:none;border:none;cursor:pointer;color:#64748b;font-size:13px;display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;font-family:inherit" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
        <i class="fa fa-arrow-left"></i> Kaikki botit
      </button>
      <div style="width:1px;height:18px;background:#e2e8f0"></div>
      <div style="width:32px;height:32px;border-radius:${bot.button?.shape==='rounded'?'9px':'50%'};background:${bot.button?.color||'#2563EB'};display:flex;align-items:center;justify-content:center;font-size:16px">
        ${bot.button?.iconType==='emoji' ? bot.button.iconValue : '💬'}
      </div>
      <h2 style="font-size:16px;font-weight:700;color:#1e293b;margin:0">${escHtml(bot.name)}</h2>
      <span style="padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:${bot.isActive?'#dcfce7':'#f1f5f9'};color:${bot.isActive?'#16a34a':'#64748b'}">
        ${bot.isActive ? 'Aktiivinen' : 'Piilotettu'}
      </span>
      <div style="margin-left:auto;display:flex;gap:8px">
        <button id="cb-copy-snippet" style="padding:7px 14px;border:1px solid #e2e8f0;background:#fff;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:inherit">
          <i class="fa fa-code"></i> Koodi
        </button>
        <button id="cb-delete-bot" style="padding:7px 14px;border:1px solid #fecaca;background:#fff;color:#ef4444;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    </div>

    <div style="display:flex;border-bottom:2px solid #e2e8f0;margin-bottom:24px;gap:4px;overflow-x:auto">
      ${['appearance','knowledge','behavior','qa','logs'].map((tab, i) => {
        const labels = ['🎨 Ulkoasu','📚 Tietokanta','⚙️ Käyttäytyminen','💬 Q&A','📊 Logit'];
        return `<button class="cb-tab" data-tab="${tab}" style="padding:9px 16px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:500;color:#64748b;border-bottom:2px solid transparent;margin-bottom:-2px;white-space:nowrap;font-family:inherit;transition:color 0.15s">${labels[i]}</button>`;
      }).join('')}
    </div>

    <div id="cb-tab-content"></div>
  `;

  container.querySelector('#cb-back').addEventListener('click', () => {
    currentBotId = null;
    renderBotList(container);
  });

  container.querySelectorAll('.cb-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.cb-tab').forEach(b => {
        b.style.color = '#64748b';
        b.style.borderBottomColor = 'transparent';
      });
      btn.style.color = '#2563EB';
      btn.style.borderBottomColor = '#2563EB';
      renderTab(container, bot, btn.dataset.tab);
    });
  });

  // Avaa ensimmäinen välilehti
  const firstTab = container.querySelector('.cb-tab');
  if (firstTab) { firstTab.click(); }

  // Koodi-nappi
  container.querySelector('#cb-copy-snippet').addEventListener('click', () => {
    const snippet = `<script src="${location.origin}/chatbot-embed.js" data-bot-id="${bot._id}" async><\/script>`;
    navigator.clipboard.writeText(snippet).then(() => showToast('Koodi kopioitu!', 'success')).catch(() => {
      prompt('Kopioi tämä koodi sivustollesi:', snippet);
    });
  });

  // Poista-nappi
  container.querySelector('#cb-delete-bot').addEventListener('click', () => {
    if (!confirm(`Poistetaanko botti "${bot.name}" pysyvästi? Kaikki dokumentit ja chat-logit poistetaan.`)) return;
    fetch(`/api/chatbots/${bot._id}`, { method: 'DELETE' })
      .then(r => r.ok ? (allBots = allBots.filter(b => b._id !== bot._id), currentBotId = null, renderBotList(container)) : showToast('Poisto epäonnistui', 'error'))
      .catch(() => showToast('Virhe', 'error'));
  });
}

// ── Välilehdet ────────────────────────────────────────────────────────────────
function renderTab(container, bot, tab) {
  const tc = container.querySelector('#cb-tab-content');
  if (!tc) return;
  if (tab === 'appearance')  renderAppearanceTab(tc, bot);
  if (tab === 'knowledge')   renderKnowledgeTab(tc, bot);
  if (tab === 'behavior')    renderBehaviorTab(tc, bot);
  if (tab === 'qa')          renderQATab(tc, bot);
  if (tab === 'logs')        renderLogsTab(tc, bot);
}

// ─────────────────────────────────────────────────────────────────────────────
// VÄLILEHTI 1: ULKOASU
// ─────────────────────────────────────────────────────────────────────────────
function renderAppearanceTab(tc, bot) {
  const b = bot.button   || {};
  const g = bot.grabber  || {};
  const a = bot.animation|| {};
  const w = bot.window   || {};

  tc.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 320px;gap:24px;align-items:start">
      <div>
        <div class="cb-card" style="margin-bottom:16px">
          <div class="cb-card-title">Chat-painike</div>
          <div class="cb-grid2">
            <div class="cb-field">
              <label class="cb-label">Muoto</label>
              <select id="ap-shape" class="cb-select">
                <option value="circle"  ${b.shape==='circle' ?'selected':''}>Pyöreä</option>
                <option value="rounded" ${b.shape==='rounded'?'selected':''}>Pyöristetty neliö</option>
              </select>
            </div>
            <div class="cb-field">
              <label class="cb-label">Koko (px)</label>
              <input id="ap-size" type="number" min="40" max="80" value="${b.size||56}" class="cb-input">
            </div>
            <div class="cb-field">
              <label class="cb-label">Taustaväri</label>
              <input id="ap-color" type="color" value="${b.color||'#2563EB'}" class="cb-color">
            </div>
            <div class="cb-field">
              <label class="cb-label">Ikonin väri</label>
              <input id="ap-icon-color" type="color" value="${b.iconColor||'#ffffff'}" class="cb-color">
            </div>
            <div class="cb-field">
              <label class="cb-label">Ikoni</label>
              <select id="ap-icon-type" class="cb-select">
                <option value="svg"   ${b.iconType==='svg'  ?'selected':''}>Chat-ikoni (oletus)</option>
                <option value="emoji" ${b.iconType==='emoji'?'selected':''}>Emoji</option>
              </select>
            </div>
            <div class="cb-field" id="ap-emoji-wrap" style="${b.iconType==='emoji'?'':'display:none'}">
              <label class="cb-label">Emoji</label>
              <input id="ap-icon-value" type="text" value="${b.iconType==='emoji'?b.iconValue||'💬':''}" placeholder="💬" class="cb-input">
            </div>
            <div class="cb-field">
              <label class="cb-label">Sijainti</label>
              <select id="ap-position" class="cb-select">
                <option value="bottom-right" ${b.position==='bottom-right'?'selected':''}>Oikea ala</option>
                <option value="bottom-left"  ${b.position==='bottom-left' ?'selected':''}>Vasen ala</option>
                <option value="top-right"    ${b.position==='top-right'   ?'selected':''}>Oikea ylä</option>
                <option value="top-left"     ${b.position==='top-left'    ?'selected':''}>Vasen ylä</option>
              </select>
            </div>
          </div>
        </div>

        <div class="cb-card" style="margin-bottom:16px">
          <div class="cb-card-title">Heräteteksti</div>
          <div class="cb-field" style="margin-bottom:10px">
            <label class="cb-label" style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" id="ap-grabber-enabled" ${g.enabled!==false?'checked':''}>
              Näytä heräteteksti
            </label>
          </div>
          <div id="ap-grabber-fields">
            <div class="cb-field" style="margin-bottom:10px">
              <label class="cb-label">Teksti</label>
              <input id="ap-grabber-text" type="text" value="${escHtml(g.text||'Onko sinulla kysyttävää? 💬')}" class="cb-input">
            </div>
            <div class="cb-grid2">
              <div class="cb-field">
                <label class="cb-label">Ilmestymisviive (ms)</label>
                <input id="ap-grabber-delay" type="number" min="0" max="30000" step="500" value="${g.delayMs!=null?g.delayMs:3000}" class="cb-input">
              </div>
              <div class="cb-field">
                <label class="cb-label">Näyttötiheys</label>
                <select id="ap-grabber-freq" class="cb-select">
                  <option value="once-per-session" ${g.frequency==='once-per-session'?'selected':''}>Kerran per sessio</option>
                  <option value="always"           ${g.frequency==='always'          ?'selected':''}>Aina</option>
                  <option value="never"            ${g.frequency==='never'           ?'selected':''}>Ei koskaan</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="cb-card" style="margin-bottom:16px">
          <div class="cb-card-title">Animaatiot</div>
          <div class="cb-grid2">
            <div class="cb-field">
              <label class="cb-label">Intro-animaatio</label>
              <select id="ap-intro" class="cb-select">
                <option value="slide-in" ${a.intro==='slide-in'?'selected':''}>Liuku sisään</option>
                <option value="fade-in"  ${a.intro==='fade-in' ?'selected':''}>Häivy sisään</option>
                <option value="pop"      ${a.intro==='pop'     ?'selected':''}>Pop</option>
                <option value="none"     ${a.intro==='none'    ?'selected':''}>Ei animaatiota</option>
              </select>
            </div>
            <div class="cb-field">
              <label class="cb-label">Idle-animaatio</label>
              <select id="ap-idle" class="cb-select">
                <option value="wiggle" ${a.idle==='wiggle'?'selected':''}>Heilahdus (wiggle)</option>
                <option value="pulse"  ${a.idle==='pulse' ?'selected':''}>Pulssi</option>
                <option value="bounce" ${a.idle==='bounce'?'selected':''}>Pomppaus</option>
                <option value="none"   ${a.idle==='none'  ?'selected':''}>Ei animaatiota</option>
              </select>
            </div>
            <div class="cb-field">
              <label class="cb-label">Idle-väli (sekuntia)</label>
              <input id="ap-idle-interval" type="number" min="3" max="120" value="${a.idleIntervalS||10}" class="cb-input">
            </div>
          </div>
        </div>

        <div class="cb-card" style="margin-bottom:16px">
          <div class="cb-card-title">Chat-ikkunan värit</div>
          <div class="cb-grid2">
            <div class="cb-field">
              <label class="cb-label">Otsikkopalkin väri</label>
              <input id="ap-header-color" type="color" value="${w.headerColor||b.color||'#2563EB'}" class="cb-color">
            </div>
            <div class="cb-field">
              <label class="cb-label">Otsikkoteksti</label>
              <input id="ap-header-text-color" type="color" value="${w.headerTextColor||'#ffffff'}" class="cb-color">
            </div>
            <div class="cb-field">
              <label class="cb-label">Botin viestipallo</label>
              <input id="ap-bot-bubble" type="color" value="${w.botBubbleColor||'#f1f5f9'}" class="cb-color">
            </div>
            <div class="cb-field">
              <label class="cb-label">Botin viestitTeksti</label>
              <input id="ap-bot-text" type="color" value="${w.botTextColor||'#1e293b'}" class="cb-color">
            </div>
            <div class="cb-field">
              <label class="cb-label">Käyttäjän viestipallo</label>
              <input id="ap-user-bubble" type="color" value="${w.userBubbleColor||b.color||'#2563EB'}" class="cb-color">
            </div>
            <div class="cb-field">
              <label class="cb-label">Käyttäjän viestiteksti</label>
              <input id="ap-user-text" type="color" value="${w.userTextColor||'#ffffff'}" class="cb-color">
            </div>
            <div class="cb-field">
              <label class="cb-label">Chat-taustaväri</label>
              <input id="ap-chat-bg" type="color" value="${w.chatBgColor||'#ffffff'}" class="cb-color">
            </div>
          </div>
        </div>

        <div class="cb-card" style="margin-bottom:16px">
          <div class="cb-card-title">Botin nimi ja avatar</div>
          <div class="cb-grid2">
            <div class="cb-field">
              <label class="cb-label">Botin nimi chat-ikkunassa</label>
              <input id="ap-bot-name" type="text" value="${escHtml(w.botName||'Avustaja')}" class="cb-input" placeholder="Avustaja">
            </div>
            <div class="cb-field">
              <label class="cb-label">Avatar-tyyppi</label>
              <select id="ap-avatar-type" class="cb-select">
                <option value="emoji"    ${w.botAvatarType==='emoji'   ?'selected':''}>Emoji</option>
                <option value="initials" ${w.botAvatarType==='initials'?'selected':''}>Nimikirjaimet</option>
              </select>
            </div>
            <div class="cb-field">
              <label class="cb-label">Avatar-arvo</label>
              <input id="ap-avatar-value" type="text" value="${escHtml(w.botAvatarValue||'🤖')}" class="cb-input" placeholder="🤖">
            </div>
          </div>
        </div>

        <button id="ap-save" style="padding:10px 24px;background:#2563EB;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
          <i class="fa fa-save"></i> Tallenna ulkoasuasetukset
        </button>
      </div>

      <!-- Esikatselu -->
      <div style="position:sticky;top:20px">
        <div style="font-size:12px;font-weight:600;color:#374151;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em">Esikatselu</div>
        <div id="ap-preview" style="background:#e2e8f0;border-radius:14px;height:400px;position:relative;overflow:hidden">
          ${renderPreviewWidget(bot)}
        </div>
        <p style="font-size:11px;color:#94a3b8;margin-top:8px;text-align:center">Esikatselu päivittyy tallennuksen jälkeen</p>
      </div>
    </div>

    <style>
      .cb-card { background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px }
      .cb-card-title { font-size:13px;font-weight:700;color:#1e293b;margin-bottom:14px }
      .cb-grid2 { display:grid;grid-template-columns:1fr 1fr;gap:12px }
      .cb-field { display:flex;flex-direction:column;gap:5px }
      .cb-label { font-size:12px;font-weight:500;color:#374151 }
      .cb-input { padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;font-family:inherit }
      .cb-input:focus { border-color:#2563EB;box-shadow:0 0 0 3px #2563eb22 }
      .cb-select { padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;font-family:inherit;background:#fff }
      .cb-color { width:100%;height:36px;border:1.5px solid #e2e8f0;border-radius:8px;cursor:pointer;padding:2px }
    </style>
  `;

  // Grabber-toggle
  tc.querySelector('#ap-grabber-enabled').addEventListener('change', e => {
    tc.querySelector('#ap-grabber-fields').style.display = e.target.checked ? '' : 'none';
  });
  if (!g.enabled) tc.querySelector('#ap-grabber-fields').style.display = 'none';

  // Ikoni-tyyppi toggle
  tc.querySelector('#ap-icon-type').addEventListener('change', e => {
    tc.querySelector('#ap-emoji-wrap').style.display = e.target.value === 'emoji' ? '' : 'none';
  });

  // Tallenna
  tc.querySelector('#ap-save').addEventListener('click', async () => {
    const payload = {
      button: {
        shape:      tc.querySelector('#ap-shape').value,
        size:       Number(tc.querySelector('#ap-size').value),
        color:      tc.querySelector('#ap-color').value,
        iconColor:  tc.querySelector('#ap-icon-color').value,
        iconType:   tc.querySelector('#ap-icon-type').value,
        iconValue:  tc.querySelector('#ap-icon-value')?.value || 'chat',
        position:   tc.querySelector('#ap-position').value
      },
      grabber: {
        enabled:   tc.querySelector('#ap-grabber-enabled').checked,
        text:      tc.querySelector('#ap-grabber-text').value,
        delayMs:   Number(tc.querySelector('#ap-grabber-delay').value),
        frequency: tc.querySelector('#ap-grabber-freq').value
      },
      animation: {
        intro:         tc.querySelector('#ap-intro').value,
        idle:          tc.querySelector('#ap-idle').value,
        idleIntervalS: Number(tc.querySelector('#ap-idle-interval').value)
      },
      window: {
        botName:         tc.querySelector('#ap-bot-name').value,
        botAvatarType:   tc.querySelector('#ap-avatar-type').value,
        botAvatarValue:  tc.querySelector('#ap-avatar-value').value,
        headerColor:     tc.querySelector('#ap-header-color').value,
        headerTextColor: tc.querySelector('#ap-header-text-color').value,
        botBubbleColor:  tc.querySelector('#ap-bot-bubble').value,
        botTextColor:    tc.querySelector('#ap-bot-text').value,
        userBubbleColor: tc.querySelector('#ap-user-bubble').value,
        userTextColor:   tc.querySelector('#ap-user-text').value,
        chatBgColor:     tc.querySelector('#ap-chat-bg').value
      }
    };
    await saveBot(bot._id, payload, tc.querySelector('#ap-save'));
    Object.assign(bot, payload);
    tc.querySelector('#ap-preview').innerHTML = renderPreviewWidget(bot);
  });
}

function renderPreviewWidget(bot) {
  const b = bot.button || {};
  const w = bot.window || {};
  const color = b.color || '#2563EB';
  const shape = b.shape === 'rounded' ? '12px' : '50%';
  const size  = b.size || 56;
  const icon  = b.iconType === 'emoji' ? b.iconValue : '💬';
  return `
    <div style="position:absolute;bottom:16px;right:16px;display:flex;flex-direction:column;align-items:flex-end;gap:8px">
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;font-size:12px;color:#374151;box-shadow:0 2px 8px rgba(0,0,0,0.1);max-width:180px;position:relative">
        ${escHtml(bot.grabber?.text||'Onko sinulla kysyttävää? 💬')}
        <div style="position:absolute;bottom:-6px;right:16px;width:10px;height:10px;background:#fff;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;transform:rotate(45deg)"></div>
      </div>
      <div style="width:${size}px;height:${size}px;border-radius:${shape};background:${color};display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.42)}px;box-shadow:0 4px 12px rgba(0,0,0,0.2);cursor:pointer">
        ${icon}
      </div>
    </div>
    <div style="position:absolute;bottom:${size+50}px;right:16px;left:16px;background:#fff;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,0.15);overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:${w.headerColor||color};color:${w.headerTextColor||'#fff'};padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px">
        <span style="font-size:18px">${w.botAvatarValue||'🤖'}</span>
        ${escHtml(w.botName||'Avustaja')}
      </div>
      <div style="padding:10px 12px;background:${w.chatBgColor||'#fff'}">
        <div style="background:${w.botBubbleColor||'#f1f5f9'};color:${w.botTextColor||'#1e293b'};padding:7px 11px;border-radius:4px 12px 12px 12px;font-size:12px;display:inline-block;max-width:80%">Hei! Kuinka voin auttaa?</div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// VÄLILEHTI 2: TIETOKANTA
// ─────────────────────────────────────────────────────────────────────────────
async function renderKnowledgeTab(tc, bot) {
  tc.innerHTML = `<div style="padding:40px;text-align:center;color:#94a3b8"><i class="fa fa-spinner fa-spin"></i></div>`;

  let docs = [];
  try {
    const r = await fetch(`/api/chatbots/${bot._id}/documents`);
    docs = await r.json();
  } catch {}

  tc.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start">
      <!-- Lataa tiedosto -->
      <div class="cb-card">
        <div class="cb-card-title">📄 Lataa dokumentti</div>
        <p style="font-size:13px;color:#64748b;margin-bottom:14px;line-height:1.5">PDF tai tekstitiedosto (max 5 MB). Dokumentti vektoroidaan automaattisesti.</p>
        <input id="kn-file" type="file" accept=".pdf,.txt,.md" style="display:none">
        <button id="kn-file-btn" style="width:100%;padding:10px;border:2px dashed #e2e8f0;border-radius:10px;background:#f8fafc;cursor:pointer;font-size:13px;color:#64748b;font-family:inherit;transition:border-color 0.15s">
          <i class="fa fa-upload"></i> Valitse tiedosto
        </button>
        <div id="kn-file-name" style="font-size:12px;color:#64748b;margin-top:8px;display:none"></div>
        <button id="kn-upload-btn" style="display:none;margin-top:10px;width:100%;padding:9px;background:#2563EB;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
          <i class="fa fa-cloud-upload-alt"></i> Lataa dokumentti
        </button>
      </div>

      <!-- URL-crawl -->
      <div class="cb-card">
        <div class="cb-card-title">🌐 URL-crawl</div>
        <p style="font-size:13px;color:#64748b;margin-bottom:14px;line-height:1.5">Anna sivuston URL. Botti indeksoi kaikki sivut automaattisesti.</p>
        <div class="cb-field" style="margin-bottom:10px">
          <label class="cb-label">URL-osoite</label>
          <input id="kn-url" type="url" placeholder="https://example.com" class="cb-input">
        </div>
        <div class="cb-grid2" style="margin-bottom:12px">
          <div class="cb-field">
            <label class="cb-label">Syvyys (1–3)</label>
            <input id="kn-depth" type="number" min="1" max="3" value="2" class="cb-input">
          </div>
          <div class="cb-field">
            <label class="cb-label">Max sivuja</label>
            <input id="kn-max-pages" type="number" min="1" max="200" value="50" class="cb-input">
          </div>
        </div>
        <button id="kn-crawl-btn" style="width:100%;padding:9px;background:#0f172a;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
          <i class="fa fa-spider"></i> Käynnistä crawl
        </button>
        <p style="font-size:11px;color:#94a3b8;margin-top:8px">Crawl käynnistyy taustalla. Dokumentit ilmestyvät listaan minuuttien sisällä.</p>
      </div>
    </div>

    <!-- Dokumenttilista -->
    <div class="cb-card" style="margin-top:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div class="cb-card-title" style="margin:0">Ladatut dokumentit (${docs.length})</div>
        <button id="kn-refresh-docs" style="background:none;border:none;cursor:pointer;color:#64748b;font-size:13px;font-family:inherit"><i class="fa fa-sync-alt"></i> Päivitä</button>
      </div>
      <div id="kn-docs-list">
        ${docs.length === 0
          ? '<p style="color:#94a3b8;font-size:13px;text-align:center;padding:20px 0">Ei dokumentteja vielä</p>'
          : docs.map(doc => `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9">
              <div style="font-size:20px">${doc.sourceType==='pdf'?'📄':doc.sourceType==='url'?'🌐':'📝'}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:500;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(doc.sourceName)}</div>
                <div style="font-size:11px;color:#94a3b8;margin-top:2px">${doc.totalChunks} chunkia · ${fmtDate(doc.createdAt)}</div>
              </div>
              <span style="padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600;background:${doc.vectorized?'#dcfce7':'#fef3c7'};color:${doc.vectorized?'#16a34a':'#d97706'}">${doc.vectorized?'Valmis':'Prosessoidaan'}</span>
              <button data-doc-id="${doc._id}" style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:13px;padding:4px" title="Poista"><i class="fa fa-trash"></i></button>
            </div>`).join('')}
      </div>
    </div>
    <style>
      .cb-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px}
      .cb-card-title{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:14px}
      .cb-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .cb-field{display:flex;flex-direction:column;gap:5px}
      .cb-label{font-size:12px;font-weight:500;color:#374151}
      .cb-input{padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;font-family:inherit}
      .cb-input:focus{border-color:#2563EB;box-shadow:0 0 0 3px #2563eb22}
    </style>
  `;

  // Tiedostovalinta
  const fileInput  = tc.querySelector('#kn-file');
  const fileBtn    = tc.querySelector('#kn-file-btn');
  const fileName   = tc.querySelector('#kn-file-name');
  const uploadBtn  = tc.querySelector('#kn-upload-btn');

  fileBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    if (!f) return;
    fileName.textContent = f.name;
    fileName.style.display = '';
    uploadBtn.style.display = 'block';
    fileBtn.textContent = '📎 ' + f.name;
  });

  uploadBtn.addEventListener('click', async () => {
    const f = fileInput.files[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Ladataan...';
    try {
      const r = await fetch(`/api/chatbots/${bot._id}/documents`, { method: 'POST', body: fd });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
      showToast('Dokumentti ladattu ja vektoroitu!', 'success');
      renderKnowledgeTab(tc, bot);
    } catch (e) {
      showToast(e.message || 'Virhe latauksessa', 'error');
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Lataa dokumentti';
    }
  });

  // Crawl
  tc.querySelector('#kn-crawl-btn').addEventListener('click', async () => {
    const url   = tc.querySelector('#kn-url').value.trim();
    const depth = Number(tc.querySelector('#kn-depth').value);
    const maxP  = Number(tc.querySelector('#kn-max-pages').value);
    if (!url) { showToast('Anna URL-osoite', 'error'); return; }
    const btn = tc.querySelector('#kn-crawl-btn');
    btn.disabled = true; btn.textContent = 'Käynnistetään...';
    try {
      const r = await fetch(`/api/chatbots/${bot._id}/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, maxDepth: depth, maxPages: maxP })
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
      showToast('Crawl käynnistetty taustalla!', 'success');
      tc.querySelector('#kn-url').value = '';
    } catch (e) {
      showToast(e.message || 'Virhe', 'error');
    }
    btn.disabled = false; btn.innerHTML = '<i class="fa fa-spider"></i> Käynnistä crawl';
  });

  // Dokumentin poisto
  tc.querySelectorAll('[data-doc-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Poistetaanko dokumentti?')) return;
      await fetch(`/api/chatbots/${bot._id}/documents/${btn.dataset.docId}`, { method: 'DELETE' });
      renderKnowledgeTab(tc, bot);
    });
  });

  // Päivitä
  tc.querySelector('#kn-refresh-docs').addEventListener('click', () => renderKnowledgeTab(tc, bot));
}

// ─────────────────────────────────────────────────────────────────────────────
// VÄLILEHTI 3: KÄYTTÄYTYMINEN
// ─────────────────────────────────────────────────────────────────────────────
function renderBehaviorTab(tc, bot) {
  const beh  = bot.behavior  || {};
  const lead = bot.leadForm  || {};

  tc.innerHTML = `
    <div style="max-width:680px">
      <div class="cb-card" style="margin-bottom:16px">
        <div class="cb-card-title">Botin moodi ja kieli</div>
        <div class="cb-grid2" style="margin-bottom:14px">
          <div class="cb-field">
            <label class="cb-label">Moodi</label>
            <select id="bh-mode" class="cb-select">
              <option value="ai" ${bot.mode==='ai'?'selected':''}>🤖 AI-chatbot (RAG)</option>
              <option value="qa" ${bot.mode==='qa'?'selected':''}>📋 Q&A-only (ei API-kuluja)</option>
            </select>
          </div>
          <div class="cb-field">
            <label class="cb-label">Ensisijainen kieli</label>
            <input id="bh-lang" type="text" value="${escHtml(beh.primaryLanguage||'fi')}" placeholder="fi" class="cb-input">
          </div>
        </div>
      </div>

      <div class="cb-card" style="margin-bottom:16px">
        <div class="cb-card-title">Viestit</div>
        <div class="cb-field" style="margin-bottom:12px">
          <label class="cb-label">Tervehdysviesti</label>
          <input id="bh-welcome" type="text" value="${escHtml(beh.welcomeMessage||'Hei! Kuinka voin auttaa sinua tänään?')}" class="cb-input">
        </div>
        <div class="cb-field" style="margin-bottom:12px">
          <label class="cb-label">Input-tekstin placeholder</label>
          <input id="bh-placeholder" type="text" value="${escHtml(beh.inputPlaceholder||'Kirjoita viestisi...')}" class="cb-input">
        </div>
        <div class="cb-field" style="margin-bottom:12px">
          <label class="cb-label">Fallback-viesti (kun vastaus ei löydy)</label>
          <textarea id="bh-fallback" rows="3" class="cb-input" style="resize:vertical">${escHtml(beh.fallbackMessage||'En löydä vastausta tähän kysymykseen. Ota yhteyttä meihin suoraan.')}</textarea>
        </div>
        <div class="cb-field">
          <label class="cb-label">Fallback-linkki (valinnainen URL tai mailto:)</label>
          <input id="bh-fallback-url" type="text" value="${escHtml(beh.fallbackContactUrl||'')}" placeholder="https://example.com/yhteystiedot" class="cb-input">
        </div>
      </div>

      <div class="cb-card" style="margin-bottom:16px" id="bh-system-prompt-card" ${bot.mode==='qa'?'style="display:none"':''}>
        <div class="cb-card-title">System prompt (AI-moodi)</div>
        <p style="font-size:12px;color:#64748b;margin-bottom:10px;line-height:1.5">Lisäohjeet botille. Älä poista "Vastaa VAIN annetun tiedon perusteella" -sääntöä.</p>
        <textarea id="bh-system" rows="5" class="cb-input" style="resize:vertical;width:100%">${escHtml(beh.systemPrompt||'')}</textarea>
      </div>

      <div class="cb-card" style="margin-bottom:16px">
        <div class="cb-card-title">Liidilomake</div>
        <div class="cb-field" style="margin-bottom:10px">
          <label class="cb-label" style="display:flex;align-items:center;gap:8px">
            <input type="checkbox" id="bh-lead-enabled" ${lead.enabled?'checked':''}>
            Näytä liidilomake
          </label>
        </div>
        <div id="bh-lead-fields">
          <div class="cb-grid2" style="margin-bottom:10px">
            <div class="cb-field">
              <label class="cb-label">Näyttöajankohta</label>
              <select id="bh-lead-timing" class="cb-select">
                <option value="before"      ${lead.timing==='before'     ?'selected':''}>Ennen chat-alkua</option>
                <option value="after-first" ${lead.timing==='after-first'?'selected':''}>Ensimmäisen viestin jälkeen</option>
                <option value="never"       ${lead.timing==='never'      ?'selected':''}>Ei koskaan (manuaalinen)</option>
              </select>
            </div>
            <div class="cb-field">
              <label class="cb-label" style="display:flex;align-items:center;gap:8px">
                <input type="checkbox" id="bh-lead-required" ${lead.required?'checked':''}>
                Pakollinen
              </label>
            </div>
          </div>
          <div class="cb-label" style="margin-bottom:8px">Lomakkeen kentät</div>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" id="bh-field-name"  ${lead.fields?.name !==false?'checked':''}> Nimi</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" id="bh-field-email" ${lead.fields?.email!==false?'checked':''}> Sähköposti</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" id="bh-field-phone" ${lead.fields?.phone        ?'checked':''}> Puhelin</label>
          </div>
        </div>
      </div>

      <div class="cb-field" style="margin-bottom:20px">
        <label class="cb-label" style="display:flex;align-items:center;gap:8px">
          <input type="checkbox" id="bh-active" ${bot.isActive?'checked':''}>
          Botti on aktiivinen (näkyy sivustolla)
        </label>
      </div>

      <button id="bh-save" style="padding:10px 24px;background:#2563EB;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
        <i class="fa fa-save"></i> Tallenna asetukset
      </button>
    </div>
    <style>
      .cb-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px}
      .cb-card-title{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:14px}
      .cb-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .cb-field{display:flex;flex-direction:column;gap:5px}
      .cb-label{font-size:12px;font-weight:500;color:#374151}
      .cb-input{padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;font-family:inherit}
      .cb-input:focus{border-color:#2563EB;box-shadow:0 0 0 3px #2563eb22}
      .cb-select{padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;font-family:inherit;background:#fff}
    </style>
  `;

  tc.querySelector('#bh-mode').addEventListener('change', e => {
    tc.querySelector('#bh-system-prompt-card').style.display = e.target.value === 'qa' ? 'none' : '';
  });
  tc.querySelector('#bh-lead-enabled').addEventListener('change', e => {
    tc.querySelector('#bh-lead-fields').style.display = e.target.checked ? '' : 'none';
  });
  if (!lead.enabled) tc.querySelector('#bh-lead-fields').style.display = 'none';

  tc.querySelector('#bh-save').addEventListener('click', async () => {
    const payload = {
      mode: tc.querySelector('#bh-mode').value,
      isActive: tc.querySelector('#bh-active').checked,
      behavior: {
        primaryLanguage:    tc.querySelector('#bh-lang').value.trim() || 'fi',
        welcomeMessage:     tc.querySelector('#bh-welcome').value,
        inputPlaceholder:   tc.querySelector('#bh-placeholder').value,
        fallbackMessage:    tc.querySelector('#bh-fallback').value,
        fallbackContactUrl: tc.querySelector('#bh-fallback-url').value,
        systemPrompt:       tc.querySelector('#bh-system').value
      },
      leadForm: {
        enabled:  tc.querySelector('#bh-lead-enabled').checked,
        timing:   tc.querySelector('#bh-lead-timing').value,
        required: tc.querySelector('#bh-lead-required').checked,
        fields: {
          name:  tc.querySelector('#bh-field-name').checked,
          email: tc.querySelector('#bh-field-email').checked,
          phone: tc.querySelector('#bh-field-phone').checked
        }
      }
    };
    await saveBot(bot._id, payload, tc.querySelector('#bh-save'));
    Object.assign(bot, payload);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// VÄLILEHTI 4: Q&A
// ─────────────────────────────────────────────────────────────────────────────
async function renderQATab(tc, bot) {
  tc.innerHTML = `<div style="padding:40px;text-align:center;color:#94a3b8"><i class="fa fa-spinner fa-spin"></i></div>`;
  let qaPairs = [];
  try {
    const r = await fetch(`/api/chatbots/${bot._id}/qa`);
    qaPairs = await r.json();
  } catch {}

  tc.innerHTML = `
    <div style="max-width:760px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <div style="font-size:14px;font-weight:700;color:#1e293b">Q&A-parit (${qaPairs.length})</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px">Hyväksytyt Q&A-vastaukset ohittavat dokumenttihaun</div>
        </div>
        <button id="qa-add-btn" style="padding:8px 16px;background:#2563EB;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:inherit">
          <i class="fa fa-plus"></i> Lisää pari
        </button>
      </div>

      <div id="qa-new-form" style="display:none;background:#fff;border:1px solid #2563EB;border-radius:12px;padding:16px;margin-bottom:16px">
        <div class="cb-field" style="margin-bottom:10px">
          <label class="cb-label">Kysymys</label>
          <input id="qa-new-q" type="text" placeholder="Mitä palveluja tarjoatte?" class="cb-input">
        </div>
        <div class="cb-field" style="margin-bottom:12px">
          <label class="cb-label">Vastaus</label>
          <textarea id="qa-new-a" rows="3" placeholder="Tarjoamme..." class="cb-input" style="resize:vertical"></textarea>
        </div>
        <div style="display:flex;gap:8px">
          <button id="qa-new-save" style="padding:8px 16px;background:#2563EB;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">Tallenna</button>
          <button id="qa-new-cancel" style="padding:8px 16px;border:1px solid #e2e8f0;background:#fff;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit">Peruuta</button>
        </div>
      </div>

      <div id="qa-list">
        ${qaPairs.length === 0
          ? '<div style="text-align:center;padding:40px;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:12px">Ei Q&A-pareja. Lisää ensimmäinen!</div>'
          : qaPairs.map(qa => `
            <div class="qa-item" data-qa-id="${qa._id}" style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:10px">
              <div style="display:flex;align-items:flex-start;gap:10px">
                <div style="flex:1">
                  <div style="font-size:12px;color:#64748b;font-weight:500;margin-bottom:4px">Kysymys</div>
                  <div class="qa-q-text" style="font-size:13px;color:#1e293b;font-weight:500">${escHtml(qa.question)}</div>
                  <div style="font-size:12px;color:#64748b;font-weight:500;margin:10px 0 4px">Vastaus</div>
                  <div class="qa-a-text" style="font-size:13px;color:#374151;line-height:1.5;white-space:pre-wrap">${escHtml(qa.answer)}</div>
                  <div class="qa-edit-area" style="display:none">
                    <textarea class="qa-edit-a cb-input" style="width:100%;resize:vertical;margin-top:8px" rows="3">${escHtml(qa.answer)}</textarea>
                  </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
                  <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#64748b;cursor:pointer">
                    <input type="checkbox" class="qa-approved" data-qa-id="${qa._id}" ${qa.approved?'checked':''}> Hyväksytty
                  </label>
                  <button class="qa-edit-btn" data-qa-id="${qa._id}" style="background:none;border:none;cursor:pointer;color:#2563EB;font-size:12px;font-family:inherit">Muokkaa</button>
                  <button class="qa-delete-btn" data-qa-id="${qa._id}" style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:12px;font-family:inherit">Poista</button>
                </div>
              </div>
              <div class="qa-save-row" style="display:none;margin-top:10px">
                <button class="qa-save-btn" data-qa-id="${qa._id}" style="padding:6px 14px;background:#2563EB;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Tallenna muutos</button>
              </div>
            </div>`).join('')}
      </div>
    </div>
    <style>
      .cb-field{display:flex;flex-direction:column;gap:5px}
      .cb-label{font-size:12px;font-weight:500;color:#374151}
      .cb-input{padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;font-family:inherit}
      .cb-input:focus{border-color:#2563EB;box-shadow:0 0 0 3px #2563eb22}
    </style>
  `;

  const newForm = tc.querySelector('#qa-new-form');
  tc.querySelector('#qa-add-btn').addEventListener('click', () => { newForm.style.display = ''; tc.querySelector('#qa-new-q').focus(); });
  tc.querySelector('#qa-new-cancel').addEventListener('click', () => { newForm.style.display = 'none'; });
  tc.querySelector('#qa-new-save').addEventListener('click', async () => {
    const q = tc.querySelector('#qa-new-q').value.trim();
    const a = tc.querySelector('#qa-new-a').value.trim();
    if (!q || !a) { showToast('Kysymys ja vastaus vaaditaan', 'error'); return; }
    try {
      await fetch(`/api/chatbots/${bot._id}/qa`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ question: q, answer: a, approved: true })
      });
      showToast('Q&A-pari lisätty!', 'success');
      renderQATab(tc, bot);
    } catch { showToast('Virhe', 'error'); }
  });

  // Muokkaus
  tc.querySelectorAll('.qa-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.qa-item');
      item.querySelector('.qa-a-text').style.display = 'none';
      item.querySelector('.qa-edit-area').style.display = '';
      item.querySelector('.qa-save-row').style.display = '';
      btn.style.display = 'none';
    });
  });

  tc.querySelectorAll('.qa-save-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const item   = btn.closest('.qa-item');
      const newAns = item.querySelector('.qa-edit-a').value.trim();
      if (!newAns) return;
      try {
        await fetch(`/api/chatbots/${bot._id}/qa/${btn.dataset.qaId}`, {
          method: 'PUT', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ answer: newAns })
        });
        showToast('Tallennettu!', 'success');
        renderQATab(tc, bot);
      } catch { showToast('Virhe', 'error'); }
    });
  });

  // Hyväksyntä-toggle
  tc.querySelectorAll('.qa-approved').forEach(cb => {
    cb.addEventListener('change', async () => {
      await fetch(`/api/chatbots/${bot._id}/qa/${cb.dataset.qaId}`, {
        method: 'PUT', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ approved: cb.checked })
      });
    });
  });

  // Poisto
  tc.querySelectorAll('.qa-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Poistetaanko Q&A-pari?')) return;
      await fetch(`/api/chatbots/${bot._id}/qa/${btn.dataset.qaId}`, { method: 'DELETE' });
      renderQATab(tc, bot);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// VÄLILEHTI 5: LOGIT & TILASTOT
// ─────────────────────────────────────────────────────────────────────────────
async function renderLogsTab(tc, bot) {
  tc.innerHTML = `<div style="padding:40px;text-align:center;color:#94a3b8"><i class="fa fa-spinner fa-spin"></i></div>`;

  let stats = {}, sessions = [];
  try {
    [stats, sessions] = await Promise.all([
      fetch(`/api/chatbots/${bot._id}/stats`).then(r => r.json()),
      fetch(`/api/chatbots/${bot._id}/sessions`).then(r => r.json())
    ]);
  } catch {}

  tc.innerHTML = `
    <div>
      <!-- Tilastokortit -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:24px">
        ${[
          ['💬', 'Viestejä tänään', stats.todayMessages || 0, '#2563EB'],
          ['📅', 'Tässä kuussa',   stats.monthMessages || 0, '#7c3aed'],
          ['🗂️', 'Sessioita yht.', stats.totalSessions || 0, '#0891b2'],
          ['📋', 'Liidit',         stats.totalLeads    || 0, '#16a34a'],
          ['📄', 'Dokumentteja',   stats.docCount      || 0, '#d97706'],
          ['❓', 'Fallback-osumat', stats.fallbackCount || 0, '#dc2626']
        ].map(([icon, label, val, color]) => `
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px">
            <div style="font-size:22px;margin-bottom:6px">${icon}</div>
            <div style="font-size:22px;font-weight:800;color:${color};line-height:1">${val}</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px">${label}</div>
          </div>`).join('')}
      </div>

      <!-- Sessiolista -->
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px">
        <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:14px">Viimeisimmät sessiot</div>
        ${sessions.length === 0
          ? '<p style="color:#94a3b8;font-size:13px;text-align:center;padding:20px 0">Ei sessioita vielä</p>'
          : `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead><tr style="background:#f8fafc">
                <th style="padding:8px 12px;text-align:left;color:#64748b;font-weight:600">Aika</th>
                <th style="padding:8px 12px;text-align:left;color:#64748b;font-weight:600">Sivu</th>
                <th style="padding:8px 12px;text-align:center;color:#64748b;font-weight:600">Viestejä</th>
                <th style="padding:8px 12px;text-align:center;color:#64748b;font-weight:600">Liidi</th>
                <th style="padding:8px 12px;text-align:left;color:#64748b;font-weight:600">IP</th>
                <th style="padding:8px 12px"></th>
              </tr></thead>
              <tbody>
                ${sessions.map(s => `
                  <tr class="log-row" data-session="${s.sessionId}" style="border-top:1px solid #f1f5f9;cursor:pointer;transition:background 0.1s" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                    <td style="padding:8px 12px;color:#374151">${fmtDate(s.createdAt)}</td>
                    <td style="padding:8px 12px;color:#374151;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(s.pageUrl||'–')}</td>
                    <td style="padding:8px 12px;text-align:center;font-weight:600">${s.messageCount}</td>
                    <td style="padding:8px 12px;text-align:center">${s.hasLead ? '✅' : '–'}</td>
                    <td style="padding:8px 12px;color:#94a3b8">${s.visitorIp||'–'}</td>
                    <td style="padding:8px 12px"><i class="fa fa-chevron-right" style="color:#94a3b8;font-size:11px"></i></td>
                  </tr>
                  <tr class="log-messages-row" data-session="${s.sessionId}" style="display:none">
                    <td colspan="6" style="padding:0 12px 14px">
                      <div class="log-messages-content" style="background:#f8fafc;border-radius:10px;padding:12px;font-size:12px;color:#374151">
                        <i class="fa fa-spinner fa-spin"></i>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table></div>`}
      </div>
    </div>
  `;

  // Sessio expand/collapse
  tc.querySelectorAll('.log-row').forEach(row => {
    row.addEventListener('click', async () => {
      const sid      = row.dataset.session;
      const msgRow   = tc.querySelector(`.log-messages-row[data-session="${sid}"]`);
      const content  = msgRow.querySelector('.log-messages-content');
      const isOpen   = msgRow.style.display !== 'none';
      tc.querySelectorAll('.log-messages-row').forEach(r => r.style.display = 'none');
      if (isOpen) return;
      msgRow.style.display = '';
      try {
        const msgs = await fetch(`/api/chatbots/${bot._id}/sessions/${sid}/messages`).then(r => r.json());
        content.innerHTML = msgs.length === 0
          ? '<span style="color:#94a3b8">Ei viestejä</span>'
          : msgs.map(m => `
            <div style="margin-bottom:8px;display:flex;gap:8px;align-items:flex-start">
              <span style="padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600;white-space:nowrap;background:${m.role==='user'?'#dbeafe':'#f1f5f9'};color:${m.role==='user'?'#1d4ed8':'#374151'}">${m.role==='user'?'Käyttäjä':'Botti'}</span>
              <span style="line-height:1.5;white-space:pre-wrap">${escHtml(m.content)}</span>
            </div>`).join('');
      } catch {
        content.innerHTML = '<span style="color:#ef4444">Virhe viestien latauksessa</span>';
      }
    });
  });
}

// ── Apumetodit ─────────────────────────────────────────────────────────────────
async function saveBot(botId, payload, btnEl) {
  const origText = btnEl?.innerHTML;
  if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Tallennetaan...'; }
  try {
    const r = await fetch(`/api/chatbots/${botId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error();
    showToast('Tallennettu!', 'success');
    // Päivitä allBots-välimuisti
    const idx = allBots.findIndex(b => b._id === botId);
    if (idx >= 0) Object.assign(allBots[idx], payload);
  } catch {
    showToast('Tallentaminen epäonnistui', 'error');
  }
  if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = origText; }
}

function fmtDate(d) {
  if (!d) return '–';
  return new Date(d).toLocaleDateString('fi-FI', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
