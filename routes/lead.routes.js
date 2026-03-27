// routes/lead.routes.js
const express = require('express');
const LeadController = require('../controllers/lead.controller');
const router = express.Router();
router.post('/', LeadController.submitLead);
module.exports = router;
