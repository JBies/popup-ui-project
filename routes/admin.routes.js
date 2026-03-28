// routes/admin.routes.js
// Admin-toimintoihin liittyvät reitit

const express = require('express');
const UserController = require('../controllers/user.controller');
const PopupController = require('../controllers/popup.controller');
const AuditLog = require('../models/AuditLog');

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

/**
 * @route   POST /api/admin/users/update-limit/:id
 * @desc    Päivittää käyttäjän popup-limiitin (vain admin)
 * @access  Admin
 */
router.post('/users/update-limit/:id', isAdmin, UserController.updateUserPopupLimit);

/**
 * @route   GET /api/admin/popups/stats/:id
 * @desc    Hakee popupin tilastot (vain admin)
 * @access  Admin
 */
router.get('/popups/stats/:id', isAdmin, PopupController.getAdminPopupStats);

/**
 * @route   PUT /api/admin/users/limits/:id
 * @desc    Päivittää käyttäjän per-tyyppi-rajoitukset
 * @access  Admin
 */
router.put('/users/limits/:id', isAdmin, UserController.updateUserLimits);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Hakee audit-lokit (vain admin). Query: ?limit=50&action=role_change&page=1
 * @access  Admin
 */
router.get('/audit-logs', isAdmin, async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 100, 500);
    const page   = Math.max(parseInt(req.query.page)   || 1,   1);
    const skip   = (page - 1) * limit;
    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.adminEmail) filter.adminEmail = new RegExp(req.query.adminEmail, 'i');
    if (req.query.targetEmail) filter.targetEmail = new RegExp(req.query.targetEmail, 'i');

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching audit logs', error: err.toString() });
  }
});

module.exports = router;