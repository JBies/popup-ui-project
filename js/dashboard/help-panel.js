// js/dashboard/help-panel.js

export function initHelpPanel() {
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#help') renderHelp();
  });
  if (window.location.hash === '#help') renderHelp();
}

function renderHelp() {
  const container = document.getElementById('help-content');
  if (!container) return;

  container.innerHTML = `
    <div style="max-width:820px;font-family:system-ui,sans-serif">

      <!-- Intro -->
      <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:14px;padding:28px;color:#fff;margin-bottom:24px">
        <div style="font-size:22px;font-weight:800;margin-bottom:8px">UI Manager – Käyttöohje</div>
        <div style="opacity:.85;font-size:14px;line-height:1.6">Luo konversioelementtejä verkkosivustollesi ilman koodausta.
        Lisää yksi skriptirivi sivustollesi ja aktivoi elementit tästä dashboardista.</div>
        <div style="margin-top:16px;background:rgba(0,0,0,.25);border-radius:8px;padding:12px 16px;font-family:monospace;font-size:12px">
          &lt;script src="https://popupmanager.net/ui-embed.js"&gt;&lt;/script&gt;<br>
          &lt;script&gt;ShowElement('ELEMENTIN_ID');&lt;/script&gt;
        </div>
      </div>

      <!-- Elementtityypit -->
      ${section('fa-layer-group','Elementtityypit','Mitä voit rakentaa', [
        card('fa-minus','#1d4ed8','Sticky Bar',
          'Kiinteä palkki sivun ylä- tai alareunassa. Pysyy näkyvissä vaikka käyttäjä scrollaa. Erinomainen ilmoituksiin, tarjouksiin ja GDPR-bannereihin.',
          ['Kampanjakoodi tai tarjous','Cookie/GDPR-ilmoitus','Varhaisen rekisteröinnin CTA','Tärkeä ilmoitus kaikille kävijöille'],
          ['barText – teksti palkissa','ctaButtons – max 3 nappia (teksti + URL + tyyli)','barPosition – top tai bottom','showDismiss – voidaanko sulkea','dismissCookieDays – muista sulkeminen X päivää']),

        card('fa-circle','#6d28d9','Floating Button (FAB)',
          'Pyöreä kelluva nappi sivun kulmassa. Näkyy aina kaikilla sivuilla. Sopii chat-, puhelin- tai "takaisin ylös" -toiminnoille.',
          ['Live chat -avaus','Soittopyyntö','Varaa aika -nappi','Takaisin sivun alkuun'],
          ['fabIcon – Font Awesome -ikoniluokka','fabColor – napin taustaväri','fabAction – link tai modal','fabUrl – mihin nappi vie','pulseAnimation – huomioanimaatio']),

        card('fa-comment-dots','#16a34a','Slide-in',
          'Animoitu boksi, joka liukuu esiin sivun kulmasta. Triggeröityy automaattisesti scrollin, ajan tai exit intentin perusteella.',
          ['Uutiskirjetilaus 50% scrollin jälkeen','Alennustarjous 30s viiveen jälkeen','Exit intent – viimeinen mahdollisuus','Mobiilioptimoitu CTA'],
          ['slideInTrigger – scroll / time / exit_intent','slideInTriggerValue – scroll-% tai sekuntia','slideInPosition – bottom-right tai bottom-left','slideInWidth – boksin leveys pikseleinä']),

        card('fa-square','#475569','Popup',
          'Perinteinen modaali-popup, joka avautuu sivun päälle. Tukee neljää alatyyppiä eri käyttötarkoituksiin.',
          ['Tervetuloviesti uusille kävijöille','Exit intent – "Odota, tässä tarjous"','Kuva + CTA -mainospopup','Tarjouskoodi viiveen jälkeen'],
          ['popupSubtype – announcement / offer / image / exit_intent','position – center, top, bottom','animation – none, fade, slide','imageUrl – kuva image-tyypille']),

        card('fa-users','#d97706','Social Proof',
          'Ponnahdusviesti sivun kulmassa: "X henkilöä katsoo nyt tätä sivua". Kasvattaa luottamusta ja kiireellisyyden tunnetta.',
          ['E-commerce: "12 henkilöä katsoo tätä tuotetta"','Palvelu: "5 henkilöä varasi ajan tällä viikolla"','Reaaliaikaiset katsojamäärät','Aidon näköiset aktiviteetti-ilmoitukset'],
          ['proofText – viesti ({count} = lukumäärä)','proofCount – 0 käyttää oikeita tilastoja','proofDuration – näyttöaika sekunteina','proofInterval – väli näyttöjen välillä (s)','proofIcon – emoji-ikoni']),

        card('fa-arrows-alt-v','#e11d48','Scroll Progress',
          'Ohut palkki sivun ylä- tai alareunassa, joka kasvaa sitä mukaa kun käyttäjä scrollaa. Pitää käyttäjän sivulla pidempään.',
          ['Blogitekstit ja pitkät artikkelit','Tuote-esittelysivut','Monivaiheinen ostoprosessi','Kaikki pitkät laskeutumissivut'],
          ['progressPosition – top tai bottom','progressHeight – paksuus 2–12px','progressColor – palkin väri','backgroundColor – taustaväri']),

        card('fa-envelope','#065f46','Lead Form',
          'Liidilomake, joka kerää yhteystietoja suoraan tietokantaan. Kentät ovat täysin konfiguroitavissa. Liidit näkyvät tilastoissa.',
          ['Yhteydenottopyyntö','Uutiskirjetilaus','Varaa demo -lomake','Kilpailun osallistuminen'],
          ['leadFields – lista kentistä (teksti/email/puhelin/textarea)','leadSubmitText – lähetä-napin teksti','leadSuccessMsg – onnistumisviesti','Kaikki liidit tallentuvat automaattisesti'])
      ])}

      <!-- Targeting -->
      ${section('fa-crosshairs','Targeting','Näytä oikealle henkilölle oikeaan aikaan', [
        infoBlock('Targeting-paneeli löytyy jokaisen elementin editorista. Aktivoi se ja lisää yksi tai useampi sääntö.',
        [
          ['URL-osoite','Näytä vain tietyillä sivuilla. Esim. sisältää "/tuotteet"'],
          ['Laitetyyppi','Vain mobiili, desktop tai tablet'],
          ['Tulolähde (referrer)','Kävijä tuli Googlesta, Facebookista...'],
          ['Scroll-syvyys','Näytä vasta kun kävijä on scrollannut 50%'],
          ['Aika sivulla','Näytä 30 sekunnin jälkeen'],
          ['Uusi / palaava','Eri viesti uusille vs. palaaviin kävijöihin'],
          ['Viikonpäivä','Näytä vain arkisin tai viikonloppuisin'],
          ['Kellonaika','Näytä vain aukioloaikoina 9–17'],
        ])
      ])}

      <!-- A/B testaus -->
      ${section('fa-flask','A/B-testaus','Testaa mikä toimii paremmin', [
        infoBlock('A/B-testi löytyy jokaisen elementin editorista Targeting-paneelin alapuolelta. Variantti A on oletusasetus, Variantti B ylikirjoittaa valitut kentät.',
        [
          ['Liikennenjako','Slider 10–90%. Esim. 50% näkee A, 50% näkee B'],
          ['Variantti B: otsikko','Ylikirjoittaa palkin tekstin tai popupin otsikon'],
          ['Variantti B: CTA-teksti','Ylikirjoittaa ensimmäisen napin tekstin'],
          ['Variantti B: taustaväri','Testaa eri värejä'],
          ['Tulokset','Vertaa A:n ja B:n CTR:ää Tilastot-sivulla'],
        ])
      ])}

      <!-- Kampanjat -->
      ${section('fa-flag','Kampanjat','Hallitse elementtejä ryhmissä', [
        infoBlock('Ryhmittele elementit kampanjan alle (esim. "Black Friday") ja aktivoi tai pysäytä kaikki yhdellä napin painalluksella.',
        [
          ['Luo kampanja','Nimeä kampanja ja valitse elementit mukaan'],
          ['Aktivoi kaikki','Käynnistää kaikki kampanjan elementit samanaikaisesti'],
          ['Pysäytä kaikki','Poistaa kampanjan elementit käytöstä'],
          ['Yksittäinen toggle','Jokaisen elementin aktiivitila on vaihdettavissa erikseen'],
          ['Aktiivisuus','Ei-käytössä oleva elementti ei näy sivustolla vaikka embed-koodi on paikallaan'],
        ])
      ])}

      <!-- Webhooks -->
      ${section('fa-plug','Webhooks','Yhdistä Zapier, Make.com tai oma järjestelmä', [
        infoBlock('Webhook lähettää automaattisesti POST-kutsun valitsemaasi URL:iin kun elementtiäsi näytetään, klikataan tai kun liidi kerätään. Toimii Zapierin, Make.comin ja minkä tahansa HTTP-vastaanottajan kanssa.',
        [
          ['Näyttö (view)','Lähetetään joka kerta kun elementti näytetään'],
          ['Klikkaus (click)','Lähetetään kun kävijä klikkaa CTA-nappia'],
          ['Liidi (lead)','Lähetetään kun lomake lähetetään – sisältää lomakkeen tiedot'],
          ['Payload','{ event, timestamp, data: { popupId, ... } }'],
          ['Zapier','Käytä "Webhooks by Zapier" → Catch Hook -triggerinä'],
        ])
      ])}

      <!-- Embed-koodi -->
      ${section('fa-code','Embed-koodi','Miten lisäät elementin sivustollesi', [
        `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px">
          <div style="font-size:13px;font-weight:600;margin-bottom:12px;color:#0f172a">3 askelta:</div>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div style="display:flex;gap:12px;align-items:flex-start">
              <div style="width:24px;height:24px;border-radius:50%;background:#3b82f6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">1</div>
              <div>
                <div style="font-size:13px;font-weight:600;margin-bottom:4px">Lisää pääskripti sivustollesi (kerran)</div>
                <code style="display:block;background:#1e293b;color:#e2e8f0;padding:8px 12px;border-radius:6px;font-size:11px">&lt;script src="https://popupmanager.net/ui-embed.js"&gt;&lt;/script&gt;</code>
              </div>
            </div>
            <div style="display:flex;gap:12px;align-items:flex-start">
              <div style="width:24px;height:24px;border-radius:50%;background:#3b82f6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">2</div>
              <div>
                <div style="font-size:13px;font-weight:600;margin-bottom:4px">Luo elementti dashboardissa ja kopioi sen ID</div>
                <div style="font-size:12px;color:#64748b">Elementtikortin "Tilastot"-napista löydät valmiin embed-koodin</div>
              </div>
            </div>
            <div style="display:flex;gap:12px;align-items:flex-start">
              <div style="width:24px;height:24px;border-radius:50%;background:#3b82f6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">3</div>
              <div>
                <div style="font-size:13px;font-weight:600;margin-bottom:4px">Aktivoi elementti sivullasi</div>
                <code style="display:block;background:#1e293b;color:#e2e8f0;padding:8px 12px;border-radius:6px;font-size:11px">&lt;script&gt;ShowElement('SINUN_ID');&lt;/script&gt;</code>
              </div>
            </div>
          </div>
        </div>`
      ])}

    </div>`;
}

function section(icon, title, subtitle, children) {
  return `<div style="margin-bottom:28px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
      <i class="fa ${icon}" style="color:#3b82f6;font-size:16px;width:20px;text-align:center"></i>
      <h2 style="margin:0;font-size:17px;font-weight:700;color:#0f172a">${title}</h2>
    </div>
    <p style="margin:0 0 14px 30px;font-size:13px;color:#64748b">${subtitle}</p>
    <div style="margin-left:0">${Array.isArray(children) ? children.join('') : children}</div>
  </div>`;
}

function card(icon, color, title, desc, useCases, fields) {
  return `<details style="border:1px solid #e2e8f0;border-radius:10px;margin-bottom:10px;overflow:hidden">
    <summary style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;background:#fff;list-style:none;user-select:none">
      <div style="width:32px;height:32px;border-radius:8px;background:${color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="fa ${icon}" style="color:${color};font-size:14px"></i>
      </div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:14px;color:#0f172a">${title}</div>
        <div style="font-size:12px;color:#64748b;margin-top:2px">${desc.substring(0,80)}...</div>
      </div>
      <i class="fa fa-chevron-down" style="color:#94a3b8;font-size:11px"></i>
    </summary>
    <div style="padding:16px;border-top:1px solid #f1f5f9;background:#fafbfc">
      <p style="font-size:13px;color:#475569;margin:0 0 14px">${desc}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Käyttötapaukset</div>
          ${useCases.map(u => `<div style="font-size:12px;color:#374151;padding:3px 0;display:flex;align-items:center;gap:6px"><span style="color:#22c55e">✓</span>${u}</div>`).join('')}
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Tärkeimmät asetukset</div>
          ${fields.map(f => `<div style="font-size:12px;color:#374151;padding:3px 0"><code style="background:#e0f2fe;color:#0369a1;padding:1px 5px;border-radius:3px;font-size:10px">${f.split(' – ')[0]}</code> <span style="color:#64748b">${f.split(' – ')[1] || ''}</span></div>`).join('')}
        </div>
      </div>
    </div>
  </details>`;
}

function infoBlock(intro, rows) {
  return `<div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;background:#fff">
    <p style="font-size:13px;color:#475569;margin:0 0 14px">${intro}</p>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${rows.map(([label, desc]) => `
        <div style="display:flex;gap:12px;padding:8px 10px;background:#f8fafc;border-radius:7px">
          <div style="font-size:12px;font-weight:600;color:#0f172a;min-width:160px;flex-shrink:0">${label}</div>
          <div style="font-size:12px;color:#64748b">${desc}</div>
        </div>`).join('')}
    </div>
  </div>`;
}
