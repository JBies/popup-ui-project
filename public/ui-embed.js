// Pre-queue: jos ShowElement kutsutaan ennen scriptin latautumista (esim. defer), tallennetaan kutsut
if (!window.ShowElement) {
  window.ShowElement = function (id) { (window.ShowElement.__q = window.ShowElement.__q || []).push(id); };
  window.ShowElement.__isPreQueue__ = true;
}

(function () {
  'use strict';

  var API_BASE = 'https://popupmanager.net';
  window.__UE_API__ = API_BASE;

  // Jonossa olevat varhaiset kutsut
  var _earlyQueue = window.ShowElement && window.ShowElement.__isPreQueue__ ? (window.ShowElement.__q || []) : [];

  // ─── XSS-apufunktio ─────────────────────────────────────────────────────────
  // Palauttaa HTML-enkoodatun merkkijonon (estää XSS kun käytetään innerHTML:ssä)
  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // ─── Julkinen API ────────────────────────────────────────────────────────────

  window.ShowElement = function (elementId) {
    fetch(API_BASE + '/api/popups/embed/' + elementId)
      .then(function (r) { return r.json(); })
      .then(function (el) {
        if (!shouldShow(el)) return;
        if (!matchesTargeting(el)) return;
        // A/B test split
        if (el.abTest && el.abTest.enabled) {
          var stored = sessionStorage.getItem('ue_variant_' + elementId);
          var variant;
          if (stored) {
            variant = stored;
          } else {
            variant = (Math.random() * 100) < (el.abTest.traffic || 50) ? 'A' : 'B';
            sessionStorage.setItem('ue_variant_' + elementId, variant);
          }
          if (variant === 'B' && el.abTest.variantBConfig) {
            var bCfg = el.abTest.variantBConfig;
            if (bCfg.backgroundColor) el.backgroundColor = bCfg.backgroundColor;
            if (bCfg.textColor) el.textColor = bCfg.textColor;
            if (bCfg.title && el.elementConfig) el.elementConfig.barText = bCfg.title;
            if (bCfg.cta && el.elementConfig && el.elementConfig.ctaButtons && el.elementConfig.ctaButtons[0]) {
              el.elementConfig.ctaButtons[0].label = bCfg.cta;
            }
          }
        }
        trackView(elementId);
        var type = el.elementType || 'popup';
        if (type === 'stats_only')           return; // vain käyntilaskuri, ei renderöintiä
        else if (type === 'sticky_bar')      renderStickyBar(el);
        else if (type === 'fab')             renderFAB(el);
        else if (type === 'slide_in')        setupSlideIn(el);
        else if (type === 'social_proof')    setupSocialProof(el);
        else if (type === 'scroll_progress') renderScrollProgress(el);
        else if (type === 'lead_form')       renderLeadForm(el);
        else                                 renderLegacyPopup(el);
      })
      .catch(function (e) { console.warn('[ui-embed] Elementtiä ei löydy:', e); });
  };

  // Jos ShowElement kutsuttiin ennen scriptin latautumista, suorita jonossa olevat kutsut
  if (_earlyQueue.length) {
    _earlyQueue.forEach(function (id) { window.ShowElement(id); });
  }

  // ─── Site Token – automaattinen lataus ──────────────────────────────────────
  // Jos <script src="...ui-embed.js" data-site="TOKEN"> niin lataa kaikki aktiiviset elementit
  (function () {
    var script = document.currentScript ||
      (function () {
        var scripts = document.querySelectorAll('script[data-site]');
        return scripts[scripts.length - 1] || null;
      })();
    var token = script && script.getAttribute('data-site');
    if (!token) return;
    fetch(API_BASE + '/api/popups/site/' + token)
      .then(function (r) { return r.json(); })
      .then(function (els) {
        if (!Array.isArray(els)) return;
        els.forEach(function (el) { window.ShowElement(el._id); });
      })
      .catch(function () {});
  })();

  // ─── Näyttölogiikka ─────────────────────────────────────────────────────────

  function shouldShow(el) {
    if (el.active === false) return false;
    var now = new Date();
    var t = el.timing || {};
    if (t.startDate && t.startDate !== 'default' && new Date(t.startDate) > now) return false;
    if (t.endDate && t.endDate !== 'default' && new Date(t.endDate) < now) return false;
    var cfg = el.elementConfig || {};
    var dismissKey = 'ue_dismiss_' + el._id;
    if (sessionStorage.getItem(dismissKey)) return false;
    if (cfg.dismissCookieDays > 0) {
      var cookie = getCookie(dismissKey);
      if (cookie) return false;
    }
    return true;
  }

  function dismiss(elementId, cookieDays) {
    var key = 'ue_dismiss_' + elementId;
    sessionStorage.setItem(key, '1');
    if (cookieDays > 0) setCookie(key, '1', cookieDays);
  }

  // ─── Sticky Bar ─────────────────────────────────────────────────────────────

  function renderStickyBar(el) {
    var cfg = el.elementConfig || {};
    var delay = (el.timing && el.timing.delay) ? el.timing.delay * 1000 : 0;
    setTimeout(function () {
      var bar = document.createElement('div');
      bar.id = 'ue-sticky-' + el._id;
      var isTop = cfg.barPosition === 'top';
      Object.assign(bar.style, {
        position: 'fixed',
        left: '0', right: '0', zIndex: '999999',
        top: isTop ? '0' : 'auto',
        bottom: isTop ? 'auto' : '0',
        backgroundColor: el.backgroundColor || '#1a56db',
        color: el.textColor || '#ffffff',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        boxShadow: isTop ? '0 2px 8px rgba(0,0,0,0.2)' : '0 -2px 8px rgba(0,0,0,0.2)'
      });

      // Teksti
      if (cfg.barText) {
        var txt = document.createElement('span');
        txt.textContent = cfg.barText;
        txt.style.flex = '1';
        txt.style.textAlign = 'center';
        bar.appendChild(txt);
      }

      // CTA-napit
      var buttons = Array.isArray(cfg.ctaButtons) ? cfg.ctaButtons : [];
      buttons.slice(0, 3).forEach(function (btn) {
        if (!btn.label) return;
        var b = document.createElement('a');
        b.textContent = btn.label;
        b.href = btn.url || '#';
        if (btn.url) b.target = '_blank';
        Object.assign(b.style, {
          padding: '6px 14px', borderRadius: '6px', textDecoration: 'none',
          fontWeight: '600', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap'
        });
        if (btn.style === 'outline') {
          b.style.border = '2px solid ' + (el.textColor || '#fff');
          b.style.color = el.textColor || '#fff';
          b.style.background = 'transparent';
        } else {
          b.style.background = el.textColor || '#fff';
          b.style.color = el.backgroundColor || '#1a56db';
          b.style.border = 'none';
        }
        b.addEventListener('click', function () { trackClick(el._id); });
        bar.appendChild(b);
      });

      // Sulje-nappi
      if (cfg.showDismiss !== false) {
        var x = document.createElement('button');
        x.textContent = '✕';
        Object.assign(x.style, {
          background: 'none', border: 'none', color: el.textColor || '#fff',
          fontSize: '16px', cursor: 'pointer', padding: '0 4px', opacity: '0.7',
          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)'
        });
        x.addEventListener('click', function () {
          bar.remove();
          adjustBodyPadding(isTop ? 'top' : 'bottom', 0);
          dismiss(el._id, cfg.dismissCookieDays || 0);
        });
        bar.style.position = 'fixed';
        bar.appendChild(x);
      }

      document.body.appendChild(bar);
      var h = bar.offsetHeight;
      adjustBodyPadding(isTop ? 'top' : 'bottom', h);
    }, delay);
  }

  function adjustBodyPadding(side, px) {
    var prop = 'padding' + (side === 'top' ? 'Top' : 'Bottom');
    var cur = parseInt(document.body.style[prop]) || 0;
    document.body.style[prop] = (px > 0 ? px : Math.max(0, cur - px)) + 'px';
  }

  // ─── FAB ────────────────────────────────────────────────────────────────────

  function renderFAB(el) {
    var cfg = el.elementConfig || {};
    var delay = (el.timing && el.timing.delay) ? el.timing.delay * 1000 : 0;
    setTimeout(function () {
      var sizes = { sm: '44px', md: '56px', lg: '68px' };
      var sz = sizes[cfg.fabSize] || '56px';
      var pos = cfg.fabPosition || 'bottom-right';
      var posMap = {
        'bottom-right': { bottom: '24px', right: '24px' },
        'bottom-left':  { bottom: '24px', left: '24px' },
        'top-right':    { top: '24px', right: '24px' },
        'top-left':     { top: '24px', left: '24px' }
      };

      var btn = document.createElement('button');
      btn.id = 'ue-fab-' + el._id;
      Object.assign(btn.style, Object.assign({
        position: 'fixed', zIndex: '999998',
        width: sz, height: sz, borderRadius: '50%',
        background: cfg.fabColor || '#1a56db',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s'
      }, posMap[pos] || posMap['bottom-right']));

      var icon = document.createElement('i');
      icon.className = 'fa ' + (cfg.fabIcon || 'fa-comment');
      icon.style.color = '#fff';
      icon.style.fontSize = '22px';
      btn.appendChild(icon);

      // Pulse-animaatio
      if (cfg.pulseAnimation) {
        var style = document.createElement('style');
        style.textContent = '@keyframes ue-pulse{0%,100%{box-shadow:0 0 0 0 ' + (cfg.fabColor || '#1a56db') + '88}50%{box-shadow:0 0 0 12px transparent}}';
        document.head.appendChild(style);
        btn.style.animation = 'ue-pulse 2s infinite';
      }

      btn.addEventListener('mouseenter', function () { btn.style.transform = 'scale(1.1)'; });
      btn.addEventListener('mouseleave', function () { btn.style.transform = 'scale(1)'; });

      btn.addEventListener('click', function () {
        trackClick(el._id);
        if (cfg.fabAction === 'modal') {
          openModal(cfg.fabModalContent || '', el.backgroundColor, el.textColor);
        } else if (cfg.fabUrl) {
          window.open(cfg.fabUrl, '_blank');
        }
      });

      // Font Awesome lataus jos ei jo ladattu
      if (!document.querySelector('link[href*="font-awesome"]')) {
        var fa = document.createElement('link');
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
        document.head.appendChild(fa);
      }

      document.body.appendChild(btn);
    }, delay);
  }

  // ─── Slide-in ────────────────────────────────────────────────────────────────

  function setupSlideIn(el) {
    var cfg = el.elementConfig || {};
    var trigger = cfg.slideInTrigger || 'time';
    var value = cfg.slideInTriggerValue || 5;

    if (trigger === 'time') {
      setTimeout(function () { renderSlideIn(el); }, value * 1000);
    } else if (trigger === 'scroll') {
      var shown = false;
      window.addEventListener('scroll', function onScroll() {
        if (shown) return;
        var pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (pct >= value) { shown = true; renderSlideIn(el); window.removeEventListener('scroll', onScroll); }
      });
    } else if (trigger === 'exit_intent') {
      var isTouch = !window.matchMedia('(hover: hover)').matches;
      if (isTouch) {
        setTimeout(function () { renderSlideIn(el); }, 15000);
      } else {
        var fired = false;
        document.addEventListener('mouseleave', function (e) {
          if (!fired && e.clientY <= 0) { fired = true; renderSlideIn(el); }
        });
      }
    }
  }

  function renderSlideIn(el) {
    var cfg = el.elementConfig || {};
    var pos = cfg.slideInPosition || 'bottom-right';
    var w = cfg.slideInWidth || 320;
    var box = document.createElement('div');
    box.id = 'ue-slidein-' + el._id;
    var isTop = pos === 'top-left' || pos === 'top-right';
    var posStyle = pos === 'top-left'    ? { top: '24px',    left: '24px'  }
                 : pos === 'top-right'   ? { top: '24px',    right: '24px' }
                 : pos === 'bottom-left' ? { bottom: '24px', left: '24px'  }
                 :                         { bottom: '24px', right: '24px' };
    var hideTransform = isTop ? 'translateY(-120%)' : 'translateY(120%)';
    Object.assign(box.style, Object.assign({
      position: 'fixed', zIndex: '999997',
      width: w + 'px', padding: '20px',
      backgroundColor: el.backgroundColor || '#fff',
      color: el.textColor || '#1f2937',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      fontFamily: 'system-ui, sans-serif',
      transform: hideTransform,
      transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)'
    }, posStyle));

    if (el.content) box.innerHTML = el.content;

    if (cfg.showCloseButton !== false) {
      var x = document.createElement('button');
      x.textContent = '✕';
      Object.assign(x.style, {
        position: 'absolute', top: '10px', right: '12px',
        background: 'none', border: 'none', fontSize: '16px',
        cursor: 'pointer', opacity: '0.5', color: el.textColor || '#1f2937'
      });
      x.addEventListener('click', function () {
        box.style.transform = hideTransform;
        setTimeout(function () { box.remove(); }, 400);
        dismiss(el._id, 0);
      });
      box.style.position = 'relative';
      box.appendChild(x);
    }

    document.body.appendChild(box);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { box.style.transform = 'translateY(0)'; });
    });
    trackView(el._id);
  }

  // ─── Legacy popup (vanha popup-embed.js -logiikka) ──────────────────────────

  function renderLegacyPopup(el) {
    var delay = (el.timing && el.timing.delay) ? el.timing.delay * 1000 : 0;
    setTimeout(function () {
      var overlay = document.createElement('div');
      Object.assign(overlay.style, {
        position: 'fixed', inset: '0', zIndex: '999996',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)'
      });
      var box = document.createElement('div');
      var isImagePopup = el.popupType === 'image' || (el.config && el.config.popupSubtype === 'image');
      Object.assign(box.style, {
        position: 'relative', borderRadius: '12px',
        maxWidth: '90vw', width: (el.width || 400) + 'px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)', fontFamily: 'system-ui, sans-serif',
        overflow: 'hidden'
      });

      if (isImagePopup && el.imageUrl) {
        // Kuvapopup: <img> tag täyttää leveyden, korkeus skaalautuu automaattisesti
        box.style.padding = '0';
        box.style.background = 'transparent';
        var imgEl = document.createElement('img');
        imgEl.src = el.imageUrl;
        imgEl.alt = '';
        imgEl.style.cssText = 'display:block;width:100%;height:auto;border-radius:12px';
        if (el.linkUrl && el.linkUrl.trim()) {
          var linkWrap = document.createElement('a');
          linkWrap.href = el.linkUrl; linkWrap.target = '_blank'; linkWrap.rel = 'noopener';
          linkWrap.style.display = 'block';
          linkWrap.appendChild(imgEl);
          box.appendChild(linkWrap);
        } else {
          box.appendChild(imgEl);
        }
      } else {
        // Tekstipopup
        box.style.backgroundColor = el.backgroundColor || '#fff';
        box.style.color = el.textColor || '#000';
        box.style.padding = '24px';
        if (el.content) box.innerHTML = el.content;
      }

      var x = document.createElement('button');
      x.textContent = '✕';
      Object.assign(x.style, {
        position: 'absolute', top: '10px', right: '12px',
        background: isImagePopup ? 'rgba(0,0,0,0.5)' : 'none',
        color: isImagePopup ? '#fff' : 'inherit',
        border: 'none', fontSize: '18px', cursor: 'pointer', borderRadius: '50%',
        lineHeight: '1', padding: isImagePopup ? '2px 6px' : '0'
      });
      x.addEventListener('click', function () { overlay.remove(); });
      box.appendChild(x);
      overlay.appendChild(box);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
      document.body.appendChild(overlay);
    }, delay);
  }

  // ─── Targeting ───────────────────────────────────────────────────────────────

  function matchesTargeting(el) {
    var t = el.targeting;
    if (!t || !t.enabled || !t.rules || t.rules.length === 0) return true;
    var results = t.rules.map(function (rule) { return evalRule(rule); });
    return t.matchType === 'any' ? results.some(Boolean) : results.every(Boolean);
  }

  function evalRule(rule) {
    var val = (rule.value || '').toLowerCase();
    var op = rule.operator;
    switch (rule.type) {
      case 'url':
        var url      = window.location.href.toLowerCase();
        var pathname = window.location.pathname.toLowerCase();
        // Jos arvo alkaa / (polku), käytetään pathnamea – muuten koko URL:ia
        var urlTarget = val.startsWith('/') ? pathname : url;
        if (op === 'contains')    return urlTarget.indexOf(val) !== -1;
        if (op === 'equals')      return urlTarget === val;
        if (op === 'starts_with') return urlTarget.indexOf(val) === 0;
        return false;
      case 'device':
        var ua = navigator.userAgent.toLowerCase();
        var isMobile = /mobi|android|iphone|ipad/.test(ua);
        var isTablet = /ipad|tablet/.test(ua);
        if (val === 'mobile') return isMobile && !isTablet;
        if (val === 'tablet') return isTablet;
        if (val === 'desktop') return !isMobile;
        return false;
      case 'referrer':
        var ref = document.referrer.toLowerCase();
        if (op === 'contains') return ref.indexOf(val) !== -1;
        if (op === 'equals') return ref === val;
        return false;
      case 'scroll_depth':
        var pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight || 1)) * 100;
        if (op === 'greater_than') return pct > parseFloat(val);
        if (op === 'less_than') return pct < parseFloat(val);
        return false;
      case 'new_vs_returning':
        var isReturning = !!localStorage.getItem('ue_visited');
        localStorage.setItem('ue_visited', '1');
        if (val === 'new') return !isReturning;
        if (val === 'returning') return isReturning;
        return false;
      case 'day_of_week':
        var days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        return days[new Date().getDay()] === val;
      case 'hour_of_day':
        var hour = new Date().getHours();
        if (op === 'greater_than') return hour > parseInt(val);
        if (op === 'less_than') return hour < parseInt(val);
        return false;
      default: return true;
    }
  }

  // ─── Social Proof ────────────────────────────────────────────────────────────

  function setupSocialProof(el) {
    var cfg = el.elementConfig || {};
    var duration = (cfg.proofDuration || 5) * 1000;
    var interval = (cfg.proofInterval || 8) * 1000;
    var delay = (el.timing && el.timing.delay) ? el.timing.delay * 1000 : 0;

    function showNotif() {
      var count = cfg.proofCount > 0 ? cfg.proofCount : Math.floor(Math.random() * 15) + 2;
      var text = (cfg.proofText || '{count} henkilöä katsoo nyt').replace('{count}', count);
      var pos = cfg.proofPosition || 'bottom-left';
      var notif = document.createElement('div');
      notif.id = 'ue-proof-' + el._id;
      var posStyle = pos === 'bottom-right' ? { bottom: '24px', right: '24px' } : { bottom: '24px', left: '24px' };
      Object.assign(notif.style, Object.assign({
        position: 'fixed', zIndex: '999995',
        padding: '10px 16px', borderRadius: '10px',
        background: cfg.backgroundColor || '#1f2937',
        color: cfg.textColor || '#fff',
        fontFamily: 'system-ui, sans-serif', fontSize: '14px',
        display: 'flex', alignItems: 'center', gap: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        opacity: '0', transform: 'translateY(10px)',
        transition: 'opacity 0.3s, transform 0.3s'
      }, posStyle));
      notif.innerHTML = '<span style="font-size:20px">' + escHtml(cfg.proofIcon || '👥') + '</span><span>' + escHtml(text) + '</span>';
      document.body.appendChild(notif);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { notif.style.opacity = '1'; notif.style.transform = 'translateY(0)'; });
      });
      setTimeout(function () {
        notif.style.opacity = '0'; notif.style.transform = 'translateY(10px)';
        setTimeout(function () { notif.remove(); }, 300);
      }, duration);
      trackView(el._id);
    }

    setTimeout(function () {
      showNotif();
      setInterval(showNotif, interval + duration);
    }, delay);
  }

  // ─── Scroll Progress ─────────────────────────────────────────────────────────

  function renderScrollProgress(el) {
    var cfg = el.elementConfig || {};
    var isTop = (cfg.progressPosition || 'top') === 'top';
    var bar = document.createElement('div');
    bar.id = 'ue-progress-' + el._id;
    Object.assign(bar.style, {
      position: 'fixed', left: '0', right: '0', zIndex: '999994',
      top: isTop ? '0' : 'auto', bottom: isTop ? 'auto' : '0',
      height: (cfg.progressHeight || 4) + 'px',
      background: cfg.backgroundColor || '#e2e8f0',
      pointerEvents: 'none'
    });
    var fill = document.createElement('div');
    Object.assign(fill.style, {
      height: '100%', width: '0%',
      background: cfg.progressColor || '#2563eb',
      transition: 'width 0.1s linear'
    });
    bar.appendChild(fill);
    document.body.appendChild(bar);
    window.addEventListener('scroll', function () {
      var pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight || 1)) * 100;
      fill.style.width = Math.min(100, pct) + '%';
    });
  }

  // ─── Lead Form ──────────────────────────────────────────────────────────────

  function renderLeadForm(el) {
    var cfg = el.elementConfig || {};
    var delay = (el.timing && el.timing.delay) ? el.timing.delay * 1000 : 0;
    setTimeout(function () {
      var overlay = document.createElement('div');
      Object.assign(overlay.style, {
        position: 'fixed', inset: '0', zIndex: '999996',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)'
      });
      var box = document.createElement('div');
      Object.assign(box.style, {
        position: 'relative',
        background: cfg.backgroundColor || el.backgroundColor || '#fff',
        color: cfg.textColor || el.textColor || '#1f2937',
        borderRadius: '14px', padding: '28px',
        maxWidth: '90vw', width: '400px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        fontFamily: 'system-ui, sans-serif'
      });

      var fields = Array.isArray(cfg.leadFields) ? cfg.leadFields : [
        { type: 'text',  label: 'Nimi',      required: true },
        { type: 'email', label: 'Sähköposti', required: true }
      ];

      var fieldsHtml = fields.filter(function (f) { return f.label; }).map(function (f) {
        var safeLabel = escHtml(f.label);
        var safeType  = escHtml(f.type === 'textarea' ? 'textarea' : f.type);
        if (f.type === 'textarea') {
          return '<div style="margin-bottom:12px"><label style="font-size:12px;font-weight:500;display:block;margin-bottom:4px">' +
            safeLabel + (f.required ? ' *' : '') + '</label>' +
            '<textarea data-field="' + safeLabel + '" rows="3" style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;font-family:inherit;box-sizing:border-box;resize:vertical"></textarea></div>';
        }
        return '<div style="margin-bottom:12px"><label style="font-size:12px;font-weight:500;display:block;margin-bottom:4px">' +
          safeLabel + (f.required ? ' *' : '') + '</label>' +
          '<input type="' + safeType + '" data-field="' + safeLabel + '" data-required="' + (f.required ? '1' : '') + '" ' +
          'style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box"></div>';
      }).join('');

      box.innerHTML = fieldsHtml +
        '<button id="ue-lead-submit" style="width:100%;padding:11px;background:#3b82f6;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-top:4px">' +
        escHtml(cfg.leadSubmitText || 'Lähetä') + '</button>' +
        '<div id="ue-lead-success" style="display:none;text-align:center;padding:12px;color:#16a34a;font-weight:500">' +
        escHtml(cfg.leadSuccessMsg || 'Kiitos!') + '</div>';

      var closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      Object.assign(closeBtn.style, {
        position: 'absolute', top: '12px', right: '14px',
        background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', opacity: '0.5'
      });
      closeBtn.addEventListener('click', function () { overlay.remove(); });
      box.appendChild(closeBtn);

      box.querySelector('#ue-lead-submit').addEventListener('click', function () {
        var data = {};
        var valid = true;
        box.querySelectorAll('[data-field]').forEach(function (inp) {
          var val = inp.value ? inp.value.trim() : '';
          if (inp.dataset.required === '1' && !val) { inp.style.borderColor = '#ef4444'; valid = false; }
          else { inp.style.borderColor = '#e2e8f0'; }
          data[inp.dataset.field] = val;
        });
        if (!valid) return;
        fetch(window.__UE_API__ + '/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ popupId: el._id, data: data, variant: sessionStorage.getItem('ue_variant_' + el._id) || 'A' })
        }).catch(function () {});
        box.querySelector('#ue-lead-submit').style.display = 'none';
        box.querySelector('#ue-lead-success').style.display = 'block';
        trackClick(el._id);
        setTimeout(function () { overlay.remove(); }, 2500);
      });

      overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
      overlay.appendChild(box);
      document.body.appendChild(overlay);
    }, delay);
  }

  // ─── Modal ──────────────────────────────────────────────────────────────────

  function openModal(html, bg, color) {
    var overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '9999999',
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    });
    var box = document.createElement('div');
    Object.assign(box.style, {
      background: bg || '#fff', color: color || '#111',
      borderRadius: '12px', padding: '28px', maxWidth: '440px',
      width: '90vw', position: 'relative', fontFamily: 'system-ui, sans-serif'
    });
    box.innerHTML = html;
    var x = document.createElement('button');
    x.textContent = '✕';
    Object.assign(x.style, { position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' });
    x.addEventListener('click', function () { overlay.remove(); });
    box.appendChild(x);
    overlay.appendChild(box);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  // ─── Tilastot ────────────────────────────────────────────────────────────────

  function trackView(id) {
    fetch(API_BASE + '/api/popups/view/' + id, { method: 'POST' }).catch(function () {});
  }

  function trackClick(id) {
    fetch(API_BASE + '/api/popups/click/' + id, { method: 'POST' }).catch(function () {});
  }

  // ─── Apufunktiot ─────────────────────────────────────────────────────────────

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 864e5);
    document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/';
  }

  function getCookie(name) {
    var v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return v ? v.pop() : '';
  }

})();
