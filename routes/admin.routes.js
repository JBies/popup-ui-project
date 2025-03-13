// routes/admin.routes.js
// Admin-toimintoihin liittyvät reitit

const express = require('express');
const UserController = require('../controllers/user.controller');
const PopupController = require('../controllers/popup.controller');

const router = express.Router();

// Admin middleware - tarkistaa että käyttäjällä on admin-oikeudet
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied' });
};

/**
 * @route   GET /api/admin/users
 * @desc    Hakee kaikki käyttäjät (vain admin)
 * @access  Admin
 */
router.get('/users', isAdmin, UserController.getAllUsers);

/**
 * @route   POST /api/admin/users/update-role/:id
 * @desc    Päivittää käyttäjän roolin (vain admin)
 * @access  Admin
 */
router.post('/users/update-role/:id', isAdmin, UserController.updateUserRole);

/**
 * @route   POST /api/admin/users/delete/:id
 * @desc    Poistaa käyttäjän (vain admin)
 * @access  Admin
 */
router.post('/users/delete/:id', isAdmin, UserController.deleteUser);

/**
 * @route   GET /api/admin/popups
 * @desc    Hakee kaikki popupit (vain admin)
 * @access  Admin
 */
router.get('/popups', isAdmin, PopupController.getAllPopups);

/**
 * @route   PUT /api/admin/popups/:id
 * @desc    Päivittää popupin (vain admin)
 * @access  Admin
 */
router.put('/popups/:id', isAdmin, PopupController.adminUpdatePopup);

module.exports = router;