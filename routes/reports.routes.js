// routes/reports.routes.js
const express = require('express');
const router  = express.Router();
const ReportsController = require('../controllers/reports.controller');

router.get('/',       ReportsController.getReport);
router.post('/email', ReportsController.emailReport);

module.exports = router;
