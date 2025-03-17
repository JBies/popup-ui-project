// routes/image.routes.js
// Kuvien hallintaan liittyvät reitit

const express = require('express');
const upload = require('../public/upload');
const ImageController = require('../controllers/image.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   POST /api/upload
 * @desc    Lataa kuvan Firebaseen
 * @access  Private (User role)
 */
router.post('/', upload.single('image'), ImageController.uploadImage);

/**
 * @route   GET /api/images
 * @desc    Hakee käyttäjän kaikki kuvat
 * @access  Private (User role)
 */
router.get('/', ImageController.getUserImages);

/**
 * @route   GET /api/images/:id
 * @desc    Hakee yksittäisen kuvan tiedot ja käyttökohteet
 * @access  Private (User role)
 */
router.get('/:id', ImageController.getImageDetails);

/**
 * @route   DELETE /api/images/:id
 * @desc    Poistaa kuvan, jos sitä ei käytetä popupeissa
 * @access  Private (User role)
 */
router.delete('/:id', ImageController.deleteImage);

module.exports = router;