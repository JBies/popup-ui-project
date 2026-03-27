// controllers/popup.controller.js
// Vastaa popup-toimintojen logiikasta

const Popup = require('../models/Popup');
const Image = require('../models/Image');

/**
 * PopupController luokka sisältää popup CRUD-toimintojen logiikan
 */
class PopupController {
  /**
   * Luo uuden popupin
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createPopup(req, res) {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const userPopupCount = await Popup.countDocuments({ userId: req.user._id });

      // admin voi luoida rajattomasti popuppeja
      if (req.user.role !== 'admin' && userPopupCount >= req.user.popupLimit) {
        return res.status(403).json({
          message: `Olet saavuttanut maksimimäärän popuppeja (${req.user.popupLimit}). Ota yhteyttä joni.bies@gmail.com lisätietoja varten.`,
          limitReached: true
        });
      }
    } catch (err) {
      console.error('Error checking popup limit:', err);
      return res.status(500).json({ message: 'Error checking popup limit', error: err.toString() });
    }
    

    const {
      name,
      popupType,
      elementType,
      elementConfig,
      targeting,
      content,
      width,
      height,
      position,
      animation,
      backgroundColor,
      textColor,
      imageUrl,
      linkUrl,
      delay,
      showDuration,
      startDate,
      endDate
    } = req.body;

    try {
      // Käsittele päivämäärät oikein - vain jos ne ovat valideja
      const timingData = {
        delay: parseInt(delay) || 0,
        showDuration: parseInt(showDuration) || 0
      };
      
      // Lisää päivämäärät vain jos ne ovat valideja
      if (startDate && startDate !== 'default' && startDate !== 'null') {
        timingData.startDate = new Date(startDate);
      }
      
      if (endDate && endDate !== 'default' && endDate !== 'null') {
        timingData.endDate = new Date(endDate);
      }
      
      // Luo uusi popup
      const newPopup = new Popup({
        userId: req.user._id,
        name: name || 'Unnamed Popup',
        elementType: elementType || 'popup',
        elementConfig: elementConfig || {},
        targeting: targeting || { enabled: false, matchType: 'all', rules: [] },
        popupType: popupType || 'rectangle',
        content,
        width: parseInt(width) || 200,
        height: parseInt(height) || 150,
        position,
        animation,
        backgroundColor,
        textColor,
        imageUrl,
        linkUrl,
        timing: timingData
      });
      
      await newPopup.save();
      
      // Jos popup käyttää kuvaa, päivitä kuvan käyttötiedot
      if (imageUrl) {
        await PopupController.updateImageUsage(req.user._id, imageUrl, newPopup._id);
      }
      
      res.status(201).json(newPopup);
    } catch (err) {
      console.error("Error saving popup:", err);
      res.status(500).json({ message: 'Error saving popup', error: err.toString() });
    }
  }

  /**
   * Hakee käyttäjän kaikki popupit
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUserPopups(req, res) {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const popups = await Popup.find({ userId: req.user._id });
      res.json(popups);
    } catch (err) {
      console.error('Error fetching popups:', err);
      res.status(500).json({ message: 'Error fetching popups', error: err });
    }
  }

  /**
   * Päivittää olemassa olevan popupin
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updatePopup(req, res) {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const {
      name,
      popupType,
      elementType,
      elementConfig,
      targeting,
      content,
      width,
      height,
      position,
      animation,
      backgroundColor,
      textColor,
      imageUrl,
      linkUrl,
      delay,
      showDuration,
      startDate,
      endDate
    } = req.body;

    try {
      // Hae popup ensin, jotta voimme tarkistaa aiemman image URL:n
      const oldPopup = await Popup.findOne({ 
        _id: req.params.id,
        userId: req.user._id
      });
      
      if (!oldPopup) {
        return res.status(404).json({ message: 'Popup not found' });
      }
      
      const oldImageUrl = oldPopup.imageUrl;

      // Tarkista onko kuva vaihtunut
      const imageChanged = oldPopup.imageUrl !== imageUrl;

      // Päivitä popup
      const updateData = {
        name,
        popupType,
        content,
        width,
        height,
        position,
        animation,
        backgroundColor,
        textColor,
        imageUrl,
        linkUrl,
        delay,
        showDuration,
        startDate,
        endDate,
      };
      
      // Jos kuva on vaihtunut, päivitä myös versionumero
      if (imageChanged) {
        updateData.version = Date.now();
      }
      
      // Käsittele päivämäärät oikein
      const timingData = {
        delay: parseInt(delay) || 0,
        showDuration: parseInt(showDuration) || 0
      };
      
      // Lisää päivämäärät vain jos ne ovat valideja
      if (startDate && startDate !== 'default' && startDate !== 'null') {
        timingData.startDate = new Date(startDate);
      }
      
      if (endDate && endDate !== 'default' && endDate !== 'null') {
        timingData.endDate = new Date(endDate);
      }
      
      // Päivitä popup
      const updatedPopup = await Popup.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        {
          name: name || 'Unnamed Popup',
          ...(elementType && { elementType }),
          ...(elementConfig && { elementConfig }),
          ...(targeting !== undefined && { targeting }),
          popupType: popupType || 'rectangle',
          content,
          width: parseInt(width) || 200,
          height: parseInt(height) || 150,
          position,
          animation,
          backgroundColor,
          textColor,
          imageUrl,
          linkUrl,
          timing: timingData,
        },
        { new: true }
      );
      
      // Käsittele kuvan käyttötietojen päivitys
      if (oldImageUrl !== imageUrl) {
        // Jos kuva on vaihdettu, päivitä kuvatiedot
        await PopupController.updateImageReferences(req.user._id, oldImageUrl, imageUrl, req.params.id);
      }
      
      if (!updatedPopup) {
        return res.status(404).json({ message: 'Popup not found' });
      }
      
      res.json(updatedPopup);
    } catch (err) {
      console.error("Error updating popup:", err);
      res.status(500).json({ message: 'Error updating popup', error: err.toString() });
    }
  }

  /**
   * Poistaa popupin
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deletePopup(req, res) {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      // Hae popup ensin
      const popup = await Popup.findOne({
        _id: req.params.id,
        userId: req.user._id
      });
      
      if (!popup) {
        return res.status(404).json({ message: 'Popup not found' });
      }
      
      // Jos popup käyttää kuvaa, päivitä kuvan käyttötiedot
      if (popup.imageUrl) {
        await PopupController.removeImageReference(req.user._id, popup.imageUrl, req.params.id);
      }
      
      // Poista popup
      const deletedPopup = await Popup.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
      });
      
      if (!deletedPopup) {
        return res.status(404).json({ message: 'Popup not found' });
      }
      
      res.json({ message: 'Popup deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting popup', error: err });
    }
  }

  /**
   * Hakee yksittäisen popupin embed-käyttöä varten
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getEmbedPopup(req, res) {
    try {
      const popup = await Popup.findById(req.params.id);
      if (!popup) {
        return res.status(404).json({ message: 'Popup not found' });
      }

      // Tehdään popupista kopio, jotta voimme muokata sitä ilman että tallennetaan muutokset
      const cleanPopup = popup.toObject();

      // Puhdistetaan päivämäärät
      if (cleanPopup.timing) {
        // Varmistetaan että delay ja duration ovat numeroita
        cleanPopup.timing.delay = parseInt(cleanPopup.timing.delay) || 0;
        cleanPopup.timing.showDuration = parseInt(cleanPopup.timing.showDuration) || 0;
        
        // Poistetaan "default" arvot
        if (cleanPopup.timing.startDate === 'default') {
          delete cleanPopup.timing.startDate;
        }
        
        if (cleanPopup.timing.endDate === 'default') {
          delete cleanPopup.timing.endDate;
        }
      }

      // Add no-cache headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json(cleanPopup);
    } catch (err) {
      console.error('Error fetching popup:', err);
      res.status(500).json({ message: 'Error fetching popup', error: err });
    }
  }

  /**
   * Rekisteröi popupin näyttökerran tilastoihin
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async registerView(req, res) {
    try {
      const popupId = req.params.id;
      
      // Päivitä tilastot
      await Popup.findByIdAndUpdate(popupId, {
        $inc: { 'statistics.views': 1 },
        $set: { 'statistics.lastViewed': new Date() }
      });
      
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error registering view:', err);
      res.status(500).json({ message: 'Error registering view', error: err.toString() });
    }
  }

  /**
   * Rekisteröi popupin klikkauksen tilastoihin
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async registerClick(req, res) {
    try {
      const popupId = req.params.id;
      
      // Päivitä tilastot
      const result = await Popup.findByIdAndUpdate(popupId, {
        $inc: { 'statistics.clicks': 1 },
        $set: { 'statistics.lastClicked': new Date() }
      }, { new: true });
      
      res.status(200).json({ success: true, message: 'Click registered' });
    } catch (err) {
      console.error('Error registering click:', err);
      res.status(500).json({ message: 'Error registering click', error: err.toString() });
    }
  }

  /**
   * Hakee popupin tilastot
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getPopupStats(req, res) {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const popup = await Popup.findOne({
        _id: req.params.id,
        userId: req.user._id
      });
      
      if (!popup) {
        return res.status(404).json({ message: 'Popup not found' });
      }
      
      // Laske klikkiprosentti (CTR)
      let clickThroughRate = 0;
      if (popup.statistics.views > 0) {
        clickThroughRate = (popup.statistics.clicks / popup.statistics.views) * 100;
      }
      
      res.json({
        views: popup.statistics.views || 0,
        clicks: popup.statistics.clicks || 0,
        clickThroughRate: clickThroughRate.toFixed(2),
        lastViewed: popup.statistics.lastViewed || null,
        lastClicked: popup.statistics.lastClicked || null,
        statsResetAt: popup.statistics.statsResetAt || null
      });
    } catch (err) {
      console.error('Error fetching popup statistics:', err);
      res.status(500).json({ message: 'Error fetching popup statistics', error: err.toString() });
    }
  }

  /**
 * (Admin) Hae popupin tilastot millä tahansa ID:llä
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
  static async getAdminPopupStats(req, res) {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    try {
      const popup = await Popup.findById(req.params.id);
      
      if (!popup) {
        return res.status(404).json({ message: 'Popup not found' });
      }
      
      // Laske klikkiprosentti (CTR)
      let clickThroughRate = 0;
      if (popup.statistics.views > 0) {
        clickThroughRate = (popup.statistics.clicks / popup.statistics.views) * 100;
      }
      
      res.json({
        views: popup.statistics.views || 0,
        clicks: popup.statistics.clicks || 0,
        clickThroughRate: clickThroughRate.toFixed(2),
        lastViewed: popup.statistics.lastViewed || null,
        lastClicked: popup.statistics.lastClicked || null,
        statsResetAt: popup.statistics.statsResetAt || null
      });
    } catch (err) {
      console.error('Error fetching popup statistics:', err);
      res.status(500).json({ message: 'Error fetching popup statistics', error: err.toString() });
    }
  }

  /**
   * Nollaa popupin tilastot
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async resetStats(req, res) {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const popup = await Popup.findOneAndUpdate(
        { 
          _id: req.params.id,
          userId: req.user._id 
        },
        {
          $set: {
            'statistics.views': 0,
            'statistics.clicks': 0,
            'statistics.lastViewed': null,
            'statistics.lastClicked': null,
            'statistics.statsResetAt': new Date()
          }
        },
        { new: true }
      );

      if (!popup) {
        return res.status(404).json({ message: 'Popup not found' });
      }

      res.json({ success: true, message: 'Statistics reset successfully' });
    } catch (err) {
      console.error('Error resetting popup statistics:', err);
      res.status(500).json({ message: 'Error resetting statistics', error: err.toString() });
    }
  }

  /**
   * (Admin) Hae kaikki popupit
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllPopups(req, res) {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    try {
      const popups = await Popup.find({});
      res.json(popups);
    } catch (err) {
      console.error('Error fetching popups:', err);
      res.status(500).json({ message: 'Error fetching popups', error: err });
    }
  }

  /**
   * (Admin) Päivitä popup
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async adminUpdatePopup(req, res) {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authenticated or not authorized' });
    }

    const {
      name,
      popupType,
      width,
      height,
      position,
      animation,
      backgroundColor,
      textColor,
      content,
      imageUrl,
      linkUrl,
      delay,
      showDuration,
      startDate,
      endDate
    } = req.body;

    try {
      const updatedPopup = await Popup.findOneAndUpdate(
        { _id: req.params.id },
        {
          name: name || 'Unnamed Popup',
          popupType,
          width,
          height,
          position,
          animation,
          backgroundColor,
          textColor,
          content,
          imageUrl,
          linkUrl,
          timing: {
            delay,
            showDuration,
            startDate,
            endDate,
            frequency: 'always',
          }
        },
        { new: true }
      );
      
      if (!updatedPopup) {
        return res.status(404).json({ message: 'Popup not found' });
      }
      res.json(updatedPopup);
    } catch (err) {
      res.status(500).json({ message: 'Error updating popup', error: err });
    }
  }

  // Apumetodit kuvatietojen päivittämiseen

  /**
   * Päivittää kuvan käyttötiedot uuden popupin luonnin yhteydessä
   * @param {string} userId - Käyttäjän ID
   * @param {string} imageUrl - Kuvan URL
   * @param {string} popupId - Popupin ID
   */
  static async updateImageUsage(userId, imageUrl, popupId) {
    if (!imageUrl) return;
    
    try {
      // Etsi kuva URL:n perusteella
      const image = await Image.findOne({ 
        url: imageUrl,
        userId: userId
      });
      
      if (image) {
        // Lisää popup kuvan käyttötietoihin
        if (!image.usedInPopups) {
          image.usedInPopups = [];
        }
        
        if (!image.usedInPopups.includes(popupId)) {
          image.usedInPopups.push(popupId);
          await image.save();
        }
      }
    } catch (error) {
      console.error('Error updating image usage:', error);
    }
  }

  /**
   * Päivittää kuvan käyttöviittaukset, kun popupin kuvaa vaihdetaan
   * @param {string} userId - Käyttäjän ID
   * @param {string} oldImageUrl - Vanha kuvan URL
   * @param {string} newImageUrl - Uusi kuvan URL
   * @param {string} popupId - Popupin ID
   */
  static async updateImageReferences(userId, oldImageUrl, newImageUrl, popupId) {
    try {
      // Jos vanha kuva on vaihdettu, poista viittaus vanhasta kuvasta
      if (oldImageUrl) {
        await PopupController.removeImageReference(userId, oldImageUrl, popupId);
      }
      
      // Jos uusi kuva on määritetty, lisää viittaus uuteen kuvaan
      if (newImageUrl) {
        await PopupController.updateImageUsage(userId, newImageUrl, popupId);
      }
    } catch (error) {
      console.error('Error updating image references:', error);
    }
  }

  /**
   * Poistaa kuvan käyttöviittauksen
   * @param {string} userId - Käyttäjän ID
   * @param {string} imageUrl - Kuvan URL
   * @param {string} popupId - Popupin ID
   */
  /**
   * Palauttaa valmiit template-presetit (ei tietokantakyselyä)
   */
  static getTemplates(req, res) {
    const templates = [
      {
        id: 'sticky-announcement', name: 'Announcement Banner', category: 'Sticky Bars',
        elementType: 'sticky_bar', popupType: 'rectangle',
        elementConfig: { barPosition: 'top', barText: '🎉 Uusi palvelu on nyt saatavilla!', ctaButtons: [{ label: 'Lue lisää', url: '', style: 'primary' }], showDismiss: true, dismissCookieDays: 1 },
        backgroundColor: '#1a56db', textColor: '#ffffff'
      },
      {
        id: 'sticky-cookie', name: 'Cookie-ilmoitus', category: 'Sticky Bars',
        elementType: 'sticky_bar', popupType: 'rectangle',
        elementConfig: { barPosition: 'bottom', barText: 'Käytämme evästeitä parantaaksemme käyttökokemustasi.', ctaButtons: [{ label: 'Hyväksy', url: '', style: 'primary' }, { label: 'Tietosuoja', url: '/privacy', style: 'outline' }], showDismiss: false, dismissCookieDays: 365 },
        backgroundColor: '#1f2937', textColor: '#ffffff'
      },
      {
        id: 'sticky-offer', name: 'Tarjousilmoitus', category: 'Sticky Bars',
        elementType: 'sticky_bar', popupType: 'rectangle',
        elementConfig: { barPosition: 'top', barText: '🔥 -20% kaikesta tänään! Käytä koodia SAVE20', ctaButtons: [{ label: 'Tilaa nyt', url: '', style: 'primary' }], showDismiss: true, dismissCookieDays: 0 },
        backgroundColor: '#dc2626', textColor: '#ffffff'
      },
      {
        id: 'fab-chat', name: 'Chat-nappi', category: 'Floating Buttons',
        elementType: 'fab', popupType: 'rectangle',
        elementConfig: { fabPosition: 'bottom-right', fabIcon: 'fa-comment', fabColor: '#1a56db', fabSize: 'md', fabAction: 'link', pulseAnimation: true }
      },
      {
        id: 'fab-phone', name: 'Soittopyyntö', category: 'Floating Buttons',
        elementType: 'fab', popupType: 'rectangle',
        elementConfig: { fabPosition: 'bottom-right', fabIcon: 'fa-phone', fabColor: '#16a34a', fabSize: 'md', fabAction: 'link', pulseAnimation: false }
      },
      {
        id: 'fab-top', name: 'Takaisin ylös', category: 'Floating Buttons',
        elementType: 'fab', popupType: 'rectangle',
        elementConfig: { fabPosition: 'bottom-right', fabIcon: 'fa-arrow-up', fabColor: '#6b7280', fabSize: 'sm', fabAction: 'link', fabUrl: '#top', pulseAnimation: false }
      },
      {
        id: 'slide-newsletter', name: 'Uutiskirje', category: 'Slide-ins',
        elementType: 'slide_in', popupType: 'rectangle',
        elementConfig: { slideInPosition: 'bottom-right', slideInWidth: 340, slideInTrigger: 'scroll', slideInTriggerValue: 50, showCloseButton: true },
        content: '<h3 style="margin:0 0 8px">Pysytään yhteydessä!</h3><p style="margin:0 0 12px;font-size:14px">Tilaa uutiskirje ja saat parhaat tarjoukset.</p>',
        backgroundColor: '#ffffff', textColor: '#1f2937'
      },
      {
        id: 'slide-offer', name: 'Alennustarjous', category: 'Slide-ins',
        elementType: 'slide_in', popupType: 'rectangle',
        elementConfig: { slideInPosition: 'bottom-left', slideInWidth: 300, slideInTrigger: 'time', slideInTriggerValue: 30, showCloseButton: true },
        content: '<h3 style="margin:0 0 8px">⚡ 20% alennus!</h3><p style="margin:0 0 12px;font-size:14px">Voimassa vain tänään.</p>',
        backgroundColor: '#fef3c7', textColor: '#92400e'
      },
      {
        id: 'popup-announcement', name: 'Ilmoituspopup', category: 'Popups',
        elementType: 'popup', popupType: 'rectangle',
        elementConfig: { popupSubtype: 'announcement' },
        content: '<h2>Tervetuloa!</h2><p>Tärkeä ilmoitus sivustolla kävijöille.</p>',
        backgroundColor: '#ffffff', textColor: '#1f2937', width: 400, height: 200
      },
      {
        id: 'social-booking', name: 'Ajanvarausilmoitus', category: 'Social Proof',
        elementType: 'social_proof', popupType: 'rectangle',
        elementConfig: { proofText: '{count} henkilöä varasi ajan tällä viikolla', proofCount: 0, proofIcon: '📅', proofDuration: 5, proofInterval: 10, proofPosition: 'bottom-left', backgroundColor: '#1f2937', textColor: '#ffffff' }
      },
      {
        id: 'social-viewers', name: 'Katselijat nyt', category: 'Social Proof',
        elementType: 'social_proof', popupType: 'rectangle',
        elementConfig: { proofText: '{count} henkilöä katsoo tätä sivua nyt', proofCount: 0, proofIcon: '👀', proofDuration: 4, proofInterval: 8, proofPosition: 'bottom-left', backgroundColor: '#0f172a', textColor: '#f8fafc' }
      },
      {
        id: 'social-purchase', name: 'Ostoilmoitus', category: 'Social Proof',
        elementType: 'social_proof', popupType: 'rectangle',
        elementConfig: { proofText: 'Joku osti juuri tämän tuotteen!', proofCount: 1, proofIcon: '🛒', proofDuration: 5, proofInterval: 12, proofPosition: 'bottom-right', backgroundColor: '#14532d', textColor: '#dcfce7' }
      },
      {
        id: 'scroll-blue', name: 'Sininen progress bar', category: 'Scroll Progress',
        elementType: 'scroll_progress', popupType: 'rectangle',
        elementConfig: { progressPosition: 'top', progressHeight: 4, progressColor: '#2563eb', backgroundColor: '#e2e8f0' }
      },
      {
        id: 'scroll-warm', name: 'Oranssi progress bar', category: 'Scroll Progress',
        elementType: 'scroll_progress', popupType: 'rectangle',
        elementConfig: { progressPosition: 'top', progressHeight: 6, progressColor: '#f59e0b', backgroundColor: '#fef3c7' }
      }
    ];
    res.json(templates);
  }

  static async removeImageReference(userId, imageUrl, popupId) {
    if (!imageUrl) return;
    
    try {
      const image = await Image.findOne({ 
        url: imageUrl,
        userId: userId
      });
      
      if (image && image.usedInPopups) {
        // Poista popup kuvan käyttötiedoista
        image.usedInPopups = image.usedInPopups.filter(
          id => id.toString() !== popupId.toString()
        );
        await image.save();
      }
    } catch (error) {
      console.error('Error removing image reference:', error);
    }
  }
}

module.exports = PopupController;
