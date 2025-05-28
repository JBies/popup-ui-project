// /swagger-docs/auth-routes.js
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Käyttäjän kirjautuminen ja autentikointi
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Kirjaa käyttäjän sisään sähköpostilla ja salasanalla
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kirjautuminen onnistui
 *       401:
 *         description: Virheellinen sähköposti tai salasana
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Kirjaa käyttäjän ulos
 *     tags: [Auth]
 *     description: Tuhoaa käyttäjän istunnon ja kirjaa ulos
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       302:
 *         description: Uudelleenohjaus etusivulle uloskirjautumisen jälkeen
 */
