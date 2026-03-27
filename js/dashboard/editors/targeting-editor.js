// editors/targeting-editor.js
const RULE_TYPES = [
  { value: 'url',             label: 'URL-osoite' },
  { value: 'device',          label: 'Laitetyyppi' },
  { value: 'referrer',        label: 'Tulolähde (referrer)' },
  { value: 'scroll_depth',    label: 'Scroll-syvyys (%)' },
  { value: 'time_on_site',    label: 'Aika sivulla (s)' },
  { value: 'new_vs_returning',label: 'Uusi / palaava kävijä' },
  { value: 'day_of_week',     label: 'Viikonpäivä' },
  { value: 'hour_of_day',     label: 'Kellonaika' },
];

const OPERATORS = {
  url:              [{ v:'contains', l:'sisältää' }, { v:'equals', l:'on täsmälleen' }, { v:'starts_with', l:'alkaa' }],
  device:           [{ v:'is', l:'on' }],
  referrer:         [{ v:'contains', l:'sisältää' }, { v:'equals', l:'on täsmälleen' }],
  scroll_depth:     [{ v:'greater_than', l:'yli (%)' }, { v:'less_than', l:'alle (%)' }],
  time_on_site:     [{ v:'greater_than', l:'yli (s)' }, { v:'less_than', l:'alle (s)' }],
  new_vs_returning: [{ v:'is', l:'on' }],
  day_of_week:      [{ v:'is', l:'on' }],
  hour_of_day:      [{ v:'greater_than', l:'jälkeen (0-23)' }, { v:'less_than', l:'ennen (0-23)' }],
};

const VALUE_HINTS = {
  url: 'esim. /tuotteet tai checkout',
  device: 'mobile / desktop / tablet',
  referrer: 'esim. facebook.com tai google',
  scroll_depth: 'esim. 50',
  time_on_site: 'esim. 30',
  new_vs_returning: 'new / returning',
  day_of_week: 'monday / tuesday / ... / sunday',
  hour_of_day: 'esim. 9 tai 17',
};

export function renderTargetingFields(container, targeting = {}) {
  const enabled = targeting.enabled || false;
  const matchType = targeting.matchType || 'all';
  const rules = targeting.rules || [];

  container.innerHTML = `
    <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
      <div style="background:#f8fafc;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0">
        <div style="font-size:13px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:8px">
          <i class="fa fa-crosshairs" style="color:var(--primary)"></i> Targeting
        </div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="targeting-enabled" ${enabled ? 'checked' : ''}>
          <span style="font-size:12px;color:#64748b">Aktiivinen</span>
        </label>
      </div>
      <div id="targeting-body" style="${enabled ? '' : 'display:none'};padding:16px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <span style="font-size:12px;color:#64748b">Näytä kun</span>
          <select id="targeting-match" style="padding:5px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px">
            <option value="all" ${matchType === 'all' ? 'selected':''}>kaikki ehdot täyttyvät (AND)</option>
            <option value="any" ${matchType === 'any' ? 'selected':''}>jokin ehto täyttyy (OR)</option>
          </select>
        </div>
        <div id="targeting-rules"></div>
        <button type="button" id="add-rule" class="btn btn-secondary btn-sm" style="margin-top:8px">
          <i class="fa fa-plus"></i> Lisää ehto
        </button>
      </div>
    </div>`;

  const body = container.querySelector('#targeting-body');
  const rulesContainer = container.querySelector('#targeting-rules');

  container.querySelector('#targeting-enabled').addEventListener('change', e => {
    body.style.display = e.target.checked ? '' : 'none';
  });

  // Lisää olemassa olevat säännöt
  rules.forEach(rule => addRuleRow(rulesContainer, rule));

  container.querySelector('#add-rule').addEventListener('click', () => {
    addRuleRow(rulesContainer, {});
  });
}

function addRuleRow(container, rule = {}) {
  const div = document.createElement('div');
  div.className = 'targeting-rule';
  div.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px';

  const typeOpts = RULE_TYPES.map(t =>
    `<option value="${t.value}" ${rule.type === t.value ? 'selected':''}>${t.label}</option>`
  ).join('');

  const currentType = rule.type || 'url';
  const ops = OPERATORS[currentType] || OPERATORS.url;
  const opOpts = ops.map(o =>
    `<option value="${o.v}" ${rule.operator === o.v ? 'selected':''}>${o.l}</option>`
  ).join('');

  div.innerHTML = `
    <select class="rule-type" style="padding:6px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;flex:1.2">
      ${typeOpts}
    </select>
    <select class="rule-operator" style="padding:6px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;flex:1">
      ${opOpts}
    </select>
    <input type="text" class="rule-value" value="${rule.value || ''}"
      placeholder="${VALUE_HINTS[currentType] || ''}"
      style="padding:6px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;flex:1.5">
    <button type="button" class="remove-rule" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:16px;padding:2px 4px">✕</button>`;

  div.querySelector('.rule-type').addEventListener('change', e => {
    const t = e.target.value;
    const opSel = div.querySelector('.rule-operator');
    const valIn = div.querySelector('.rule-value');
    const ops = OPERATORS[t] || OPERATORS.url;
    opSel.innerHTML = ops.map(o => `<option value="${o.v}">${o.l}</option>`).join('');
    valIn.placeholder = VALUE_HINTS[t] || '';
  });

  div.querySelector('.remove-rule').addEventListener('click', () => div.remove());
  container.appendChild(div);
}

export function getTargetingData(container) {
  const enabled = container.querySelector('#targeting-enabled')?.checked ?? false;
  const matchType = container.querySelector('#targeting-match')?.value || 'all';
  const rules = [...container.querySelectorAll('.targeting-rule')].map(row => ({
    type:     row.querySelector('.rule-type')?.value || 'url',
    operator: row.querySelector('.rule-operator')?.value || 'contains',
    value:    row.querySelector('.rule-value')?.value?.trim() || ''
  })).filter(r => r.value);

  return { enabled, matchType, rules };
}
