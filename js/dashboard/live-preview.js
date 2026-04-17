// js/dashboard/live-preview.js

export function renderPreview(containerId, el) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.background = '#f1f5f9';
  container.style.minHeight = '360px';

  // Taustasisältö simuloi sivustoa
  const bg = document.createElement('div');
  bg.innerHTML = `
    <div style="padding:20px;font-family:system-ui,sans-serif">
      <div style="height:18px;background:#e2e8f0;border-radius:4px;width:60%;margin-bottom:12px"></div>
      <div style="height:10px;background:#e2e8f0;border-radius:4px;width:90%;margin-bottom:8px"></div>
      <div style="height:10px;background:#e2e8f0;border-radius:4px;width:75%;margin-bottom:8px"></div>
      <div style="height:10px;background:#e2e8f0;border-radius:4px;width:85%;margin-bottom:16px"></div>
      <div style="height:80px;background:#e2e8f0;border-radius:6px;width:100%;margin-bottom:12px"></div>
      <div style="height:10px;background:#e2e8f0;border-radius:4px;width:80%;margin-bottom:8px"></div>
      <div style="height:10px;background:#e2e8f0;border-radius:4px;width:65%"></div>
    </div>`;
  container.appendChild(bg);

  const type = el.elementType || 'popup';
  const cfg = el.elementConfig || {};

  if (type === 'sticky_bar')         previewStickyBar(container, el, cfg);
  else if (type === 'fab')            previewFAB(container, el, cfg);
  else if (type === 'slide_in')       previewSlideIn(container, el, cfg);
  else if (type === 'social_proof')   previewSocialProof(container, cfg);
  else if (type === 'scroll_progress') previewScrollProgress(container, cfg);
  else if (type === 'lead_form')      previewLeadForm(container, el, cfg);
  else if (type === 'cookie_consent') previewCookieConsent(container, el, cfg);
  else previewPopup(container, el);
}

// ── Sticky Bar preview ──────────────────────────────────
function previewStickyBar(container, el, cfg) {
  const bar = document.createElement('div');
  const isTop = cfg.barPosition === 'top';
  Object.assign(bar.style, {
    position: 'absolute', left: '0', right: '0', zIndex: '10',
    top: isTop ? '0' : 'auto', bottom: isTop ? 'auto' : '0',
    backgroundColor: el.backgroundColor || '#1a56db',
    color: el.textColor || '#ffffff',
    padding: '8px 10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', flexWrap: 'wrap',
    fontFamily: 'system-ui,sans-serif', fontSize: '11px',
    boxShadow: isTop ? '0 2px 6px rgba(0,0,0,0.15)' : '0 -2px 6px rgba(0,0,0,0.15)'
  });

  if (cfg.barText) {
    const txt = document.createElement('span');
    txt.textContent = cfg.barText;
    txt.style.flex = '1';
    txt.style.textAlign = 'center';
    bar.appendChild(txt);
  }

  const buttons = Array.isArray(cfg.ctaButtons) ? cfg.ctaButtons : [];
  buttons.slice(0, 3).forEach(btn => {
    if (!btn.label) return;
    const b = document.createElement('span');
    b.textContent = btn.label;
    Object.assign(b.style, {
      padding: '3px 9px', borderRadius: '5px', cursor: 'pointer',
      fontWeight: '600', fontSize: '10px', whiteSpace: 'nowrap'
    });
    if (btn.style === 'outline') {
      b.style.border = '1.5px solid ' + (el.textColor || '#fff');
      b.style.color = el.textColor || '#fff';
    } else {
      b.style.background = el.textColor || '#fff';
      b.style.color = el.backgroundColor || '#1a56db';
    }
    bar.appendChild(b);
  });

  if (cfg.showDismiss !== false) {
    const x = document.createElement('span');
    x.textContent = '✕';
    x.style.cssText = 'cursor:pointer;opacity:0.7;font-size:12px;padding:0 2px;position:absolute;right:8px';
    bar.style.position = 'absolute';
    bar.appendChild(x);
  }
  container.appendChild(bar);
}

// ── FAB preview ─────────────────────────────────────────
function previewFAB(container, el, cfg) {
  const sizes = { sm: '36px', md: '46px', lg: '56px' };
  const sz = sizes[cfg.fabSize] || '46px';
  const pos = cfg.fabPosition || 'bottom-right';
  const posMap = {
    'bottom-right': { bottom: '12px', right: '12px' },
    'bottom-left':  { bottom: '12px', left: '12px' },
    'top-right':    { top: '12px', right: '12px' },
    'top-left':     { top: '12px', left: '12px' }
  };

  const btn = document.createElement('div');
  Object.assign(btn.style, Object.assign({
    position: 'absolute', zIndex: '10',
    width: sz, height: sz, borderRadius: '50%',
    background: cfg.fabColor || '#1a56db',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 3px 10px rgba(0,0,0,0.25)', cursor: 'pointer'
  }, posMap[pos] || posMap['bottom-right']));

  const icon = document.createElement('i');
  icon.className = 'fa ' + (cfg.fabIcon || 'fa-comment');
  icon.style.cssText = 'color:#fff;font-size:16px';
  btn.appendChild(icon);
  container.appendChild(btn);
}

// ── Slide-in preview ────────────────────────────────────
function previewSlideIn(container, el, cfg) {
  const pos = cfg.slideInPosition || 'bottom-right';
  const w = Math.min(cfg.slideInWidth || 280, 240);
  const box = document.createElement('div');
  Object.assign(box.style, {
    position: 'absolute', zIndex: '10',
    width: w + 'px', padding: '14px',
    backgroundColor: el.backgroundColor || '#fff',
    color: el.textColor || '#1f2937',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    fontFamily: 'system-ui,sans-serif', fontSize: '11px',
    ...(pos === 'top-left'    ? { top: '12px',    left: '12px'  } :
        pos === 'top-right'   ? { top: '12px',    right: '12px' } :
        pos === 'bottom-left' ? { bottom: '12px', left: '12px'  } :
                                { bottom: '12px', right: '12px' })
  });

  if (el.content) {
    const div = document.createElement('div');
    div.innerHTML = el.content;
    div.style.fontSize = '11px';
    box.appendChild(div);
  } else {
    box.innerHTML = '<div style="height:10px;background:#e2e8f0;border-radius:3px;margin-bottom:6px"></div><div style="height:10px;background:#e2e8f0;border-radius:3px;width:70%"></div>';
  }

  if (cfg.showCloseButton !== false) {
    const x = document.createElement('span');
    x.textContent = '✕';
    x.style.cssText = 'position:absolute;top:8px;right:10px;cursor:pointer;opacity:0.5;font-size:12px';
    box.style.position = 'absolute';
    box.appendChild(x);
  }
  container.appendChild(box);
}

// ── Social Proof preview ─────────────────────────────────
function previewSocialProof(container, cfg) {
  const pos = cfg.proofPosition || 'bottom-left';
  const box = document.createElement('div');
  const text = (cfg.proofText || '{count} henkilöä katsoo nyt').replace('{count}', cfg.proofCount || '5');
  Object.assign(box.style, {
    position: 'absolute', zIndex: '10',
    padding: '8px 12px', borderRadius: '8px',
    background: cfg.backgroundColor || '#1f2937',
    color: cfg.textColor || '#ffffff',
    fontFamily: 'system-ui,sans-serif', fontSize: '11px',
    display: 'flex', alignItems: 'center', gap: '6px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    maxWidth: '200px',
    ...(pos === 'bottom-left' ? { bottom: '12px', left: '12px' } : { bottom: '12px', right: '12px' })
  });
  box.innerHTML = `<span style="font-size:16px">${cfg.proofIcon || '👥'}</span><span>${text}</span>`;
  container.appendChild(box);
}

// ── Scroll Progress preview ──────────────────────────────
function previewScrollProgress(container, cfg) {
  const isTop = (cfg.progressPosition || 'top') === 'top';
  const bar = document.createElement('div');
  Object.assign(bar.style, {
    position: 'absolute', left: '0', right: '0', zIndex: '10',
    top: isTop ? '0' : 'auto', bottom: isTop ? 'auto' : '0',
    height: (cfg.progressHeight || 4) + 'px',
    background: cfg.backgroundColor || '#e2e8f0'
  });
  const fill = document.createElement('div');
  Object.assign(fill.style, {
    height: '100%', width: '60%',
    background: cfg.progressColor || '#2563eb',
    borderRadius: '0 2px 2px 0',
    transition: 'width 0.3s'
  });
  bar.appendChild(fill);
  container.appendChild(bar);
}

// ── Lead Form preview ───────────────────────────────────
function previewLeadForm(container, el, cfg) {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'absolute', inset: '0', zIndex: '10',
    background: 'rgba(0,0,0,0.3)', display: 'flex',
    alignItems: 'center', justifyContent: 'center'
  });
  const box = document.createElement('div');
  Object.assign(box.style, {
    background: cfg.backgroundColor || '#fff',
    color: cfg.textColor || '#1f2937',
    borderRadius: '10px', padding: '16px', width: '80%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    fontFamily: 'system-ui,sans-serif', fontSize: '11px'
  });
  const fields = cfg.leadFields || [{ label: 'Nimi' }, { label: 'Sähköposti' }];
  const titleHtml = cfg.leadTitle
    ? `<div style="font-size:12px;font-weight:700;margin-bottom:${cfg.leadSubtitle ? '2px' : '10px'};line-height:1.3">${cfg.leadTitle}</div>`
    : '';
  const subtitleHtml = cfg.leadSubtitle
    ? `<div style="font-size:10px;opacity:0.6;margin-bottom:10px;line-height:1.4">${cfg.leadSubtitle}</div>`
    : '';
  box.innerHTML = titleHtml + subtitleHtml +
  fields.map(f =>
    `<div style="margin-bottom:8px">
      <div style="font-size:10px;margin-bottom:3px;opacity:0.7">${f.label || ''}</div>
      <div style="height:24px;background:rgba(0,0,0,0.08);border-radius:4px"></div>
    </div>`
  ).join('') +
  `<div style="margin-top:10px;background:#3b82f6;color:#fff;padding:6px 12px;border-radius:5px;text-align:center;font-size:10px;font-weight:600">
    ${cfg.leadSubmitText || 'Lähetä'}
  </div>`;
  overlay.appendChild(box);
  container.appendChild(overlay);
}

// ── Popup preview ────────────────────────────────────────
function previewPopup(container, el) {
  const isImagePopup = el.popupType === 'image' || (el.config && el.config.popupSubtype === 'image');
  const pos          = el.position || 'center';
  const isCenter     = pos === 'center';
  const elementW     = el.width || 400;
  const previewW     = container.offsetWidth || 300;
  // Kulmissa max 60% leveydestä jotta popup mahtuu kulmaan, muuten 82%
  const maxRatio = isCenter ? 0.82 : 0.60;
  const boxW = Math.min(Math.round(elementW * 0.55), Math.round(previewW * maxRatio));

  const box = document.createElement('div');
  Object.assign(box.style, {
    borderRadius: '10px', overflow: 'hidden',
    position: 'relative', width: boxW + 'px',
    boxShadow: isImagePopup ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.2)',
    fontFamily: 'system-ui,sans-serif', fontSize: '11px',
  });

  if (isImagePopup && el.imageUrl) {
    // Näytä oikea kuva – leveys hallitsee kokoa
    box.style.background = 'transparent';
    const img = document.createElement('img');
    img.src = el.imageUrl;
    img.alt = '';
    img.style.cssText = 'display:block;width:100%;height:auto;border-radius:10px';
    box.appendChild(img);
  } else if (el.content) {
    box.style.background    = el.backgroundColor || '#fff';
    box.style.color         = el.textColor || '#000';
    box.style.padding       = '14px';
    const div = document.createElement('div');
    div.innerHTML           = el.content;
    div.style.fontSize      = '10px';
    div.style.lineHeight    = '1.4';
    box.appendChild(div);
  } else {
    box.style.background = el.backgroundColor || '#fff';
    box.style.padding    = '14px';
    box.innerHTML = '<div style="height:10px;background:#e2e8f0;border-radius:3px;width:60%;margin-bottom:7px"></div><div style="height:7px;background:#e2e8f0;border-radius:3px;width:85%"></div>';
  }

  const x = document.createElement('span');
  x.textContent = '✕';
  x.style.cssText = `position:absolute;top:5px;right:7px;cursor:pointer;font-size:12px;
    ${isImagePopup
      ? 'color:#fff;background:rgba(0,0,0,0.5);border-radius:50%;padding:1px 4px;line-height:1.4'
      : 'opacity:0.4'}`;
  box.appendChild(x);

  if (isCenter) {
    // Keskitetty overlay (alkuperäinen käytös)
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'absolute', inset: '0', zIndex: '10',
      background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    });
    overlay.appendChild(box);
    container.appendChild(overlay);
  } else {
    // Näytetään popup oikeassa kulmassa ilman overlay-taustasuodinta
    const posMap = {
      'top-left':     { top: '10px',    left: '10px'  },
      'top-right':    { top: '10px',    right: '10px' },
      'bottom-left':  { bottom: '10px', left: '10px'  },
      'bottom-right': { bottom: '10px', right: '10px' },
    };
    box.style.position = 'absolute';
    box.style.zIndex   = '10';
    Object.assign(box.style, posMap[pos] || posMap['bottom-right']);
    container.appendChild(box);
  }
}

// ── Cookie Consent preview ──────────────────────────────────
function previewCookieConsent(container, el, cfg) {
  const bg = el.backgroundColor || '#1f2937';
  const txt = el.textColor || '#ffffff';
  const btnColor = cfg.allowBtnColor || '#22c55e';

  const bar = document.createElement('div');
  Object.assign(bar.style, {
    position: 'absolute', left: '0', right: '0', bottom: '0', zIndex: '10',
    backgroundColor: bg, color: txt,
    padding: '10px 12px',
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
    fontFamily: 'system-ui,sans-serif', fontSize: '11px',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.2)'
  });

  const span = document.createElement('span');
  span.style.flex = '1';
  span.textContent = cfg.bannerText || 'Käytämme evästeitä sivuston toiminnan parantamiseksi.';
  bar.appendChild(span);

  const deny = document.createElement('button');
  deny.textContent = cfg.denyBtnLabel || 'Hylkää';
  Object.assign(deny.style, {
    background: 'transparent', border: '1px solid ' + txt, color: txt,
    padding: '4px 8px', borderRadius: '5px', fontSize: '10px', cursor: 'default', fontWeight: '600'
  });
  bar.appendChild(deny);

  const allow = document.createElement('button');
  allow.textContent = cfg.allowBtnLabel || 'Hyväksy';
  Object.assign(allow.style, {
    background: btnColor, border: 'none', color: '#fff',
    padding: '4px 10px', borderRadius: '5px', fontSize: '10px', cursor: 'default', fontWeight: '700'
  });
  bar.appendChild(allow);

  // Sivuston runko
  const body = document.createElement('div');
  Object.assign(body.style, { padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' });
  for (let i = 0; i < 5; i++) {
    const line = document.createElement('div');
    Object.assign(line.style, {
      height: '8px', borderRadius: '4px', background: '#cbd5e1',
      width: i % 2 === 0 ? '85%' : '65%'
    });
    body.appendChild(line);
  }
  container.appendChild(body);
  container.appendChild(bar);
}
