// controllers/reportSchedule.controller.js

const ReportSchedule = require('../models/ReportSchedule');
const { executeSchedule, runScheduledReports } = require('../utils/scheduled-reports');

// Rate limit: max 2 testisähköpostia per 30 min per käyttäjä
const previewCooldown = new Map();
const PREVIEW_LIMIT    = 2;
const PREVIEW_WINDOW   = 30 * 60 * 1000; // 30 min

function checkPreviewRateLimit(userId) {
  const key    = String(userId);
  const now    = Date.now();
  const record = previewCooldown.get(key) || { count: 0, reset: now + PREVIEW_WINDOW };
  if (now > record.reset) { record.count = 0; record.reset = now + PREVIEW_WINDOW; }
  if (record.count >= PREVIEW_LIMIT) {
    const minLeft = Math.ceil((record.reset - now) / 60000);
    return { blocked: true, minLeft };
  }
  record.count++;
  previewCooldown.set(key, record);
  return { blocked: false };
}

const VALID_DATA_RANGES = ['lastWeek', 'lastMonth', 'last90days', 'lastYear'];

function validateScheduleBody(body) {
  const errors = [];
  const { name, frequency, hour, minute, recipients, weekDay, monthDay, customIntervalDays } = body;

  if (!name || String(name).trim().length === 0) errors.push('Nimi on pakollinen');
  if (String(name || '').length > 120)           errors.push('Nimi on liian pitkä (max 120 merkkiä)');

  const freqs = ['daily', 'weekly', 'monthly', 'custom'];
  if (!freqs.includes(frequency)) errors.push('Virheellinen toistuvuus');

  if (hour === undefined || hour === null || isNaN(Number(hour)) || Number(hour) < 0 || Number(hour) > 23)
    errors.push('Kellonaika (tunti) on virheellinen');
  if (minute !== undefined && (isNaN(Number(minute)) || Number(minute) < 0 || Number(minute) > 59))
    errors.push('Kellonaika (minuutti) on virheellinen');

  if (!Array.isArray(recipients) || recipients.length === 0)
    errors.push('Vähintään yksi vastaanottaja vaaditaan');
  else if (recipients.length > 5)
    errors.push('Enintään 5 vastaanottajaa sallittu');
  else {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const r of recipients) {
      if (!emailRe.test(r)) errors.push(`Virheellinen sähköpostiosoite: ${r}`);
    }
  }

  if (frequency === 'weekly' && (weekDay === undefined || weekDay < 0 || weekDay > 6))
    errors.push('Viikonpäivä (0–6) vaaditaan viikoittaiselle aikataululle');
  if (frequency === 'monthly' && (monthDay === undefined || monthDay < 1 || monthDay > 31))
    errors.push('Kuukaudenpäivä (1–31) vaaditaan kuukausittaiselle aikataululle');
  if (frequency === 'custom' && (!customIntervalDays || customIntervalDays < 1 || customIntervalDays > 365))
    errors.push('Toistumisväli (1–365 päivää) vaaditaan mukautetulle aikataululle');

  if (body.dataRange && !VALID_DATA_RANGES.includes(body.dataRange))
    errors.push(`Virheellinen raporttijakso. Sallitut: ${VALID_DATA_RANGES.join(', ')}`);

  return errors;
}

function extractFields(body) {
  return {
    name:               String(body.name || '').trim(),
    siteIds:            Array.isArray(body.siteIds)  ? body.siteIds  : [],
    popupIds:           Array.isArray(body.popupIds) ? body.popupIds : [],
    frequency:          body.frequency,
    weekDay:            Number(body.weekDay   ?? 1),
    monthDay:           Number(body.monthDay  ?? 1),
    customIntervalDays: Number(body.customIntervalDays ?? 7),
    hour:               Number(body.hour),
    minute:             Number(body.minute ?? 0),
    dataRange:          body.dataRange || 'last7days',
    recipients:         (body.recipients || []).map(r => String(r).trim().toLowerCase()),
    customSubject:      String(body.customSubject      || '').trim(),
    customIntroMessage: String(body.customIntroMessage || '').trim(),
    clientName:         String(body.clientName         || '').trim(),
    active:             body.active !== false,
  };
}

// GET /api/report-schedules
exports.listSchedules = async (req, res) => {
  try {
    const schedules = await ReportSchedule.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(schedules);
  } catch (err) {
    console.error('[reportSchedule] listSchedules error:', err);
    res.status(500).json({ message: 'Aikataulujen haku epäonnistui' });
  }
};

// GET /api/report-schedules/:id
exports.getSchedule = async (req, res) => {
  try {
    const schedule = await ReportSchedule.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!schedule) return res.status(404).json({ message: 'Aikataulua ei löydy' });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: 'Haku epäonnistui' });
  }
};

// POST /api/report-schedules
exports.createSchedule = async (req, res) => {
  try {
    const errors = validateScheduleBody(req.body);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    const fields = extractFields(req.body);
    const schedule = new ReportSchedule({ userId: req.user._id, ...fields });
    await schedule.save();
    res.status(201).json(schedule);
  } catch (err) {
    console.error('[reportSchedule] createSchedule error:', err);
    res.status(500).json({ message: 'Luonti epäonnistui', error: err.message });
  }
};

// PUT /api/report-schedules/:id
exports.updateSchedule = async (req, res) => {
  try {
    const schedule = await ReportSchedule.findOne({ _id: req.params.id, userId: req.user._id });
    if (!schedule) return res.status(404).json({ message: 'Aikataulua ei löydy' });

    const errors = validateScheduleBody(req.body);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    const fields = extractFields(req.body);
    Object.assign(schedule, fields);
    await schedule.save(); // pre('save') laskee nextSendAt uudelleen
    res.json(schedule);
  } catch (err) {
    console.error('[reportSchedule] updateSchedule error:', err);
    res.status(500).json({ message: 'Päivitys epäonnistui', error: err.message });
  }
};

// PATCH /api/report-schedules/:id/toggle
exports.toggleSchedule = async (req, res) => {
  try {
    const schedule = await ReportSchedule.findOne({ _id: req.params.id, userId: req.user._id });
    if (!schedule) return res.status(404).json({ message: 'Aikataulua ei löydy' });

    schedule.active = !schedule.active;
    await schedule.save();
    res.json({ active: schedule.active, nextSendAt: schedule.nextSendAt });
  } catch (err) {
    res.status(500).json({ message: 'Tilamuutos epäonnistui' });
  }
};

// DELETE /api/report-schedules/:id
exports.deleteSchedule = async (req, res) => {
  try {
    const result = await ReportSchedule.deleteOne({ _id: req.params.id, userId: req.user._id });
    if (!result.deletedCount) return res.status(404).json({ message: 'Aikataulua ei löydy' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Poisto epäonnistui' });
  }
};

// GET /api/report-schedules/debug/status  — näyttää kaikkien aikataulujen tila
exports.debugStatus = async (req, res) => {
  try {
    const now = new Date();
    const schedules = await ReportSchedule.find({ userId: req.user._id })
      .select('name active frequency hour minute nextSendAt lastSentAt deliveryLog dataRange')
      .lean();

    const result = schedules.map(s => ({
      name:        s.name,
      active:      s.active,
      frequency:   s.frequency,
      hour:        s.hour,
      minute:      s.minute,
      dataRange:   s.dataRange,
      nextSendAt:  s.nextSendAt,
      nextSendAt_helsinki: s.nextSendAt
        ? new Date(s.nextSendAt).toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' })
        : null,
      isDue:       s.nextSendAt ? s.nextSendAt <= now : false,
      lastSentAt:  s.lastSentAt,
      lastLog:     s.deliveryLog?.slice(-1)[0] || null,
      serverNow:   now.toISOString(),
      serverNow_helsinki: now.toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' }),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/report-schedules/debug/trigger  — ajaa erääntyneet heti manuaalisesti
exports.debugTrigger = async (req, res) => {
  try {
    await runScheduledReports();
    res.json({ ok: true, message: 'Scheduler ajettu manuaalisesti — katso palvelinlokit' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/report-schedules/:id/preview
exports.previewSchedule = async (req, res) => {
  try {
    const rl = checkPreviewRateLimit(req.user._id);
    if (rl.blocked) {
      return res.status(429).json({ message: `Odota ${rl.minLeft} min ennen seuraavaa testilähetystä.` });
    }

    const schedule = await ReportSchedule.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!schedule) return res.status(404).json({ message: 'Aikataulua ei löydy' });

    const logEntry = await executeSchedule(schedule, new Date(), true);
    if (!logEntry.success) {
      return res.status(500).json({ message: logEntry.error || 'Lähetys epäonnistui' });
    }
    res.json({ ok: true, recipientCount: logEntry.recipientCount });
  } catch (err) {
    console.error('[reportSchedule] previewSchedule error:', err);
    res.status(500).json({ message: 'Esikatselu epäonnistui' });
  }
};
