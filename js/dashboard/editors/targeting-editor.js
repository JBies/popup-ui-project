// editors/targeting-editor.js

// Pikavalinnat – yleisimmät skenaariot yhdellä klikkauksella
const PRESETS = [
  { label: '📱 Vain mobiili',     rule: { type: 'device',          operator: 'is',           value: 'mobile' } },
  { label: '🖥️ Vain desktop',    rule: { type: 'device',          operator: 'is',           value: 'desktop' } },
  { label: '🔁 Palaavat kävijät', rule: { type: 'new_vs_returning',operator: 'is',           value: 'returning' } },
  { label: '🆕 Uudet kävijät',    rule: { type: 'new_vs_returning',operator: 'is',           value: 'new' } },
  { label: '📜 50% scrollattu',   rule: { type: 'scroll_depth',    operator: 'greater_than', value: '50' } },
  { label: '⏱️ 30s sivulla',     rule: { type: 'time_on_site',    operator: 'greater_than', value: '30' } },
];

const RULE_TYPES = [
  { value: 'url',              label: 'URL sisältää' },
  { value: 'device',           label: 'Laite on' },
  { value: 'referrer',         label: 'Tulolähde sisältää' },
  { value: 'scroll_depth',     label: 'Scrollattu (%)' },
  { value: 'time_on_site',     label: 'Aika sivulla (s)' },
  { value: 'new_vs_returning', label: 'Kävijätyyppi on' },
  { value: 'day_of_week',      label: 'Viikonpäivä on' },
  { value: 'hour_of_day',      label: 'Kellonaika (0–23)' },
];

// Operaattorit per tyyppi
const OPS = {
  url:              [{ v:'contains', l:'sisältää' }, { v:'equals', l:'on täsmälleen' }, { v:'starts_with', l:'alkaa tekstillä' }],
  device:           [{ v:'is', l:'on' }],
  referrer:         [{ v:'contains', l:'sisältää' }, { v:'equals', l:'on täsmälleen' }],
  scroll_depth:     [{ v:'greater_than', l:'yli (%)' }, { v:'less_than', l:'alle (%)' }],
  time_on_site:     [{ v:'greater_than', l:'yli (s)' }, { v:'less_than', l:'alle (s)' }],
  new_vs_returning: [{ v:'is', l:'on' }],
  day_of_week:      [{ v:'is', l:'on' }],
  hour_of_day:      [{ v:'greater_than', l:'jälkeen' }, { v:'less_than', l:'ennen' }],
};

// Dropdown-arvot tyypeille jotka käyttävät valintalistan
const DROPDOWN_VALUES = {
  device:           [{ v:'mobile', l:'📱 Mobiili' }, { v:'desktop', l:'🖥️ Desktop' }, { v:'tablet', l:'📋 Tabletti' }],
  new_vs_returning: [{ v:'new', l:'🆕 Uusi kävijä' }, { v:'returning', l:'🔁 Palaava kävijä' }],
  day_of_week:      [
    { v:'monday', l:'Maanantai' }, { v:'tuesday', l:'Tiistai' }, { v:'wednesday', l:'Keskiviikko' },
    { v:'thursday', l:'Torstai' }, { v:'friday', l:'Perjantai' }, { v:'saturday', l:'Lauantai' }, { v:'sunday', l:'Sunnuntai' },
  ],
};

// Ohjetekstit
const HINTS = {
  url:          'esim. /tuotteet tai checkout',
  referrer:     'esim. facebook.com tai google',
  scroll_depth: 'esim. 50  (prosentti)',
  time_on_site: 'esim. 30  (sekuntia)',
  hour_of_day:  'esim. 9 tai 17  (0–23)',
};

export function renderTargetingFields(container, targeting = {}) {
  const enabled   = targeting.enabled   || false;
  const matchType = targeting.matchType || 'all';
  const rules     = targeting.rules     || [];

  container.innerHTML = `
    <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">

      <!-- Otsikkorivi -->
      <div style="background:#f8fafc;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0">
        <div style="font-size:13px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:8px">
          <i class="fa fa-crosshairs" style="color:var(--primary)"></i> Kohdennus
          <span style="font-size:11px;font-weight:400;color:#94a3b8">– kenelle elementti näytetään?</span>
        </div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="targeting-enabled" ${enabled ? 'checked' : ''}>
          <span style="font-size:12px;color:#64748b">Aktiivinen</span>
        </label>
      </div>

      <div id="targeting-body" style="${enabled ? '' : 'display:none'};padding:16px">

        <!-- Pikavalinnat -->
        <div style="margin-bottom:14px">
          <div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">Lisää nopeasti</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${PRESETS.map((p, i) => `
              <button type="button" class="targeting-preset" data-idx="${i}"
                style="padding:5px 10px;border-radius:6px;border:1px solid #e2e8f0;background:#fff;font-size:12px;cursor:pointer;transition:all 0.15s">
                ${p.label}
              </button>`).join('')}
          </div>
        </div>

        <!-- Logiikka -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:8px 12px;background:#f8fafc;border-radius:7px">
          <span style="font-size:12px;color:#64748b;white-space:nowrap">Näytä kun</span>
          <select id="targeting-match" style="padding:5px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px">
            <option value="all" ${matchType === 'all' ? 'selected':''}>kaikki ehdot täyttyvät</option>
            <option value="any" ${matchType === 'any' ? 'selected':''}>jokin ehto täyttyy</option>
          </select>
        </div>

        <!-- Säännöt -->
        <div id="targeting-rules"></div>
        <button type="button" id="add-rule" class="btn btn-secondary btn-sm" style="margin-top:6px">
          <i class="fa fa-plus"></i> Lisää ehto
        </button>

        <!-- Ohjeteksti -->
        <div style="margin-top:10px;font-size:11px;color:#94a3b8;line-height:1.5">
          Tyhjä = näytetään kaikille. Useampi ehto = kaikki täyttyvät (voit vaihtaa "jokin täyttyy" yläpuolelta).
        </div>
      </div>
    </div>`;

  const rulesContainer = container.querySelector('#targeting-rules');

  // Toggle
  container.querySelector('#targeting-enabled').addEventListener('change', e => {
    container.querySelector('#targeting-body').style.display = e.target.checked ? '' : 'none';
  });

  // Lataa olemassa olevat säännöt
  rules.forEach(rule => addRuleRow(rulesContainer, rule));

  // Lisää ehto
  container.querySelector('#add-rule').addEventListener('click', () => addRuleRow(rulesContainer, {}));

  // Pikavalinnat
  container.querySelectorAll('.targeting-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const rule = PRESETS[parseInt(btn.dataset.idx)].rule;
      // Älä lisää duplikaatteja
      const existing = [...rulesContainer.querySelectorAll('.targeting-rule')].some(row => {
        const t = row.querySelector('.rule-type')?.value;
        const v = row.querySelector('.rule-value-input,.rule-value-select')?.value;
        return t === rule.type && v === rule.value;
      });
      if (!existing) addRuleRow(rulesContainer, rule);
      // Aktivoi targeting jos ei ollut
      const cb = container.querySelector('#targeting-enabled');
      if (!cb.checked) { cb.checked = true; container.querySelector('#targeting-body').style.display = ''; }
    });
  });
}

function addRuleRow(container, rule = {}) {
  const div = document.createElement('div');
  div.className = 'targeting-rule';
  div.style.cssText = 'display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap';

  const currentType = rule.type || 'url';
  const ops         = OPS[currentType] || OPS.url;
  const isDropdown  = !!DROPDOWN_VALUES[currentType];

  div.innerHTML = `
    <select class="rule-type" style="padding:6px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;min-width:140px">
      ${RULE_TYPES.map(t => `<option value="${t.value}" ${rule.type === t.value ? 'selected':''}>${t.label}</option>`).join('')}
    </select>
    <select class="rule-operator" style="padding:6px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;min-width:80px">
      ${ops.map(o => `<option value="${o.v}" ${rule.operator === o.v ? 'selected':''}>${o.l}</option>`).join('')}
    </select>
    ${isDropdown
      ? `<select class="rule-value-select" style="padding:6px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;flex:1">
           ${(DROPDOWN_VALUES[currentType] || []).map(dv => `<option value="${dv.v}" ${rule.value === dv.v ? 'selected':''}>${dv.l}</option>`).join('')}
         </select>`
      : `<input type="text" class="rule-value-input" value="${rule.value || ''}"
           placeholder="${HINTS[currentType] || ''}"
           style="padding:6px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;flex:1;min-width:80px">`
    }
    <button type="button" class="remove-rule"
      style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:16px;padding:2px 4px;flex-shrink:0">✕</button>`;

  // Tyypinvaihto → päivitä operaattorit ja arvokomponentti
  div.querySelector('.rule-type').addEventListener('change', e => {
    const t          = e.target.value;
    const opSel      = div.querySelector('.rule-operator');
    const newOps     = OPS[t] || OPS.url;
    opSel.innerHTML  = newOps.map(o => `<option value="${o.v}">${o.l}</option>`).join('');

    // Vaihda text↔select jos tarpeen
    const oldText   = div.querySelector('.rule-value-input');
    const oldSelect = div.querySelector('.rule-value-select');
    const wantDrop  = !!DROPDOWN_VALUES[t];

    if (wantDrop && oldText) {
      const sel = document.createElement('select');
      sel.className = 'rule-value-select';
      sel.style.cssText = 'padding:6px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;flex:1';
      sel.innerHTML = (DROPDOWN_VALUES[t] || []).map(dv => `<option value="${dv.v}">${dv.l}</option>`).join('');
      oldText.replaceWith(sel);
    } else if (!wantDrop && oldSelect) {
      const inp = document.createElement('input');
      inp.type = 'text'; inp.className = 'rule-value-input';
      inp.placeholder = HINTS[t] || '';
      inp.style.cssText = 'padding:6px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;flex:1;min-width:80px';
      oldSelect.replaceWith(inp);
    } else if (!wantDrop && oldText) {
      oldText.placeholder = HINTS[t] || '';
    }
  });

  div.querySelector('.remove-rule').addEventListener('click', () => div.remove());
  container.appendChild(div);
}

export function getTargetingData(container) {
  const enabled   = container.querySelector('#targeting-enabled')?.checked ?? false;
  const matchType = container.querySelector('#targeting-match')?.value      || 'all';
  const rules     = [...container.querySelectorAll('.targeting-rule')].map(row => {
    const valEl = row.querySelector('.rule-value-input') || row.querySelector('.rule-value-select');
    return {
      type:     row.querySelector('.rule-type')?.value     || 'url',
      operator: row.querySelector('.rule-operator')?.value || 'contains',
      value:    valEl?.value?.trim()                       || '',
    };
  }).filter(r => r.value);
  return { enabled, matchType, rules };
}
