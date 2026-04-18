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

    <div class="section-title" style="margin-top:16px">Ulkoasu &amp; sijoittelu</div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="form-group" style="margin-bottom:0">
        <label>Bannerin sijainti</label>
        <select name="bannerPosition" style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px">
          <option value="bottom" ${(cfg.bannerPosition||'bottom')==='bottom' ? 'selected' : ''}>Alareuna</option>
          <option value="top"    ${cfg.bannerPosition==='top' ? 'selected' : ''}>Yläreuna</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label>Asetusnapin sijainti</label>
        <select name="settingsBtnPos" style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px">
          <option value="bottom-left"  ${(cfg.settingsBtnPos||'bottom-left')==='bottom-left'  ? 'selected' : ''}>Vasen alareunus</option>
          <option value="bottom-right" ${cfg.settingsBtnPos==='bottom-right' ? 'selected' : ''}>Oikea alareunus</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;text-transform:none;letter-spacing:0;font-size:13px;font-weight:500;color:#0f172a;margin-bottom:0">
        <input type="checkbox" name="showSettingsBtn" ${cfg.showSettingsBtn !== false ? 'checked' : ''}
          style="width:16px;height:16px;accent-color:#2563eb;cursor:pointer;flex-shrink:0">
        Näytä "🍪 Evästeasetukset"-nappi sivun kulmassa suostumuksen jälkeen
        <span style="font-size:11px;color:#64748b;font-weight:400">(GDPR — käyttäjä voi muuttaa valintaansa)</span>
      </label>
    </div>

    <div class="form-group" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 12px">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;text-transform:none;letter-spacing:0;font-size:13px;font-weight:500;color:#0f172a;margin-bottom:8px">
        <input type="checkbox" name="showNecessaryBtn" ${cfg.showNecessaryBtn ? 'checked' : ''}
          style="width:16px;height:16px;accent-color:#2563eb;cursor:pointer;flex-shrink:0">
        Lisää "Vain välttämättömät" -nappi
        <span style="font-size:11px;color:#64748b;font-weight:400">(ammattimaisempi UX)</span>
      </label>
      <input type="text" name="necessaryBtnLabel" value="${cfg.necessaryBtnLabel || 'Vain välttämättömät'}"
        placeholder="Napin teksti"
        style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px;box-sizing:border-box">
    </div>

    <div class="section-title" style="margin-top:16px">
      <i class="fa fa-chart-line" style="color:#6366f1;margin-right:6px"></i>Tracking-integraatiot
    </div>

    <div class="form-group" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 14px">
      <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;margin:0">
        <input type="checkbox" name="hideBanner" ${cfg.hideBanner ? 'checked' : ''}
          style="margin-top:2px;width:16px;height:16px;accent-color:#f97316;flex-shrink:0;cursor:pointer">
        <span>
          <span style="font-size:13px;font-weight:700;color:#c2410c;display:block;margin-bottom:2px">Piilota banneri — aktivoi vain tracking-skriptit</span>
          <span style="font-size:12px;color:#9a3412;line-height:1.5">
            Banneria ei näytetä kävijälle. Tracking-skriptit (GA, Pixel jne.) ladataan <strong>heti sivun latautuessa</strong> ilman suostumuspyyntöä.<br>
            <span style="color:#b45309">⚠️ Käytä vain jos et tarvitse GDPR-suostumusta tai sinulla on muu tapa kerätä suostumus.</span>
          </span>
        </span>
      </label>
    </div>

    <div id="cc-banner-fields-wrapper">
    <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:12px;color:#5b21b6;line-height:1.6">
      🔒 <strong>Consent-first:</strong> Nämä skriptit ladataan <strong>vasta kun käyttäjä klikkaa Hyväksy</strong>.<br>
      Deny estää kaiken seurannan ja pyyhkii jo asetetut tracking-evästeet automaattisesti.
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="form-group">
        <label style="display:flex;align-items:center;gap:6px">
          <img src="https://www.google.com/favicon.ico" style="width:13px;height:13px" onerror="this.style.display='none'">
          Google Analytics 4 ID
        </label>
        <input type="text" name="gaId" value="${cfg.gaId || ''}" placeholder="G-XXXXXXXXXX"
          style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px;box-sizing:border-box;font-family:monospace">
      </div>
      <div class="form-group">
        <label style="display:flex;align-items:center;gap:6px">
          <img src="https://www.google.com/favicon.ico" style="width:13px;height:13px" onerror="this.style.display='none'">
          Google Tag Manager ID
        </label>
        <input type="text" name="gtmId" value="${cfg.gtmId || ''}" placeholder="GTM-XXXXXXX"
          style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px;box-sizing:border-box;font-family:monospace">
      </div>
    </div>

    <div class="form-group" style="margin-bottom:12px">
      <label style="display:flex;align-items:center;gap:6px">
        <span style="font-size:13px">📘</span> Facebook Pixel ID
      </label>
      <input type="text" name="fbPixelId" value="${cfg.fbPixelId || ''}" placeholder="123456789012345"
        style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px;box-sizing:border-box;font-family:monospace">
    </div>

    <div class="form-group">
      <label>Muu koodi <span style="color:#94a3b8;font-weight:400">(ajetaan suostumuksen jälkeen — esim. Hotjar, LinkedIn)</span></label>
      <textarea name="customScripts" rows="4" placeholder="// Esim. Hotjar:\n(function(h,o,t,j,a,r){ ... })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');"
        style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:7px;font-size:12px;resize:vertical;font-family:monospace">${cfg.customScripts || ''}</textarea>
    </div>

    <div class="form-group" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px">
      <p style="margin:0;font-size:12px;color:#15803d;line-height:1.6">
        <strong>Miten se toimii:</strong><br>
        • <strong>Hyväksy</strong> → tallentaa suostumuksen + lataa GA/Pixel/GTM automaattisesti<br>
        • <strong>Hylkää</strong> → ei skriptejä, pyyhkii tracking-evästeet (_ga, _fbp jne.)<br>
        • <strong>Yksi koodirivi riittää koko sivustolle</strong> — GA seuraa jokaista sivua automaattisesti<br>
        • Sivustosi koodi voi kuunnella: <code>document.addEventListener('cc_consent', e => { ... })</code>
      </p>
    </div>
    </div>
  `;

  // Toggle: piilota bannerin asetukset jos "hideBanner" on valittu
  const hideCb = container.querySelector('[name="hideBanner"]');
  const bannerWrapper = container.querySelector('#cc-banner-fields-wrapper');
  function updateBannerVisibility() {
    if (bannerWrapper) bannerWrapper.style.display = hideCb.checked ? 'none' : '';
  }
  updateBannerVisibility();
  hideCb?.addEventListener('change', updateBannerVisibility);
}

export function getCookieConsentData(container) {
  const g = name => container.querySelector(`[name="${name}"]`);
  return {
    backgroundColor: g('ccBgColor')?.value    || '#1f2937',
    textColor:       g('ccTextColor')?.value  || '#ffffff',
    elementConfig: {
      bannerText:       g('bannerText')?.value?.trim()       || '',
      allowBtnLabel:    g('allowBtnLabel')?.value?.trim()    || 'Hyväksy',
      denyBtnLabel:     g('denyBtnLabel')?.value?.trim()     || 'Hylkää',
      allowBtnColor:    g('allowBtnColor')?.value            || '#22c55e',
      denyBtnColor:     g('denyBtnColor')?.value             || '#6b7280',
      infoBtnLabel:     g('infoBtnLabel')?.value?.trim()     || 'Lisätietoja',
      infoText:         g('infoText')?.value?.trim()         || '',
      consentFrequency: g('consentFrequency')?.value         || 'once',
      gaId:             g('gaId')?.value?.trim()             || '',
      gtmId:            g('gtmId')?.value?.trim()            || '',
      fbPixelId:        g('fbPixelId')?.value?.trim()        || '',
      customScripts:    g('customScripts')?.value?.trim()    || '',
      hideBanner:       g('hideBanner')?.checked             || false,
      bannerPosition:   g('bannerPosition')?.value           || 'bottom',
      showSettingsBtn:  g('showSettingsBtn')?.checked        ?? true,
      settingsBtnPos:   g('settingsBtnPos')?.value           || 'bottom-left',
      showNecessaryBtn: g('showNecessaryBtn')?.checked       || false,
      necessaryBtnLabel:g('necessaryBtnLabel')?.value?.trim()|| 'Vain välttämättömät',
    }
  };
}
