(function () {
  'use strict';

  // ── Preset-ikonit (sama lista kuin dashboardissa) ──────────────────────────
  var PRESET_PATHS = {
    chat:     'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
    question: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z',
    star:     'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    phone:    'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
    person:   'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    mail:     'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    bolt:     'M7 2v11h3v9l7-12h-4l4-8z',
    heart:    'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
  };

  function buildPresetSvg(key, size, fillColor) {
    var path = PRESET_PATHS[key] || PRESET_PATHS.chat;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" style="pointer-events:none;fill:' + fillColor + '"><path d="' + path + '"/></svg>';
  }

  // ── Lue bot-id skriptitägistä ──────────────────────────────────────────────
  const scriptEl = document.currentScript
    || document.querySelector('script[data-bot-id]');
  const BOT_ID  = scriptEl?.getAttribute('data-bot-id');
  const API_BASE = scriptEl?.src
    ? new URL(scriptEl.src).origin
    : 'https://popupmanager.net';

  if (!BOT_ID) return;

  // ── Session-hallinta (localStorage) ───────────────────────────────────────
  const SESSION_KEY = `pm_chat_sid_${BOT_ID}`;
  function getOrCreateSessionId() {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  }
  const SESSION_ID = getOrCreateSessionId();

  // Muista onko heräteteksti jo näytetty tässä sessiossa
  const GRABBER_SHOWN_KEY = `pm_grabber_shown_${BOT_ID}`;

  // ── API-kutsut ──────────────────────────────────────────────────────────────
  async function apiGet(path) {
    const r = await fetch(`${API_BASE}${path}`);
    if (!r.ok) throw new Error('API error ' + r.status);
    return r.json();
  }
  async function apiPost(path, body) {
    const r = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('API error ' + r.status);
    return r.json();
  }

  // ── Lataa konfiguraatio ────────────────────────────────────────────────────
  apiGet(`/api/chat/bot/${BOT_ID}/config`).then(cfg => init(cfg)).catch(() => {});

  function init(cfg) {
    const btn    = cfg.button    || {};
    const grabber = cfg.grabber  || {};
    const anim   = cfg.animation || {};
    const win    = cfg.window    || {};
    const beh    = cfg.behavior  || {};
    const lead   = cfg.leadForm  || {};

    // Positio-luokka
    const pos    = btn.position || 'bottom-right';
    const offsetX = btn.offsetX != null ? btn.offsetX : 20;
    const offsetY = btn.offsetY != null ? btn.offsetY : 20;
    const size   = btn.size || 56;
    const color  = btn.color || '#2563EB';
    const iconColor = btn.iconColor || '#ffffff';
    const isCustomShape = btn.shape === 'image';   // vapaamuotoinen oma kuva, ei taustapalloa
    const shape  = btn.shape === 'rounded' ? '14px' : (isCustomShape ? '0' : '50%');

    // ── Tyylilaskenta: gradientit, tausta, fontit ──────────────────────────────
    // Painikkeen tausta (kiinteä tai liukuväri). Vapaamuotoisessa kuvassa ei taustaa.
    const launcherBg = isCustomShape
      ? 'transparent'
      : (btn.colorStyle === 'gradient'
          ? `linear-gradient(135deg, ${color}, ${btn.color2 || color})`
          : color);

    // Otsikkopalkin tausta
    const headerBase = win.headerColor || color;
    const headerBg = win.headerStyle === 'gradient'
      ? `linear-gradient(135deg, ${headerBase}, ${win.headerColor2 || headerBase})`
      : headerBase;

    // Chat-alueen tausta (väri / liukuväri / kuva)
    const bgColor = win.chatBgColor || '#ffffff';
    let chatBg, isFancyBg = false;
    if (win.chatBgType === 'gradient') {
      chatBg = `linear-gradient(160deg, ${bgColor}, ${win.chatBgColor2 || bgColor})`;
      isFancyBg = true;
    } else if (win.chatBgType === 'image' && win.chatBgImage) {
      chatBg = `url("${win.chatBgImage}") center/cover no-repeat`;
      isFancyBg = true;
    } else {
      chatBg = bgColor;
    }
    // Syöte-/pikavalintapalkin tausta: kuvan/gradientin päällä huurrettu, muuten värin mukainen
    const barBg = isFancyBg ? 'rgba(255,255,255,0.86)' : bgColor;
    const barBlur = isFancyBg ? 'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' : '';

    // Fonttipino + Google Fonts -import
    const FONT_STACKS = {
      system:  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      inter:   "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      poppins: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
      roboto:  "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
      nunito:  "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif"
    };
    const FONT_IMPORTS = {
      inter:   'Inter:wght@400;500;600;700',
      poppins: 'Poppins:wght@400;500;600;700',
      roboto:  'Roboto:wght@400;500;700',
      nunito:  'Nunito:wght@400;600;700;800'
    };
    const fontKey   = win.fontFamily && FONT_STACKS[win.fontFamily] ? win.fontFamily : 'system';
    const fontStack = FONT_STACKS[fontKey];
    const fontImport = FONT_IMPORTS[fontKey]
      ? `@import url('https://fonts.googleapis.com/css2?family=${FONT_IMPORTS[fontKey]}&display=swap');`
      : '';

    // ── Shadow DOM ────────────────────────────────────────────────────────────
    const host = document.createElement('div');
    host.id    = 'pm-chatbot-host';
    host.style.cssText = 'all:initial;position:fixed;z-index:2147483647;pointer-events:none';
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    // ── CSS ───────────────────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
      ${fontImport}
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :host { all: initial; }
      #pm-wrap, #pm-window, #pm-window * { font-family: ${fontStack}; }

      #pm-wrap {
        position: fixed;
        ${pos.includes('bottom') ? 'bottom:' + offsetY + 'px' : 'top:' + offsetY + 'px'};
        ${pos.includes('right')  ? 'right:'  + offsetX + 'px' : 'left:' + offsetX + 'px'};
        display: flex;
        flex-direction: column;
        align-items: ${pos.includes('right') ? 'flex-end' : 'flex-start'};
        gap: 10px;
        pointer-events: all;
      }

      /* ── Toggle-painike ── */
      #pm-btn {
        width: ${size}px;
        height: ${size}px;
        border-radius: ${shape};
        background: ${launcherBg};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: ${isCustomShape ? 'visible' : 'hidden'};
        box-shadow: ${isCustomShape ? 'none' : '0 4px 16px rgba(0,0,0,0.22)'};
        ${isCustomShape ? 'filter: drop-shadow(0 4px 10px rgba(0,0,0,0.35));' : ''}
        transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        flex-shrink: 0;
        opacity: 0;
        transform: translateX(${pos.includes('right') ? '80px' : '-80px'});
      }
      #pm-btn.pm-visible {
        opacity: 1;
        transform: translateX(0);
        transition: opacity 0.4s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1);
      }
      #pm-btn:hover { transform: scale(1.08); ${isCustomShape ? 'filter: drop-shadow(0 7px 16px rgba(0,0,0,0.45));' : 'box-shadow: 0 6px 24px rgba(0,0,0,0.28);'} }
      #pm-btn svg, #pm-btn .pm-emoji {
        pointer-events: none;
        color: ${iconColor};
        fill: ${iconColor};
        font-size: ${Math.round(size * 0.45)}px;
        line-height: 1;
      }

      /* ── Animaatiot ── */
      @keyframes pm-wiggle {
        0%,100% { transform: rotate(0deg) scale(1); }
        20%     { transform: rotate(-14deg) scale(1.05); }
        40%     { transform: rotate(10deg)  scale(1.05); }
        60%     { transform: rotate(-8deg)  scale(1.03); }
        80%     { transform: rotate(5deg)   scale(1.02); }
      }
      @keyframes pm-pulse {
        0%,100% { box-shadow: 0 4px 16px rgba(0,0,0,0.22), 0 0 0 0 ${color}66; }
        50%     { box-shadow: 0 4px 16px rgba(0,0,0,0.22), 0 0 0 10px ${color}00; }
      }
      @keyframes pm-bounce {
        0%,100% { transform: translateY(0); }
        40%     { transform: translateY(-10px); }
        70%     { transform: translateY(-5px); }
      }
      #pm-btn.pm-anim-wiggle { animation: pm-wiggle 0.6s ease; }
      #pm-btn.pm-anim-pulse  { animation: pm-pulse  1.2s ease; }
      #pm-btn.pm-anim-bounce { animation: pm-bounce 0.7s ease; }

      /* ── Heräteteksti ── */
      #pm-grabber {
        background: #ffffff;
        color: #1e293b;
        border-radius: 12px;
        padding: 10px 14px;
        font-family: ${fontStack};
        font-size: 13.5px;
        line-height: 1.4;
        box-shadow: 0 4px 18px rgba(0,0,0,0.14);
        max-width: 220px;
        position: relative;
        opacity: 0;
        transform: translateY(6px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: all;
        border: 1px solid #e2e8f0;
      }
      #pm-grabber.pm-visible { opacity: 1; transform: translateY(0); }
      #pm-grabber::after {
        content: '';
        position: absolute;
        bottom: -7px;
        ${pos.includes('right') ? 'right: 20px' : 'left: 20px'};
        width: 12px; height: 12px;
        background: #ffffff;
        border-right: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
        transform: rotate(45deg);
      }
      #pm-grabber-close {
        position: absolute; top: 4px; right: 6px;
        background: none; border: none; cursor: pointer;
        font-size: 14px; color: #94a3b8; line-height: 1; padding: 2px;
      }
      #pm-grabber-close:hover { color: #475569; }

      /* ── Chat-ikkuna ── */
      #pm-window {
        width: 360px;
        max-width: calc(100vw - ${offsetX * 2}px);
        height: 520px;
        max-height: calc(100vh - ${offsetY + size + 20}px);
        background: ${chatBg};
        border-radius: 18px;
        box-shadow: 0 12px 48px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        transform: scale(0.92) translateY(16px);
        transform-origin: ${pos.includes('right') ? 'right' : 'left'} bottom;
        transition: opacity 0.25s ease, transform 0.28s cubic-bezier(0.34,1.56,0.64,1);
        pointer-events: none;
        border: 1px solid rgba(0,0,0,0.07);
      }
      #pm-window.pm-open {
        opacity: 1; transform: scale(1) translateY(0); pointer-events: all;
      }

      /* Header */
      #pm-header {
        background: ${headerBg};
        color: ${win.headerTextColor || '#ffffff'};
        padding: 14px 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
        box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.06);
        position: relative;
        z-index: 2;
      }
      .pm-header-logo { max-height: ${win.logoHeight || 26}px; max-width: 150px; object-fit: contain; display: block; }
      .pm-avatar {
        width: 34px; height: 34px;
        border-radius: 50%;
        background: rgba(255,255,255,0.25);
        display: flex; align-items: center; justify-content: center;
        font-size: 18px; flex-shrink: 0;
        overflow: hidden;
      }
      .pm-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .pm-bot-name { font-size: 14px; font-weight: 600; flex: 1; font-family: ${fontStack}; }
      .pm-status { font-size: 11px; opacity: 0.8; margin-top: 1px; }
      #pm-header-close {
        background: none; border: none; cursor: pointer;
        color: inherit; font-size: 18px; line-height: 1; opacity: 0.8; padding: 4px;
      }
      #pm-header-close:hover { opacity: 1; }

      /* Viestialue */
      #pm-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: transparent;
        font-family: ${fontStack};
      }
      #pm-messages::-webkit-scrollbar { width: 4px; }
      #pm-messages::-webkit-scrollbar-track { background: transparent; }
      #pm-messages::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

      .pm-msg {
        max-width: 82%; display: flex; flex-direction: column; gap: 3px;
        animation: pm-msg-in 0.32s cubic-bezier(0.22,1,0.36,1) both;
      }
      @keyframes pm-msg-in {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .pm-msg.pm-bot { align-self: flex-start; }
      .pm-msg.pm-user { align-self: flex-end; }
      .pm-bubble {
        padding: 9px 13px;
        border-radius: 16px;
        font-size: 13.5px;
        line-height: 1.5;
        word-break: break-word;
        box-shadow: 0 1px 2px rgba(0,0,0,0.06);
      }
      .pm-msg.pm-bot  .pm-bubble { background: ${win.botBubbleColor  || '#f1f5f9'}; color: ${win.botTextColor  || '#1e293b'}; border-radius: 4px 16px 16px 16px; }
      .pm-msg.pm-user .pm-bubble { background: ${win.userBubbleColor || color};     color: ${win.userTextColor || '#ffffff'}; border-radius: 16px 4px 16px 16px; }

      /* Typing indicator */
      .pm-typing { display: flex; gap: 4px; padding: 10px 14px; align-items: center; }
      .pm-typing span {
        width: 7px; height: 7px;
        border-radius: 50%;
        background: #94a3b8;
        animation: pm-dot 1.2s infinite;
      }
      .pm-typing span:nth-child(2) { animation-delay: 0.2s; }
      .pm-typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes pm-dot {
        0%,80%,100% { transform: scale(0.8); opacity: 0.5; }
        40%          { transform: scale(1.1); opacity: 1; }
      }

      /* Liidilomake */
      #pm-lead-form {
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-family: ${fontStack};
      }
      #pm-lead-form.pm-hidden { display: none; }
      .pm-lead-title { font-size: 12px; font-weight: 600; color: #374151; }
      .pm-lead-row { display: flex; gap: 6px; }
      .pm-lead-input {
        flex: 1;
        padding: 8px 10px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 13px;
        font-family: inherit;
        outline: none;
        background: #fff;
      }
      .pm-lead-input:focus { border-color: ${color}; box-shadow: 0 0 0 3px ${color}22; }
      .pm-lead-submit {
        padding: 8px 16px;
        background: ${color};
        color: ${iconColor};
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        white-space: nowrap;
      }
      .pm-lead-submit:hover { opacity: 0.9; }
      .pm-lead-skip { font-size: 11px; color: #94a3b8; background: none; border: none; cursor: pointer; align-self: center; font-family: inherit; }
      .pm-lead-skip:hover { color: #64748b; }

      /* Pikavalinnat */
      #pm-quick-replies {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 8px 12px 4px;
        background: ${barBg};
        ${barBlur}
        flex-shrink: 0;
      }
      .pm-qr-btn {
        padding: 5px 12px;
        border: 1.5px solid ${color};
        border-radius: 99px;
        background: transparent;
        color: ${color};
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
        transition: background 0.15s, color 0.15s;
        white-space: nowrap;
      }
      .pm-qr-btn:hover { background: ${color}; color: ${iconColor}; }

      /* Input-alue */
      #pm-input-area {
        padding: 10px 12px;
        border-top: 1px solid ${isFancyBg ? 'rgba(0,0,0,0.06)' : '#e2e8f0'};
        display: flex;
        gap: 8px;
        align-items: flex-end;
        background: ${barBg};
        ${barBlur}
        flex-shrink: 0;
      }
      #pm-input {
        flex: 1;
        resize: none;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 8px 12px;
        font-size: 13.5px;
        font-family: ${fontStack};
        outline: none;
        background: #fff;
        max-height: 100px;
        min-height: 38px;
        line-height: 1.4;
        color: #1e293b;
      }
      #pm-input:focus { border-color: ${color}; box-shadow: 0 0 0 3px ${color}22; }
      #pm-send {
        width: 36px; height: 36px;
        border-radius: 10px;
        background: ${color};
        border: none;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        transition: opacity 0.15s;
      }
      #pm-send:hover { opacity: 0.88; }
      #pm-send:disabled { opacity: 0.4; cursor: default; }
      #pm-send svg { fill: ${iconColor}; }

      /* Footer */
      #pm-footer {
        padding: 5px 14px 8px;
        font-size: 10px;
        color: #94a3b8;
        text-align: center;
        background: ${barBg};
        ${barBlur}
        font-family: ${fontStack};
        flex-shrink: 0;
      }

      @media (max-width: 480px) {
        #pm-window { width: 100vw; max-width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; }
        #pm-wrap { bottom: 0 !important; right: 0 !important; left: 0 !important; }
      }
    `;

    // ── HTML ──────────────────────────────────────────────────────────────────
    const wrap = document.createElement('div');
    wrap.id = 'pm-wrap';

    // Avatar HTML
    const avatarType  = win.botAvatarType  || 'emoji';
    const avatarValue = win.botAvatarValue || '🤖';
    const avatarHtml  = avatarType === 'image'
      ? `<div class="pm-avatar"><img src="${avatarValue}" alt="bot" onerror="this.parentNode.textContent='🤖'"></div>`
      : `<div class="pm-avatar">${avatarValue}</div>`;

    // Painike-ikoni
    const btnIconType  = btn.iconType  || 'svg';
    const btnIconValue = btn.iconValue || 'chat';
    const iconSz = Math.round(size * 0.45);
    let btnIconHtml;
    if (isCustomShape) {
      // Vapaamuotoinen oma kuva: täyttää koko alueen luonnollisessa muodossaan (ei taustapalloa)
      if (btnIconType === 'image' && btnIconValue) {
        btnIconHtml = `<img src="${btnIconValue}" style="width:100%;height:100%;object-fit:contain;pointer-events:none" onerror="this.style.display='none'">`;
      } else if (btnIconType === 'emoji') {
        btnIconHtml = `<span class="pm-emoji" style="font-size:${Math.round(size*0.9)}px;line-height:1;pointer-events:none">${btnIconValue}</span>`;
      } else {
        btnIconHtml = buildPresetSvg(btnIconValue || 'chat', size, iconColor);
      }
    } else if (btnIconType === 'emoji') {
      btnIconHtml = `<span class="pm-emoji" style="font-size:${Math.round(size*0.42)}px;line-height:1;pointer-events:none">${btnIconValue}</span>`;
    } else if (btnIconType === 'image') {
      if (btn.iconFit === 'cover') {
        // Kuva täyttää koko napin ja rajautuu napin muotoon (overflow:hidden napissa)
        btnIconHtml = `<img src="${btnIconValue}" style="width:100%;height:100%;object-fit:cover;pointer-events:none" onerror="this.style.display='none'">`;
      } else {
        const imgPct = (btn.iconScale || 65) + '%';
        btnIconHtml = `<img src="${btnIconValue}" style="width:${imgPct};height:${imgPct};object-fit:contain;pointer-events:none" onerror="this.style.display='none'">`;
      }
    } else {
      // Preset SVG-ikoni nimen perusteella
      btnIconHtml = buildPresetSvg(btnIconValue || 'chat', iconSz, iconColor);
    }
    const closeSz = Math.round(size*0.38);
    const btnCloseHtml = `<svg id="pm-icon-close" xmlns="http://www.w3.org/2000/svg" width="${closeSz}" height="${closeSz}" viewBox="0 0 24 24" style="display:none;fill:${iconColor};pointer-events:none"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;

    // Liidilomake-kentät
    const fields = lead.fields || { name: true, email: true };
    let leadFieldsHtml = '';
    if (fields.name)  leadFieldsHtml += `<input class="pm-lead-input" id="pm-lead-name"  type="text"  placeholder="Nimi">`;
    if (fields.email) leadFieldsHtml += `<input class="pm-lead-input" id="pm-lead-email" type="email" placeholder="Sähköposti">`;
    if (fields.phone) leadFieldsHtml += `<input class="pm-lead-input" id="pm-lead-phone" type="tel"   placeholder="Puhelin">`;

    // Otsikon sisältö: logo tai botin nimi
    const logoUrl    = win.logoUrl || '';
    const statusText = win.statusText != null ? win.statusText : 'Online';
    const headerTitleHtml = logoUrl
      ? `<img class="pm-header-logo" src="${escHtml(logoUrl)}" alt="${escHtml(win.botName || '')}" onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<div class=\\'pm-bot-name\\'>${escHtml(win.botName || 'Avustaja')}</div>')">`
      : `<div class="pm-bot-name">${escHtml(win.botName || 'Avustaja')}</div>`;
    const statusHtml = statusText
      ? `<div class="pm-status"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;margin-right:5px;vertical-align:middle"></span>${escHtml(statusText)}</div>`
      : '';

    wrap.innerHTML = `
      <div id="pm-window">
        <div id="pm-header">
          ${avatarHtml}
          <div style="flex:1;min-width:0">
            ${headerTitleHtml}
            ${statusHtml}
          </div>
          <button id="pm-header-close">✕</button>
        </div>
        <div id="pm-messages"></div>
        <div id="pm-lead-form" class="pm-hidden">
          <div class="pm-lead-title">Jätä yhteystietosi 👋</div>
          <div class="pm-lead-row">${leadFieldsHtml}</div>
          <div class="pm-lead-row">
            <button class="pm-lead-submit" id="pm-lead-submit">Lähetä</button>
            <button class="pm-lead-skip"   id="pm-lead-skip">Ohita</button>
          </div>
        </div>
        ${(cfg.quickReplies||[]).length ? `<div id="pm-quick-replies">${(cfg.quickReplies).map(t=>`<button class="pm-qr-btn">${escHtml(t)}</button>`).join('')}</div>` : ''}
        <div id="pm-input-area">
          <textarea id="pm-input" rows="1" placeholder="${escHtml(beh.inputPlaceholder || 'Kirjoita viestisi...')}" maxlength="${2000}"></textarea>
          <button id="pm-send" title="Lähetä">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
        <div id="pm-footer">${escHtml(cfg.poweredBy || '')}</div>
      </div>

      <div id="pm-grabber">
        <button id="pm-grabber-close">✕</button>
        <span id="pm-grabber-text">${escHtml(grabber.text || 'Onko sinulla kysyttävää? 💬')}</span>
      </div>

      <button id="pm-btn">${btnIconHtml}${btnCloseHtml}</button>
    `;

    shadow.appendChild(style);
    shadow.appendChild(wrap);

    // ── Elementtiviittaukset ─────────────────────────────────────────────────
    const btnEl      = shadow.getElementById('pm-btn');
    const windowEl   = shadow.getElementById('pm-window');
    const messagesEl = shadow.getElementById('pm-messages');
    const inputEl    = shadow.getElementById('pm-input');
    const sendEl     = shadow.getElementById('pm-send');
    const grabberEl  = shadow.getElementById('pm-grabber');
    const leadFormEl = shadow.getElementById('pm-lead-form');
    const iconChat   = shadow.getElementById('pm-icon-chat');
    const iconClose  = shadow.getElementById('pm-icon-close');

    let isOpen    = false;
    let isSending = false;
    let msgCount  = 0;
    let leadDone  = false;

    // ── Intro-animaatio ──────────────────────────────────────────────────────
    setTimeout(() => btnEl.classList.add('pm-visible'), 800);

    // ── Idle-animaatio ───────────────────────────────────────────────────────
    const idleAnim     = anim.idle || 'wiggle';
    const idleInterval = (anim.idleIntervalS || 10) * 1000;

    if (idleAnim !== 'none') {
      let idleTimer;
      function triggerIdle() {
        if (isOpen) return;
        const cls = 'pm-anim-' + idleAnim;
        btnEl.classList.add(cls);
        btnEl.addEventListener('animationend', () => btnEl.classList.remove(cls), { once: true });
        idleTimer = setTimeout(triggerIdle, idleInterval);
      }
      idleTimer = setTimeout(triggerIdle, idleInterval);
    }

    // ── Heräteteksti ─────────────────────────────────────────────────────────
    const grabberFreq = grabber.frequency || 'once-per-session';
    const alreadyShown = localStorage.getItem(GRABBER_SHOWN_KEY);

    if (grabber.enabled !== false && grabberFreq !== 'never') {
      if (grabberFreq === 'always' || !alreadyShown) {
        const grabDelay = grabber.delayMs != null ? grabber.delayMs : 3000;
        setTimeout(() => {
          if (!isOpen) {
            grabberEl.classList.add('pm-visible');
            if (grabberFreq === 'once-per-session') {
              localStorage.setItem(GRABBER_SHOWN_KEY, '1');
            }
          }
        }, grabDelay + 800); // +800 koska painike tulee ensin esiin
      }
    }

    shadow.getElementById('pm-grabber-close').addEventListener('click', (e) => {
      e.stopPropagation();
      grabberEl.classList.remove('pm-visible');
    });

    // ── Avaa/sulje chat ───────────────────────────────────────────────────────
    function openChat() {
      isOpen = true;
      windowEl.classList.add('pm-open');
      grabberEl.classList.remove('pm-visible');
      if (iconChat)  iconChat.style.display  = 'none';
      if (iconClose) iconClose.style.display = '';
      // Jos ei vielä tervehdysviestiä, lisätään
      if (messagesEl.children.length === 0) {
        if (beh.welcomeMessage) addMessage('bot', beh.welcomeMessage);
        // Liidilomake heti alussa
        if (lead.enabled && lead.timing === 'before' && !leadDone) showLeadForm();
      }
      setTimeout(() => inputEl.focus(), 200);
    }

    function closeChat() {
      isOpen = false;
      windowEl.classList.remove('pm-open');
      if (iconChat)  iconChat.style.display  = '';
      if (iconClose) iconClose.style.display = 'none';
    }

    btnEl.addEventListener('click', () => isOpen ? closeChat() : openChat());
    shadow.getElementById('pm-header-close').addEventListener('click', closeChat);
    grabberEl.addEventListener('click', () => { grabberEl.classList.remove('pm-visible'); openChat(); });

    // ── Viestit ───────────────────────────────────────────────────────────────
    function addMessage(role, text) {
      const div = document.createElement('div');
      div.className = `pm-msg pm-${role}`;
      const bubble = document.createElement('div');
      bubble.className = 'pm-bubble';
      bubble.textContent = text;
      div.appendChild(bubble);
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function addMessageHtml(role, html) {
      const div = document.createElement('div');
      div.className = `pm-msg pm-${role}`;
      const bubble = document.createElement('div');
      bubble.className = 'pm-bubble';
      bubble.style.lineHeight = '1.7';
      bubble.innerHTML = html;
      div.appendChild(bubble);
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTyping() {
      const div = document.createElement('div');
      div.className = 'pm-msg pm-bot';
      div.id = 'pm-typing';
      div.innerHTML = '<div class="pm-bubble pm-typing"><span></span><span></span><span></span></div>';
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    function removeTyping() {
      shadow.getElementById('pm-typing')?.remove();
    }

    async function sendMessage() {
      const text = inputEl.value.trim();
      if (!text || isSending) return;

      isSending = true;
      sendEl.disabled = true;
      inputEl.value = '';
      inputEl.style.height = 'auto';

      addMessage('user', text);
      showTyping();

      // Näytä liidilomake ensimmäisen viestin jälkeen
      msgCount++;
      if (lead.enabled && lead.timing === 'after-first' && msgCount === 1 && !leadDone) {
        showLeadForm();
      }

      try {
        const data = await apiPost(`/api/chat/${BOT_ID}/message`, {
          sessionId: SESSION_ID,
          message:   text,
          pageUrl:   window.location.href
        });
        removeTyping();
        addMessage('bot', data.reply || '');
      } catch {
        removeTyping();
        addMessage('bot', beh.fallbackMessage || 'Palvelimeen ei saada yhteyttä. Yritä hetken kuluttua.');
        if (beh.fallbackPhone || beh.fallbackEmail || beh.fallbackContactUrl) {
          const parts = [];
          if (beh.fallbackPhone) parts.push(`📞 <a href="tel:${escHtml(beh.fallbackPhone)}" style="color:inherit">${escHtml(beh.fallbackPhone)}</a>`);
          if (beh.fallbackEmail) parts.push(`✉️ <a href="mailto:${escHtml(beh.fallbackEmail)}" style="color:inherit">${escHtml(beh.fallbackEmail)}</a>`);
          if (beh.fallbackContactUrl) parts.push(`🔗 <a href="${escHtml(beh.fallbackContactUrl)}" target="_blank" rel="noopener" style="color:inherit">Ota yhteyttä →</a>`);
          addMessageHtml('bot', parts.join('<br>'));
        }
      }

      isSending = false;
      sendEl.disabled = false;
      inputEl.focus();
    }

    // ── Pikavalinnat ─────────────────────────────────────────────────────────
    shadow.querySelectorAll('.pm-qr-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        inputEl.value = btn.textContent;
        sendMessage();
      });
    });

    sendEl.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    // Auto-resize textarea
    inputEl.addEventListener('input', () => {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
    });

    // ── Liidilomake ───────────────────────────────────────────────────────────
    function showLeadForm() {
      if (leadDone || !lead.enabled) return;
      leadFormEl.classList.remove('pm-hidden');
    }
    function hideLeadForm() {
      leadFormEl.classList.add('pm-hidden');
      leadDone = true;
    }

    shadow.getElementById('pm-lead-submit')?.addEventListener('click', async () => {
      const data = {};
      const nameEl  = shadow.getElementById('pm-lead-name');
      const emailEl = shadow.getElementById('pm-lead-email');
      const phoneEl = shadow.getElementById('pm-lead-phone');
      if (nameEl?.value)  data.name  = nameEl.value.trim();
      if (emailEl?.value) data.email = emailEl.value.trim();
      if (phoneEl?.value) data.phone = phoneEl.value.trim();
      if (!Object.keys(data).length) return;
      try {
        await apiPost(`/api/chat/${BOT_ID}/lead`, { sessionId: SESSION_ID, data });
      } catch {}
      hideLeadForm();
    });
    shadow.getElementById('pm-lead-skip')?.addEventListener('click', hideLeadForm);

    // Aloita sessio palvelimella
    apiPost(`/api/chat/${BOT_ID}/session`, {
      sessionId: SESSION_ID,
      pageUrl: window.location.href
    }).catch(() => {});
  }

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
})();
