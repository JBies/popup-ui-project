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
            <div style="font-size:13px;color:#166534"><strong>Lisää asennuskoodi</strong> – Asennuskoodi-välilehdeltä löydät yksirivisen skriptin joka lisätään sivustosi &lt;head&gt;-osioon. Tehdään vain kerran.</div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="width:24px;height:24px;border-radius:50%;background:#16a34a;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">2</div>
            <div style="font-size:13px;color:#166534"><strong>Luo elementti</strong> – Klikkaa "+ Uusi elementti" → valitse tyyppi → täytä tekstikentät (ei koodausta tarvita) → tallenna.</div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="width:24px;height:24px;border-radius:50%;background:#16a34a;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">3</div>
            <div style="font-size:13px;color:#166534"><strong>Aktivoi</strong> – Kytke elementtikortin kytkin päälle. Elementti alkaa näkyä sivustollasi välittömästi – ei tarvitse muuttaa sivuston koodia uudelleen.</div>
          </div>
        </div>
      </div>

      <!-- Elementtityypit -->
      ${section('fa-layer-group','Elementtityypit','Mitä voit rakentaa', [
        card('fa-minus','#1d4ed8','Sticky Bar',
          'Kiinteä palkki sivun ylä- tai alareunassa. Pysyy näkyvissä vaikka käyttäjä scrollaa. Valitse valmisviesti tai kirjoita oma.',
          ['Kampanjakoodi tai tarjous','Cookie/GDPR-ilmoitus','Varhaisen rekisteröinnin CTA','Tärkeä ilmoitus kaikille kävijöille'],
          ['6 valmisviestimallia – klikkaa tai kirjoita oma','Max 3 toimintanappia (teksti + URL + tyyli)','Sijainti ylös tai alas','Sulkemismuisti: sessio / 1pv / viikko / kuukausi']),

        card('fa-circle','#6d28d9','Floating Button (FAB)',
          'Pyöreä kelluva nappi sivun kulmassa. Sopii chat-, puhelin- tai "takaisin ylös" -toiminnoille. Ponnahdusikkuna sisältää selkeät tekstikentät – ei koodausta.',
          ['Live chat -avaus','Soittopyyntö','Varaa aika -nappi','Takaisin sivun alkuun'],
          ['12 ikonia valittavissa visuaalisesta ruudukosta','Toiminto: avaa linkki TAI ponnahdusikkuna','Ponnahdusikkuna: otsikko / teksti / nappi – selkeät kentät','Pulssi-animaatio, koko ja väri säädettävissä']),

        card('fa-comment-dots','#16a34a','Slide-in',
          'Animoitu boksi, joka liukuu esiin sivun kulmasta. Valitse valmis malli (5 eri pohjaa) ja täytä vain tekstit – ei koodausta.',
          ['Uutiskirjetilaus 50% scrollin jälkeen','Alennustarjous 30s viiveen jälkeen','Exit intent – viimeinen mahdollisuus','Mobiilioptimoitu CTA'],
          ['5 valmismallia – Ilmoitus / Tarjous / Kehotus / Exit Intent / Luottamus','Triggerit – aika / scroll / exit intent (omat arvot)','4 sijainta – kaikki kulmat','Leveys ja värit säädettävissä']),

        card('fa-square','#475569','Popup',
          'Perinteinen modaali-popup. Valitse tyyppi (📢 Ilmoitus / 🎉 Tarjous / 🖼️ Kuva / 🚪 Exit Intent) ja täytä tekstikentät – ei HTML-koodausta.',
          ['Tervetuloviesti uusille kävijöille','Exit intent – "Odota, tässä tarjous"','Kuva + CTA -mainospopup','Tarjouskoodi viiveen jälkeen'],
          ['4 popup-tyyppiä valittavissa korteilla','Otsikko / teksti / nappi – selkeät kentät','Kuvapopup – lataa kuva suoraan tai valitse kirjastosta','Animaatio, sijainti ja värit säädettävissä']),

        card('fa-users','#d97706','Social Proof',
          'Pieni vilahteleva ilmoitus sivun kulmassa: "12 henkilöä katsoo nyt tätä sivua". Kasvattaa luottamusta ja ostohalua.',
          ['E-commerce: "12 henkilöä katsoo tätä tuotetta"','Palvelu: "5 henkilöä varasi ajan tällä viikolla"','Reaaliaikaiset katsojamäärät','Aidon näköiset aktiviteetti-ilmoitukset'],
          ['5 viestipohjaa – klikkaa malli tai kirjoita oma','{count} korvautuu automaattisesti numerolla','0 = käyttää oikeita sivustotilastoja','Ikoni, värit ja ajoitus säädettävissä']),

        card('fa-arrows-alt-v','#e11d48','Scroll Progress',
          'Ohut palkki sivun ylä- tai alareunassa, joka kasvaa sitä mukaa kun käyttäjä scrollaa. Pitää käyttäjän sivulla pidempään.',
          ['Blogitekstit ja pitkät artikkelit','Tuote-esittelysivut','Monivaiheinen ostoprosessi','Kaikki pitkät laskeutumissivut'],
          ['progressPosition – top tai bottom','progressHeight – paksuus 2–12px','progressColor – palkin väri','backgroundColor – taustaväri']),

        card('fa-envelope','#065f46','Lead Form',
          'Liidilomake, joka kerää yhteystietoja suoraan tietokantaan. Kentät ovat täysin konfiguroitavissa. Liidit näkyvät tilastoissa.',
          ['Yhteydenottopyyntö','Uutiskirjetilaus','Varaa demo -lomake','Kilpailun osallistuminen'],
          ['leadFields – lista kentistä (teksti/email/puhelin/textarea)','leadSubmitText – lähetä-napin teksti','leadSuccessMsg – onnistumisviesti','Kaikki liidit tallentuvat automaattisesti']),

        card('fa-chart-bar','#64748b','Tilastojen kerääjä',
          'Näkymätön tilastopiste — ei näytä kävijöille mitään visuaalista elementtiä. Rekisteröi ainoastaan näyttökerran kun skripti suoritetaan sivulla. Hyödyllinen kun haluat seurata tietyn sivun kävijämäärää ilman häiritseviä popupeja tai bannereitä.',
          ['Kävijämäärän seuranta tietylle sivulle','Funnel-analytiikka: kuinka moni saavuttaa tietyn kohdan','Sivuston suosituimpien osioiden kartoitus','A/B-testaus sivuston liikenteelle'],
          ['Ei visuaalisia asetuksia – pelkkä nimi riittää','Tilastot näkyvät normaalisti dashboardissa','Asenna samalla skriptillä kuin muut elementit','Ei häiritse sivuston ulkoasua lainkaan'])
      ])}

      <!-- Kuvakirjasto -->
      ${section('fa-images','Kuvakirjasto','Hallitse kuvia ja lisää niitä elementteihin', [
        infoBlock('Kuvakirjastosta löydät kaikki lataamasi kuvat. Kuvat tallennetaan pilveen ja ovat käytettävissä elementtien muokkauksessa.',
        [
          ['Missä kuvakirjasto on','Dashboard-sivupalkin linkki <strong>Kuvakirjasto</strong>. Kaikki aiemmin lataamasi kuvat näkyvät ruudukkonäkymässä.'],
          ['Kuvan lataaminen','Kuvakirjastossa: klikkaa <em>Lataa uusi kuva</em> -nappia ja valitse tiedosto. Kuvat pakataan automaattisesti jos ne ovat yli 950 KB.'],
          ['Kuvan käyttö popupissa','Avaa Popup-elementti muokkaukseen → vaihda tyypiksi <em>Kuvapopup</em> → klikkaa <em>Valitse kirjastosta</em> tai <em>Lataa kuva</em> suoraan editorista.'],
          ['Tuetut tiedostomuodot','JPG, PNG, GIF, WebP. Suositeltu maksimikoko 5 MB (pakataan automaattisesti alle 950 KB).'],
          ['Kuvan URL leikepöydälle','Kuvakirjastossa: klikkaa kuvan esikatselua → URL kopioidaan leikepöydälle. Käyttökelpoinen jos tarvitset suoran linkin muualle.'],
          ['Kuvan poistaminen','Vie hiiri kuvan päälle → klikkaa punainen roskakori-ikoni. Kuvaa ei voi poistaa jos se on käytössä jossakin elementissä.'],
          ['Kuvalinkit eivät vanhene','Kuvat tallennetaan turvallisesti pilveen. Linkit ovat voimassa 7 päivää kerrallaan ja päivittyvät automaattisesti – kuvat näkyvät aina oikein sivustollasi.'],
        ]),

        `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;margin-top:10px">
          <span style="font-size:18px;flex-shrink:0">💡</span>
          <div style="font-size:13px;color:#78350f">
            <strong>Vinkki – kuvapopup nopeasti:</strong> Avaa uuden Popup-elementin luonti → vaihda tyyppi <em>Kuvapopupiksi</em> → klikkaa <em>Lataa kuva</em> editorin kuvaosassa. Kuva latautuu suoraan kirjastoon ja asetetaan samalla popuppiin – ei tarvitse käydä erikseen kuvakirjastossa.
          </div>
        </div>`
      ])}

      <!-- Targeting -->
      ${section('fa-crosshairs','Kohdennus','Näytä elementti juuri oikealle henkilölle oikeaan aikaan', [
        infoBlock('Kohdennus-paneeli löytyy jokaisen elementin editorin alaosasta. Aktivoi se rastilla ja lisää ehtoja.',
        [
          ['Pikavalinnat','Klikkaa valmista pikavalintalinkkiä (esim. "📱 Vain mobiili") – ehto lisätään automaattisesti ilman kirjoittamista'],
          ['URL sisältää','Näytä vain tietyillä sivuilla. Kirjoita osa URL:ista, esim. <em>/tuotteet</em> tai <em>checkout</em>'],
          ['Laite on','Valitse pudotusvalikosta: Mobiili / Desktop / Tabletti'],
          ['Tulolähde sisältää','Kävijä tuli Googlesta → kirjoita <em>google</em>. Facebookista → <em>facebook.com</em>'],
          ['Scrollattu (%)','Näytä vasta kun kävijä on scrollannut vähintään 50% – kirjoita <em>50</em>'],
          ['Aika sivulla (s)','Näytä 30 sekunnin jälkeen – kirjoita <em>30</em>'],
          ['Kävijätyyppi on','Valitse: Uusi kävijä tai Palaava kävijä'],
          ['Viikonpäivä on','Valitse päivä pudotusvalikosta: Maanantai–Sunnuntai'],
          ['Kellonaika (0–23)','Näytä vain aukioloaikoina: "jälkeen 9" JA "ennen 17" – lisää kaksi ehtoa'],
          ['Useampi ehto','Oletuksena kaikki ehdot täyttyvät (AND). Vaihda "jokin ehto täyttyy" jos haluat OR-logiikan'],
        ])
      ])}

      <!-- A/B testaus -->
      ${section('fa-flask','A/B-testi','Testaa kumpi versio toimii paremmin – automaattisesti', [
        infoBlock('A/B-testi-paneeli löytyy jokaisen elementin editorin alareunasta. Luo kaksi versiota elementistäsi ilman mitään lisätyötä.',
        [
          ['Miten se toimii','Puolet kävijöistä näkee version A (nykyinen elementti), puolet version B. Dashboard näyttää automaattisesti kumpi voittaa.'],
          ['Liikennejako','Visuaalinen palkki: siirrä slideria 10–90%. Esim. 50% näkee A, 50% näkee B. Voit myös testata 10/90-jaolla varovaisesti.'],
          ['Versio B: otsikko / teksti','Vaihda pääotsikko tai viesti – testaa eri arvolupauksia: "Ilmainen toimitus" vs "Säästä 20%"'],
          ['Versio B: napin teksti','Testaa CTA-nappia: "Tilaa nyt" vs "Osta heti" vs "Katso tarjous" – pienet sanat voivat tehdä ison eron'],
          ['Versio B: värit','Testaa eri taustavärejä: punainen vs sininen vs vihreä – väri vaikuttaa konversioon'],
          ['Tulokset','Dashboard → Tilastot → valitse elementti → näet A:n ja B:n CTR-prosentit vierekkäin. Valitse voittaja.'],
          ['Päätös','Kun voittaja selvillä: poista A/B-testi käytöstä ja päivitä elementti voittajan asetuksiin.'],
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

      <!-- Sivustot & asennuskoodi -->
      ${section('fa-code','Asennuskoodi','Valitse tilanteeseesi sopiva tapa', [
        `<div style="display:flex;flex-direction:column;gap:10px">

          ${scenario('⭐','#1d4ed8','#eff6ff','#dbeafe',
            'Skenaario 1 – Kaikki elementit automaattisesti (suositeltava)',
            'Lisää <strong>yksi rivi</strong> sivustosi &lt;head&gt;-osioon. Kaikki aktiiviset elementit latautuvat itsestään – ei muita koodirivejä tarvita koskaan.',
            '&lt;!-- Lisää sivuston &lt;head&gt;-osioon kerran --&gt;\n&lt;script src="https://popupmanager.net/ui-embed.js"\n        data-site="SINUN_SIVUSTO_TOKEN"&gt;&lt;/script&gt;',
            'Token löytyy Asennuskoodi-välilehdeltä. Luo ensin sivusto sieltä.'
          )}

          ${scenario('📌','#374151','#f8fafc','#e2e8f0',
            'Skenaario 2 – Yksi elementti yhdelle sivulle',
            'Haluat näyttää tietyn elementin vain yhdellä sivulla. Lisää pääskripti &lt;head&gt;-osioon ja kutsu ShowElement() halutulla sivulla.',
            '&lt;!-- head-osioon (kerran per sivusto) --&gt;\n&lt;script src="https://popupmanager.net/ui-embed.js"&gt;&lt;/script&gt;\n\n&lt;!-- sivun loppuun tai &lt;body&gt;-osioon --&gt;\n&lt;script&gt;ShowElement(\'ELEMENTIN_ID\');&lt;/script&gt;',
            'Elementin ID löytyy elementtikortin 📊 Tilastot-painikkeesta.'
          )}

          ${scenario('✅','#15803d','#f0fdf4','#bbf7d0',
            'Skenaario 3 – Useita elementtejä samalla sivulla (esim. sticky bar + popup)',
            '<strong>Kyllä onnistuu!</strong> Kahdella tavalla: käytä data-site (lataa kaikki automaattisesti) tai kutsu ShowElement() useampaan kertaan – yksi kutsu per elementti.',
            '&lt;!-- Tapa A: data-site lataa KAIKKI automaattisesti --&gt;\n&lt;script src="https://popupmanager.net/ui-embed.js"\n        data-site="SINUN_TOKEN"&gt;&lt;/script&gt;\n\n&lt;!-- Tapa B: Valitse tarkasti mitä näytetään --&gt;\n&lt;script src="https://popupmanager.net/ui-embed.js"&gt;&lt;/script&gt;\n&lt;script&gt;\n  ShowElement(\'sticky-bar-id\');  // sticky bar\n  ShowElement(\'popup-id\');       // popup\n  ShowElement(\'fab-id\');         // floating button\n&lt;/script&gt;',
            'Ei rajoituksia kuinka monta ShowElement()-kutsua voit tehdä.'
          )}

          ${scenario('🌐','#6d28d9','#f5f3ff','#ede9fe',
            'Skenaario 4 – Eri elementtejä eri sivuille',
            'Haluat esim. exit-popup vain kassasivulle ja sticky barin kaikille sivuille. Lisää pääskripti joka sivulle, mutta ShowElement()-kutsu vain oikealle sivulle.',
            '&lt;!-- Etusivu (index.html) --&gt;\n&lt;script src="...ui-embed.js"&gt;&lt;/script&gt;\n&lt;script&gt;ShowElement(\'hero-popup-id\');&lt;/script&gt;\n\n&lt;!-- Tuotesivu (product.html) --&gt;\n&lt;script src="...ui-embed.js"&gt;&lt;/script&gt;\n&lt;script&gt;ShowElement(\'discount-bar-id\');&lt;/script&gt;\n\n&lt;!-- Kassasivu (checkout.html) --&gt;\n&lt;script src="...ui-embed.js"&gt;&lt;/script&gt;\n&lt;script&gt;ShowElement(\'exit-intent-id\');&lt;/script&gt;',
            'Vinkki: Voit myös käyttää Targeting-sääntöjä URL-osoitteen perusteella yhdessä data-site-koodissa.'
          )}

        </div>`
      ])}

      <!-- Liidit -->
      ${section('fa-inbox','Liidit','Kerätyt yhteystiedot ja lomakelähetykset', [
        infoBlock('Lead Form -elementti tallentaa kaikki lomakelähetykset automaattisesti. Voit tarkastella niitä Liidit-välilehdellä dashboardissa.',
        [
          ['Missä liidit näkyvät','Dashboard → Liidit-välilehti. Näet kaikki yhteystiedot taulukossa.'],
          ['Suodatus','Suodata elementin tai päivämäärän mukaan'],
          ['A/B-variantti','Taulukossa näkyy kumpi variantti (A/B) liidi lähetti'],
          ['CSV-vienti','Lataa kaikki liidit Excel/CSV-tiedostona yhdellä napin painalluksella'],
          ['Webhook','Lähetä liidi reaaliajassa Zapieriin tai Make.comiin Webhooks-välilehdeltä'],
          ['Kentät','Lomakkeen kentät määritetään Lead Form -editorissa (teksti, email, puhelin, textarea)'],
        ])
      ])}

      <!-- Sähköposti-ilmoitukset -->
      ${section('fa-envelope','Sähköposti-ilmoitukset','Automaattiset ilmoitukset ja viikkoraportti', [
        infoBlock('Asetukset löytyvät <strong>Dashboard → Asennuskoodi-välilehti → Sähköposti-ilmoitukset</strong> -osiosta. Ei erillistä integraatiota tarvita.',
        [
          ['Liidi-ilmoitus','Saat sähköpostin heti kun Lead Form -elementtiin tulee uusi lähetys. Viesti sisältää kaikki lomakkeen kentät ja suoran "Vastaa liidiin" -napin.'],
          ['Viikkoraportti','Joka maanantai klo 8:00 saat yhteenvedon: näyttökerrat, klikkaukset ja liidit + vertailu edelliseen viikkoon. Top 3 parhaiten suoriutunutta elementtiä.'],
          ['Ilmoitusosoite','Oletuksena käytetään tili-sähköpostiosoitetta (<em>kirjautumiseen käytetty email</em>). Voit asettaa erillisen osoitteen esim. tiimisähköpostille tai myyntipostilaatikkoon — kirjoita osoite kenttään ja tallenna.'],
          ['Testisähköposti','Klikkaa "Lähetä testisähköposti" -nappia asetuksissa – näet heti miltä ilmoitus näyttää ennen kuin ensimmäinen liidi saapuu.'],
          ['Ilmoitusten sammutus','Poista rasti "Liidi-ilmoitus" tai "Viikkoraportti" -ruudusta ja klikkaa Tallenna – ilmoitukset lakkaa välittömästi.'],
          ['Aktivointi','Ominaisuus aktivoituu automaattisesti kun palvelimen SMTP-asetukset on konfiguroitu. Jos et saa sähköposteja, ota yhteyttä ylläpitoon.'],
        ]),

        // SMTP-konfiguraatio vain adminille – tavallinen käyttäjä ei aseta .env-tietoja
        isAdmin ? infoBlock('SMTP-asetukset (palvelimen ylläpitäjälle) – konfiguroidaan kerran palvelimen .env-tiedostoon, pätee kaikille käyttäjille:',
        [
          ['Gmail (helpoin tapa)','SMTP_HOST=smtp.gmail.com · SMTP_PORT=587 · SMTP_USER=sinun@gmail.com · SMTP_PASS=sovellussalasana. Sovellussalasana luodaan: Google-tili → Turvallisuus → Kaksivaiheinen todentaminen (ensin päälle) → Sovellussalasanat → Luo uusi.'],
          ['Brevo (SendinBlue)','Ilmainen tili: 300 sähköpostia/vrk. SMTP_HOST=smtp-relay.brevo.com · SMTP_PORT=587 · SMTP_USER=sinun@email.com · SMTP_PASS=brevo-api-avain. Luo API-avain Brecon dashboardista.'],
          ['Mailgun','SMTP_HOST=smtp.mailgun.org · SMTP_PORT=587 · SMTP_USER=postmaster@sandbox.mailgun.org · SMTP_PASS=mailgun-salasana. Hyvä vaihtoehto tuotantokäyttöön.'],
          ['Zoho Mail','SMTP_HOST=smtp.zoho.eu · SMTP_PORT=587 · SMTP_USER=noreply@sinundomain.fi · SMTP_PASS=salasana. Hyvä jos haluat oman domainin sähköpostiosoitteen.'],
          ['Hosting-palvelun SMTP','Useimmat hosting-palvelut (cPanel, Plesk) tarjoavat SMTP-palvelimen ilmaiseksi. Löydät tiedot hosting-palvelusi hallintapaneelista tai asiakaspalvelusta.'],
          ['APP_URL','Aseta myös APP_URL=https://sinundomain.fi – käytetään sähköpostien linkeissä (esim. "Avaa dashboard" -nappi).'],
        ]) : '',

        isAdmin ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;margin-top:10px">
  <span style="font-size:18px;flex-shrink:0">💡</span>
  <div style="font-size:13px;color:#78350f">
    <strong>Vinkki – Testaa ensin Etherealilla:</strong> Jos et halua käyttää oikeaa sähköpostitiliä testaukseen, luo ilmainen testitili osoitteessa <strong>ethereal.email</strong>. Sähköpostit "lähetetään" mutta näkyvät vain Etherealin web-käyttöliittymässä – ei päädy oikeaan postilaatikkoon.
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

function scenario(icon, titleColor, bgHeader, bgBorder, title, desc, code, tip) {
  return `<details style="border:1px solid ${bgBorder};border-radius:10px;overflow:hidden">
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
