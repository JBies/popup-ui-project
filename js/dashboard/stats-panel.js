// js/dashboard/stats-panel.js
import { showToast } from './dashboard-main.js';
import { t, getCurrentLanguage } from '../i18n.js';

const TYPE_LABELS = {
  sticky_bar: 'Sticky Bar', fab: 'Floating Button', slide_in: 'Slide-in',
  popup: 'Popup', social_proof: 'Social Proof', scroll_progress: 'Scroll Progress', lead_form: 'Lead Form'
};

function locale() {
  return getCurrentLanguage() === 'fi' ? 'fi-FI' : 'en-GB';
}

function getTimingStatus(el) {
  const now = new Date();
  const timing = el.timing || {};
  const start = timing.startDate && timing.startDate !== 'default' ? new Date(timing.startDate) : null;
  const end   = timing.endDate   && timing.endDate   !== 'default' ? new Date(timing.endDate)   : null;
  if (el.active === false) return { label: t('stats.status.inactive'), color: '#ef4444' };
  if (end   && now > end)   return { label: t('stats.status.ended'),   color: '#f59e0b' };
  if (start && now < start) return { label: `${t('stats.status.starts')} ${start.toLocaleDateString(locale())}`, color: '#64748b' };
  return { label: t('stats.status.active'), color: '#10b981' };
}

export function openStats(el) {
  const root = document.getElementById('modal-root');
  if (!root) return;

  root.innerHTML = buildStatsHTML(el);
  loadStats(el._id, el);
  renderStatusRow(el);

  const cfg = el.elementConfig || {};
  if (canUsePageTracking()) {
    const toggleBtn = root.querySelector('#s-pt-toggle');
    const ptDiv     = root.querySelector('#s-page-tracking');
    const arrow     = root.querySelector('#s-pt-arrow');
    let loaded = false;

    const openTracking = async () => {
      if (ptDiv) ptDiv.style.display = 'block';
      if (arrow) arrow.textContent = '▲';
      if (!loaded) {
        loaded = true;
        await loadPageTrackingStats(el._id, cfg, el);
      }
    };

    if (toggleBtn && ptDiv) {
      toggleBtn.addEventListener('click', async () => {
        const open = ptDiv.style.display !== 'none';
        if (open) {
          ptDiv.style.display = 'none';
          if (arrow) arrow.textContent = '▼';
        } else {
          await openTracking();
        }
      });
    }

    // Avaa automaattisesti jos seuranta on aktivoitu
    if (cfg.trackPageLinks || cfg.trackScroll) {
      openTracking();
    }
  }

  root.querySelectorAll('#close-stats').forEach(btn => btn.addEventListener('click', () => { root.innerHTML = ''; }));
  root.querySelector('#reset-stats')?.addEventListener('click', () => resetStats(el._id, el));
  root.querySelector('#stats-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'stats-overlay') root.innerHTML = '';
  });
}

function canUsePageTracking() {
  const u = window.__currentUser__;
  return u?.role === 'admin' || (u?.popupLimit || 1) > 1 || u?.limits?.canUsePageTracking;
}

function buildStatsHTML(el) {
  const cfg = el.elementConfig || {};
  const hasTracking = canUsePageTracking();

  return `
    <div class="modal-overlay" id="stats-overlay">
      <div class="modal" style="max-width:560px">
        <div class="modal-header">
          <h2><i class="fa fa-chart-bar" style="color:var(--primary);margin-right:8px"></i>${escHtml(el.name)}</h2>
          <button class="modal-close" id="close-stats">✕</button>
        </div>

        <div id="s-status" style="margin-bottom:14px"></div>
        <div id="stats-cards" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
          <div class="stat-card"><div class="stat-value" id="s-views">–</div><div class="stat-label">${t('stats.views')}</div></div>
          <div class="stat-card"><div class="stat-value" id="s-clicks">–</div><div class="stat-label">${t('stats.clicks')}</div></div>
          <div class="stat-card"><div class="stat-value" id="s-ctr">–</div><div class="stat-label">${t('stats.ctr')}</div></div>
        </div>
        <div style="font-size:12px;color:#94a3b8;margin-bottom:16px" id="s-dates"></div>

        ${hasTracking ? `
        <div style="margin-bottom:20px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
          <button id="s-pt-toggle" style="width:100%;display:flex;align-items:center;gap:8px;padding:12px 16px;background:#f8fafc;border:none;cursor:pointer;text-align:left">
            <span style="font-size:14px">📎</span>
            <span style="font-size:13px;font-weight:700;color:#0f172a;flex:1">${t('stats.pageTracking')}</span>
            <span id="s-pt-arrow" style="font-size:12px;color:#64748b">▼</span>
          </button>
          <div id="s-page-tracking" style="display:none;padding:12px 16px"></div>
        </div>` : ''}

        <div style="display:flex;justify-content:space-between;align-items:center">
          <button class="btn btn-danger btn-sm" id="reset-stats">
            <i class="fa fa-redo"></i> ${t('stats.resetBtn')}
          </button>
          <button class="btn btn-secondary" id="close-stats">${t('stats.closeBtn')}</button>
        </div>
      </div>
    </div>

    <style>
      .stat-card { background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center; }
      .stat-card .stat-value { font-size:24px;font-weight:700;color:#0f172a; }
      .stat-card .stat-label { font-size:11px;color:#64748b;margin-top:2px; }
    </style>`;
}

function renderStatusRow(el) {
  const sd = document.getElementById('s-status');
  if (!sd) return;
  const status = getTimingStatus(el);
  const typeLabel = TYPE_LABELS[el.elementType] || el.elementType || 'Popup';
  const timing = el.timing || {};
  const start = timing.startDate && timing.startDate !== 'default' ? new Date(timing.startDate) : null;
  const end   = timing.endDate   && timing.endDate   !== 'default' ? new Date(timing.endDate)   : null;
  let dateRange = '';
  if (start && end) dateRange = `${t('stats.valid')} ${start.toLocaleDateString(locale())}–${end.toLocaleDateString(locale())}`;
  else if (start)   dateRange = `${t('stats.startsOn')} ${start.toLocaleDateString(locale())}`;
  else if (end)     dateRange = `${t('stats.endsOn')} ${end.toLocaleDateString(locale())}`;
  sd.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;flex-wrap:wrap">
      <span style="color:${status.color};font-size:13px;font-weight:600">${status.label}</span>
      <span style="color:#94a3b8;font-size:12px">·</span>
      <span style="color:#64748b;font-size:12px">${typeLabel}</span>
      ${dateRange ? `<span style="color:#94a3b8;font-size:12px">·</span><span style="color:#64748b;font-size:12px">${dateRange}</span>` : ''}
    </div>`;
}

async function loadStats(id, el) {
  try {
    const r = await fetch('/api/popups/stats/' + id);
    if (!r.ok) return;
    const s = await r.json();
    const sv = document.getElementById('s-views');
    const sc = document.getElementById('s-clicks');
    const sctr = document.getElementById('s-ctr');
    const sd = document.getElementById('s-dates');
    if (sv) sv.textContent = s.views ?? 0;
    if (sc) sc.textContent = s.clicks ?? 0;
    if (sctr) sctr.textContent = (s.clickThroughRate ?? '0.00') + '%';
    if (sd) {
      const parts = [];
      if (s.leads > 0)     parts.push(`${t('stats.leads')} ${s.leads}`);
      if (s.lastViewed)    parts.push(`${t('stats.lastViewed')} ${new Date(s.lastViewed).toLocaleString(locale())}`);
      if (s.lastClicked)   parts.push(`${t('stats.lastClicked')} ${new Date(s.lastClicked).toLocaleString(locale())}`);
      if (s.statsResetAt)  parts.push(`${t('stats.resetAt')} ${new Date(s.statsResetAt).toLocaleString(locale())}`);
      sd.innerHTML = parts.map(p => `<span>${p}</span>`).join(' <span style="color:#e2e8f0">·</span> ');
    }
  } catch {}
}

async function resetStats(id, el) {
  if (!confirm(t('stats.resetConfirm'))) return;
  try {
    const r = await fetch('/api/popups/stats/' + id + '/reset', { method: 'POST' });
    if (!r.ok) throw new Error();
    showToast(t('stats.resetSuccess'));
    loadStats(id, el);
    window.dispatchEvent(new CustomEvent('refresh-elements'));
  } catch {
    showToast(t('stats.resetFailed'), 'error');
  }
}

// Näytä kaikki elementit (ilman targeting-sääntöjä)
function renderAllElementsView(allElements) {
  const uniquePages = [...new Set(allElements.map(el => el.pageUrl).filter(url => url && url.trim() !== ''))];

  let pageSelectorHtml = '';
  if (uniquePages.length > 1) {
    pageSelectorHtml = `
      <div style="margin-bottom:12px">
        <div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:4px">${t('stats.selectPage') || 'Select page:'}</div>
        <select id="page-url-selector" style="width:100%;padding:6px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;background:#fff">
          <option value="">${t('stats.allPages') || 'All pages'}</option>
          ${uniquePages.map(url => `<option value="${escHtml(url)}">${escHtml(url.length > 60 ? url.substring(0, 57) + '...' : url)}</option>`).join('')}
        </select>
      </div>
    `;
  }

  const rows = renderElementRows(allElements);

  let html = `<div style="margin-bottom:16px">
    <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px;display:flex;align-items:center;gap:6px">
      <i class="fa fa-mouse-pointer" style="color:#3b82f6"></i> ${t('stats.pageElementsTitle')} (${allElements.length})
    </div>
    ${pageSelectorHtml}
    <div id="page-elements-list" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;max-height:280px;overflow-y:auto">${rows}</div>
  </div>`;

  // Lisää tapahtumankäsittelijä sivun valinnalle
  if (uniquePages.length > 1) {
    setTimeout(() => {
      const selector = document.getElementById('page-url-selector');
      const elementsList = document.getElementById('page-elements-list');
      if (selector && elementsList) {
        selector.addEventListener('change', function() {
          const selectedUrl = this.value;
          const allRows = elementsList.querySelectorAll('[data-page-url]');
          allRows.forEach(row => {
            const rowUrl = row.getAttribute('data-page-url');
            if (!selectedUrl || rowUrl === selectedUrl) {
              row.style.display = 'flex';
            } else {
              row.style.display = 'none';
            }
          });
        });
      }
    }, 100);
  }

  return html;
}

// Näytä elementit tabs targeting-säännöille
function renderTargetingRuleTabs(popupId, urlRules, allElements) {
  if (urlRules.length === 0) return '';

  // Tabit säännöille
  const tabsHtml = urlRules.map((rule, idx) => `
    <button class="rule-tab" data-rule-idx="${idx}" style="padding:8px 12px;border:none;background:${idx === 0 ? '#3b82f6' : '#f1f5f9'};color:${idx === 0 ? '#fff' : '#64748b'};border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;margin-right:8px">
      ${escHtml(rule.value.length > 20 ? rule.value.substring(0, 17) + '...' : rule.value)}
    </button>
  `).join('');

  // Renderöi ensimmäisen säännön elementit
  const firstRuleElements = filterElementsByRule(allElements, urlRules[0]);
  const uniquePagesForRule = [...new Set(firstRuleElements.map(el => el.pageUrl).filter(url => url && url.trim() !== ''))];

  // Dropdown sivuille (esitäytettynä "filtered")
  let dropdownHtml = '';
  if (uniquePagesForRule.length > 1) {
    dropdownHtml = `
      <div style="margin-bottom:12px">
        <div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:4px">${t('stats.selectPage') || 'Select page:'}</div>
        <select id="page-url-selector" data-rule-idx="0" style="width:100%;padding:6px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;background:#fff">
          <option value="filtered" selected>${t('stats.filteredPages') || 'Filtered (targeted)'}</option>
          <option value="">${t('stats.allPages') || 'All pages'}</option>
          ${uniquePagesForRule.map(url => `<option value="${escHtml(url)}">${escHtml(url.length > 60 ? url.substring(0, 57) + '...' : url)}</option>`).join('')}
        </select>
      </div>
    `;
  }

  const rows = renderElementRows(firstRuleElements);

  let html = `<div style="margin-bottom:16px">
    <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px;display:flex;align-items:center;gap:6px">
      <i class="fa fa-mouse-pointer" style="color:#3b82f6"></i> ${t('stats.pageElementsTitle')} (${firstRuleElements.length})
    </div>
    <div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap">
      ${tabsHtml}
    </div>
    ${dropdownHtml}
    <div id="page-elements-list" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;max-height:280px;overflow-y:auto" data-rule-idx="0">${rows}</div>
  </div>`;

  // Lisää tapahtumankäsittelijät
  setTimeout(() => {
    // Tab-klikit
    document.querySelectorAll('.rule-tab').forEach(btn => {
      btn.addEventListener('click', function() {
        const ruleIdx = parseInt(this.getAttribute('data-rule-idx'));
        switchRuleTab(ruleIdx, urlRules, allElements);
      });
    });

    // Dropdown-muutokset
    const dropdown = document.getElementById('page-url-selector');
    if (dropdown) {
      dropdown.addEventListener('change', function() {
        const ruleIdx = parseInt(this.getAttribute('data-rule-idx'));
        const selectedValue = this.value;
        filterElementsByRuleAndPage(ruleIdx, selectedValue, urlRules, allElements);
      });
    }
  }, 100);

  return html;
}

// Suodata elementit targeting-säännön perusteella
function filterElementsByRule(elements, rule) {
  if (!rule.value) return elements;

  return elements.filter(el => {
    const url = el.pageUrl || '';
    switch (rule.operator || 'contains') {
      case 'contains':
        return url.includes(rule.value);
      case 'equals':
        return url === rule.value;
      case 'starts_with':
        return url.startsWith(rule.value);
      default:
        return url.includes(rule.value);
    }
  });
}

// Renderöi elementti-rivit
function renderElementRows(elements) {
  return elements.map(el => {
    const icon = el.type === 'link' ? 'fa-link' : 'fa-hand-pointer';
    const text = escHtml((el.text || el.cssSelector || '').slice(0, 60));
    const href = el.href ? `<div style="font-size:10px;color:#94a3b8;margin-top:1px">${escHtml(el.href.slice(0, 55))}</div>` : '';
    const pageUrlDisplay = el.pageUrl ? `<div style="font-size:9px;color:#9ca3af;margin-top:1px">${escHtml(el.pageUrl.length > 50 ? el.pageUrl.substring(0, 47) + '...' : el.pageUrl)}</div>` : '';
    return `<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid #f1f5f9" data-page-url="${escHtml(el.pageUrl || '')}">
      <i class="fa ${icon}" style="color:#64748b;width:12px;font-size:11px;flex-shrink:0"></i>
      <div style="flex:1;min-width:0"><div style="font-size:12px;color:#1e293b">${text}</div>${href}${pageUrlDisplay}</div>
      <span style="font-size:12px;font-weight:700;color:#3b82f6;white-space:nowrap">${el.clicks} ${t('stats.clicksShort')}</span>
    </div>`;
  }).join('');
}

// Vaihda tab targeting-säännölle
function switchRuleTab(ruleIdx, urlRules, allElements) {
  const rule = urlRules[ruleIdx];
  const ruleElements = filterElementsByRule(allElements, rule);
  const uniquePages = [...new Set(ruleElements.map(el => el.pageUrl).filter(url => url && url.trim() !== ''))];

  // Päivitä tab-näppäimet
  document.querySelectorAll('.rule-tab').forEach((btn, idx) => {
    if (idx === ruleIdx) {
      btn.style.background = '#3b82f6';
      btn.style.color = '#fff';
    } else {
      btn.style.background = '#f1f5f9';
      btn.style.color = '#64748b';
    }
  });

  // Päivitä dropdown
  let dropdownHtml = '';
  if (uniquePages.length > 1) {
    dropdownHtml = `
      <div style="margin-bottom:12px">
        <div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:4px">${t('stats.selectPage') || 'Select page:'}</div>
        <select id="page-url-selector" data-rule-idx="${ruleIdx}" style="width:100%;padding:6px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;background:#fff">
          <option value="filtered" selected>${t('stats.filteredPages') || 'Filtered (targeted)'}</option>
          <option value="">${t('stats.allPages') || 'All pages'}</option>
          ${uniquePages.map(url => `<option value="${escHtml(url)}">${escHtml(url.length > 60 ? url.substring(0, 57) + '...' : url)}</option>`).join('')}
        </select>
      </div>
    `;
  }

  const rows = renderElementRows(ruleElements);
  const elementsList = document.getElementById('page-elements-list');
  if (elementsList) {
    elementsList.parentElement.innerHTML = dropdownHtml +
      `<div id="page-elements-list" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;max-height:280px;overflow-y:auto" data-rule-idx="${ruleIdx}">${rows}</div>`;

    // Lisää dropdown-listener
    const dropdown = document.getElementById('page-url-selector');
    if (dropdown) {
      dropdown.addEventListener('change', function() {
        filterElementsByRuleAndPage(ruleIdx, this.value, urlRules, allElements);
      });
    }
  }
}

// Suodata elementit säännön ja sivun perusteella
function filterElementsByRuleAndPage(ruleIdx, selectedValue, urlRules, allElements) {
  const rule = urlRules[ruleIdx];
  const ruleElements = filterElementsByRule(allElements, rule);

  const elementsList = document.getElementById('page-elements-list');
  if (!elementsList) return;

  const allRows = elementsList.querySelectorAll('[data-page-url]');
  allRows.forEach(row => {
    const rowUrl = row.getAttribute('data-page-url');

    if (selectedValue === 'filtered') {
      // Näytä vain ne sivut jotka täsmäävät sääntöön
      if (filterElementsByRule([{pageUrl: rowUrl}], rule).length > 0) {
        row.style.display = 'flex';
      } else {
        row.style.display = 'none';
      }
    } else if (!selectedValue) {
      // All pages
      row.style.display = 'flex';
    } else {
      // Tarkka sivu
      if (rowUrl === selectedValue) {
        row.style.display = 'flex';
      } else {
        row.style.display = 'none';
      }
    }
  });
}

async function loadPageTrackingStats(popupId, cfg, el) {
  const container = document.getElementById('s-page-tracking');
  if (!container) return;

  let html = '';

  if (cfg.trackPageLinks) {
    try {
      const r = await fetch('/api/popups/page-elements/' + popupId);
      if (r.ok) {
        const allElements = await r.json();
        if (allElements.length) {
          html += renderAllElementsView(allElements);
        } else {
          html += `<div style="font-size:12px;color:#64748b;padding:6px 0;display:flex;align-items:center;gap:6px">
            <i class="fa fa-info-circle" style="color:#3b82f6"></i>
            Ei seurattuja elementtejä vielä. Skripti löytää linkit ja napit automaattisesti seuraavalla sivulatauksella.
          </div>`;
        }
      }
    } catch {}
  }

  if (cfg.trackScroll) {
    try {
      const r = await fetch('/api/popups/scroll/' + popupId);
      if (r.ok) {
        const data = await r.json();
        const summary = data.summary || {};
        if (summary.sessions > 0) {
          const b = data.buckets || {};
          const buckets = [
            { label: '0–10%',   val: b.d10  || 0 },
            { label: '10–25%',  val: b.d25  || 0 },
            { label: '25–50%',  val: b.d50  || 0 },
            { label: '50–75%',  val: b.d75  || 0 },
            { label: '75–90%',  val: b.d90  || 0 },
            { label: '90–100%', val: b.d100 || 0 }
          ];
          const max = Math.max(...buckets.map(bk => bk.val), 1);
          const bars = buckets.map(bk => {
            const pct = Math.round((bk.val / max) * 100);
            return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="width:50px;font-size:11px;color:#64748b;text-align:right">${bk.label}</span>
              <div style="flex:1;background:#f1f5f9;border-radius:3px;height:12px">
                <div style="width:${pct}%;background:#3b82f6;height:100%;border-radius:3px"></div>
              </div>
              <span style="width:36px;font-size:11px;color:#374151;font-weight:600">${bk.val}</span>
            </div>`;
          }).join('');
          html += `<div>
            <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px;display:flex;align-items:center;gap:6px">
              <i class="fa fa-arrows-alt-v" style="color:#3b82f6"></i> ${t('stats.scrollTitle')}
              <span style="font-weight:400;color:#94a3b8;margin-left:4px">${summary.sessions} ${t('stats.sessions')} ${summary.avgDepth}%</span>
            </div>
            ${bars}
          </div>`;
        } else {
          html += `<div style="font-size:12px;color:#64748b;padding:6px 0;display:flex;align-items:center;gap:6px">
            <i class="fa fa-arrows-alt-v" style="color:#3b82f6"></i>
            Ei vieritystietoja vielä. Scroll-data kertyy kun sivustolla vieraillaan.
          </div>`;
        }
      }
    } catch {}
  }

  if (html) {
    container.innerHTML = html;
  } else if (!cfg.trackPageLinks && !cfg.trackScroll) {
    container.innerHTML = `<div style="font-size:12px;color:#94a3b8;padding:4px 0">${t('stats.noTracking').replace('\n', '<br>')}</div>`;
  }
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
