// js/dashboard/chatbots-page.js
import { showToast } from './dashboard-main.js';
import { getCurrentLanguage } from '../i18n.js';

let currentBotId = null;
let allBots = [];

export function initChatbotsPage() {
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#chatbots') loadBots();
  });
  // Päivitä näkymä (mm. kaksikielinen aloitusopas) kun kieli vaihdetaan
  window.addEventListener('languagechange', () => {
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
    ${renderGettingStarted()}
    ${allBots.length === 0 ? renderEmptyState() : renderBotsGrid()}
  `;
  container.innerHTML = html;

  // Aloitusopas: avaa/sulje + muista valinta
  const guide = container.querySelector('#cb-guide');
  if (guide) {
    const body   = guide.querySelector('#cb-guide-body');
    const chevron = guide.querySelector('#cb-guide-chevron');
    const collapsed = localStorage.getItem('cb_guide_collapsed') === '1';
    if (collapsed) { body.style.display = 'none'; chevron.style.transform = 'rotate(-90deg)'; }
    guide.querySelector('#cb-guide-toggle').addEventListener('click', () => {
      const isOpen = body.style.display !== 'none';
      body.style.display = isOpen ? 'none' : '';
      chevron.style.transform = isOpen ? 'rotate(-90deg)' : '';
      localStorage.setItem('cb_guide_collapsed', isOpen ? '1' : '0');
    });
  }

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

// ── Aloitusopas ei-tekniselle käyttäjälle (kaksikielinen) ──────────────────────
function renderGettingStarted() {
  const fi = getCurrentLanguage() === 'fi';
  const T = fi ? {
    title: 'Näin otat chatbotin käyttöön – 4 helppoa askelta',
    sub:   'Ei teknistä osaamista tarvita. Klikkaa avataksesi ohjeet.',
    steps: [
      ['1', '➕', 'Luo chatbot', 'Klikkaa <strong>“Uusi chatbot”</strong>. Anna sille nimi (esim. yrityksesi nimi) ja valitse moodi: <strong>AI</strong> vastaa lataamiesi tietojen perusteella, <strong>Q&amp;A</strong> käyttää valmiita kysymys–vastaus-pareja.'],
      ['2', '📚', 'Lisää tietoa botille', 'Avaa botti ja mene <strong>Tietokanta</strong>-välilehdelle. Lataa PDF tai anna verkkosivusi osoite – botti oppii vastaamaan automaattisesti. (Q&amp;A-moodissa lisää vastaukset <strong>Q&amp;A</strong>-välilehdellä.)'],
      ['3', '🎨', 'Muokkaa ulkoasu', '<strong>Ulkoasu</strong>-välilehdellä valitse värit, lataa logo, vaihda chat-ikkunan tausta ja fontti. Oikealla näkyvä esikatselu päivittyy kun tallennat.'],
      ['4', '🔗', 'Lisää sivustollesi', 'Klikkaa oikeasta yläkulmasta <strong>“Koodi”</strong>, kopioi yksi rivi ja liitä se verkkosivusi koodiin (tai pyydä verkkovastaavaasi tekemään se). Chat ilmestyy heti – tehdään vain kerran.'],
    ],
    tip: '💡 <strong>Vinkki:</strong> Lataa logo läpinäkyvällä taustalla (PNG) ja kokeile chat-ikkunan taustakuvaa tai liukuväriä – saat brändillesi näköisen, ammattimaisen chatin. Tarkemmat ohjeet löydät <strong>Ohjeet</strong>-painikkeesta (oikea yläkulma).'
  } : {
    title: 'How to launch your chatbot – 4 easy steps',
    sub:   'No technical skills needed. Click to open the guide.',
    steps: [
      ['1', '➕', 'Create a chatbot', 'Click <strong>“New chatbot”</strong>. Give it a name (e.g. your company name) and choose a mode: <strong>AI</strong> answers based on the content you upload, <strong>Q&amp;A</strong> uses ready-made question–answer pairs.'],
      ['2', '📚', 'Add knowledge', 'Open the bot and go to the <strong>Knowledge</strong> tab. Upload a PDF or enter your website address – the bot learns to answer automatically. (In Q&amp;A mode, add answers on the <strong>Q&amp;A</strong> tab.)'],
      ['3', '🎨', 'Customise the look', 'On the <strong>Appearance</strong> tab choose colours, upload a logo, and change the chat window background and font. The preview on the right updates when you save.'],
      ['4', '🔗', 'Add it to your site', 'Click <strong>“Code”</strong> in the top-right corner, copy the single line and paste it into your website code (or ask your webmaster to do it). The chat appears instantly – done only once.'],
    ],
    tip: '💡 <strong>Tip:</strong> Upload a logo with a transparent background (PNG) and try a chat window background image or gradient – you get a branded, professional-looking chat. Find detailed help via the <strong>Help</strong> button (top-right).'
  };
  return `
    <div id="cb-guide" style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);border:1px solid #dbeafe;border-radius:16px;padding:0;margin-bottom:24px;overflow:hidden">
      <div id="cb-guide-toggle" style="display:flex;align-items:center;gap:12px;padding:16px 20px;cursor:pointer;user-select:none">
        <div style="font-size:22px">🚀</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:700;color:#1e293b">${T.title}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px">${T.sub}</div>
        </div>
        <i id="cb-guide-chevron" class="fa fa-chevron-down" style="color:#64748b;transition:transform 0.2s"></i>
      </div>
      <div id="cb-guide-body" style="padding:0 20px 20px">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">
          ${T.steps.map(([n, icon, title, body]) => `
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;position:relative">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <div style="width:26px;height:26px;border-radius:50%;background:#2563EB;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">${n}</div>
                <div style="font-size:13px;font-weight:700;color:#1e293b">${icon} ${title}</div>
              </div>
              <div style="font-size:12px;color:#475569;line-height:1.6">${body}</div>
            </div>`).join('')}
        </div>
        <div style="margin-top:14px;background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:11px 14px;font-size:12px;color:#78350f;line-height:1.5">
          ${T.tip}
        </div>
      </div>
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

  // Koodi-nappi — avaa modaali jossa koodi näkyvissä
  container.querySelector('#cb-copy-snippet').addEventListener('click', () => {
    const snippet = `<script src="${location.origin}/chatbot-embed.js" data-bot-id="${bot._id}" async><\/script>`;

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:18px;padding:28px;width:520px;max-width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div style="font-size:15px;font-weight:700;color:#1e293b;display:flex;align-items:center;gap:8px">
            <i class="fa fa-code" style="color:#2563EB"></i> Lisää chatbot sivustollesi
          </div>
          <button id="cb-snippet-close" style="background:none;border:none;font-size:20px;color:#94a3b8;cursor:pointer;line-height:1;padding:0">✕</button>
        </div>
        <p style="font-size:13px;color:#64748b;margin:0 0 14px">Liitä tämä koodi sivustosi <code style="background:#f1f5f9;padding:1px 5px;border-radius:4px">&lt;head&gt;</code>- tai <code style="background:#f1f5f9;padding:1px 5px;border-radius:4px">&lt;body&gt;</code>-osioon.</p>
        <div style="position:relative">
          <pre id="cb-snippet-code" style="background:#1e293b;color:#93c5fd;border-radius:10px;padding:16px 48px 16px 16px;font-size:12px;font-family:monospace;white-space:pre-wrap;word-break:break-all;margin:0;line-height:1.6;user-select:all">${snippet.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
          <button id="cb-snippet-copy" title="Kopioi" style="position:absolute;top:10px;right:10px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:7px;padding:6px 10px;cursor:pointer;color:#e2e8f0;font-size:11px;font-family:inherit;display:flex;align-items:center;gap:5px;transition:background 0.15s" onmouseover="this.style.background='rgba(255,255,255,0.22)'" onmouseout="this.style.background='rgba(255,255,255,0.12)'">
            <i class="fa fa-copy"></i> Kopioi
          </button>
        </div>
        <div style="margin-top:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:9px;padding:11px 14px;font-size:12px;color:#166534">
          <i class="fa fa-check-circle" style="margin-right:6px"></i>Tehdään kerran — chatbot latautuu kaikilla sivuilla automaattisesti.
        </div>
      </div>`;

    document.body.appendChild(overlay);

    overlay.querySelector('#cb-snippet-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#cb-snippet-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(snippet)
        .then(() => {
          const btn = overlay.querySelector('#cb-snippet-copy');
          btn.innerHTML = '<i class="fa fa-check"></i> Kopioitu!';
          btn.style.background = 'rgba(34,197,94,0.25)';
          btn.style.borderColor = 'rgba(34,197,94,0.4)';
          btn.style.color = '#4ade80';
          setTimeout(() => {
            btn.innerHTML = '<i class="fa fa-copy"></i> Kopioi';
            btn.style.background = 'rgba(255,255,255,0.12)';
            btn.style.borderColor = 'rgba(255,255,255,0.2)';
            btn.style.color = '#e2e8f0';
          }, 2000);
        })
        .catch(() => showToast('Kopioi koodi manuaalisesti', 'error'));
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
// IKONIMÄÄRITTELYT (dashboard + embed käyttävät samoja nimiä)
// ─────────────────────────────────────────────────────────────────────────────
const PRESET_ICONS = {
  chat:     { label: 'Chat',        path: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z' },
  question: { label: 'Kysymys',     path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z' },
  star:     { label: 'Tähti',       path: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z' },
  phone:    { label: 'Puhelin',     path: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z' },
  person:   { label: 'Henkilö',     path: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
  mail:     { label: 'Viesti',      path: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' },
  bolt:     { label: 'Salama',      path: 'M7 2v11h3v9l7-12h-4l4-8z' },
  heart:    { label: 'Sydän',       path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' }
};

function presetIconSvg(key, size, color) {
  const p = PRESET_ICONS[key]?.path || PRESET_ICONS.chat.path;
  const s = size || 22;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" style="fill:${color||'currentColor'};pointer-events:none"><path d="${p}"/></svg>`;
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
          </div>
          <!-- Painikkeen liukuväri -->
          <div style="margin-top:12px">
            <label class="cb-label" style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <input type="checkbox" id="ap-btn-gradient" ${b.colorStyle==='gradient'?'checked':''}>
              Käytä liukuväriä (gradient) painikkeessa
            </label>
            <div id="ap-btn-gradient-field" class="cb-field" style="${b.colorStyle==='gradient'?'':'display:none'}">
              <label class="cb-label">Liukuvärin 2. väri</label>
              <input id="ap-color2" type="color" value="${b.color2||'#1e40af'}" class="cb-color">
            </div>
          </div>
          <!-- Ikonivalitsin — koko leveys -->
          <div style="margin-top:14px">
            <label class="cb-label" style="margin-bottom:8px;display:block">Chat-painikkeen ikoni</label>
            <!-- Esiasetettu-/Emoji-/Kuva-välilehdet -->
            <div style="display:flex;gap:6px;margin-bottom:10px">
              <button class="ap-icon-tab ${b.iconType!=='emoji'&&b.iconType!=='image'?'active':''}" data-tab="preset" style="padding:5px 12px;border-radius:7px;border:1.5px solid;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit">Esiasetettu</button>
              <button class="ap-icon-tab ${b.iconType==='emoji'?'active':''}"  data-tab="emoji"  style="padding:5px 12px;border-radius:7px;border:1.5px solid;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit">Emoji</button>
              <button class="ap-icon-tab ${b.iconType==='image'?'active':''}"  data-tab="image"  style="padding:5px 12px;border-radius:7px;border:1.5px solid;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit">Kuva URL</button>
            </div>
            <!-- Esiasetettu ruudukko -->
            <div id="ap-preset-grid" style="${b.iconType==='emoji'||b.iconType==='image'?'display:none':''}display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
              ${Object.entries(PRESET_ICONS).map(([key, cfg]) => {
                const isActive = (b.iconType==='svg'||!b.iconType) && (b.iconValue===key||(key==='chat'&&!b.iconValue));
                return `<button class="ap-preset-icon ${isActive?'selected':''}" data-key="${key}" title="${cfg.label}" style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 6px;border-radius:10px;border:2px solid ${isActive?'#2563EB':'#e2e8f0'};background:${isActive?'#eff6ff':'#f8fafc'};cursor:pointer;font-family:inherit;transition:all 0.15s">
                  <div style="color:#374151">${presetIconSvg(key,22,'#374151')}</div>
                  <span style="font-size:10px;color:#64748b;font-weight:500">${cfg.label}</span>
                </button>`;
              }).join('')}
            </div>
            <!-- Emoji-kenttä -->
            <div id="ap-emoji-panel" style="${b.iconType==='emoji'?'':'display:none'}">
              <input id="ap-emoji-value" type="text" value="${b.iconType==='emoji'?b.iconValue||'':'💬'}" placeholder="Kirjoita emoji, esim. 🤖" class="cb-input" style="width:100%">
              <p style="font-size:11px;color:#94a3b8;margin-top:4px">Kopioi haluamasi emoji ja liitä tähän</p>
            </div>
            <!-- Kuva URL -kenttä -->
            <div id="ap-image-panel" style="${b.iconType==='image'?'':'display:none'}">
              <!-- Latausnappi -->
              <div style="margin-bottom:8px">
                <input type="file" id="ap-image-file" accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp" style="display:none">
                <button id="ap-image-upload-btn" style="width:100%;padding:10px;border:2px dashed #e2e8f0;border-radius:10px;background:#f8fafc;cursor:pointer;font-size:13px;color:#64748b;font-family:inherit;transition:border-color 0.15s;display:flex;align-items:center;justify-content:center;gap:8px" onmouseover="this.style.borderColor='#2563EB';this.style.color='#2563EB'" onmouseout="this.style.borderColor='#e2e8f0';this.style.color='#64748b'">
                  <i class="fa fa-cloud-upload-alt"></i> Lataa kuva koneelta (PNG, JPG, SVG)
                </button>
                <div id="ap-image-upload-status" style="font-size:11px;margin-top:5px;min-height:14px;color:#64748b"></div>
              </div>
              <!-- Tai syötä URL käsin -->
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <div style="flex:1;height:1px;background:#e2e8f0"></div>
                <span style="font-size:11px;color:#94a3b8">tai syötä URL</span>
                <div style="flex:1;height:1px;background:#e2e8f0"></div>
              </div>
              <input id="ap-image-url" type="text" value="${b.iconType==='image'?b.iconValue||'':''}" placeholder="https://..." class="cb-input" style="width:100%">
              <!-- Esikatselu ladatusta kuvasta -->
              <div id="ap-image-preview" style="${b.iconType==='image'&&b.iconValue?'':'display:none'};margin-top:10px;display:flex;align-items:center;gap:10px">
                <img id="ap-image-preview-img" src="${b.iconType==='image'?b.iconValue||'':''}" style="width:52px;height:52px;object-fit:contain;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc" onerror="this.parentNode.style.display='none'">
                <div>
                  <div style="font-size:12px;font-weight:500;color:#1e293b">Valittu kuva</div>
                  <button id="ap-image-clear" style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:11px;font-family:inherit;padding:0;margin-top:2px">✕ Poista</button>
                </div>
              </div>
              <p style="font-size:11px;color:#94a3b8;margin-top:6px">Suositeltu koko: 64×64 px tai suurempi neliö</p>
              <!-- Kuvan koko napissa -->
              <div style="margin-top:12px">
                <label class="cb-label" style="display:flex;align-items:center;justify-content:space-between">
                  <span>Kuvan koko napissa</span>
                  <span id="ap-icon-scale-label" style="font-weight:700;color:#1e293b">${b.iconScale||65}%</span>
                </label>
                <input type="range" id="ap-icon-scale" min="30" max="95" step="5" value="${b.iconScale||65}"
                  style="width:100%;margin-top:6px;accent-color:#2563EB"
                  oninput="document.getElementById('ap-icon-scale-label').textContent=this.value+'%'">
                <div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;margin-top:2px"><span>Pieni</span><span>Suuri</span></div>
              </div>
            </div>
            <!-- Piilokenttä tallennusta varten -->
            <input type="hidden" id="ap-icon-type"  value="${b.iconType||'svg'}">
            <input type="hidden" id="ap-icon-value" value="${b.iconValue||'chat'}">
          </div>
          <div class="cb-grid2" style="margin-top:14px">
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
          <div class="cb-card-title">Otsikkopalkki &amp; logo</div>
          <div class="cb-grid2">
            <div class="cb-field">
              <label class="cb-label">Palkin tyyli</label>
              <select id="ap-header-style" class="cb-select">
                <option value="solid"    ${w.headerStyle!=='gradient'?'selected':''}>Yksi väri</option>
                <option value="gradient" ${w.headerStyle==='gradient'?'selected':''}>Liukuväri</option>
              </select>
            </div>
            <div class="cb-field">
              <label class="cb-label">Otsikkotekstin väri</label>
              <input id="ap-header-text-color" type="color" value="${w.headerTextColor||'#ffffff'}" class="cb-color">
            </div>
            <div class="cb-field">
              <label class="cb-label">Palkin väri 1</label>
              <input id="ap-header-color" type="color" value="${w.headerColor||b.color||'#2563EB'}" class="cb-color">
            </div>
            <div class="cb-field" id="ap-header-color2-field" style="${w.headerStyle==='gradient'?'':'display:none'}">
              <label class="cb-label">Palkin väri 2 (liukuväri)</label>
              <input id="ap-header-color2" type="color" value="${w.headerColor2||'#1e40af'}" class="cb-color">
            </div>
          </div>
          <div class="cb-field" style="margin-top:12px">
            <label class="cb-label">Status-teksti otsikon alla</label>
            <input id="ap-status-text" type="text" value="${escHtml(w.statusText!=null?w.statusText:'Online')}" placeholder="Online" class="cb-input">
          </div>
          <!-- Logo -->
          <div style="margin-top:14px">
            <label class="cb-label" style="margin-bottom:6px;display:block">Yrityksen logo otsikkopalkkiin (valinnainen)</label>
            <input type="file" id="ap-logo-file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style="display:none">
            <button id="ap-logo-upload-btn" style="width:100%;padding:10px;border:2px dashed #e2e8f0;border-radius:10px;background:#f8fafc;cursor:pointer;font-size:13px;color:#64748b;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px" onmouseover="this.style.borderColor='#2563EB';this.style.color='#2563EB'" onmouseout="this.style.borderColor='#e2e8f0';this.style.color='#64748b'">
              <i class="fa fa-cloud-upload-alt"></i> Lataa logo koneelta (PNG läpinäkyvällä taustalla suositeltu)
            </button>
            <div id="ap-logo-upload-status" style="font-size:11px;margin-top:5px;min-height:14px;color:#64748b"></div>
            <input id="ap-logo-url" type="text" value="${escHtml(w.logoUrl||'')}" placeholder="tai liitä logon URL https://..." class="cb-input" style="width:100%;margin-top:6px">
            <div id="ap-logo-preview" style="${w.logoUrl?'':'display:none'};margin-top:10px;display:flex;align-items:center;gap:12px;background:${w.headerColor||'#2563EB'};padding:8px 12px;border-radius:8px">
              <img id="ap-logo-preview-img" src="${escHtml(w.logoUrl||'')}" style="max-height:${w.logoHeight||26}px;max-width:140px;object-fit:contain" onerror="this.parentNode.style.display='none'">
              <button id="ap-logo-clear" style="background:rgba(255,255,255,0.2);border:none;cursor:pointer;color:#fff;font-size:11px;font-family:inherit;padding:3px 8px;border-radius:6px">✕ Poista logo</button>
            </div>
            <div style="margin-top:10px">
              <label class="cb-label" style="display:flex;align-items:center;justify-content:space-between">
                <span>Logon korkeus</span>
                <span id="ap-logo-height-label" style="font-weight:700;color:#1e293b">${w.logoHeight||26}px</span>
              </label>
              <input type="range" id="ap-logo-height" min="16" max="48" step="1" value="${w.logoHeight||26}" style="width:100%;margin-top:6px;accent-color:#2563EB"
                oninput="document.getElementById('ap-logo-height-label').textContent=this.value+'px';var p=document.getElementById('ap-logo-preview-img');if(p)p.style.maxHeight=this.value+'px'">
            </div>
          </div>
        </div>

        <div class="cb-card" style="margin-bottom:16px">
          <div class="cb-card-title">Viestipallojen värit</div>
          <div class="cb-grid2">
            <div class="cb-field">
              <label class="cb-label">Botin viestipallo</label>
              <input id="ap-bot-bubble" type="color" value="${w.botBubbleColor||'#f1f5f9'}" class="cb-color">
            </div>
            <div class="cb-field">
              <label class="cb-label">Botin viestiteksti</label>
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
          </div>
        </div>

        <div class="cb-card" style="margin-bottom:16px">
          <div class="cb-card-title">Chat-ikkunan tausta</div>
          <div class="cb-field" style="margin-bottom:12px">
            <label class="cb-label">Taustan tyyppi</label>
            <select id="ap-bg-type" class="cb-select">
              <option value="color"    ${(w.chatBgType||'color')==='color'   ?'selected':''}>Yksi väri</option>
              <option value="gradient" ${w.chatBgType==='gradient'?'selected':''}>Liukuväri</option>
              <option value="image"    ${w.chatBgType==='image'   ?'selected':''}>Taustakuva</option>
            </select>
          </div>
          <div class="cb-grid2" id="ap-bg-colors">
            <div class="cb-field">
              <label class="cb-label">Taustaväri 1</label>
              <input id="ap-chat-bg" type="color" value="${w.chatBgColor||'#ffffff'}" class="cb-color">
            </div>
            <div class="cb-field" id="ap-bg-color2-field" style="${w.chatBgType==='gradient'?'':'display:none'}">
              <label class="cb-label">Taustaväri 2 (liukuväri)</label>
              <input id="ap-chat-bg2" type="color" value="${w.chatBgColor2||'#eef2ff'}" class="cb-color">
            </div>
          </div>
          <!-- Taustakuva -->
          <div id="ap-bg-image-panel" style="${w.chatBgType==='image'?'':'display:none'};margin-top:12px">
            <input type="file" id="ap-bg-image-file" accept="image/png,image/jpeg,image/webp" style="display:none">
            <button id="ap-bg-image-upload-btn" style="width:100%;padding:10px;border:2px dashed #e2e8f0;border-radius:10px;background:#f8fafc;cursor:pointer;font-size:13px;color:#64748b;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px" onmouseover="this.style.borderColor='#2563EB';this.style.color='#2563EB'" onmouseout="this.style.borderColor='#e2e8f0';this.style.color='#64748b'">
              <i class="fa fa-cloud-upload-alt"></i> Lataa taustakuva koneelta (JPG/PNG, esim. 720×960 px)
            </button>
            <div id="ap-bg-image-upload-status" style="font-size:11px;margin-top:5px;min-height:14px;color:#64748b"></div>
            <input id="ap-bg-image-url" type="text" value="${escHtml(w.chatBgImage||'')}" placeholder="tai liitä kuvan URL https://..." class="cb-input" style="width:100%;margin-top:6px">
            <div id="ap-bg-image-preview" style="${w.chatBgImage?'':'display:none'};margin-top:10px">
              <img id="ap-bg-image-preview-img" src="${escHtml(w.chatBgImage||'')}" style="width:100%;max-height:160px;object-fit:contain;background:#f1f5f9;border-radius:10px;border:1px solid #e2e8f0" onerror="this.parentNode.style.display='none'">
              <button id="ap-bg-image-clear" style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:11px;font-family:inherit;padding:4px 0 0;margin-top:2px">✕ Poista taustakuva</button>
            </div>
            <p style="font-size:11px;color:#94a3b8;margin-top:6px">Syöte- ja viestipalkit saavat automaattisesti huurretun taustan, jotta teksti pysyy luettavana.</p>
          </div>
        </div>

        <div class="cb-card" style="margin-bottom:16px">
          <div class="cb-card-title">Typografia</div>
          <div class="cb-field">
            <label class="cb-label">Fontti</label>
            <select id="ap-font" class="cb-select">
              <option value="system"  ${(w.fontFamily||'system')==='system'?'selected':''}>Järjestelmäfontti (oletus)</option>
              <option value="inter"   ${w.fontFamily==='inter'  ?'selected':''}>Inter (moderni)</option>
              <option value="poppins" ${w.fontFamily==='poppins'?'selected':''}>Poppins (pyöreä, ystävällinen)</option>
              <option value="roboto"  ${w.fontFamily==='roboto' ?'selected':''}>Roboto (selkeä)</option>
              <option value="nunito"  ${w.fontFamily==='nunito' ?'selected':''}>Nunito (pehmeä)</option>
            </select>
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

        <div class="cb-card" style="margin-bottom:16px">
          <div class="cb-card-title">Pikavalinnat – valmiit tekstipainikkeet chatissa</div>
          <p style="font-size:12px;color:#64748b;margin:0 0 12px;line-height:1.5">Kävijä voi klikata näitä lähettääkseen viestin suoraan — tai kirjoittaa itse. Näkyvät chat-ikkunan alaosassa.</p>
          <div id="ap-qr-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px"></div>
          <button id="ap-qr-add" style="padding:7px 14px;border:1.5px dashed #2563EB;background:#eff6ff;color:#2563EB;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
            <i class="fa fa-plus"></i> Lisää pikavalinta
          </button>
        </div>

        <button id="ap-save" style="padding:10px 24px;background:#2563EB;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
          <i class="fa fa-save"></i> Tallenna ulkoasuasetukset
        </button>
      </div>

      <!-- Esikatselu -->
      <div style="position:sticky;top:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em">Esikatselu</div>
          <div style="display:flex;gap:4px" id="ap-preview-tabs">
            <button class="ap-ptab active" data-state="button" style="padding:4px 10px;border-radius:6px;border:1px solid #2563EB;background:#eff6ff;color:#2563EB;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">💬 Painike</button>
            <button class="ap-ptab" data-state="window" style="padding:4px 10px;border-radius:6px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:11px;font-weight:500;cursor:pointer;font-family:inherit">🪟 Chat-ikkuna</button>
          </div>
        </div>
        <div id="ap-preview" style="background:#e2e8f0;border-radius:14px;height:360px;position:relative;overflow:hidden">
          ${renderPreviewWidget(bot, 'button')}
        </div>
        <p style="font-size:11px;color:#94a3b8;margin-top:8px;text-align:center">Esikatselu päivittyy reaaliajassa · muista <strong>Tallenna</strong></p>
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

  // ── Ikonivalitsimen logiikka ──────────────────────────────────────────────
  const iconTypeInput  = tc.querySelector('#ap-icon-type');
  const iconValueInput = tc.querySelector('#ap-icon-value');

  // Välilehdet (Esiasetettu / Emoji / Kuva)
  tc.querySelectorAll('.ap-icon-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tc.querySelectorAll('.ap-icon-tab').forEach(t => {
        t.style.background = '#f8fafc'; t.style.borderColor = '#e2e8f0'; t.style.color = '#374151';
      });
      tab.style.background = '#eff6ff'; tab.style.borderColor = '#2563EB'; tab.style.color = '#2563EB';
      const t = tab.dataset.tab;
      tc.querySelector('#ap-preset-grid').style.display = t === 'preset' ? 'grid' : 'none';
      tc.querySelector('#ap-emoji-panel').style.display  = t === 'emoji'  ? '' : 'none';
      tc.querySelector('#ap-image-panel').style.display  = t === 'image'  ? '' : 'none';
      if (t === 'preset') {
        iconTypeInput.value  = 'svg';
        const sel = tc.querySelector('.ap-preset-icon.selected');
        iconValueInput.value = sel ? sel.dataset.key : 'chat';
      } else if (t === 'emoji') {
        iconTypeInput.value  = 'emoji';
        iconValueInput.value = tc.querySelector('#ap-emoji-value').value || '💬';
      } else {
        iconTypeInput.value  = 'image';
        iconValueInput.value = tc.querySelector('#ap-image-url').value || '';
      }
      refreshPreview();
    });
  });
  // Tyylitä aktiivinen välilehti heti
  tc.querySelectorAll('.ap-icon-tab').forEach(t => {
    const isActive = t.classList.contains('active');
    t.style.background   = isActive ? '#eff6ff' : '#f8fafc';
    t.style.borderColor  = isActive ? '#2563EB' : '#e2e8f0';
    t.style.color        = isActive ? '#2563EB' : '#374151';
  });

  // Preset-ikonin klikkailu
  tc.querySelectorAll('.ap-preset-icon').forEach(btn => {
    btn.addEventListener('click', () => {
      tc.querySelectorAll('.ap-preset-icon').forEach(b2 => {
        b2.style.borderColor = '#e2e8f0'; b2.style.background = '#f8fafc'; b2.classList.remove('selected');
      });
      btn.style.borderColor = '#2563EB'; btn.style.background = '#eff6ff'; btn.classList.add('selected');
      iconTypeInput.value  = 'svg';
      iconValueInput.value = btn.dataset.key;
      refreshPreview();
    });
  });

  // Emoji-kenttä muutos
  tc.querySelector('#ap-emoji-value')?.addEventListener('input', e => {
    iconTypeInput.value  = 'emoji';
    iconValueInput.value = e.target.value;
  });

  // Kuva URL muutos (käsin syötetty)
  tc.querySelector('#ap-image-url')?.addEventListener('input', e => {
    iconTypeInput.value  = 'image';
    iconValueInput.value = e.target.value;
    updateImagePreview(tc, e.target.value);
  });

  // Kuvalatauspainike
  tc.querySelector('#ap-image-upload-btn')?.addEventListener('click', () => {
    tc.querySelector('#ap-image-file').click();
  });

  // Tiedoston valinta → lataa Firebase:en
  tc.querySelector('#ap-image-file')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const status = tc.querySelector('#ap-image-upload-status');
    const btn    = tc.querySelector('#ap-image-upload-btn');
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Ladataan...';
    btn.disabled = true;
    status.textContent = '';
    status.style.color = '#64748b';
    try {
      const fd = new FormData();
      fd.append('image', file);
      const r = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!r.ok) throw new Error((await r.json()).message || 'Virhe');
      const data = await r.json();
      const url  = data.url || data.signedUrl || data.imageUrl || '';
      if (!url) throw new Error('URL puuttuu vastauksesta');
      tc.querySelector('#ap-image-url').value = url;
      iconTypeInput.value  = 'image';
      iconValueInput.value = url;
      updateImagePreview(tc, url);
      refreshPreview();
      status.textContent  = '✅ Kuva ladattu onnistuneesti!';
      status.style.color  = '#16a34a';
    } catch (err) {
      status.textContent = '❌ ' + err.message;
      status.style.color = '#ef4444';
    }
    btn.innerHTML = '<i class="fa fa-cloud-upload-alt"></i> Lataa kuva koneelta (PNG, JPG, SVG)';
    btn.disabled  = false;
    e.target.value = '';
  });

  // Poista kuva
  tc.querySelector('#ap-image-clear')?.addEventListener('click', () => {
    tc.querySelector('#ap-image-url').value = '';
    iconValueInput.value = '';
    updateImagePreview(tc, '');
    refreshPreview();
  });

  // Lataa valittu fontti esikatselua varten
  ensureGoogleFont(w.fontFamily);
  tc.querySelector('#ap-font')?.addEventListener('change', e => ensureGoogleFont(e.target.value));

  // ── Painikkeen liukuväri-toggle ───────────────────────────────────────────
  tc.querySelector('#ap-btn-gradient')?.addEventListener('change', e => {
    tc.querySelector('#ap-btn-gradient-field').style.display = e.target.checked ? '' : 'none';
  });

  // ── Otsikkopalkin tyyli ───────────────────────────────────────────────────
  tc.querySelector('#ap-header-style')?.addEventListener('change', e => {
    tc.querySelector('#ap-header-color2-field').style.display = e.target.value === 'gradient' ? '' : 'none';
  });

  // ── Chat-taustan tyyppi ───────────────────────────────────────────────────
  tc.querySelector('#ap-bg-type')?.addEventListener('change', e => {
    const v = e.target.value;
    tc.querySelector('#ap-bg-color2-field').style.display = v === 'gradient' ? '' : 'none';
    tc.querySelector('#ap-bg-image-panel').style.display  = v === 'image'    ? '' : 'none';
  });

  // ── Logon lataus ──────────────────────────────────────────────────────────
  const logoUrlInput = tc.querySelector('#ap-logo-url');
  tc.querySelector('#ap-logo-upload-btn')?.addEventListener('click', () => tc.querySelector('#ap-logo-file').click());
  tc.querySelector('#ap-logo-file')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const status = tc.querySelector('#ap-logo-upload-status');
    const btn = tc.querySelector('#ap-logo-upload-btn');
    btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Ladataan...';
    status.textContent = '';
    try {
      const url = await uploadImageFile(file);
      logoUrlInput.value = url;
      updateLogoPreview(tc, url);
      refreshPreview();
      status.textContent = '✅ Logo ladattu!'; status.style.color = '#16a34a';
    } catch (err) {
      status.textContent = '❌ ' + err.message; status.style.color = '#ef4444';
    }
    btn.disabled = false; btn.innerHTML = '<i class="fa fa-cloud-upload-alt"></i> Lataa logo koneelta (PNG läpinäkyvällä taustalla suositeltu)';
    e.target.value = '';
  });
  logoUrlInput?.addEventListener('input', e => updateLogoPreview(tc, e.target.value));
  tc.querySelector('#ap-logo-clear')?.addEventListener('click', () => {
    logoUrlInput.value = ''; updateLogoPreview(tc, ''); refreshPreview();
  });

  // ── Taustakuvan lataus ────────────────────────────────────────────────────
  const bgImageUrlInput = tc.querySelector('#ap-bg-image-url');
  tc.querySelector('#ap-bg-image-upload-btn')?.addEventListener('click', () => tc.querySelector('#ap-bg-image-file').click());
  tc.querySelector('#ap-bg-image-file')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const status = tc.querySelector('#ap-bg-image-upload-status');
    const btn = tc.querySelector('#ap-bg-image-upload-btn');
    btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Ladataan...';
    status.textContent = '';
    try {
      const url = await uploadImageFile(file);
      bgImageUrlInput.value = url;
      updateBgImagePreview(tc, url);
      refreshPreview();
      status.textContent = '✅ Taustakuva ladattu!'; status.style.color = '#16a34a';
    } catch (err) {
      status.textContent = '❌ ' + err.message; status.style.color = '#ef4444';
    }
    btn.disabled = false; btn.innerHTML = '<i class="fa fa-cloud-upload-alt"></i> Lataa taustakuva koneelta (JPG/PNG, esim. 720×960 px)';
    e.target.value = '';
  });
  bgImageUrlInput?.addEventListener('input', e => updateBgImagePreview(tc, e.target.value));
  tc.querySelector('#ap-bg-image-clear')?.addEventListener('click', () => {
    bgImageUrlInput.value = ''; updateBgImagePreview(tc, ''); refreshPreview();
  });

  // ── Esikatselun tila-napit ────────────────────────────────────────────────
  let previewState = 'button';

  // Kerää nykyiset lomakearvot payload-objektiksi (käytetään sekä esikatseluun että tallennukseen)
  function collectPayload() {
    const payload = {
      button: {
        shape:      tc.querySelector('#ap-shape').value,
        size:       Number(tc.querySelector('#ap-size').value),
        colorStyle: tc.querySelector('#ap-btn-gradient')?.checked ? 'gradient' : 'solid',
        color:      tc.querySelector('#ap-color').value,
        color2:     tc.querySelector('#ap-color2')?.value || '#1e40af',
        iconColor:  tc.querySelector('#ap-icon-color').value,
        iconType:   tc.querySelector('#ap-icon-type').value,
        iconValue:  tc.querySelector('#ap-icon-value')?.value || 'chat',
        iconScale:  Number(tc.querySelector('#ap-icon-scale')?.value || 65),
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
        headerStyle:     tc.querySelector('#ap-header-style').value,
        headerColor:     tc.querySelector('#ap-header-color').value,
        headerColor2:    tc.querySelector('#ap-header-color2').value,
        headerTextColor: tc.querySelector('#ap-header-text-color').value,
        statusText:      tc.querySelector('#ap-status-text').value,
        logoUrl:         tc.querySelector('#ap-logo-url').value.trim(),
        logoHeight:      Number(tc.querySelector('#ap-logo-height').value || 26),
        botBubbleColor:  tc.querySelector('#ap-bot-bubble').value,
        botTextColor:    tc.querySelector('#ap-bot-text').value,
        userBubbleColor: tc.querySelector('#ap-user-bubble').value,
        userTextColor:   tc.querySelector('#ap-user-text').value,
        chatBgType:      tc.querySelector('#ap-bg-type').value,
        chatBgColor:     tc.querySelector('#ap-chat-bg').value,
        chatBgColor2:    tc.querySelector('#ap-chat-bg2').value,
        chatBgImage:     tc.querySelector('#ap-bg-image-url').value.trim(),
        fontFamily:      tc.querySelector('#ap-font').value
      }
    };
    payload.quickReplies = [...tc.querySelectorAll('.ap-qr-input')]
      .map(i => i.value.trim()).filter(Boolean);
    return payload;
  }

  // Live-esikatselu: renderöi nykyisillä (myös tallentamattomilla) arvoilla
  function refreshPreview() {
    const merged = { ...bot, ...collectPayload(), behavior: bot.behavior };
    tc.querySelector('#ap-preview').innerHTML = renderPreviewWidget(merged, previewState);
  }

  tc.querySelectorAll('.ap-ptab').forEach(tab => {
    tab.addEventListener('click', () => {
      previewState = tab.dataset.state;
      tc.querySelectorAll('.ap-ptab').forEach(t => {
        const active = t.dataset.state === previewState;
        t.style.background   = active ? '#eff6ff' : '#fff';
        t.style.borderColor  = active ? '#2563EB' : '#e2e8f0';
        t.style.color        = active ? '#2563EB' : '#64748b';
        t.style.fontWeight   = active ? '600' : '500';
      });
      refreshPreview();
    });
  });

  // Päivitä esikatselu reaaliajassa mistä tahansa kentän muutoksesta
  tc.addEventListener('input', refreshPreview);
  tc.addEventListener('change', refreshPreview);

  function addQRRow(list, value = '') {
    const row = document.createElement('div');
    row.className = 'ap-qr-row';
    row.style.cssText = 'display:flex;align-items:center;gap:8px';
    row.innerHTML = `<input type="text" class="ap-qr-input cb-input" value="${escHtml(value)}" placeholder="esim. Yhteystiedot" style="flex:1"><button class="ap-qr-del" title="Poista" style="padding:6px 9px;border:1px solid #fecaca;background:#fff;color:#ef4444;border-radius:7px;cursor:pointer;font-size:12px;font-family:inherit">✕</button>`;
    list.appendChild(row);
    const input = row.querySelector('.ap-qr-input');
    const delBtn = row.querySelector('.ap-qr-del');
    delBtn.addEventListener('click', () => row.remove());
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const next = row.nextElementSibling;
        if (next?.querySelector('.ap-qr-input')) {
          next.querySelector('.ap-qr-input').focus();
        } else {
          addQRRow(list);
          list.lastElementChild?.querySelector('.ap-qr-input')?.focus();
        }
      }
    });
    return input;
  }

  // Pikavalinnat – lisää rivi
  tc.querySelector('#ap-qr-add').addEventListener('click', () => {
    const list = tc.querySelector('#ap-qr-list');
    addQRRow(list).focus();
  });

  // Populoi olemassa olevat pikavalinnat
  const qrList = tc.querySelector('#ap-qr-list');
  (bot.quickReplies || []).forEach(t => addQRRow(qrList, t));

  // Olemassa olevien poisto + Enter (varakoodi — addQRRow hoitaa nämä itse)
  tc.querySelectorAll('.ap-qr-row').forEach(row => {
    const list = tc.querySelector('#ap-qr-list');
    const input = row.querySelector('.ap-qr-input');
    const delBtn = row.querySelector('.ap-qr-del');
    delBtn.addEventListener('click', () => row.remove());
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const next = row.nextElementSibling;
        if (next?.querySelector('.ap-qr-input')) {
          next.querySelector('.ap-qr-input').focus();
        } else {
          addQRRow(list);
          list.lastElementChild?.querySelector('.ap-qr-input')?.focus();
        }
      }
    });
  });

  // Tallenna
  tc.querySelector('#ap-save').addEventListener('click', async () => {
    const payload = collectPayload();
    const saveBtn = tc.querySelector('#ap-save');
    try {
      await saveBot(bot._id, payload, saveBtn);
      Object.assign(bot, payload);
      ensureGoogleFont(payload.window.fontFamily);
      refreshPreview();
    } catch (err) {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fa fa-save"></i> Tallenna ulkoasuasetukset'; }
      showToast('Tallentaminen epäonnistui', 'error');
    }
  });
}

function renderPreviewWidget(bot, state) {
  const b     = bot.button  || {};
  const w     = bot.window  || {};
  const color = b.color     || '#2563EB';
  const shape = b.shape === 'rounded' ? '14px' : '50%';
  const size  = b.size      || 56;
  const iColor = b.iconColor || '#ffffff';
  const iconSvgSize = Math.round(size * 0.45);

  // ── Tyylilaskenta (sama logiikka kuin embedissä) ──────────────────────────
  const FONT_STACKS = {
    system:  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    inter:   "'Inter', sans-serif", poppins: "'Poppins', sans-serif",
    roboto:  "'Roboto', sans-serif", nunito: "'Nunito', sans-serif"
  };
  const fontStack = FONT_STACKS[w.fontFamily] || FONT_STACKS.system;
  const launcherBg = b.colorStyle === 'gradient'
    ? `linear-gradient(135deg, ${color}, ${b.color2||color})` : color;
  const headerBase = w.headerColor || color;
  const headerBg = w.headerStyle === 'gradient'
    ? `linear-gradient(135deg, ${headerBase}, ${w.headerColor2||headerBase})` : headerBase;
  const bgColor = w.chatBgColor || '#ffffff';
  let chatBg, fancy = false;
  if (w.chatBgType === 'gradient') { chatBg = `linear-gradient(160deg, ${bgColor}, ${w.chatBgColor2||bgColor})`; fancy = true; }
  else if (w.chatBgType === 'image' && w.chatBgImage) { chatBg = `url("${w.chatBgImage}") center/cover no-repeat`; fancy = true; }
  else chatBg = bgColor;
  const barBg = fancy ? 'rgba(255,255,255,0.86)' : bgColor;
  const statusText = w.statusText != null ? w.statusText : 'Online';
  const logoUrl = w.logoUrl || '';

  // Ikonin renderöinti tyypin mukaan
  let iconHtml;
  if (b.iconType === 'emoji') {
    iconHtml = `<span style="font-size:${Math.round(size*0.42)}px;line-height:1">${escHtml(b.iconValue||'💬')}</span>`;
  } else if (b.iconType === 'image') {
    iconHtml = `<img src="${escHtml(b.iconValue||'')}" style="width:60%;height:60%;object-fit:contain;border-radius:4px" onerror="this.style.display='none'">`;
  } else {
    iconHtml = presetIconSvg(b.iconValue || 'chat', iconSvgSize, iColor);
  }

  if (state === 'window') {
    const titleHtml = logoUrl
      ? `<img src="${escHtml(logoUrl)}" style="max-height:${w.logoHeight||26}px;max-width:130px;object-fit:contain;display:block" onerror="this.style.display='none'">`
      : `<div style="font-size:13px;font-weight:700">${escHtml(w.botName||'Avustaja')}</div>`;
    // ── Chat-ikkuna auki ───────────────────────────────────────────────────
    return `
      <div style="position:absolute;inset:12px;background:${chatBg};border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,0.15);overflow:hidden;border:1px solid #e2e8f0;display:flex;flex-direction:column;font-family:${fontStack}">
        <div style="background:${headerBg};color:${w.headerTextColor||'#fff'};padding:12px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;box-shadow:0 2px 10px rgba(0,0,0,0.06)">
          <div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0">${w.botAvatarValue||'🤖'}</div>
          <div style="min-width:0">
            ${titleHtml}
            ${statusText?`<div style="font-size:11px;opacity:0.85"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#22c55e;margin-right:5px"></span>${escHtml(statusText)}</div>`:''}
          </div>
        </div>
        <div style="flex:1;padding:12px;overflow:hidden;display:flex;flex-direction:column;gap:8px">
          <div style="background:${w.botBubbleColor||'#f1f5f9'};color:${w.botTextColor||'#1e293b'};padding:8px 12px;border-radius:4px 12px 12px 12px;font-size:12px;line-height:1.4;max-width:80%;align-self:flex-start;box-shadow:0 1px 2px rgba(0,0,0,0.06)">${escHtml((bot.behavior||{}).welcomeMessage||'Hei! Kuinka voin auttaa?')}</div>
          <div style="background:${w.userBubbleColor||color};color:${w.userTextColor||'#fff'};padding:8px 12px;border-radius:12px 4px 12px 12px;font-size:12px;line-height:1.4;max-width:80%;align-self:flex-end;box-shadow:0 1px 2px rgba(0,0,0,0.06)">Esimerkki viesti</div>
          <div style="background:${w.botBubbleColor||'#f1f5f9'};color:${w.botTextColor||'#1e293b'};padding:8px 12px;border-radius:4px 12px 12px 12px;font-size:12px;line-height:1.4;max-width:80%;align-self:flex-start;box-shadow:0 1px 2px rgba(0,0,0,0.06)">Selvä, voin auttaa sinua!</div>
        </div>
        <div style="padding:8px 10px;border-top:1px solid ${fancy?'rgba(0,0,0,0.06)':'#e2e8f0'};display:flex;gap:6px;background:${barBg};${fancy?'backdrop-filter:blur(10px)':''};flex-shrink:0">
          <div style="flex:1;background:#f1f5f9;border-radius:8px;padding:7px 10px;font-size:11px;color:#94a3b8">${escHtml((bot.behavior||{}).inputPlaceholder||'Kirjoita viestisi...')}</div>
          <div style="width:30px;height:30px;border-radius:8px;background:${launcherBg};display:flex;align-items:center;justify-content:center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" style="fill:${iColor}"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </div>
        </div>
      </div>`;
  }

  // ── Painike-tila (suljettu) ────────────────────────────────────────────────
  const grabberText = (bot.grabber?.enabled !== false) ? escHtml(bot.grabber?.text || 'Onko sinulla kysyttävää? 💬') : '';
  return `
    <div style="position:absolute;bottom:16px;right:16px;display:flex;flex-direction:column;align-items:flex-end;gap:10px;font-family:${fontStack}">
      ${grabberText ? `
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:9px 13px;font-size:12px;color:#374151;box-shadow:0 2px 10px rgba(0,0,0,0.1);max-width:190px;position:relative;line-height:1.4">
          ${grabberText}
          <div style="position:absolute;bottom:-7px;right:18px;width:12px;height:12px;background:#fff;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;transform:rotate(45deg)"></div>
        </div>` : ''}
      <div style="width:${size}px;height:${size}px;border-radius:${shape};background:${launcherBg};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,0.22);cursor:pointer;flex-shrink:0">
        ${iconHtml}
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
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-top:4px">
          <div style="font-size:12px;font-weight:600;color:#374151;margin-bottom:10px">📋 Yhteystiedot fallback-viestin alle (valinnainen)</div>
          <p style="font-size:11px;color:#94a3b8;margin:0 0 10px">Jos asetettu, botti näyttää nämä klikattavina linkkeinä kun vastaus ei löydy.</p>
          <div class="cb-grid2" style="margin-bottom:10px">
            <div class="cb-field">
              <label class="cb-label">Puhelinnumero</label>
              <input id="bh-fallback-phone" type="text" value="${escHtml(beh.fallbackPhone||'')}" placeholder="+358 40 123 4567" class="cb-input">
            </div>
            <div class="cb-field">
              <label class="cb-label">Sähköpostiosoite</label>
              <input id="bh-fallback-email" type="text" value="${escHtml(beh.fallbackEmail||'')}" placeholder="info@yritys.fi" class="cb-input">
            </div>
          </div>
          <div class="cb-field">
            <label class="cb-label">Linkki (URL tai mailto:)</label>
            <input id="bh-fallback-url" type="text" value="${escHtml(beh.fallbackContactUrl||'')}" placeholder="https://example.com/yhteystiedot" class="cb-input">
          </div>
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
        fallbackPhone:      tc.querySelector('#bh-fallback-phone').value.trim(),
        fallbackEmail:      tc.querySelector('#bh-fallback-email').value.trim(),
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
    const saveBtn = tc.querySelector('#bh-save');
    try {
      await saveBot(bot._id, payload, saveBtn);
      Object.assign(bot, payload);
    } catch (err) {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fa fa-save"></i> Tallenna asetukset'; }
      showToast('Tallentaminen epäonnistui', 'error');
    }
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

function updateImagePreview(tc, url) {
  const preview = tc.querySelector('#ap-image-preview');
  const img     = tc.querySelector('#ap-image-preview-img');
  if (!preview || !img) return;
  if (url) {
    img.src = url;
    preview.style.display = 'flex';
  } else {
    preview.style.display = 'none';
    img.src = '';
  }
}

// Lataa kuva /api/upload-reittiin ja palauta URL
async function uploadImageFile(file) {
  const fd = new FormData();
  fd.append('image', file);
  const r = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || 'Lataus epäonnistui');
  const data = await r.json();
  const url  = data.url || data.signedUrl || data.imageUrl || '';
  if (!url) throw new Error('URL puuttuu vastauksesta');
  return url;
}

function updateLogoPreview(tc, url) {
  const preview = tc.querySelector('#ap-logo-preview');
  const img     = tc.querySelector('#ap-logo-preview-img');
  if (!preview || !img) return;
  if (url) { img.src = url; preview.style.display = 'flex'; }
  else     { preview.style.display = 'none'; img.src = ''; }
}

function updateBgImagePreview(tc, url) {
  const preview = tc.querySelector('#ap-bg-image-preview');
  const img     = tc.querySelector('#ap-bg-image-preview-img');
  if (!preview || !img) return;
  if (url) { img.src = url; preview.style.display = ''; }
  else     { preview.style.display = 'none'; img.src = ''; }
}

// Lataa Google-fontti dashboardiin esikatselua varten (kerran per fontti)
function ensureGoogleFont(fontKey) {
  const FONT_URLS = {
    inter:   'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    poppins: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    roboto:  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
    nunito:  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap'
  };
  const url = FONT_URLS[fontKey];
  if (!url || document.querySelector(`link[data-cb-font="${fontKey}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.setAttribute('data-cb-font', fontKey);
  document.head.appendChild(link);
}

function fmtDate(d) {
  if (!d) return '–';
  return new Date(d).toLocaleDateString('fi-FI', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
