// routes/auth.routes.js
// Autentikaatioon liittyvät reitit

const express = require('express');
const passport = require('passport');
const UserController = require('../controllers/user.controller');

const router = express.Router();

/**
 * @route   GET /auth/google
 * @desc    Aloittaa Google-autentikaation
 * @access  Public
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @route   GET /auth/google/callback
 * @desc    Google-autentikaation callback
 * @access  Public
 */
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    req.session.save(() => {
      if (req.user && req.user.role === 'pending') {
        return res.redirect('/pending');
      }
      res.redirect('/dashboard');
    });
  });

/**
 * @route   POST /auth/logout
 * @desc    Kirjaa käyttäjän ulos
 * @access  Private
 */
router.post('/logout', UserController.logout);

module.exports = router;