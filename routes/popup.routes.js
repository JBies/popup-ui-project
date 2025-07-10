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
 * @route   POST /api/popups/stats/:id/reset
 * @desc    Nollaa popupin tilastot
 * @access  Private
 */
router.post('/stats/:id/reset', PopupController.resetStats);

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

module.exports = router;
