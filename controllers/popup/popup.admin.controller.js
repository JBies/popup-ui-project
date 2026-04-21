// controllers/popup/popup.admin.controller.js
// Admin-toiminnot popupeille

const Popup = require('../../models/Popup');
const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');
const { refreshImageUrl } = require('./popup.utils');

/**
 * (Admin) Hakee kaikki popupit
 */
async function getAllPopups(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const popups = await Popup.find().lean();
    
    // Päivitä kuvan URL:it jos firebasePath on tallennettu
    await Promise.all(popups.map(async p => {
      if (p.imageUrl && p.imageFirebasePath) {
        p.imageUrl = await refreshImageUrl(p.imageUrl, p.imageFirebasePath);
      }
    }));
    
    res.json(popups);
  } catch (err) {
    console.error('Error fetching all popups:', err);
    res.status(500).json({ message: 'Error fetching all popups', error: err });
  }
}

/**
 * (Admin) Hakee yksittäisen popupin
 */
async function getAdminPopup(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const popup = await Popup.findById(req.params.id).lean();
    
    if (!popup) {
      return res.status(404).json({ message: 'Popup not found' });
    }
    
    // Päivitä kuvan URL jos firebasePath on tallennettu
    if (popup.imageUrl && popup.imageFirebasePath) {
      popup.imageUrl = await refreshImageUrl(popup.imageUrl, popup.imageFirebasePath);
    }
    
    res.json(popup);
  } catch (err) {
    console.error('Error fetching popup:', err);
    res.status(500).json({ message: 'Error fetching popup', error: err });
  }
}

/**
 * (Admin) Päivittää popupin
 */
async function updateAdminPopup(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const popup = await Popup.findById(req.params.id);
    
    if (!popup) {
      return res.status(404).json({ message: 'Popup not found' });
    }
    
    // Päivitä popup
    const updatedPopup = await Popup.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.json(updatedPopup);
  } catch (err) {
    console.error('Error updating popup:', err);
    res.status(500).json({ message: 'Error updating popup', error: err });
  }
}

/**
 * (Admin) Poistaa popupin
 */
async function deleteAdminPopup(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const deletedPopup = await Popup.findByIdAndDelete(req.params.id);
    
    if (!deletedPopup) {
      return res.status(404).json({ message: 'Popup not found' });
    }
    
    res.json({ message: 'Popup deleted successfully' });
  } catch (err) {
    console.error('Error deleting popup:', err);
    res.status(500).json({ message: 'Error deleting popup', error: err });
  }
}

/**
 * (Admin) Hakee käyttäjän popupit
 */
async function getUserPopupsAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const userId = req.params.userId;
    const popups = await Popup.find({ userId }).lean();
    
    // Päivitä kuvan URL:it jos firebasePath on tallennettu
    await Promise.all(popups.map(async p => {
      if (p.imageUrl && p.imageFirebasePath) {
        p.imageUrl = await refreshImageUrl(p.imageUrl, p.imageFirebasePath);
      }
    }));
    
    res.json(popups);
  } catch (err) {
    console.error('Error fetching user popups:', err);
    res.status(500).json({ message: 'Error fetching user popups', error: err });
  }
}

/**
 * (Admin) Luo popupin käyttäjälle
 */
async function createPopupForUser(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const popupData = {
      ...req.body,
      userId: user._id
    };
    
    const newPopup = new Popup(popupData);
    await newPopup.save();
    
    res.status(201).json(newPopup);
  } catch (err) {
    console.error('Error creating popup for user:', err);
    res.status(500).json({ message: 'Error creating popup for user', error: err });
  }
}

/**
 * (Admin) Hakee popupin audit logit
 */
async function getPopupAuditLogs(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const logs = await AuditLog.find({ 
      'details.popupId': req.params.id 
    }).sort({ createdAt: -1 }).lean();
    
    res.json(logs);
  } catch (err) {
    console.error('Error fetching popup audit logs:', err);
    res.status(500).json({ message: 'Error fetching popup audit logs', error: err });
  }
}

module.exports = {
  getAllPopups,
  getAdminPopup,
  updateAdminPopup,
  deleteAdminPopup,
  getUserPopupsAdmin,
  createPopupForUser,
  getPopupAuditLogs
};