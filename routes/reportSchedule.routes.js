// routes/reportSchedule.routes.js

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/reportSchedule.controller');

router.get   ('/',              ctrl.listSchedules);
router.post  ('/',              ctrl.createSchedule);
router.get   ('/debug/status',  ctrl.debugStatus);     // näyttää nextSendAt-tilat
router.post  ('/debug/trigger', ctrl.debugTrigger);    // ajaa erääntyneet heti
router.get   ('/:id',          ctrl.getSchedule);
router.put   ('/:id',          ctrl.updateSchedule);
router.patch ('/:id/toggle',   ctrl.toggleSchedule);
router.delete('/:id',          ctrl.deleteSchedule);
router.post  ('/:id/preview',  ctrl.previewSchedule);

module.exports = router;
