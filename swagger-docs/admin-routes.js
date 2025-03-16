// /swagger-docs/admin-routes.js

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-käyttäjien hallintatoiminnot
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Hakee kaikki käyttäjät (admin)
 *     tags: [Admin]
 *     description: Hakee kaikki järjestelmän käyttäjät. Vain admin-käyttäjät voivat käyttää tätä.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Käyttäjät haettu onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Käyttäjä ei ole kirjautunut
 *       403:
 *         description: Käyttäjällä ei ole admin-oikeuksia
 *       500:
 *         description: Palvelinvirhe
 */

/**
 * @swagger
 * /api/admin/users/update-role/{id}:
 *   post:
 *     summary: Päivittää käyttäjän roolin (admin)
 *     tags: [Admin]
 *     description: Päivittää olemassa olevan käyttäjän roolin. Vain admin-käyttäjät voivat käyttää tätä.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Käyttäjän MongoDB ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin, pending]
 *                 description: Uusi rooli käyttäjälle
 *                 example: user
 *     responses:
 *       200:
 *         description: Käyttäjän rooli päivitetty onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Role updated successfully!
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     approvedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Käyttäjä ei ole kirjautunut
 *       403:
 *         description: Käyttäjällä ei ole admin-oikeuksia
 *       404:
 *         description: Käyttäjää ei löytynyt
 *       500:
 *         description: Palvelinvirhe
 */

/**
 * @swagger
 * /api/admin/users/delete/{id}:
 *   post:
 *     summary: Poistaa käyttäjän (admin)
 *     tags: [Admin]
 *     description: Poistaa olemassa olevan käyttäjän. Vain admin-käyttäjät voivat käyttää tätä.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Käyttäjän MongoDB ID
 *     responses:
 *       200:
 *         description: Käyttäjä poistettu onnistuneesti
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: User deleted successfully!
 *       401:
 *         description: Käyttäjä ei ole kirjautunut
 *       403:
 *         description: Käyttäjällä ei ole admin-oikeuksia
 *       404:
 *         description: Käyttäjää ei löytynyt
 *       500:
 *         description: Palvelinvirhe
 */

/**
 * @swagger
 * /api/admin/popups:
 *   get:
 *     summary: Hakee kaikki popupit (admin)
 *     tags: [Admin]
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
 *       500:
 *         description: Palvelinvirhe
 */

/**
 * @swagger
 * /api/admin/popups/{id}:
 *   put:
 *     summary: Päivittää popupin (admin)
 *     tags: [Admin]
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
 *       500:
 *         description: Palvelinvirhe
 */
