// /swagger-docs/image-routes.js
/**
 * @swagger
 * tags:
 *   name: Images
 *   description: Kuvien hallinta
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Lataa kuvan Firebaseen
 *     tags: [Images]
 *     description: Lataa kuvan Firebase Storage -palveluun
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Ladattava kuvatiedosto
 *     responses:
 *       200:
 *         description: Kuva ladattu onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   description: Ladatun kuvan URL
 *                 imageId:
 *                   type: string
 *                   description: Kuvan MongoDB ID
 *                 name:
 *                   type: string
 *                   description: Kuvan alkuperäinen tiedostonimi
 *                 size:
 *                   type: number
 *                   description: Kuvan koko tavuina
 *       400:
 *         description: Virheellinen pyyntö (esim. ei kuvaa)
 *       401:
 *         description: Käyttäjä ei ole kirjautunut
 *       403:
 *         description: Käyttäjällä ei ole oikeuksia tai tili odottaa hyväksyntää
 *       500:
 *         description: Palvelinvirhe kuvan latauksessa
 */

/**
 * @swagger
 * /api/images:
 *   get:
 *     summary: Hakee käyttäjän kaikki kuvat
 *     tags: [Images]
 *     description: Hakee kirjautuneen käyttäjän kaikki kuvat
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Kuvat haettu onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Image'
 *       401:
 *         description: Käyttäjä ei ole kirjautunut
 *       403:
 *         description: Käyttäjällä ei ole oikeuksia tai tili odottaa hyväksyntää
 */

/**
 * @swagger
 * /api/images/{id}:
 *   get:
 *     summary: Hakee yksittäisen kuvan tiedot
 *     tags: [Images]
 *     description: Hakee yhden kuvan tiedot ja listan popupeista, joissa kuvaa käytetään
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kuvan MongoDB ID
 *     responses:
 *       200:
 *         description: Kuvan tiedot haettu onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 image:
 *                   $ref: '#/components/schemas/Image'
 *                 popups:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       popupType:
 *                         type: string
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Käyttäjä ei ole kirjautunut
 *       403:
 *         description: Käyttäjällä ei ole oikeuksia
 *       404:
 *         description: Kuvaa ei löytynyt
 *
 *   delete:
 *     summary: Poistaa kuvan
 *     tags: [Images]
 *     description: Poistaa kuvan, jos sitä ei käytetä popupeissa
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kuvan MongoDB ID
 *     responses:
 *       200:
 *         description: Kuva poistettu onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Kuva poistettu onnistuneesti
 *       400:
 *         description: Kuvaa ei voi poistaa, koska sitä käytetään popupeissa
 *       401:
 *         description: Käyttäjä ei ole kirjautunut
 *       403:
 *         description: Käyttäjällä ei ole oikeuksia
 *       404:
 *         description: Kuvaa ei löytynyt
 */