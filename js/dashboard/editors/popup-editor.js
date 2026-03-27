// editors/popup-editor.js
const SUBTYPES = [
  { value: 'announcement', label: 'Ilmoitus' },
  { value: 'offer',        label: 'Tarjous' },
  { value: 'image',        label: 'Kuvapopup' },
  { value: 'exit_intent',  label: 'Exit Intent' }
];

export function renderPopupFields(container, cfg = {}, el = {}) {
  const subtype = cfg.popupSubtype || el.popupType || 'announcement';
  container.innerHTML = `
    <div class="section-title">Popup-asetukset</div>
    <div class="form-row">
      <div class="form-group">
        <label>Tyyppi</label>
        <select name="popupSubtype">
          ${SUBTYPES.map(t => `<option value="${t.value}" ${subtype === t.value ? 'selected':''}>${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Sijainti</label>
        <select name="position">
          <option value="center"       ${(el.position||'center') === 'center' ? 'selected':''}>Keskellä</option>
          <option value="top-left"     ${el.position === 'top-left' ? 'selected':''}>Ylh. vasemmalla</option>
          <option value="top-right"    ${el.position === 'top-right' ? 'selected':''}>Ylh. oikealla</option>
          <option value="bottom-left"  ${el.position === 'bottom-left' ? 'selected':''}>Alh. vasemmalla</option>
          <option value="bottom-right" ${el.position === 'bottom-right' ? 'selected':''}>Alh. oikealla</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Leveys (px)</label>
        <input type="number" name="width" value="${el.width || 400}" min="200" max="900">
      </div>
      <div class="form-group">
        <label>Animaatio</label>
        <select name="animation">
          <option value="none"  ${(el.animation||'none') === 'none' ? 'selected':''}>Ei animaatiota</option>
          <option value="fade"  ${el.animation === 'fade' ? 'selected':''}>Häivytys</option>
          <option value="slide" ${el.animation === 'slide' ? 'selected':''}>Liu'utus</option>
        </select>
      </div>
    </div>

    <div class="section-title">Sisältö</div>
    <div class="form-group">
      <label>Sisältö (HTML)</label>
      <textarea name="content" rows="5" placeholder="<h2>Otsikko</h2><p>Teksti...</p>">${el.content || ''}</textarea>
    </div>
    <div class="form-group" id="popup-image-group" style="${subtype !== 'image' ? 'display:none':''}">
      <label>Kuvan URL</label>
      <input type="text" name="imageUrl" value="${el.imageUrl || ''}" placeholder="https://...">
    </div>
    <div class="form-group">
      <label>Linkki-URL (klikattavuus)</label>
      <input type="text" name="linkUrl" value="${el.linkUrl || ''}" placeholder="https://...">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Taustaväri</label>
        <input type="color" name="backgroundColor" value="${el.backgroundColor || '#ffffff'}">
      </div>
      <div class="form-group">
        <label>Tekstiväri</label>
        <input type="color" name="textColor" value="${el.textColor || '#000000'}">
      </div>
    </div>`;

  container.querySelector('[name="popupSubtype"]')?.addEventListener('change', e => {
    const imgGrp = container.querySelector('#popup-image-group');
    if (imgGrp) imgGrp.style.display = e.target.value === 'image' ? '' : 'none';
  });
}

export function getPopupData(container) {
  const g = n => container.querySelector(`[name="${n}"]`);
  return {
    config: { popupSubtype: g('popupSubtype')?.value || 'announcement' },
    popupType:       g('popupSubtype')?.value === 'image' ? 'image' : 'rectangle',
    position:        g('position')?.value || 'center',
    animation:       g('animation')?.value || 'none',
    width:           parseInt(g('width')?.value) || 400,
    content:         g('content')?.value || '',
    imageUrl:        g('imageUrl')?.value?.trim() || '',
    linkUrl:         g('linkUrl')?.value?.trim() || '',
    backgroundColor: g('backgroundColor')?.value || '#ffffff',
    textColor:       g('textColor')?.value || '#000000'
  };
}
