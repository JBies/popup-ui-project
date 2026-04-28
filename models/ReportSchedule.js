// models/ReportSchedule.js

const mongoose = require('mongoose');

// Helsinki UTC-offset laskettuna ilman kirjastoja
function helOffset(date) {
  const utcStr = date.toLocaleString('en-CA', { timeZone: 'UTC' });
  const helStr = date.toLocaleString('en-CA', { timeZone: 'Europe/Helsinki' });
  return Math.round((new Date(helStr) - new Date(utcStr)) / 60000); // +120 tai +180
}

function helNow(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const get = t => Number(parts.find(p => p.type === t).value);
  return { year: get('year'), month: get('month') - 1, day: get('day'), hour: get('hour'), minute: get('minute') };
}

function candidateUTC(year, month, day, hour, minute) {
  const nominalUTC  = Date.UTC(year, month, day, hour, minute, 0);
  const nominalDate = new Date(nominalUTC);
  const offset      = helOffset(nominalDate);
  return new Date(nominalUTC - offset * 60000);
}

function addDays(date, n) {
  return new Date(date.getTime() + n * 86400000);
}

function computeNextSendAt(schedule, now = new Date()) {
  const { frequency, hour, minute, weekDay, monthDay, customIntervalDays, lastSentAt } = schedule;
  const hel = helNow(now);

  if (frequency === 'daily') {
    let cand = candidateUTC(hel.year, hel.month, hel.day, hour, minute);
    if (cand <= now) cand = addDays(cand, 1);
    return cand;
  }

  if (frequency === 'weekly') {
    const todayCand = candidateUTC(hel.year, hel.month, hel.day, hour, minute);
    const helDay = helNow(todayCand).day;
    // Laske viikonpäivä Helsinki-ajassa
    const todayDate = new Date(Date.UTC(hel.year, hel.month, hel.day));
    const todayWeekDay = new Date(todayDate.toLocaleString('en-CA', { timeZone: 'Europe/Helsinki' })).getDay
      ? (() => {
          const d = new Date(Date.UTC(hel.year, hel.month, hel.day, 12));
          return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Helsinki', weekday: 'short' })
            .format(d) === 'Sun' ? 0
            : ['Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(
                new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Helsinki', weekday: 'short' }).format(d)
              ) + 1;
        })()
      : 0;

    // Yksinkertainen laskenta: käytä UTC-viikonpäivää kandidaatille
    let daysAhead = (weekDay - todayWeekDay + 7) % 7;
    if (daysAhead === 0 && todayCand <= now) daysAhead = 7;
    return addDays(candidateUTC(hel.year, hel.month, hel.day, hour, minute), daysAhead);
  }

  if (frequency === 'monthly') {
    for (let offset = 0; offset <= 2; offset++) {
      const rawMonth  = hel.month + offset;
      const targetYear  = hel.year + Math.floor(rawMonth / 12);
      const targetMonth = rawMonth % 12;
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const d = Math.min(monthDay, daysInMonth);
      const cand = candidateUTC(targetYear, targetMonth, d, hour, minute);
      if (cand > now) return cand;
    }
  }

  if (frequency === 'custom') {
    const base = lastSentAt ? new Date(lastSentAt) : now;
    let cand = addDays(base, customIntervalDays);
    const helC = helNow(cand);
    cand = candidateUTC(helC.year, helC.month, helC.day, hour, minute);
    if (cand <= now) cand = addDays(cand, customIntervalDays);
    return cand;
  }

  return null;
}

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
    enum:    ['last7days', 'last30days', 'last90days', 'lastWeek', 'lastMonth'],
    default: 'last7days',
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
