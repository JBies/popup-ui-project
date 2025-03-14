// /swagger-docs/user-routes.js
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Käyttäjän kirjautuminen ja autentikointi
 */

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Aloittaa Google-autentikaation
 *     tags: [Auth]
 *     description: Ohjaa käyttäjän Google-kirjautumissivulle
 *     responses:
 *       302:
 *         description: Uudelleenohjaus Google OAuth -palveluun
 */

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google-autentikaation callback
 *     tags: [Auth]
 *     description: Käsittelee Google-autentikaation vastauksen
 *     responses:
 *       302:
 *         description: Uudelleenohjaus sovelluksen etusivulle kirjautumisen jälkeen
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