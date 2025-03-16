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
router.get('/google', (req, res, next) => {
  console.log('Starting Google authentication');
  console.log('Session ID:', req.sessionID);
  console.log('Callback URL:', process.env.GOOGLE_CALLBACK_URL);
  next();
}, passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @route   GET /auth/google/callback
 * @desc    Google-autentikaation callback
 * @access  Public
 */
router.get('/google/callback', (req, res, next) => {
  console.log('Google callback route hit');
  console.log('Query params:', req.query);
  next();
}, passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  console.log('Authentication successful, user:', req.user ? req.user.displayName : 'unknown');
  console.log('User object:', req.user);
  res.redirect('/index.html');
});

/**
 * @route   POST /auth/logout
 * @desc    Kirjaa käyttäjän ulos
 * @access  Private
 */
router.post('/logout', UserController.logout);

module.exports = router;
