// controllers/image.controller.js
// Kuvien hallintaan liittyvät kontrollerit

const fs = require('fs');
const Image = require('../models/Image');
const Popup = require('../models/Popup');
const { bucket } = require('../public/firebase');

/**
 * ImageController vastaa kuvien hallinnan toimintalogiikasta
 */
class ImageController {
  /**
   * Lataa kuvan Firebaseen ja tallentaa tiedot tietokantaan
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async uploadImage(req, res) {
    if (!req.user) {
      return res.status(401).json({ message: 'Kirjautuminen vaaditaan' });
    }
  
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Kuvaa ei ladattu' });
      }
  
      console.log("Processing uploaded file:", req.file);
  
      const filePath = req.file.path;
      const fileExtension = require('path').extname(req.file.originalname);
      
      // Luodaan uniikki tiedostonimi käyttäjän ID:n ja aikaleiman avulla
      const fileName = `${req.user._id}-${Date.now()}${fileExtension}`;
      const firebasePath = `popupImages/${fileName}`;
  
      // Lataa tiedosto Firebaseen
      await bucket.upload(filePath, {
        destination: firebasePath,
        metadata: {
          contentType: req.file.mimetype,
        }
      });
  
      // Tee tiedosto julkisesti saatavaksi ja hae URL
      await bucket.file(firebasePath).makePublic();
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${firebasePath}`;
  
      console.log("File uploaded successfully, URL:", imageUrl);
  
      // Poista väliaikainen tiedosto
      fs.unlinkSync(filePath);
  
      // Tallenna kuvan tiedot tietokantaan
      const newImage = new Image({
        userId: req.user._id,
        name: req.file.originalname,
        url: imageUrl,
        size: req.file.size,
        mimeType: req.file.mimetype
      });
  
      await newImage.save();
      
      // Palauta URL ja muut tiedot clientille
      res.json({ 
        imageUrl,
        imageId: newImage._id,
        name: newImage.name,
        size: newImage.size
      });
    } catch (error) {
      console.error('Virhe kuvan latauksessa:', error);
      res.status(500).json({ message: 'Virhe kuvan latauksessa', error: error.message });
    }
  }

  /**
   * Hakee käyttäjän kaikki kuvat
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUserImages(req, res) {
    if (!req.user) {
      return res.status(401).json({ message: 'Kirjautuminen vaaditaan' });
    }
  
    try {
      const images = await Image.find({ userId: req.user._id })
        .sort({ createdAt: -1 }) // Uusimmat ensin
        .select('name url size createdAt'); // Valitse vain tarvittavat kentät
      
      res.json(images);
    } catch (error) {
      console.error('Virhe kuvien haussa:', error);
      res.status(500).json({ message: 'Virhe kuvien haussa', error: error.message });
    }
  }

  /**
   * Hakee yksittäisen kuvan tiedot ja käyttökohteet
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getImageDetails(req, res) {
    if (!req.user) {
      return res.status(401).json({ message: 'Kirjautuminen vaaditaan' });
    }
  
    try {
      const image = await Image.findOne({ 
        _id: req.params.id,
        userId: req.user._id
      });
  
      if (!image) {
        return res.status(404).json({ message: 'Kuvaa ei löydy' });
      }
  
      // Hae popupit, joissa kuvaa käytetään
      let popups = [];
      if (image.usedInPopups && image.usedInPopups.length > 0) {
        popups = await Popup.find({
          _id: { $in: image.usedInPopups },
          userId: req.user._id
        }).select('_id popupType content createdAt');
      }
  
      res.json({
        image,
        popups
      });
    } catch (error) {
      console.error('Virhe kuvan tietojen haussa:', error);
      res.status(500).json({ message: 'Virhe kuvan tietojen haussa', error: error.message });
    }
  }

  /**
   * Poistaa kuvan
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteImage(req, res) {
    if (!req.user) {
      return res.status(401).json({ message: 'Kirjautuminen vaaditaan' });
    }
  
    try {
      // Varmista että käyttäjä omistaa kuvan
      const image = await Image.findOne({ 
        _id: req.params.id,
        userId: req.user._id
      });
  
      if (!image) {
        return res.status(404).json({ message: 'Kuvaa ei löydy' });
      }
  
      // Tarkista, käytetäänkö kuvaa aktiivisesti popupeissa
      if (image.usedInPopups && image.usedInPopups.length > 0) {
        return res.status(400).json({ 
          message: 'Kuvaa ei voi poistaa, koska sitä käytetään popupeissa',
          popups: image.usedInPopups 
        });
      }
  
      // Poista kuva Firebasesta
      const urlParts = image.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const firebasePath = `popupImages/${fileName}`;
      
      try {
        await bucket.file(firebasePath).delete();
        console.log(`Firebase image deleted: ${firebasePath}`);
      } catch (firebaseError) {
        console.error('Firebase image deletion error:', firebaseError);
        // Jatka silti tietokannasta poistamiseen
      }
  
      // Poista kuva tietokannasta
      await Image.deleteOne({ _id: req.params.id });
      
      res.json({ message: 'Kuva poistettu onnistuneesti' });
    } catch (error) {
      console.error('Virhe kuvan poistossa:', error);
      res.status(500).json({ message: 'Virhe kuvan poistossa', error: error.message });
    }
  }
}

module.exports = ImageController;