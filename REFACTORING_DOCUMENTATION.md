# Refaktorointidokumentaatio: index.html

## Yleiskatsaus

Alkuperäinen `index.html`-tiedosto oli 1500 riviä pitkä monoliittinen tiedosto, joka sisälsi:
- 314 riviä inline-CSS:ää
- Monimutkaisen HTML-rakenteen
- Inline-JavaScriptiä modaaleihin ja animaatioihin
- Toistuvaa koodia eri komponenteissa

Refaktorointi jakoi tämän modulaariseen rakenteeseen, joka on:
- **Ylläpidettävämpi** - muutokset tehdään pienempiin tiedostoihin
- **Uudelleenkäytettävä** - komponentit voidaan käyttää uudelleen
- **Suorituskykyisempi** - CSS cachettuu, JavaScript modulaarista
- **Selkeämpi** - erilliset tiedostot eri vastuualueille

## Uusi tiedostorakenne

### CSS
```
css/landing/
├── base.css              # Perustyylit, muuttujat, reset
├── main.css             # Päätyylitiedosto (importtaa muut)
├── animations.css       # Animaatiot ja siirtymät
├── components/          # Komponenttityylit
│   ├── cards.css       # Korttityylit (feature, power, pricing)
│   ├── buttons.css     # Painiketyylit
│   └── previews.css    # Esikatselukomponenttien tyylit
└── sections/           # Osiokohtaiset tyylit
    └── hero.css        # Hero-osion tyylit
```

### JavaScript
```
js/landing/
├── main.js              # Päämoduuli (importtaa muut)
├── scroll-animations.js # Scroll-animaatiot
├── contact-modal.js     # Yhteydenottomodaalin logiikka
└── user-detection.js    # Käyttäjätunnistus ja kielivalinta
```

### HTML
- `index-refactored.html` - Refaktoroitu versio
- `test-refactored.html` - Testisivu kaikille komponenteille

## Mitä muutettiin

### 1. CSS:n erottaminen
- **Inline-CSS poistettu**: 314 riviä CSS:ää siirrettiin ulkoisiin tiedostoihin
- **CSS-muuttujat**: Luotiin `:root`-muuttujat väreille, varjoille, radiusille
- **Komponenttipohjainen**: Jokaiselle komponenttityypille oma CSS-tiedosto
- **Responsiivisuus**: Media queryt säilytettiin mutta organisoitiin paremmin

### 2. JavaScriptin modularisointi
- **Moduulirakenne**: ECMAScript moduulit (ES6) import/export
- **Selkeät vastuualueet**:
  - `scroll-animations.js` - Scroll-fade efektit
  - `contact-modal.js` - Modaalin avaaminen/sulkeminen, lomakkeen käsittely
  - `user-detection.js` - Käyttäjätunnistus, kielivalinta
- **Automaattinen initialisointi**: Moduulit initialisoituvat automaattisesti

### 3. HTML:n siistiminen
- **Inline-stylet minimoitu**: Vain kriittiset tyylit jätetty inlineen
- **Semanttiset luokat**: Selkeämmät CSS-luokat
- **Data-attribuutit**: `data-i18n` säilytettiin kielituen vuoksi

## Hyödyt

### Kehitys
1. **Nopeampi kehitys**: Komponentteja voidaan muokata erikseen
2. **Vähemmän virheitä**: Pienemmät tiedostot = vähemmän bugien mahdollisuuksia
3. **Parempi ylläpidettävyys**: Muutokset lokalisoituvat pienempiin tiedostoihin

### Suorituskyky
1. **CSS cache**: Ulkoiset CSS-tiedostot cachettuvat selaimessa
2. **JavaScript moduulit**: Vain tarvittavat moduulit ladataan
3. **Pienempi HTML**: Nopeampi latausaika, parempi SEO

### Tulevaisuus
1. **Laajennettavuus**: Uusia komponentteja voidaan lisätä helposti
2. **Testattavuus**: Komponentteja voidaan testata erikseen
3. **Ylläpidettävyys**: Uudet kehittäjät ymmärtävät rakenteen nopeammin

## Testaus

Testisivu `test-refactored.html` sisältää:
- Kaikki refaktroidut CSS-komponentit
- JavaScript-moduulien testit
- Scroll-animaatioiden testit
- Modaalin testit

## Seuraavat vaiheet

### 1. Tuotantoon siirtyminen
1. Varmista että `index-refactored.html` toimii kaikilla selaimilla
2. Testaa responsiivisuus eri näyttökokoilla
3. Varmista että kaikki JavaScript-toiminnot toimivat

### 2. Lisäoptimointi
1. **CSS-minimointi**: Yhdistä CSS-tiedostot tuotantoon
2. **JavaScript bundling**: Käytä esbuild/vite bundleria
3. **Image optimization**: Optimoi kuvat

### 3. Laajennusmahdollisuudet
1. **Build-prosessi**: Lisää CSS preprocessor (Sass/PostCSS)
2. **Templating**: Lisää HTML templating (Nunjucks, Handlebars)
3. **Component library**: Kehitä täysin uudelleenkäytettävä komponenttikirjasto

## Tiedostojen kuvaukset

### CSS-tiedostot
- `base.css` - CSS-muuttujat, perustyylit, reset
- `cards.css` - FeatureCard, PowerCard, PricingCard komponentit
- `buttons.css` - Kaikki painiketyypit (primary, secondary, mock)
- `previews.css` - Esikatselukomponentit (browser mockup, element previews)
- `animations.css` - Animaatiot (blobs, fade, slide, pulse)
- `hero.css` - Hero-osion spesifiset tyylit
- `main.css` - Päätyylitiedosto joka importtaa kaikki muut

### JavaScript-tiedostot
- `scroll-animations.js` - Intersection Observer -pohjaiset scroll-animaatiot
- `contact-modal.js` - Yhteydenottomodaalin koko logiikka
- `user-detection.js` - Käyttäjätunnistus ja kielivalinta
- `main.js` - Päämoduuli joka koordinoi kaikkia toimintoja

## Ongelmat ja ratkaisut

### Ongelma 1: Inline-CSS riippuvuudet
**Ratkaisu**: Luotiin CSS-muuttujat (`:root`) ja siirrettiin kaikki tyylit ulkoisiin tiedostoihin

### Ongelma 2: JavaScript riippuvuudet
**Ratkaisu**: Modulaarinen rakenne jossa jokaisella moduulilla on selkeä vastuualue

### Ongelma 3: Toistuva koodi
**Ratkaisu**: Komponenttipohjainen rakenne jossa yhteiset osat eriytetään

## Suorituskykymittaukset

### Ennen refaktorointia
- HTML koko: ~1500 riviä
- Inline-CSS: 314 riviä
- Inline-JS: ~200 riviä
- Latausaika: Suurempi (kaikki yhdessä tiedostossa)

### Refaktoroinnin jälkeen
- HTML koko: ~300 riviä (kevyempi)
- CSS: 7 erillistä tiedostoa (cachettuvat)
- JS: 4 modulaarista tiedostoa (ladataan tarvittaessa)
- Latausaika: Pienempi (rinnakkaiset lataukset, cache)

## Käyttöohjeet

### Uusien komponenttien lisääminen
1. Lisää komponentin tyylit `css/landing/components/`-hakemistoon
2. Lisää tarvittaessa JavaScript-logiikka `js/landing/`-hakemistoon
3. Importtaa uudet tyylit `css/landing/main.css`:ään
4. Importtaa uudet JavaScript-moduulit `js/landing/main.js`:ään

### Muutosten tekeminen
1. Etsi oikea CSS/JS-tiedosto komponenttityypin mukaan
2. Tee muutokset kyseiseen tiedostoon
3. Testaa muutokset `test-refactored.html`:llä
4. Varmista että muutokset eivät riko muita osia

### Tuotantoon vieminen
1. Varmista että kaikki testit menevät läpi
2. Tarkista konsolivirheet
3. Testaa eri selaimilla
4. Korvaa `index.html` refaktroidulla versiolla