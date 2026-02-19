# Tilastojenkerääjä-popup - Käyttöopas

## Mikä on Tilastojenkerääjä-popup?

Tilastojenkerääjä on uusi popup-tyyppi, joka **ei näytä visuaalista popuppia** käyttäjille, vaan kerää tilastoja kävijöistä. Tämä on erinomainen työkalu, kun haluat:

1. **Testata sivuston liikennettä** ilman, että häiritset käyttäjiä popupeilla
2. **Kerätä dataa** siitä, kuinka monta kävijää sivullasi on
3. **Valmistella kampanjaa** - voit kerätä tietoa ennen kuin näytät oikean popupin
4. **A/B-testata** eri popup-versioita

## Kuinka se toimii?

1. **Luo Tilastojenkerääjä-popup** valitsemalla "Tilastojenkerääjä" popup-tyypiksi
2. **Upota popup** sivullesi normaaliin tapaan (sama embed-koodi)
3. **Kävijät eivät näe mitään** - popup ei näy visuaalisesti
4. **Tilastot kerääntyvät** automaattisesti:
   - Näyttökerrat (views)
   - Klikkaukset (clicks) - jos popupissa on linkki
   - Viimeisin näyttökerta
   - Viimeisin klikkaus

## Tekninen toteutus

### Popup-malli (`models/Popup.js`)
- Uusi `popupType: "stats_only"` 
- Ei vaadi sisältöä eikä kuvaa (toisin kuin muut popup-tyypit)
- Tilastot tallennetaan normaaliin `statistics`-kenttään

### Embed-skripti (`public/popup-embed.js`)
- Tarkistaa popup-tyypin
- Jos tyyppi on `stats_only`:
  - Rekisteröi näyttökerran (`/api/popups/view/:id`)
  - **EI luo visuaalista popuppia**
  - Pysäyttää suorituksen

### API-reitit
- Sama API kuin normaalille popupille
- `GET /api/popups/embed/:id` - palauttaa popup-tiedot
- `POST /api/popups/view/:id` - rekisteröi näyttökerran
- `POST /api/popups/click/:id` - rekisteröi klikkauksen (jos linkki on määritetty)

## Käyttöohje

### 1. Luo Tilastojenkerääjä-popup

1. Kirjaudu Popup Manageriin
2. Valitse "Tee uusi Popup"
3. Valitse "Popupin Tyyppi" -kohdasta **"Tilastojenkerääjä"**
4. Anna popupille nimi (esim. "Sivuston X kävijätilastot")
5. **Huom!** Sisältö, kuva ja väriasetukset eivät ole pakollisia
6. Voit asettaa ajastuksen (delay, duration, start/end date) kuten normaalistikin
7. Voit lisätä linkin, jos haluat seurata klikkauksia
8. Luo popup

### 2. Muuta olemassa olevaa popuppia tilastojenkerääjäksi

1. Mene "Sinun popupit" -osioon
2. Etsi popup, jonka haluat muuttaa tilastojenkerääjäksi
3. Klikkaa "Muokkaa" -painiketta
4. Vaihda "Popupin Tyyppi" -kohdasta **"Tilastojenkerääjä"**
5. **Huom!** Voit jättää sisällön ja kuvan tyhjäksi
6. Tallenna muutokset
7. Popup muuttuu tilastojenkerääjäksi ja lakkaa näyttämästä visuaalista popuppia

### 3. Muuta tilastojenkerääjä-popuppia takaisin näkyväksi popupiksi

1. Mene "Sinun popupit" -osioon
2. Etsi tilastojenkerääjä-popup, jonka haluat muuttaa näkyväksi
3. Klikkaa "Muokkaa" -painiketta
4. Vaihda "Popupin Tyyppi" -kohdasta joko "Pelkkä kuvatiedosto", "Neliö" tai "Ympyrä"
5. **Huom!** Nyt sinun täytyy lisätä joko sisältö tai kuva
6. Tallenna muutokset
7. Popup muuttuu takaisin näkyväksi popupiksi ja alkaa näyttämään visuaalista popuppia

### 4. Upota popup sivullesi

1. Mene "Sinun popupit" -osioon
2. Etsi luomasi Tilastojenkerääjä-popup
3. Kopioi embed-koodi:
   ```html
   <script src="https://popupmanager.net/popup-embed.js"></script>
   <script>
     window.addEventListener('load', function() {
       ShowPopup('POPUP_ID');
     });
   </script>
   ```
4. Liitä koodi sivustosi HTML-tiedostoon

### 5. Seuraa tilastoja

1. Palaa Popup Manageriin
2. Mene "Sinun popupit" -osioon
3. Klikkaa tilastot-nappia (kuvake: 📊) popupin kohdalla
4. Näet:
   - Näyttökerrat (kuinka monta kertaa popup on ladattu)
   - Klikkaukset (jos linkki on määritetty)
   - Klikkaprosentti (CTR)
   - Viimeisin näyttökerta
   - Viimeisin klik
   ```

3. **Päivitä koodi GitHubista**:
   ```
   git pull origin master
   ```

4. **Käynnistä palvelin uudelleen**:
   ```
   pm2 restart all
   ```

5. **Tarkista lokit** (valinnainen):
   ```
   pm2 logs
   ```

### Tärkeitä komentoja:

- `git pull origin master` - Hae uusin koodi GitHubista
- `pm2 restart all` - Käynnistä kaikki prosessit uudelleen
- `pm2 logs` - Näytä reaaliaikaiset lokit
- `pm2 status` - Tarkista prosessien tila

## Vianetsintä

### Popup ei kerää tilastoja
1. Tarkista että popup-tyyppi on "stats_only"
2. Tarkista konsolilokit (F12 → Console)
3. Varmista että `popup-embed.js` latautuu oikein
4. Tarkista että API-pyynnöt menevät läpi (Network-välilehti)

### Tilastot eivät päivity
1. Odota muutama minuutti - tilastot päivittyvät reaaliaikaisesti
2. Tarkista palvelimen lokit: `pm2 logs`
3. Varmista että MongoDB on käynnissä

### Admin-näkymässä ei näy tilastoja
1. Varmista että olet kirjautunut admin-tilillä
2. Päivitä sivu
3. Tarkista konsoli virheilmoituksia varten

## Tulevaisuuden kehitysmahdollisuudet

1. **Laajennetut tilastot**:
   - Käyttäjän agentti (selain, laite)
   - IP-osoite (anonymisoituna)
   - Viittaava sivu
   - Resoluutio/näytön koko

2. **Reaaliaikainen seuranta**:
   - Live-kävijälaskuri
   - Kartta kävijöiden sijainneista

3. **Integraatiot**:
   - Google Analytics
   - Facebook Pixel
   - Custom webhookit

4. **Raportointi**:
   - CSV/JSON-vienti
   - Automaattiset raportit sähköpostiin
   - Kaaviot ja visualisointi

## Teknisiä tietoja

- **Teknologia**: Node.js, Express, MongoDB
- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **Hosting**: Digital Ocean
- **Versionhallinta**: GitHub
- **Prosessinhallinta**: PM2

## Yhteystiedot

- **Ongelmatilanteissa**: tarkista ensin yllä olevat vianetsintävaiheet
- **Kehitysideat**: lähetä GitHub-issue
- **Kriittiset ongelmat**: ota yhteyttä ylläpitoon

---

*Tämä opas päivitetty: 19.2.2026*