// utils/webhooks.js
const User = require('../models/User');

async function triggerWebhooks(userId, event, data) {
  if (!userId) return;
  try {
    const user = await User.findById(userId).select('webhooks').lean();
    if (!user?.webhooks?.length) return;
    user.webhooks
      .filter(wh => wh.active !== false && Array.isArray(wh.events) && wh.events.includes(event))
      .forEach(wh => {
        fetch(wh.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, timestamp: new Date().toISOString(), data })
        }).catch(() => {});
      });
  } catch (e) {}
}

module.exports = { triggerWebhooks };
