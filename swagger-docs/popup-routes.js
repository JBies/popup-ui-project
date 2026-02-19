// /swagger-docs/popup-routes.js
/**
 * @swagger
 * tags:
 *   name: Popups
 *   description: Popuppien hallinta ja käyttö
 */

/**
 * @swagger
 * /api/popups:
 *   get:
 *     summary: Hakee käyttäjän kaikki popupit
 *     tags: [Popups]
 *     description: Palauttaa kirjautuneen käyttäjän kaikki popupit
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Popupit haettu onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Popup'
 *       401:
 *         description: Käyttäjä ei ole kirjautunut
 *       403:
 *         description: Käyttäjällä ei ole oikeuksia tai tili odottaa hyväksyntää
 *
 *   post:
 *     summary: Luo uuden popupin
 *     tags: [Popups]
 *     description: Luo uuden popupin kirjautuneelle käyttäjälle
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - popupType
 *             properties:
 *               name:
 *                 type: string
 *                 description: Popupin nimi
 *                 example: Etusivun tervehdys
 *               popupType:
 *                 type: string
 *                 enum: [square, circle, image, stats_only]
 *                 description: Popupin tyyppi (square, circle, image, stats_only)
 *                 example: square
 *               content:
 *                 type: string
 *                 description: Popupin sisältö (teksti/HTML)
 *                 example: <h3>Tervetuloa sivustolle!</h3>
 *               width:
 *                 type: number
 *                 description: Popupin leveys pikseleinä
 *                 example: 300
 *               height:
 *                 type: number
 *                 description: Popupin korkeus pikseleinä
 *                 example: 200
 *               position:
 *                 type: string
 *                 enum: [center, top-left, top-right, bottom-left, bottom-right]
 *                 description: Popupin sijainti näytöllä
 *                 example: center
 *               animation:
 *                 type: string
 *                 enum: [none, fade, slide]
 *                 description: Popupin animaatio
 *                 example: fade
 *               backgroundColor:
 *                 type: string
 *                 description: Popupin taustaväri (HEX)
 *                 example: '#ffffff'
 *               textColor:
 *                 type: string
 *                 description: Popupin tekstin väri (HEX)
 *                 example: '#000000'
 *               imageUrl:
 *                 type: string
 *                 description: Popupin kuvan URL
 *                 example: https://storage.googleapis.com/popup-manager-e4753.appspot.com/popupImages/image.jpg
 *               linkUrl:
 *                 type: string
 *                 description: URL, johon popup vie klikattaessa
 *                 example: https://example.com
 *               delay:
 *                 type: number
 *                 description: Viive ennen popupin näyttämistä (sekunteina)
 *                 example: 2
 *               showDuration:
 *                 type: number
 *                 description: Kesto jonka popup näkyy (sekunteina, 0 = kunnes suljetaan)
 *                 example: 5
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Popupin näyttämisen aloituspäivä
 *                 example: 2023-05-01T00:00:00Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Popupin näyttämisen lopetuspäivä
 *                 example: 2023-05-31T23:59:59Z
 *     responses:
 *       201:
 *         description: Popup luotu onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Popup'
 *       400:
 *         description: Virheellinen pyyntö (esim. puuttuva sisältö)
 *       401:
 *         description: Käyttäjä ei ole kirjautunut
 *       403:
 *         description: Käyttäjällä ei ole oikeuksia tai tili odottaa hyväksyntää
 */

/**
 * @swagger
 * /api/popups/embed/{id}:
 *   get:
 *     summary: Hakee yksittäisen popupin embed-käyttöä varten
 *     tags: [Popups]
 *     description: Hakee popupin tiedot ulkoista embed-käyttöä varten, ei vaadi kirjautumista
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Popupin MongoDB ID
 *     responses:
 *       200:
 *         description: Popup haettu onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Popup'
 *       404:
 *         description: Popupia ei löytynyt
 */

/**
 * @swagger
 * /api/popups/stats/{id}:
 *   get:
 *     summary: Hakee popupin tilastot
 *     tags: [Popups]
 *     description: Hakee popupin näyttö- ja klikkaustilastot
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Popupin MongoDB ID
 *     responses:
 *       200:
 *         description: Tilastot haettu onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 views:
 *                   type: number
 *                   description: Näyttökertojen määrä
 *                 clicks:
 *                   type: number
 *                   description: Klikkausten määrä
 *                 clickThroughRate:
 *                   type: string
 *                   description: Klikkaussuhde prosentteina
 *                 lastViewed:
 *                   type: string
 *                   format: date-time
 *                   description: Viimeisin näyttökerta
 *                 lastClicked:
 *                   type: string
 *                   format: date-time
 *                   description: Viimeisin klikkaus
 *       401:
 *         description: Käyttäjä ei ole kirjautunut
 *       403:
 *         description: Käyttäjällä ei ole oikeuksia
 *       404:
 *         description: Popupia ei löytynyt
 */

/**
 * @swagger
 * /api/popups/view/{id}:
 *   post:
 *     summary: Rekisteröi popupin näyttökerran
 *     tags: [Popups]
 *     description: Lisää yhden näyttökerran popupin tilastoihin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Popupin MongoDB ID
 *     responses:
 *       200:
 *         description: Näyttökerta rekisteröity onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Palvelinvirhe
 */

/**
 * @swagger
 * /api/popups/click/{id}:
 *   post:
 *     summary: Rekisteröi popupin klikkauksen
 *     tags: [Popups]
 *     description: Lisää yhden klikkauksen popupin tilastoihin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Popupin MongoDB ID
 *     responses:
 *       200:
 *         description: Klikkaus rekisteröity onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Click registered
 *       500:
 *         description: Palvelinvirhe
 */

/**
 * @swagger
 * /api/popups/{id}:
 *   put:
 *     summary: Päivittää popupin
 *     tags: [Popups]
 *     description: Päivittää olemassa olevan popupin
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Popupin MongoDB ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               popupType:
 *                 type: string
 *                 enum: [square, circle, image, stats_only]
 *               content:
 *                 type: string
 *               width:
 *                 type: number
 *               height:
 *                 type: number
 *               position:
 *                 type: string
 *                 enum: [center, top-left, top-right, bottom-left, bottom-right]
 *               animation:
 *                 type: string
 *                 enum: [none, fade, slide]
 *               backgroundColor:
 *                 type: string
 *               textColor:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               linkUrl:
 *                 type: string
 *               delay:
 *                 type: number
 *               showDuration:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Popup päivitetty onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Popup'
 *       400:
 *         description: Virheellinen pyyntö
 *       401:
 *         description: Käyttäjä ei ole kirjautunut
 *       403:
 *         description: Käyttäjällä ei ole oikeuksia
 *       404:
 *         description: Popupia ei löytynyt
 *   
 *   delete:
 *     summary: Poistaa popupin
 *     tags: [Popups]
 *     description: Poistaa olemassa olevan popupin
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Popupin MongoDB ID
 *     responses:
 *       200:
 *         description: Popup poistettu onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Popup deleted successfully
 *       401:
 *         description: Käyttäjä ei ole kirjautunut
 *       403:
 *         description: Käyttäjällä ei ole oikeuksia
 *       404:
 *         description: Popupia ei löytynyt
 */

/**
 * @swagger
 * /api/admin/popups:
 *   get:
 *     summary: Hakee kaikki popupit (admin)
 *     tags: [Popups]
 *     description: Hakee kaikki järjestelmän popupit. Vain admin-käyttäjät voivat käyttää tätä.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Popupit haettu onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Popup'
 *       401:
 *         description: Käyttäjä ei ole kirjautunut
 *       403:
 *         description: Käyttäjällä ei ole admin-oikeuksia
 */

/**
 * @swagger
 * /api/admin/popups/{id}:
 *   put:
 *     summary: Päivittää popupin (admin)
 *     tags: [Popups]
 *     description: Päivittää minkä tahansa popupin. Vain admin-käyttäjät voivat käyttää tätä.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Popupin MongoDB ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Popup'
 *     responses:
 *       200:
 *         description: Popup päivitetty onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Popup'
 *       401:
 *         description: Käyttäjä ei ole kirjautunut
 *       403:
 *         description: Käyttäjällä ei ole admin-oikeuksia
 *       404:
 *         description: Popupia ei löytynyt
 */