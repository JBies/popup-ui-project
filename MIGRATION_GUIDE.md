# Migration Guide: index.html refaktorointi

Tämä opas auttaa siirtymään alkuperäisestä monoliittisesta `index.html`:stä refaktoroituun modulaariseen rakenteeseen.

## Vaihe 1: Varmista että refaktoroitu koodi toimii

1. **Avaa testisivu**: Avaa `test-refactored.html` selaimessa
2. **Testaa kaikki komponentit**:
   - Feature card hover efektit
   - Scroll-animaatiot (scrollaa alas ja ylös)
   - Contact modal (avaa ja sulje)
   - Pro upgrade -nappi
   - Browser mockup
   - Element previews
3. **Tarkista konsoli**: Varmista että ei ole JavaScript-virheitä
4. **Testaa responsiivisuus**: Muuta selaimen kokoa ja tarkista että kaikki näkyy oikein

## Vaihe 2: Korvaa alkuperäinen index.html

### Vaihtoehto A: Käytä refaktoroitua versiota suoraan
1. Varmista että `index-refactored.html` sisältää kaikki alkuperäisen toiminnallisuudet
2. Nimeä `index.html` → `index-old.html` (varmuuskopio)
3. Nimeä `index-refactored.html` → `index.html`

### Vaihtoehto B: Siirrä refaktorointi asteittain
1. Kopioi CSS-linkit alkuperäiseen `index.html`:ään:
```html
<!-- Lisää head-osioon -->
<link rel="stylesheet" href="css/landing/main.css">
```

2. Poista inline-CSS (rivit 33-347) ja korvaa ne yllä olevalla linkillä

3. Siirrä JavaScript moduuleihin:
```html
<!-- Korvaa script-osiot (rivit 1310-1498) -->
<script type="module" src="js/landing/main.js"></script>
<script type="module" src="js/i18n.js"></script>
```

## Vaihe 3: Testaa tuotantoympäristössä

1. **Käynnistä dev-server**: `npm start` tai `node server.js`
2. **Avaa localhost**: Varmista että sivu latautuu oikein
3. **Testaa kaikki linkit**: 
   - Google Sign-in
   - Anchor links (#elementit, #ominaisuudet, jne.)
   - Dashboard redirect (jos kirjautunut)
4. **Tarkista konsoli virheet**
5. **Testaa eri selaimilla**: Chrome, Firefox, Safari

## Vaihe 4: Optimoi suorituskyky

### CSS optimointi
1. **Yhdistä CSS-tiedostot** tuotantoon:
```bash
# Esimerkki: yhdistä kaikki CSS-tiedostot
type css\landing\*.css > css\landing-bundle.css
```

2. **Minimoi CSS**:
```bash
# Käytä esim. cssnano tai purgecss
```

### JavaScript optimointi
1. **Bundle JavaScript**:
```javascript
// package.json
{
  "scripts": {
    "build": "esbuild js/landing/main.js --bundle --minify --outfile=public/js/landing-bundle.js"
  }
}
```

2. **Lazy load** modaaleja tarvittaessa

## Tiedostojen vastaavuudet

### CSS
| Alkuperäinen (inline) | Refaktoroitu (tiedosto) |
|----------------------|-------------------------|
| Rivit 33-347         | `css/landing/main.css` |
| .hero-gradient       | `css/landing/sections/hero.css` |
| .feature-card        | `css/landing/components/cards.css` |
| .browser-window      | `css/landing/components/previews.css` |
| .blob animaatiot     | `css/landing/animations.css` |

### JavaScript
| Alkuperäinen (inline) | Refaktoroitu (tiedosto) |
|----------------------|-------------------------|
| Rivit 1310-1322      | `js/landing/scroll-animations.js` |
| Rivit 1324-1336      | `js/landing/user-detection.js` |
| Rivit 1413-1498      | `js/landing/contact-modal.js` |
| Kaikki yhteensä      | `js/landing/main.js` (importtaa muut) |

## Tunnetut ongelmat ja ratkaisut

### Ongelma: Tailwind CSS konflikti
**Ratkaisu**: Refaktoroitu CSS käyttää CSS-muuttujia (`--color-*`) eikä konfliktoi Tailwindin kanssa

### Ongelma: JavaScript moduulit eivät toimi vanhoissa selaimissa
**Ratkaisu**: Käytä bundleria (esbuild/vite) joka luo yhteensopivan koodin

### Ongelma: CSS import ei toimi kaikissa ympäristöissä
**Ratkaisu**: Yhdistä CSS-tiedostot ennen tuotantoon vientiä

## Rollback-ohje

Jos refaktorointi aiheuttaa ongelmia:

1. **Palauta varmuuskopio**:
```bash
# Jos käytit Vaihtoehtoa A
mv index.html index-refactored.html
mv index-old.html index.html
```

2. **Poista CSS-linkit** jos käytit Vaihtoehtoa B

3. **Palauta alkuperäiset scriptit**

## Seuranta ja monitorointi

### Ennen refaktorointia
1. Ota screenshot alkuperäisestä sivusta
2. Tallenna konsolilokit
3. Mittaa latausaika

### Refaktoroinnin jälkeen
1. Vertaa screenshotteja
2. Tarkista että konsolissa ei ole uusia virheitä
3. Mittaa uusi latausaika

### Suorituskykymittaukset
- **Lighthouse score**: Vertaa ennen/jälkeen
- **First Contentful Paint**: Pitäisi parantua
- **Time to Interactive**: Pitäisi parantua

## Tukikanavat

Jos kohtaat ongelmia:

1. **Tarkista konsoli**: `F12` → Console välilehti
2. **Network välilehti**: Tarkista että CSS/JS-tiedostot latautuvat
3. **Elements välilehti**: Tarkista että CSS-luokat ovat oikein
4. **Käytä testisivua**: `test-refactored.html` auttaa debuggaamaan

## Päivitykset ja ylläpito

### CSS-päivitykset
1. Muuta muuttujia `css/landing/base.css`:ssä
2. Lisää uusia komponentteja `css/landing/components/`:iin
3. Importtaa uudet tiedostot `css/landing/main.css`:ään

### JavaScript-päivitykset
1. Lisää uusia moduuleja `js/landing/`:iin
2. Importtaa uudet moduulit `js/landing/main.js`:ään
3. Testaa aina `test-refactored.html`:llä

### HTML-päivitykset
1. Lisää uusia komponentteja käyttämällä refaktoroituja CSS-luokkia
2. Käytä data-attribuutteja (`data-i18n`) kielituelle
3. Vältä inline-stylet ja inline-scriptit

## Lopullinen tarkistuslista

- [ ] Kaikki CSS-komponentit toimivat
- [ ] JavaScript-moduulit toimivat
- [ ] Scroll-animaatiot toimivat
- [ ] Contact modal toimii
- [ ] User detection toimii
- [ ] Responsiivisuus toimii
- [ ] Kaikki linkit toimivat
- [ ] Konsolissa ei ole virheitä
- [ ] Lighthouse score on sama tai parempi
- [ ] Testattu eri selaimilla
- [ ] Varmuuskopio tehty