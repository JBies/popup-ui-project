// editors/cookie-consent-editor.js

export function renderCookieConsentFields(container, cfg = {}, data = {}) {
  container.innerHTML = `
    <div class="section-title">Cookie Consent -asetukset</div>

    <div class="form-group">
      <label>Bannerin teksti</label>
      <textarea name="bannerText" rows="3" style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px;resize:vertical">${cfg.bannerText || 'Käytämme evästeitä sivuston toiminnan ja käyttökokemuksen parantamiseksi.'}</textarea>
    </div>

    <div class="section-title" style="margin-top:16px">Värit</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label>Taustaväri</label>
        <input type="color" name="ccBgColor" value="${data.backgroundColor || '#1f2937'}"
          style="width:100%;height:38px;padding:2px 4px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer">
      </div>
      <div class="form-group">
        <label>Tekstiväri</label>
        <input type="color" name="ccTextColor" value="${data.textColor || '#ffffff'}"
          style="width:100%;height:38px;padding:2px 4px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer">
      </div>
      <div class="form-group">
        <label>"Hyväksy"-napin väri</label>
        <input type="color" name="allowBtnColor" value="${cfg.allowBtnColor || '#22c55e'}"
          style="width:100%;height:38px;padding:2px 4px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer">
      </div>
      <div class="form-group">
        <label>"Hylkää"-napin väri</label>
        <input type="color" name="denyBtnColor" value="${cfg.denyBtnColor || '#6b7280'}"
          style="width:100%;height:38px;padding:2px 4px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer">
      </div>
    </div>

    <div class="section-title" style="margin-top:4px">Napit</div>
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
      <label>Lisätietoja-teksti <span style="color:#94a3b8;font-weight:400">(valinnainen — avaa popup-ikkunan)</span></label>
      <div class="form-group" style="margin-bottom:6px">
        <input type="text" name="infoBtnLabel" value="${cfg.infoBtnLabel || 'Lisätietoja'}" placeholder="Napin teksti"
          style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px;box-sizing:border-box">
      </div>
      <textarea name="infoText" rows="4" placeholder="Kirjoita tähän tietosuojatekstisi tai selitys kerättävistä tiedoista..."
        style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px;resize:vertical">${cfg.infoText || ''}</textarea>
    </div>

    <div class="form-group">
      <label>Kuinka usein banneri näytetään</label>
      <select name="consentFrequency" style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px">
        <option value="once" ${(cfg.consentFrequency||'once')==='once' ? 'selected' : ''}>Kerran — ei näytetä uudelleen hyväksynnän/hylkäyksen jälkeen</option>
        <option value="annual" ${cfg.consentFrequency==='annual' ? 'selected' : ''}>Kerran vuodessa — näytetään taas 365 päivän jälkeen</option>
        <option value="monthly" ${cfg.consentFrequency==='monthly' ? 'selected' : ''}>Kerran kuussa — näytetään taas 30 päivän jälkeen</option>
        <option value="always" ${cfg.consentFrequency==='always' ? 'selected' : ''}>Aina — näytetään joka sivulatauksella (ei muisteta valintaa)</option>
      </select>
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
    backgroundColor: g('ccBgColor')?.value    || '#1f2937',
    textColor:       g('ccTextColor')?.value  || '#ffffff',
    elementConfig: {
      bannerText:    g('bannerText')?.value?.trim()    || '',
      allowBtnLabel: g('allowBtnLabel')?.value?.trim() || 'Hyväksy',
      denyBtnLabel:  g('denyBtnLabel')?.value?.trim()  || 'Hylkää',
      allowBtnColor: g('allowBtnColor')?.value         || '#22c55e',
      denyBtnColor:  g('denyBtnColor')?.value          || '#6b7280',
      infoBtnLabel:  g('infoBtnLabel')?.value?.trim()  || 'Lisätietoja',
      infoText:           g('infoText')?.value?.trim()           || '',
      consentFrequency:   g('consentFrequency')?.value           || 'once',
    }
  };
}
