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
  const isAdmin = window.__currentUser__?.role === 'admin';

  container.innerHTML = `
    <div style="max-width:820px;font-family:system-ui,sans-serif">

      <!-- Intro -->
      <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:14px;padding:28px;color:#fff;margin-bottom:24px">
        <div style="font-size:22px;font-weight:800;margin-bottom:8px">UI Manager – Käyttöohje</div>
        <div style="opacity:.85;font-size:14px;line-height:1.6">Luo konversioelementtejä verkkosivustollesi ilman koodausta.
        Lisää yksi skriptirivi sivustollesi ja aktivoi elementit tästä dashboardista.</div>
        <div style="margin-top:16px;background:rgba(0,0,0,.25);border-radius:8px;padding:12px 16px;font-family:monospace;font-size:12px">
          &lt;script src="https://popupmanager.net/ui-embed.js" data-site="SIVUSTO_TOKEN"&gt;&lt;/script&gt;
        </div>
        <div style="margin-top:8px;font-size:12px;opacity:.75">Yksi rivi sivuston &lt;head&gt;-osioon – kaikki elementit latautuvat automaattisesti.</div>
      </div>

      <!-- Pikaohje -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin-bottom:24px">
        <div style="font-size:14px;font-weight:800;color:#166534;margin-bottom:12px">🚀 Pikaohje – 3 askelta alkuun</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="width:24px;height:24px;border-radius:50%;background:#16a34a;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">1</div>
            <div style="font-size:13px;color:#166534"><strong>Lisää asennuskoodi</strong> – Asennuskoodi-välilehdeltä löydät yksirivisen skriptin. Lisää se sivustosi &lt;head&gt;-osioon. Tehdään vain kerran – toimii kaikille elementeille.</div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="width:24px;height:24px;border-radius:50%;background:#16a34a;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">2</div>
            <div style="font-size:13px;color:#166534"><strong>Luo elementti</strong> – Klikkaa "+ Luo uusi" → valitse tyyppi kortista → täytä tekstit ja värit → tallenna.</div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="width:24px;height:24px;border-radius:50%;background:#16a34a;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">3</div>
            <div style="font-size:13px;color:#166534"><strong>Aktivoi</strong> – Kytke elementtikortin toggle päälle. Elementti alkaa näkyä sivustollasi välittömästi – ei tarvitse muuttaa sivuston koodia uudelleen.</div>
          </div>
        </div>
      </div>

      <!-- Elementtityypit -->
      ${section('fa-layer-group','Elementtityypit','Mitä voit rakentaa', [
        card('fa-minus','#1d4ed8','Sticky Bar',
          'Kiinteä palkki sivun ylä- tai alareunassa. Pysyy näkyvissä vaikka käyttäjä scrollaa. Ihanteellinen kampanjoille, tarjouksille ja tärkeille ilmoituksille.',
          ['Kampanjakoodi tai tarjous','Cookie/GDPR-ilmoitus','Varhaisen rekisteröinnin CTA','Tärkeä ilmoitus kaikille kävijöille'],
          ['Teksti – kirjoita oma viesti','Max 3 toimintanappia (teksti + URL)','Sijainti – ylös tai alas','Taustaväri ja tekstiväri vapaasti valittavissa']),

        card('fa-circle','#6d28d9','Floating Button',
          'Pyöreä kelluva nappi sivun kulmassa. Sopii chat-, puhelin- tai CTA-toiminnoille. Näkyy aina kaikkialla häiritsemättä sisältöä.',
          ['Live chat -avaus','Soittopyyntö tai WhatsApp','Varaa aika -nappi','Takaisin sivun alkuun'],
          ['Ikoni – valitse visuaalisesta ruudukosta','Toiminto – avaa linkki tai ponnahdusikkuna','Sijainti – kaikki neljä kulmaa','Väri ja koko säädettävissä']),

        card('fa-comment-dots','#16a34a','Slide-in',
          'Animoitu boksi joka liukuu esiin sivun kulmasta. Voit asettaa milloin se näytetään: heti, viiveen jälkeen tai scrollatessa.',
          ['Uutiskirjetilaus scrollin jälkeen','Alennustarjous viiveen jälkeen','Yhteydenotto- tai liidilomake','Mobiilioptimoitu CTA'],
          ['Triggerit – aika tai scroll-syvyys','4 sijaintia – kaikki kulmat','Leveys ja värit säädettävissä','HTML-sisältö tai yksinkertaiset tekstikentät']),

        card('fa-square','#475569','Popup',
          'Ponnahdusikkuna näytön keskellä. Valitse sisältötapa: lataa valmis kuva (nopein) tai kirjoita otsikko, teksti ja nappi.',
          ['Kuva + linkki mainospopup (nopein)','Tervetuloviesti uusille kävijöille','Tarjouskoodi viiveen jälkeen','Tärkeä ilmoitus ennen sisältöä'],
          ['Kuva – drag & drop tai valitse kirjastosta','Teksti-tila – otsikko, teksti, nappi + värit','Linkki-URL – koko popup klikattavaksi','Ajastus – heti tai viiveen jälkeen']),

        card('fa-envelope','#065f46','Lead Form',
          'Liidilomake joka kerää yhteystietoja suoraan tietokantaan. Kentät ovat täysin konfiguroitavissa. Liidit näkyvät Liidit-välilehdellä ja voit ladata ne CSV:nä.',
          ['Yhteydenottopyyntö','Uutiskirjetilaus','Varaa demo -lomake','Kilpailun osallistuminen'],
          ['Kentät – teksti / email / puhelin / textarea','Lähetä-napin teksti muokattavissa','Onnistumisviesti tallentuvan jälkeen','Kaikki liidit tallentuvat automaattisesti']),

        card('fa-chart-bar','#64748b','Tilastojen kerääjä',
          'Näkymätön tilastopiste – ei näytä kävijöille mitään. Rekisteröi ainoastaan näyttökerran kun skripti suoritetaan. Hyödyllinen sivun kävijämäärän seurantaan ilman häiritseviä elementtejä.',
          ['Kävijämäärän seuranta tietylle sivulle','Funnel-analytiikka: kuinka moni saavuttaa kohdan','Sivuston suosituimpien osioiden kartoitus','Datan keräys ennen varsinaisen elementin aktivointia'],
          ['Ei visuaalisia asetuksia – pelkkä nimi riittää','Tilastot näkyvät normaalisti dashboardissa','Asenna samalla skriptillä kuin muut elementit','Ei häiritse sivuston ulkoasua lainkaan'])
      ])}

      <!-- Kuvakirjasto -->
      ${section('fa-images','Kuvakirjasto','Lataa ja hallitse kuvia popup-elementteihin', [
        infoBlock('Pääset kuvakirjastoon suoraan popup-elementin editorista "Valitse kirjastosta" -napista. Kuvat tallennetaan pilveen.',
        [
          ['Kuvan lataaminen','Popup-editorissa: klikkaa "Lataa kuva" tai raahaa kuva suoraan kenttään. Kuvat pakataan automaattisesti jos ne ovat yli 950 KB.'],
          ['Valitse kirjastosta','Klikkaa "Kirjastosta" -nappia popup-editorissa – näet kaikki aiemmin lataamasi kuvat ruudukkonäkymässä.'],
          ['Tuetut tiedostomuodot','JPG, PNG, GIF, WebP. Suositeltu maksimikoko 5 MB (pakataan automaattisesti).'],
          ['Kuvalinkit','Kuvat tallennetaan turvallisesti pilveen. Linkit päivittyvät automaattisesti 7 päivän välein – kuvat näkyvät aina oikein.'],
          ['Vinkki – nopein tapa','Suunnittele popup Canvassa tai Photoshopissa → lataa kuva suoraan editoriin drag & dropilla → aseta linkki-URL → valmis.'],
        ]),
      ])}

      <!-- Ajastus -->
      ${section('fa-clock','Ajastus','Milloin elementti näytetään', [
        infoBlock('Ajoitusasetukset löytyvät elementin editorin "Näyttäminen"-osiosta.',
        [
          ['Heti','Elementti näkyy heti kun sivu latautuu.'],
          ['Viiveen jälkeen','Valitse napin painalluksella: 3s / 5s / 10s / 15s / 30s. Antaa kävijälle aikaa ensin tutustua sisältöön.'],
          ['Joka kerta','Elementti näytetään jokaisella sivulatauksella.'],
          ['Kerran per istunto','Elementti näytetään vain kerran per selainistunto. Hyvä popupeille jotta se ei ärsytä kävijää.'],
          ['Slide-in – omat ajastimet','Slide-in-elementillä on omat ajoitusasetukset editorin sisällä: aika (sekuntia) tai scroll-syvyys (%).'],
        ])
      ])}

      <!-- Asennuskoodi -->
      ${section('fa-code','Asennuskoodi','Yksi rivi riittää', [
        `<div style="display:flex;flex-direction:column;gap:10px">

          ${scenario('⭐','#1d4ed8','#eff6ff','#dbeafe',
            'Suositeltava tapa – kaikki elementit automaattisesti',
            'Lisää <strong>yksi rivi</strong> sivustosi &lt;head&gt;-osioon. Kaikki aktiiviset elementit latautuvat itsestään – ei muita koodirivejä tarvita koskaan.',
            '&lt;!-- Lisää sivuston &lt;head&gt;-osioon kerran --&gt;\n&lt;script src="https://popupmanager.net/ui-embed.js"\n        data-site="SINUN_SIVUSTO_TOKEN"&gt;&lt;/script&gt;',
            'Token löytyy Asennuskoodi-välilehdeltä. Luo ensin sivusto sieltä.'
          )}

          ${scenario('🌐','#374151','#f8fafc','#e2e8f0',
            'Useita sivustoja tai erillisiä testialueita',
            'Luo jokaista sivustoa tai domainia varten oma sivusto Asennuskoodi-välilehdeltä. Kukin sivusto saa oman tokenin.',
            '&lt;!-- paasivu.fi --&gt;\n&lt;script src="...ui-embed.js" data-site="TOKEN_PAASIVU"&gt;&lt;/script&gt;\n\n&lt;!-- verkkokauppa.fi --&gt;\n&lt;script src="...ui-embed.js" data-site="TOKEN_KAUPPA"&gt;&lt;/script&gt;',
            'Elementtejä voi rajata tietylle sivustolle editorin Sivusto-kentällä.'
          )}

        </div>`
      ])}

      <!-- Liidit -->
      ${section('fa-inbox','Liidit','Kerätyt yhteystiedot ja lomakelähetykset', [
        infoBlock('Lead Form -elementti tallentaa kaikki lomakelähetykset automaattisesti. Voit tarkastella niitä Liidit-välilehdellä dashboardissa.',
        [
          ['Missä liidit näkyvät','Dashboard → Liidit-välilehti. Näet kaikki yhteystiedot taulukossa aikajärjestyksessä.'],
          ['CSV-vienti','Lataa kaikki liidit Excel/CSV-tiedostona yhdellä napin painalluksella.'],
          ['Kentät','Lomakkeen kentät määritetään Lead Form -editorissa: teksti, email, puhelin, textarea.'],
          ['Sähköposti-ilmoitus','Saat automaattisesti sähköpostin joka uudesta liidistä (asetus: Asennuskoodi → Sähköposti-ilmoitukset).'],
        ])
      ])}

      <!-- Sähköposti-ilmoitukset -->
      ${section('fa-envelope','Sähköposti-ilmoitukset','Automaattiset ilmoitukset ja viikkoraportti', [
        infoBlock('Asetukset löytyvät <strong>Asennuskoodi → Sähköposti-ilmoitukset</strong> -osiosta.',
        [
          ['Liidi-ilmoitus','Saat sähköpostin heti kun Lead Form -elementtiin tulee uusi lähetys. Viesti sisältää kaikki lomakkeen kentät.'],
          ['Viikkoraportti','Joka maanantai klo 8:00 saat yhteenvedon: näyttökerrat, klikkaukset ja liidit + vertailu edelliseen viikkoon.'],
          ['Ilmoitusosoite','Oletuksena käytetään tili-sähköpostiosoitetta. Voit asettaa erillisen osoitteen esim. tiimille tai myyntipostilaatikkoon.'],
          ['Testisähköposti','Klikkaa "Lähetä testisähköposti" -nappia – näet heti miltä ilmoitus näyttää.'],
          ['Ilmoitusten sammutus','Poista rasti ao. ruudusta ja klikkaa Tallenna – ilmoitukset lakkaa välittömästi.'],
        ]),

        isAdmin ? infoBlock('SMTP-asetukset (palvelimen ylläpitäjälle) – konfiguroidaan kerran .env-tiedostoon:',
        [
          ['Gmail (helpoin)','SMTP_HOST=smtp.gmail.com · SMTP_PORT=587 · SMTP_USER=sinun@gmail.com · SMTP_PASS=sovellussalasana. Sovellussalasana: Google-tili → Turvallisuus → Kaksivaiheinen todentaminen → Sovellussalasanat.'],
          ['Brevo (SendinBlue)','Ilmainen tili: 300 sähköpostia/vrk. SMTP_HOST=smtp-relay.brevo.com · SMTP_PORT=587. Luo API-avain Brecon dashboardista.'],
          ['Mailgun','SMTP_HOST=smtp.mailgun.org · SMTP_PORT=587. Hyvä vaihtoehto tuotantokäyttöön.'],
          ['APP_URL','Aseta myös APP_URL=https://sinundomain.fi – käytetään sähköpostien linkeissä.'],
        ]) : '',

        isAdmin ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;margin-top:10px">
  <span style="font-size:18px;flex-shrink:0">💡</span>
  <div style="font-size:13px;color:#78350f">
    <strong>Vinkki – Testaa Etherealilla:</strong> Luo ilmainen testitili osoitteessa <strong>ethereal.email</strong>. Sähköpostit "lähetetään" mutta näkyvät vain Etherealin web-käyttöliittymässä – ei päädy oikeaan postilaatikkoon.
  </div>
</div>` : ''
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
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Asetukset</div>
          ${fields.map(f => `<div style="font-size:12px;color:#374151;padding:3px 0;display:flex;align-items:flex-start;gap:6px"><span style="color:#22c55e;flex-shrink:0">•</span><span>${f}</span></div>`).join('')}
        </div>
      </div>
    </div>
  </details>`;
}

function infoBlock(intro, rows) {
  return `<div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;background:#fff;margin-bottom:10px">
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

function scenario(icon, titleColor, bgHeader, bgBorder, title, desc, code, tip) {
  return `<details style="border:1px solid ${bgBorder};border-radius:10px;overflow:hidden;margin-bottom:8px">
    <summary style="display:flex;align-items:center;gap:10px;padding:12px 16px;cursor:pointer;background:${bgHeader};list-style:none;user-select:none">
      <span style="font-size:18px">${icon}</span>
      <span style="font-size:13px;font-weight:700;color:${titleColor};flex:1">${title}</span>
      <i class="fa fa-chevron-down" style="color:#94a3b8;font-size:11px"></i>
    </summary>
    <div style="padding:16px;border-top:1px solid ${bgBorder};background:#fff">
      <p style="font-size:13px;color:#475569;margin:0 0 12px">${desc}</p>
      <pre style="background:#1e293b;color:#e2e8f0;padding:14px 16px;border-radius:8px;font-size:11px;font-family:monospace;white-space:pre-wrap;word-break:break-all;margin:0 0 10px;line-height:1.6">${code}</pre>
      ${tip ? `<div style="display:flex;align-items:flex-start;gap:6px;font-size:12px;color:#64748b"><span>💡</span><span>${tip}</span></div>` : ''}
    </div>
  </details>`;
}
