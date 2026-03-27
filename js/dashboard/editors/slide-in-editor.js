// editors/slide-in-editor.js
export function renderSlideInFields(container, cfg = {}, el = {}) {
  container.innerHTML = `
    <div class="section-title">Slide-in-asetukset</div>
    <div class="form-row">
      <div class="form-group">
        <label>Sijainti</label>
        <select name="slideInPosition">
          <option value="bottom-right" ${cfg.slideInPosition !== 'bottom-left' ? 'selected':''}>Oik. alanurkka</option>
          <option value="bottom-left"  ${cfg.slideInPosition === 'bottom-left' ? 'selected':''}>Vas. alanurkka</option>
        </select>
      </div>
      <div class="form-group">
        <label>Leveys (px)</label>
        <input type="number" name="slideInWidth" min="200" max="500" value="${cfg.slideInWidth || 320}">
      </div>
    </div>

    <div class="section-title">Trigger – milloin ilmestyy</div>
    <div class="form-group">
      <label>Triggerin tyyppi</label>
      <select name="slideInTrigger" id="slideInTrigger">
        <option value="time"        ${cfg.slideInTrigger === 'time'        || !cfg.slideInTrigger ? 'selected':''}>Aikaviive (sekuntia)</option>
        <option value="scroll"      ${cfg.slideInTrigger === 'scroll'      ? 'selected':''}>Scroll-prosentti (%)</option>
        <option value="exit_intent" ${cfg.slideInTrigger === 'exit_intent' ? 'selected':''}>Exit intent</option>
      </select>
    </div>
    <div class="form-group" id="trigger-value-group" style="${cfg.slideInTrigger === 'exit_intent' ? 'display:none':''}">
      <label id="trigger-value-label">${cfg.slideInTrigger === 'scroll' ? 'Scrollin jälkeen (%)' : 'Viive (sekuntia)'}</label>
      <input type="number" name="slideInTriggerValue" min="0" max="100" value="${cfg.slideInTriggerValue ?? 5}">
    </div>

    <div class="section-title">Sisältö</div>
    <div class="form-group">
      <label>Sisältö (HTML)</label>
      <textarea name="slideContent" rows="4" placeholder="<h3>Otsikko</h3><p>Teksti...</p>">${el.content || ''}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Taustaväri</label>
        <input type="color" name="backgroundColor" value="${el.backgroundColor || '#ffffff'}">
      </div>
      <div class="form-group">
        <label>Tekstiväri</label>
        <input type="color" name="textColor" value="${el.textColor || '#1f2937'}">
      </div>
    </div>
    <div class="form-check">
      <input type="checkbox" name="showCloseButton" id="showClose" ${cfg.showCloseButton !== false ? 'checked':''}>
      <label for="showClose">Näytä sulkemisnappi</label>
    </div>`;

  // Toggle trigger value -kenttä
  container.querySelector('#slideInTrigger')?.addEventListener('change', e => {
    const v = e.target.value;
    const grp = container.querySelector('#trigger-value-group');
    const lbl = container.querySelector('#trigger-value-label');
    grp.style.display = v === 'exit_intent' ? 'none' : '';
    if (lbl) lbl.textContent = v === 'scroll' ? 'Scrollin jälkeen (%)' : 'Viive (sekuntia)';
  });
}

export function getSlideInData(container) {
  const g = n => container.querySelector(`[name="${n}"]`);
  return {
    config: {
      slideInPosition:     g('slideInPosition')?.value || 'bottom-right',
      slideInWidth:        parseInt(g('slideInWidth')?.value) || 320,
      slideInTrigger:      g('slideInTrigger')?.value || 'time',
      slideInTriggerValue: parseInt(g('slideInTriggerValue')?.value) || 5,
      showCloseButton:     g('showCloseButton')?.checked ?? true
    },
    content:         g('slideContent')?.value || '',
    backgroundColor: g('backgroundColor')?.value || '#ffffff',
    textColor:       g('textColor')?.value || '#1f2937'
  };
}
