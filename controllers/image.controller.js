// controllers/image.controller.js
// Kuvien hallintaan liittyvät kontrollerit

const fs = require('fs');
const Image = require('../models/Image');
const Popup = require('../models/Popup');
const { bucket } = require('../firebase');
const recentUploads = new Map(); // Säilyttää viimeisimmät lataukset muistissa
const activeUploads = new Set(); // Tallentaa parhaillaan käynnissä olevat lataukset

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
  
      // Luo uniikki avain tiedostolle (käyttäjä + tiedostonimi + koko)
      const fileKey = `${req.user._id}-${req.file.originalname}-${req.file.size}`;
      
      // Jos tämä tiedosto on jo käsittelyssä, odota kunnes se valmistuu
      if (activeUploads.has(fileKey)) {
        console.log(`File ${fileKey} is already being processed, waiting...`);
        
        // Odota että aiempi käsittely valmistuu
        let retryCount = 0;
        while (activeUploads.has(fileKey) && retryCount < 10) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Odota 500ms
          retryCount++;
        }
        
        // Tarkista onko kuva jo ladattu onnistuneesti
        if (recentUploads.has(fileKey)) {
          console.log("Using previously uploaded image");
          const result = recentUploads.get(fileKey);
          return res.json(result);
        }
      }
      
      // Merkkaa tämä tiedosto käsittelyyn
      activeUploads.add(fileKey);
      
      // Tarkista onko sama tiedosto jo ladattu lähiaikoina
      if (recentUploads.has(fileKey)) {
        console.log("Duplicate upload detected, returning cached result");
        const result = recentUploads.get(fileKey);
        activeUploads.delete(fileKey);
        return res.json(result);
      }
      
      // Tarkista onko tietokannassa jo sama kuva tältä käyttäjältä
      const existingImage = await Image.findOne({
        userId: req.user._id,
        name: req.file.originalname,
        size: req.file.size
      }).sort({ createdAt: -1 }).limit(1);
      
      // Jos kuva on ladattu viimeisen 5 minuutin aikana, käytä sitä
      if (existingImage && 
          (new Date() - new Date(existingImage.createdAt)) < 5 * 60 * 1000) {
        console.log("Using recently uploaded image from database");
        const result = {
          imageUrl: existingImage.url,
          imageId: existingImage._id,
          name: existingImage.name,
          size: existingImage.size
        };
        
        recentUploads.set(fileKey, result);
        activeUploads.delete(fileKey);
        return res.json(result);
      }
  
      // Jatka normaalilla kuvan latauksella
      const filePath = req.file.path;
      const fileExtension = require('path').extname(req.file.originalname);
      
      // Luodaan uniikki tiedostonimi käyttäjän ID:n ja aikaleiman avulla
      const fileName = `${req.user._id}-${Date.now()}${fileExtension}`;
      const firebasePath = `popupImages/${fileName}`;
  
      // Lataa tiedosto Firebaseen ja jatka normaalia käsittelyä...
      await bucket.upload(filePath, {
        destination: firebasePath,
        metadata: {
          contentType: req.file.mimetype,
        }
      });
  
      // Generoi allekirjoitettu URL joka vanhenee 24 tunnissa
      const [signedUrl] = await bucket.file(firebasePath).getSignedUrl({
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        version: 'v4'
      });

      console.log("File uploaded successfully, signed URL:", signedUrl);

      // Poista väliaikainen tiedosto
      fs.unlinkSync(filePath);

      // Tallenna kuvan tiedot tietokantaan
      const newImage = new Image({
        userId: req.user._id,
        name: req.file.originalname,
        url: signedUrl,
        size: req.file.size,
        mimeType: req.file.mimetype,
        firebasePath: firebasePath // Store path for future URL regeneration
      });
  
      await newImage.save();
      
      // Tallenna tulos väliaikaismuistiin
      const result = { 
        imageUrl: signedUrl,
        imageId: newImage._id,
        name: newImage.name,
        size: newImage.size
      };
      
      recentUploads.set(fileKey, result);
      
      // Poista tiedosto käsittelystä
      activeUploads.delete(fileKey);
      
      // Poista vanhentuneet tiedostot väliaikaismuistista (10 minuutin jälkeen)
      setTimeout(() => {
        recentUploads.delete(fileKey);
      }, 10 * 60 * 1000);
      
      // Palauta URL ja muut tiedot clientille
      res.json(result);
    } catch (error) {
      console.error('Virhe kuvan latauksessa:', error);
      
      // Varmista, että tiedosto poistetaan käsittelystä virhetilanteessakin
      if (req.file) {
        const fileKey = `${req.user._id}-${req.file.originalname}-${req.file.size}`;
        activeUploads.delete(fileKey);
      }
      
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
        .select('name url size createdAt firebasePath'); // Valitse vain tarvittavat kentät

      // Regenerate signed URLs for each image
      const imagesWithUrls = await Promise.all(images.map(async (image) => {
        const [signedUrl] = await bucket.file(image.firebasePath).getSignedUrl({
          action: 'read',
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          version: 'v4'
        });
        return {
          ...image.toObject(),
          url: signedUrl
        };
      }));
      
      res.json(imagesWithUrls);
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
  
      // Generate new signed URL for the image
      const [signedUrl] = await bucket.file(image.firebasePath).getSignedUrl({
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        version: 'v4'
      });

      res.json({
        image: {
          ...image.toObject(),
          url: signedUrl
        },
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
      const firebasePath = image.firebasePath;
      
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
