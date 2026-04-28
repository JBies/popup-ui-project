// routes/reportSchedule.routes.js

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/reportSchedule.controller');

router.get   ('/',           ctrl.listSchedules);
router.post  ('/',           ctrl.createSchedule);
router.get   ('/:id',        ctrl.getSchedule);
router.put   ('/:id',        ctrl.updateSchedule);
router.patch ('/:id/toggle', ctrl.toggleSchedule);
router.delete('/:id',        ctrl.deleteSchedule);
router.post  ('/:id/preview',ctrl.previewSchedule);

module.exports = router;
