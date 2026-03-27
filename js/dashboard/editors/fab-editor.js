// editors/fab-editor.js
const ICONS = [
  { icon: 'fa-comment',      label: 'Chat' },
  { icon: 'fa-phone',        label: 'Puhelin' },
  { icon: 'fa-envelope',     label: 'Sähköposti' },
  { icon: 'fa-arrow-up',     label: 'Ylös' },
  { icon: 'fa-shopping-cart',label: 'Ostoskori' },
  { icon: 'fa-calendar',     label: 'Kalenteri' },
  { icon: 'fa-star',         label: 'Tähti' },
  { icon: 'fa-heart',        label: 'Sydän' },
  { icon: 'fa-info',         label: 'Info' },
  { icon: 'fa-question',     label: 'Kysymys' },
  { icon: 'fa-gift',         label: 'Lahja' },
  { icon: 'fa-bolt',         label: 'Salama' },
];

export function renderFabFields(container, cfg = {}) {
  const selectedIcon = cfg.fabIcon || 'fa-comment';
  container.innerHTML = `
    <div class="section-title">FAB-asetukset</div>
    <div class="form-row">
      <div class="form-group">
        <label>Sijainti</label>
        <select name="fabPosition">
          <option value="bottom-right" ${cfg.fabPosition === 'bottom-right' || !cfg.fabPosition ? 'selected':''}>Alh. oikealla</option>
          <option value="bottom-left"  ${cfg.fabPosition === 'bottom-left' ? 'selected':''}>Alh. vasemmalla</option>
          <option value="top-right"    ${cfg.fabPosition === 'top-right' ? 'selected':''}>Ylh. oikealla</option>
          <option value="top-left"     ${cfg.fabPosition === 'top-left' ? 'selected':''}>Ylh. vasemmalla</option>
        </select>
      </div>
      <div class="form-group">
        <label>Koko</label>
        <select name="fabSize">
          <option value="sm" ${cfg.fabSize === 'sm' ? 'selected':''}>Pieni (44px)</option>
          <option value="md" ${cfg.fabSize === 'md' || !cfg.fabSize ? 'selected':''}>Normaali (56px)</option>
          <option value="lg" ${cfg.fabSize === 'lg' ? 'selected':''}>Suuri (68px)</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label>Väri</label>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="color" name="fabColor" value="${cfg.fabColor || '#1a56db'}" style="width:44px;height:36px;padding:2px;border-radius:6px;border:1px solid #e2e8f0;cursor:pointer">
        <input type="text" name="fabColorHex" value="${cfg.fabColor || '#1a56db'}" style="flex:1" placeholder="#1a56db">
      </div>
    </div>

    <div class="form-group">
      <label>Ikoni</label>
      <div id="icon-grid" style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:4px">
        ${ICONS.map(({icon, label}) => `
          <button type="button" class="icon-btn ${icon === selectedIcon ? 'selected' : ''}" data-icon="${icon}" title="${label}"
            style="padding:10px 6px;border-radius:7px;border:2px solid ${icon === selectedIcon ? 'var(--primary)' : '#e2e8f0'};background:${icon === selectedIcon ? '#eff6ff' : '#fff'};cursor:pointer;transition:all 0.15s">
            <i class="fa ${icon}" style="font-size:18px;color:${icon === selectedIcon ? 'var(--primary)' : '#64748b'}"></i>
          </button>`).join('')}
      </div>
      <input type="hidden" name="fabIcon" value="${selectedIcon}">
    </div>

    <div class="section-title" style="margin-top:4px">Toiminto klikatessa</div>
    <div class="form-group">
      <label>Tyyppi</label>
      <select name="fabAction" id="fabAction">
        <option value="link"  ${cfg.fabAction !== 'modal' ? 'selected':''}>Avaa linkki</option>
        <option value="modal" ${cfg.fabAction === 'modal' ? 'selected':''}>Avaa modaali</option>
      </select>
    </div>
    <div id="fab-link-group" class="form-group" style="${cfg.fabAction === 'modal' ? 'display:none' : ''}">
      <label>URL</label>
      <input type="text" name="fabUrl" value="${cfg.fabUrl || ''}" placeholder="https://...">
    </div>
    <div id="fab-modal-group" class="form-group" style="${cfg.fabAction === 'modal' ? '' : 'display:none'}">
      <label>Modaalin sisältö (HTML)</label>
      <textarea name="fabModalContent" rows="4" placeholder="<h3>Otsikko</h3><p>Teksti...</p>">${cfg.fabModalContent || ''}</textarea>
    </div>

    <div class="form-check" style="margin-top:4px">
      <input type="checkbox" name="pulseAnimation" id="pulseAnim" ${cfg.pulseAnimation ? 'checked':''}>
      <label for="pulseAnim">Pulssi-animaatio (huomio)</label>
    </div>`;

  // Ikoninappi-logiikka
  container.querySelectorAll('.icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.icon-btn').forEach(b => {
        b.style.borderColor = '#e2e8f0';
        b.style.background = '#fff';
        b.querySelector('i').style.color = '#64748b';
      });
      btn.style.borderColor = 'var(--primary)';
      btn.style.background = '#eff6ff';
      btn.querySelector('i').style.color = 'var(--primary)';
      container.querySelector('[name="fabIcon"]').value = btn.dataset.icon;
      container.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  // Värisynkronointi
  const colorInput = container.querySelector('[name="fabColor"]');
  const hexInput = container.querySelector('[name="fabColorHex"]');
  colorInput?.addEventListener('input', () => { hexInput.value = colorInput.value; container.dispatchEvent(new Event('change', { bubbles: true })); });
  hexInput?.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(hexInput.value)) colorInput.value = hexInput.value; });

  // Toggle link/modal
  container.querySelector('#fabAction')?.addEventListener('change', e => {
    const isModal = e.target.value === 'modal';
    container.querySelector('#fab-link-group').style.display = isModal ? 'none' : '';
    container.querySelector('#fab-modal-group').style.display = isModal ? '' : 'none';
  });
}

export function getFabData(container) {
  const g = n => container.querySelector(`[name="${n}"]`);
  return {
    fabPosition:     g('fabPosition')?.value || 'bottom-right',
    fabSize:         g('fabSize')?.value || 'md',
    fabIcon:         g('fabIcon')?.value || 'fa-comment',
    fabColor:        g('fabColor')?.value || '#1a56db',
    fabAction:       g('fabAction')?.value || 'link',
    fabUrl:          g('fabUrl')?.value?.trim() || '',
    fabModalContent: g('fabModalContent')?.value?.trim() || '',
    pulseAnimation:  g('pulseAnimation')?.checked ?? false
  };
}
