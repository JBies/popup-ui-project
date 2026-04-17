// editors/cookie-consent-editor.js

export function renderCookieConsentFields(container, cfg = {}) {
  container.innerHTML = `
    <div class="section-title">Cookie Consent -asetukset</div>

    <div class="form-group">
      <label>Bannerin teksti</label>
      <textarea name="bannerText" rows="3" style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px;resize:vertical">${cfg.bannerText || 'Käytämme evästeitä sivuston toiminnan ja käyttökokemuksen parantamiseksi.'}</textarea>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label>"Hyväksy"-napin teksti</label>
        <input type="text" name="allowBtnLabel" value="${cfg.allowBtnLabel || 'Hyväksy'}"
          style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px;box-sizing:border-box">
      </div>
      <div class="form-group">
        <label>"Hylkää"-napin teksti</label>
        <input type="text" name="denyBtnLabel" value="${cfg.denyBtnLabel || 'Hylkää'}"
          style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px;box-sizing:border-box">
      </div>
    </div>

    <div class="form-group">
      <label>"Hyväksy"-napin väri</label>
      <div style="display:flex;align-items:center;gap:8px">
        <input type="color" name="allowBtnColor" value="${cfg.allowBtnColor || '#22c55e'}"
          style="width:40px;height:34px;border:none;cursor:pointer;border-radius:6px">
        <span style="font-size:12px;color:#64748b">Hyväksy-nappi</span>
      </div>
    </div>

    <div class="form-group">
      <label>Lisätietoja-teksti <span style="color:#94a3b8;font-weight:400">(valinnainen — avaa popup-ikkunan)</span></label>
      <div class="form-group" style="margin-bottom:6px">
        <input type="text" name="infoBtnLabel" value="${cfg.infoBtnLabel || 'Lisätietoja'}" placeholder="Napin teksti"
          style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px;box-sizing:border-box">
      </div>
      <textarea name="infoText" rows="4" placeholder="Kirjoita tähän tietosuojatekstisi tai selitys kerättävistä tiedoista..."
        style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px;resize:vertical">${cfg.infoText || ''}</textarea>
    </div>

    <div class="form-group" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px">
      <p style="margin:0;font-size:12px;color:#15803d;line-height:1.6">
        <strong>Miten se toimii:</strong><br>
        • <strong>Hyväksy</strong> → tallentaa suostumuksen evästeeseen 365 päiväksi<br>
        • <strong>Hylkää</strong> → tallennetaan vain täksi sessioksi (ei evästettä)<br>
        • Sivustosi koodi voi kuunnella: <code>document.addEventListener('cc_consent', e => { ... })</code>
      </p>
    </div>
  `;
}

export function getCookieConsentData(container) {
  const g = name => container.querySelector(`[name="${name}"]`);
  return {
    bannerText:    g('bannerText')?.value?.trim()    || '',
    allowBtnLabel: g('allowBtnLabel')?.value?.trim() || 'Hyväksy',
    denyBtnLabel:  g('denyBtnLabel')?.value?.trim()  || 'Hylkää',
    allowBtnColor: g('allowBtnColor')?.value         || '#22c55e',
    infoBtnLabel:  g('infoBtnLabel')?.value?.trim()  || 'Lisätietoja',
    infoText:      g('infoText')?.value?.trim()      || '',
  };
}
