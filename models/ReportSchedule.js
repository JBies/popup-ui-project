// models/ReportSchedule.js

const mongoose = require('mongoose');

// ─── Helsinki-aikalaskenta (ei locale-string-parsintaa, ei kirjastoja) ────────

// Palauttaa Helsinki-ajan komponentit Intl:n avulla
function helParts(date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    weekday: 'short', hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = type => parts.find(p => p.type === type)?.value;
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return {
    year:    Number(get('year')),
    month:   Number(get('month')) - 1,   // 0-indeksoitu
    day:     Number(get('day')),
    hour:    Number(get('hour')),
    minute:  Number(get('minute')),
    weekDay: weekdays.indexOf(get('weekday')), // 0=Su, 1=Ma, 2=Ti...
  };
}

// Helsinki UTC-offset minuutteina: rekonstruoi Helsinki-hetki UTC-timestampiksi
// eikä käytä new Date(localeString) -parsintaa (epäluotettava)
function helOffset(date) {
  const p = helParts(date);
  const helAsUTC = Date.UTC(p.year, p.month, p.day, p.hour, p.minute);
  return Math.round((helAsUTC - date.getTime()) / 60000); // esim. 120 tai 180
}

// Muodostaa UTC Date:n annetulle Helsinki-kalenteripäivälle + kelloajalle
function helToUTC(year, month, day, hour, minute) {
  const approx  = new Date(Date.UTC(year, month, day, hour, minute));
  const offset  = helOffset(approx);
  return new Date(Date.UTC(year, month, day, hour, minute) - offset * 60000);
}

function addDays(date, n) {
  return new Date(date.getTime() + n * 86400000);
}

function computeNextSendAt(schedule, now = new Date()) {
  const { frequency, hour, minute, weekDay, monthDay, customIntervalDays, lastSentAt } = schedule;
  const hel = helParts(now);

  if (frequency === 'daily') {
    let cand = helToUTC(hel.year, hel.month, hel.day, hour, minute);
    if (cand <= now) cand = helToUTC(hel.year, hel.month, hel.day + 1, hour, minute);
    return cand;
  }

  if (frequency === 'weekly') {
    const todayCand = helToUTC(hel.year, hel.month, hel.day, hour, minute);
    let daysAhead = (weekDay - hel.weekDay + 7) % 7;
    if (daysAhead === 0 && todayCand <= now) daysAhead = 7;
    return helToUTC(hel.year, hel.month, hel.day + daysAhead, hour, minute);
  }

  if (frequency === 'monthly') {
    for (let offset = 0; offset <= 2; offset++) {
      const rawMonth    = hel.month + offset;
      const targetYear  = hel.year + Math.floor(rawMonth / 12);
      const targetMonth = rawMonth % 12;
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const d    = Math.min(monthDay, daysInMonth);
      const cand = helToUTC(targetYear, targetMonth, d, hour, minute);
      if (cand > now) return cand;
    }
  }

  if (frequency === 'custom') {
    const base    = lastSentAt ? new Date(lastSentAt) : now;
    const baseFwd = addDays(base, customIntervalDays);
    const fwdHel  = helParts(baseFwd);
    let cand = helToUTC(fwdHel.year, fwdHel.month, fwdHel.day, hour, minute);
    if (cand <= now) {
      const nowFwd = addDays(now, customIntervalDays);
      const nowHel = helParts(nowFwd);
      cand = helToUTC(nowHel.year, nowHel.month, nowHel.day, hour, minute);
    }
    return cand;
  }

  return null;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const deliveryLogEntrySchema = new mongoose.Schema({
  sentAt:         { type: Date, required: true },
  success:        { type: Boolean, required: true },
  error:          { type: String, default: null },
  recipientCount: { type: Number, default: 0 },
  isPreview:      { type: Boolean, default: false },
}, { _id: false });

const reportScheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:   { type: String, required: true, maxlength: 120 },

  siteIds:  { type: [String], default: [] },
  popupIds: { type: [String], default: [] },

  frequency:          { type: String, enum: ['daily', 'weekly', 'monthly', 'custom'], required: true },
  weekDay:            { type: Number, min: 0, max: 6, default: 1 },
  monthDay:           { type: Number, min: 1, max: 31, default: 1 },
  customIntervalDays: { type: Number, min: 1, max: 365, default: 7 },

  hour:     { type: Number, min: 0, max: 23, required: true },
  minute:   { type: Number, min: 0, max: 59, default: 0 },

  dataRange: {
    type:    String,
    enum:    ['lastWeek', 'lastMonth', 'last90days', 'lastYear'],
    default: 'lastWeek',
  },

  recipients:         { type: [String], required: true, validate: v => v.length >= 1 && v.length <= 5 },
  customSubject:      { type: String, default: '' },
  customIntroMessage: { type: String, default: '' },
  clientName:         { type: String, default: '' },

  active:     { type: Boolean, default: true, index: true },
  lastSentAt: { type: Date, default: null },
  nextSendAt: { type: Date, default: null, index: true },

  deliveryLog: { type: [deliveryLogEntrySchema], default: [] },

}, { timestamps: true });

reportScheduleSchema.pre('save', function (next) {
  if (this.active && (this.isNew || this.isModified(
    'frequency weekDay monthDay customIntervalDays hour minute active lastSentAt'
  ))) {
    this.nextSendAt = computeNextSendAt(this);
  }
  if (!this.active) {
    this.nextSendAt = null;
  }
  next();
});

reportScheduleSchema.statics.computeNextSendAt = computeNextSendAt;

module.exports = mongoose.model('ReportSchedule', reportScheduleSchema);
