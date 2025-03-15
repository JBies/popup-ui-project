// routes/popup.routes.js
// Popupeihin liittyvät reitit

const express = require('express');
const PopupController = require('../controllers/popup.controller');

const router = express.Router();

/**
 * @route   GET /api/popups
 * @desc    Hakee käyttäjän kaikki popupit
 * @access  Private
 */
router.get('/', PopupController.getUserPopups);

/**
 * @route   POST /api/popups
 * @desc    Luo uuden popupin
 * @access  Private
 */
router.post('/', PopupController.createPopup);

/**
 * @route   GET /api/popups/embed/:id
 * @desc    Hakee yksittäisen popupin embed-käyttöä varten
 * @access  Public
 */
router.get('/embed/:id', PopupController.getEmbedPopup);

/**
 * @route   GET /api/popups/stats/:id
 * @desc    Hakee popupin tilastot
 * @access  Private
 */
router.get('/stats/:id', PopupController.getPopupStats);

/**
 * @route   POST /api/popups/view/:id
 * @desc    Rekisteröi popupin näyttökerran
 * @access  Public
 */
router.post('/view/:id', PopupController.registerView);

/**
 * @route   POST /api/popups/click/:id
 * @desc    Rekisteröi popupin klikkauksen
 * @access  Public
 */
router.post('/click/:id', PopupController.registerClick);

/**
 * @route   PUT /api/popups/:id
 * @desc    Päivittää popupin
 * @access  Private
 */
router.put('/:id', PopupController.updatePopup);

/**
 * @route   DELETE /api/popups/:id
 * @desc    Poistaa popupin
 * @access  Private
 */
router.delete('/:id', PopupController.deletePopup);


// Käyttäjän popupit API
/**
 * @swagger
 * /api/popups:
 *   get:
 *     ...
 *     responses:
 *       200:
 *         description: Popupit haettu onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Popup'
 *             example:
 *               - _id: "60d21b4667d0d8992e610c85"
 *                 userId: "60d21b4667d0d8992e610c70"
 *                 name: "Etusivun tervehdys"
 *                 popupType: "square"
 *                 content: "<h3>Tervetuloa sivustolle!</h3>"
 *                 width: 300
 *                 height: 200
 *                 position: "center"
 *                 animation: "fade"
 *                 backgroundColor: "#ffffff"
 *                 textColor: "#000000"
 *                 imageUrl: ""
 *                 linkUrl: "https://example.com/campaign"
 *                 timing:
 *                   delay: 2
 *                   showDuration: 0
 *                   frequency: "always"
 *                   startDate: "2023-05-01T00:00:00Z"
 *                   endDate: null
 *                 statistics:
 *                   views: 1250
 *                   clicks: 85
 *                   lastViewed: "2023-05-15T14:30:00Z"
 *                   lastClicked: "2023-05-15T10:22:00Z"
 *                 createdAt: "2023-04-01T12:00:00Z"
 */

// Popup embed -kutsu esimerkki
/**
 * @swagger
 * /api/popups/embed/{id}:
 *   get:
 *     ...
 *     responses:
 *       200:
 *         description: Popup haettu onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Popup'
 *             example:
 *               _id: "60d21b4667d0d8992e610c85"
 *               name: "Etusivun tervehdys"
 *               popupType: "square"
 *               content: "<h3>Tervetuloa sivustolle!</h3>"
 *               width: 300
 *               height: 200
 *               position: "center"
 *               animation: "fade"
 *               backgroundColor: "#ffffff"
 *               textColor: "#000000"
 *               imageUrl: "https://storage.googleapis.com/popup-manager-e4753.appspot.com/popupImages/image.jpg"
 *               linkUrl: "https://example.com/campaign"
 *               timing:
 *                 delay: 2
 *                 showDuration: 0
 *               statistics:
 *                 views: 1250
 *                 clicks: 85
 */

// Tilastokutsu esimerkki
/**
 * @swagger
 * /api/popups/stats/{id}:
 *   get:
 *     ...
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
 *                 clicks:
 *                   type: number
 *                 clickThroughRate:
 *                   type: string
 *                 lastViewed:
 *                   type: string
 *                   format: date-time
 *                 lastClicked:
 *                   type: string
 *                   format: date-time
 *             example:
 *               views: 1250
 *               clicks: 85
 *               clickThroughRate: "6.80"
 *               lastViewed: "2023-05-15T14:30:00Z"
 *               lastClicked: "2023-05-15T10:22:00Z"
 */

// Käyttäjä API
/**
 * @swagger
 * /api/user:
 *   get:
 *     ...
 *     responses:
 *       200:
 *         description: Käyttäjän tiedot haettu onnistuneesti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: 'null'
 *             example:
 *               user:
 *                 _id: "60d21b4667d0d8992e610c70"
 *                 googleId: "109876543210987654321"
 *                 displayName: "Matti Meikäläinen"
 *                 email: "matti@example.com" 
 *                 role: "user"
 *                 profilePicture: "https://lh3.googleusercontent.com/a/ABC123"
 *                 registeredAt: "2023-03-01T10:20:30Z"
 *                 lastLogin: "2023-05-15T08:45:12Z"
 */

module.exports = router;