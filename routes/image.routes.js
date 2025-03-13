// routes/image.routes.js
// Kuvien hallintaan liittyvät reitit

const express = require('express');
const upload = require('../upload');
const ImageController = require('../controllers/image.controller');

const router = express.Router();

/**
 * @route   POST /api/upload
 * @desc    Lataa kuvan Firebaseen
 * @access  Private
 */
router.post('/upload', upload.single('image'), ImageController.uploadImage);

/**
 * @route   GET /api/images
 * @desc    Hakee käyttäjän kaikki kuvat
 * @access  Private
 */
router.get('/images', ImageController.getUserImages);

/**
 * @route   GET /api/images/:id
 * @desc    Hakee yksittäisen kuvan tiedot ja käyttökohteet
 * @access  Private
 */
router.get('/images/:id', ImageController.getImageDetails);

/**
 * @route   DELETE /api/images/:id
 * @desc    Poistaa kuvan, jos sitä ei käytetä popupeissa
 * @access  Private
 */
router.delete('/images/:id', ImageController.deleteImage);

module.exports = router;