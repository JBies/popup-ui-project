# Tilastojenkerääjä – Käyttöopas

## Mikä on Tilastojenkerääjä?

Tilastojenkerääjä on elementtityyppi, joka **ei näytä mitään visuaalista sivustolla**, vaan rekisteröi ainoastaan näyttökerran kun skripti suoritetaan. Hyödyllinen kun haluat:

1. **Seurata kävijämäärää** tietylle sivulle ilman häiritseviä bannereitä
2. **Kerätä dataa** ennen kuin oikea elementti aktivoidaan
3. **Funnel-analytiikka** – kuinka moni saavuttaa tietyn vaiheen
4. **Kartoittaa sivuston suosituimpia osioita** puhtaasti ja häiritsemättä

## Luo Tilastojenkerääjä

1. Kirjaudu dashboardiin
2. Klikkaa **"+ Luo uusi"** → avautuu tyyppi-valitsin
3. Valitse **"👁️ Tilastot"** -kortti
4. Anna elementille nimi (esim. "Kassasivu – kävijämäärä")
5. Valitse sivusto (vapaaehtoinen)
6. Klikkaa **Tallenna**

Mitään muita asetuksia ei tarvita – pelkkä nimi riittää.

## Asennuskoodi

Käytä samaa asennuskoodia kuin muilla elementeillä. Suositeltava tapa:

```html
<!-- Lisää sivuston <head>-osioon kerran -->
<script src="https://popupmanager.net/ui-embed.js"
        data-site="SINUN_SIVUSTO_TOKEN"></script>
```

Token löytyy dashboardin **Asennuskoodi**-välilehdeltä.

## Tilastojen seuranta

1. Palaa dashboardiin
2. Etsi elementtikortti listasta
3. Klikkaa **"📊 Tilastot"** -painiketta
4. Näet:
   - **Näyttökerrat** – kuinka monta kertaa elementti on ladattu
   - **Klikkaukset** – jos elementtiin on asetettu linkki
   - **CTR** – klikkaprosentti
   - **Viimeisin näyttökerta**

## Muuta Tilastojenkerääjä tavalliseksi elementiksi

1. Etsi elementtikortti listasta → klikkaa **Muokkaa**
2. Koska elementtityyppiä ei voi vaihtaa tallennuksen jälkeen, poista tämä elementti ja luo uusi haluamallasi tyypillä

## Vianetsintä

**Tilastot eivät päivity:**
- Varmista että asennuskoodi on sivulla oikein
- Tarkista konsolilokit (F12 → Console)
- Varmista että elementti on aktiivinen (toggle päällä elementtikortissa)

**Palvelimen uudelleenkäynnistys (ylläpidolle):**
```
git pull origin master
pm2 restart all
pm2 logs
```

---

*Päivitetty: 13.4.2026*
