// routes/user.routes.js
// Käyttäjätietojen hallintaan liittyvät reitit

const express = require('express');
const UserController = require('../controllers/user.controller');

const router = express.Router();

/**
 * @route   GET /api/user
 * @desc    Hakee kirjautuneen käyttäjän tiedot
 * @access  Public
 */
router.get('/', UserController.getCurrentUser);

router.get('/webhooks', UserController.getWebhooks);
router.post('/webhooks', UserController.addWebhook);
router.delete('/webhooks/:id', UserController.deleteWebhook);

module.exports = router;