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

// Lisää tämä uusi reitti
/**
 * @route   GET /api/check-auth
 * @desc    Tarkistaa käyttäjän kirjautumistilan
 * @access  Public
 */

// Testireitti kirjautumistilan tarkistamiseen
router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({
      authenticated: true,
      user: {
        id: req.user._id,
        name: req.user.displayName,
        email: req.user.email,
        role: req.user.role
      }
    });
  } else {
    return res.json({
      authenticated: false,
      session: req.sessionID
    });
  }
});

module.exports = router;

