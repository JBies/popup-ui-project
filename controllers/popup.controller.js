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
        popupType,
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
          popupType,
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
        lastClicked: popup.statistics.lastClicked || null
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
      lastClicked: popup.statistics.lastClicked || null
    });
  } catch (err) {
    console.error('Error fetching popup statistics:', err);
    res.status(500).json({ message: 'Error fetching popup statistics', error: err.toString() });
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