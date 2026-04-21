// routes/popup.routes.js
// Popupeihin liittyvät reitit

const express = require('express');
const PopupController = require('../controllers/popup.controller');
const PageTrackingController = require('../controllers/pageTracking.controller');

const router = express.Router();

/**
 * @route   GET /api/popups
 * @desc    Hakee käyttäjän kaikki popupit
 * @access  Private
 */
router.get('/', PopupController.getUserPopups);

/**
 * @route   GET /api/popups/templates
 * @desc    Palauttaa valmiit template-presetit
 * @access  Private
 */
router.get('/templates', PopupController.getTemplates);

/**
 * @route   GET /api/popups/site/:token
 * @desc    Palauttaa kaikki aktiiviset elementit site-tokenin perusteella
 * @access  Public
 */
router.get('/site/:token', PopupController.getSiteElements);

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

router.put('/:id/toggle-active', PopupController.toggleActive);
router.post('/campaign/activate', PopupController.activateCampaign);

// Sivun seuranta - julkiset (embed)
router.post('/page-elements/:id/discover', PageTrackingController.discoverElements);
router.post('/page-elements/:id/click',    PageTrackingController.recordPageElementClick);
router.post('/scroll/:id',                 PageTrackingController.recordScroll);

// Sivun seuranta - autentikoitu (dashboard)
router.get('/page-elements/:id',               PageTrackingController.listPageElements);
router.post('/page-elements/:id/manual',       PageTrackingController.addManualElement);
router.delete('/page-elements/:pageElementId', PageTrackingController.deactivatePageElement);
router.get('/scroll/:id',                      PageTrackingController.getScrollStats);

module.exports = router;
