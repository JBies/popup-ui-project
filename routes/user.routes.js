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
router.get('/user', UserController.getCurrentUser);

module.exports = router;