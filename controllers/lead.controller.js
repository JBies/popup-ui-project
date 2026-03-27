// controllers/lead.controller.js
const Lead = require('../models/Lead');
const Popup = require('../models/Popup');
const { triggerWebhooks } = require('../utils/webhooks');

class LeadController {
  static async submitLead(req, res) {
    try {
      const { popupId, data, variant } = req.body;
      if (!popupId) return res.status(400).json({ message: 'popupId required' });
      const popup = await Popup.findById(popupId);
      if (!popup) return res.status(404).json({ message: 'Not found' });
      const lead = new Lead({ popupId, userId: popup.userId, data: data || {}, variant: variant || 'A' });
      await lead.save();
      await Popup.findByIdAndUpdate(popupId, { $inc: { 'statistics.leads': 1 } });
      triggerWebhooks(popup.userId, 'lead', { popupId, data });
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ message: 'Error saving lead' });
    }
  }

  static async getLeads(req, res) {
    try {
      const leads = await Lead.find({ userId: req.user._id }).sort({ submittedAt: -1 }).limit(200).lean();
      res.json(leads);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching leads' });
    }
  }

  static async getLeadsByPopup(req, res) {
    try {
      const leads = await Lead.find({ popupId: req.params.popupId, userId: req.user._id })
        .sort({ submittedAt: -1 }).limit(100).lean();
      res.json(leads);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching leads' });
    }
  }
}

module.exports = LeadController;
