// controllers/popup.controller.js
// Refaktoroitu versio - käyttää modulaarista rakennetta

// Tuo kaikki popup-moduulit
const popupController = require('./popup/popup.controller');

// PopupController luokka - wrapper vanhaan rajapintaan
class PopupController {
  /**
   * Luo uuden popupin
   */
  static async createPopup(req, res) {
    return popupController.createPopup(req, res);
  }

  /**
   * Hakee käyttäjän kaikki popupit
   */
  static async getUserPopups(req, res) {
    return popupController.getUserPopups(req, res);
  }

  /**
   * Päivittää olemassa olevan popupin
   */
  static async updatePopup(req, res) {
    return popupController.updatePopup(req, res);
  }

  /**
   * Poistaa popupin
   */
  static async deletePopup(req, res) {
    return popupController.deletePopup(req, res);
  }

  /**
   * Hakee yksittäisen popupin embed-käyttöä varten
   */
  static async getEmbedPopup(req, res) {
    return popupController.getEmbedPopup(req, res);
  }

  /**
   * Rekisteröi popupin näyttökerran tilastoihin
   */
  static async registerView(req, res) {
    return popupController.registerView(req, res);
  }

  /**
   * Rekisteröi popupin klikkauksen tilastoihin
   */
  static async registerClick(req, res) {
    return popupController.registerClick(req, res);
  }

  /**
   * Hakee popupin tilastot
   */
  static async getPopupStats(req, res) {
    return popupController.getPopupStats(req, res);
  }

  /**
   * (Admin) Hae popupin tilastot millä tahansa ID:llä
   */
  static async getAdminPopupStats(req, res) {
    return popupController.getAdminPopupStats(req, res);
  }

  /**
   * Nollaa popupin tilastot
   */
  static async resetStats(req, res) {
    return popupController.resetStats(req, res);
  }

  /**
   * (Admin) Hakee kaikki popupit
   */
  static async getAllPopups(req, res) {
    return popupController.getAllPopups(req, res);
  }

  /**
   * Palauttaa kaikki aktiiviset elementit site-tokenin perusteella (julkinen)
   */
  static async getSiteElements(req, res) {
    return popupController.getSiteElements(req, res);
  }

  /**
   * (Admin) Päivitä popup
   */
  static async adminUpdatePopup(req, res) {
    return popupController.updateAdminPopup(req, res);
  }

  /**
   * Palauttaa valmiit template-presetit
   */
  static async getTemplates(req, res) {
    return popupController.getTemplates(req, res);
  }

  /**
   * Luo popupin templatesta
   */
  static async createFromTemplate(req, res) {
    return popupController.createFromTemplate(req, res);
  }

  /**
   * Hakee käyttäjän omat template-presetit
   */
  static async getUserTemplates(req, res) {
    return popupController.getUserTemplates(req, res);
  }

  /**
   * Tallentaa popupin template-presetiksi
   */
  static async saveAsTemplate(req, res) {
    return popupController.saveAsTemplate(req, res);
  }

  /**
   * (Admin) Hakee yksittäisen popupin
   */
  static async getAdminPopup(req, res) {
    return popupController.getAdminPopup(req, res);
  }

  /**
   * (Admin) Poistaa popupin
   */
  static async deleteAdminPopup(req, res) {
    return popupController.deleteAdminPopup(req, res);
  }

  /**
   * (Admin) Hakee käyttäjän popupit
   */
  static async getUserPopupsAdmin(req, res) {
    return popupController.getUserPopupsAdmin(req, res);
  }

  /**
   * (Admin) Luo popupin käyttäjälle
   */
  static async createPopupForUser(req, res) {
    return popupController.createPopupForUser(req, res);
  }

  /**
   * (Admin) Hakee popupin audit logit
   */
  static async getPopupAuditLogs(req, res) {
    return popupController.getPopupAuditLogs(req, res);
  }

  /**
   * Vaihtaa popupin aktiivisuustilaa
   */
  static async toggleActive(req, res) {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const { active } = req.body;
      const Popup = require('../models/Popup');
      const popup = await Popup.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { $set: { active } },
        { new: true }
      );
      if (!popup) return res.status(404).json({ message: 'Not found' });
      res.json(popup);
    } catch (err) {
      res.status(500).json({ message: 'Error toggling active' });
    }
  }

  /**
   * Aktivoi/deaktivoi kampanjan
   */
  static async activateCampaign(req, res) {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const { campaign, active } = req.body;
      const Popup = require('../models/Popup');
      await Popup.updateMany({ userId: req.user._id, campaign }, { $set: { active } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: 'Error activating campaign' });
    }
  }

  // Apumetodit kuvatietojen päivittämiseen (nämä ovat nyt popup.utils.js:ssä)
  
  /**
   * Päivittää kuvan käyttötiedot uuden popupin luonnin yhteydessä
   */
  static async updateImageUsage(userId, imageUrl, popupId) {
    const { updateImageUsage } = require('./popup/popup.utils');
    return updateImageUsage(userId, imageUrl, popupId);
  }

  /**
   * Päivittää kuvan käyttöviittaukset, kun popupin kuvaa vaihdetaan
   */
  static async updateImageReferences(userId, oldImageUrl, newImageUrl, popupId) {
    const { updateImageReferences } = require('./popup/popup.utils');
    return updateImageReferences(userId, oldImageUrl, newImageUrl, popupId);
  }

  /**
   * Poistaa kuvan käyttöviittauksen
   */
  static async removeImageReference(userId, imageUrl, popupId) {
    const { removeImageReference } = require('./popup/popup.utils');
    return removeImageReference(userId, imageUrl, popupId);
  }
}

module.exports = PopupController;