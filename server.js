// server.js
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./db');
const User = require('./models/User'); // Import User model
const Popup = require('./models/Popup'); // Import Popup model
const path = require('path');
const upload = require('./upload');
const { bucket } = require('./firebase');
const fs = require('fs');
const Image = require('./models/Image');
require('./auth');

const app = express();
const PORT = 3000;

connectDB();

// Middleware for parsing JSON
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '/')));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

//Embedin js tiedosto
app.use('/popup-embed.js', express.static(path.join(__dirname, 'popup-embed.js')));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route to fetch user info
app.get('/api/user', (req, res) => {
    if (req.user) {
        res.json({ user: req.user }); // Send user info
    } else {
        res.json({ user: null }); // If user is not logged in
    }
});

// Route to handle logout
app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/');
    });
});

// Uuden popupin luonti
app.post('/api/popups', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    const { 
        popupType, 
        content, 
        width, 
        height, 
        position, 
        animation, 
        backgroundColor, 
        textColor,
        imageUrl,
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
            popupType,
            content,
            width: parseInt(width) || 200,
            height: parseInt(height) || 150,
            position,
            animation,
            backgroundColor,
            textColor,
            imageUrl,
            timing: timingData
        });
        
        await newPopup.save();
        
        // Jos popup käyttää kuvaa, päivitä kuvan käyttötiedot
        if (imageUrl) {
            // Etsi kuva URL:n perusteella
            const image = await Image.findOne({ 
                url: imageUrl,
                userId: req.user._id
            });
            
            if (image) {
                // Lisää popup kuvan käyttötietoihin
                if (!image.usedInPopups) {
                    image.usedInPopups = [];
                }
                
                if (!image.usedInPopups.includes(newPopup._id)) {
                    image.usedInPopups.push(newPopup._id);
                    await image.save();
                }
            }
        }
        
        res.status(201).json(newPopup);
    } catch (err) {
        console.error("Error saving popup:", err);
        res.status(500).json({ message: 'Error saving popup', error: err.toString() });
    }
});

// Route to get user's popups
app.get('/api/popups', async (req, res) => {
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
});

// Päivitä popup
app.put('/api/popups/:id', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    const {
        popupType,
        content,
        width,
        height,
        position,
        animation,
        backgroundColor,
        textColor,
        imageUrl,
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
                popupType,
                content,
                width: parseInt(width) || 200,
                height: parseInt(height) || 150,
                position,
                animation,
                backgroundColor,
                textColor,
                imageUrl,
                timing: timingData
            },
            { new: true }
        );
        
        // Käsittele kuvan käyttötietojen päivitys
        if (oldImageUrl !== imageUrl) {
            // Jos vanha kuva on vaihdettu, poista viittaus vanhasta kuvasta
            if (oldImageUrl) {
                const oldImage = await Image.findOne({ 
                    url: oldImageUrl,
                    userId: req.user._id
                });
                
                if (oldImage && oldImage.usedInPopups) {
                    oldImage.usedInPopups = oldImage.usedInPopups.filter(
                        id => id.toString() !== req.params.id
                    );
                    await oldImage.save();
                }
            }
            
            // Jos uusi kuva on määritetty, lisää viittaus uuteen kuvaan
            if (imageUrl) {
                const newImage = await Image.findOne({ 
                    url: imageUrl,
                    userId: req.user._id
                });
                
                if (newImage) {
                    if (!newImage.usedInPopups) {
                        newImage.usedInPopups = [];
                    }
                    
                    if (!newImage.usedInPopups.includes(updatedPopup._id)) {
                        newImage.usedInPopups.push(updatedPopup._id);
                        await newImage.save();
                    }
                }
            }
        }
        
        if (!updatedPopup) {
            return res.status(404).json({ message: 'Popup not found' });
        }
        
        res.json(updatedPopup);
    } catch (err) {
        console.error("Error updating popup:", err);
        res.status(500).json({ message: 'Error updating popup', error: err.toString() });
    }
});

// Route for admin to update a popup
app.put('/api/admin/popups/:id', async (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(401).json({ message: 'Not authenticated or not authorized' });
    }

    const {
        popupType,
        width,
        height,
        position,
        animation,
        backgroundColor,
        textColor,
        content
    } = req.body;

    try {
        const updatedPopup = await Popup.findOneAndUpdate(
            { _id: req.params.id },
            {
                popupType,
                width,
                height,
                position,
                animation,
                backgroundColor,
                textColor,
                content
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
});

// Poista popup
app.delete('/api/popups/:id', async (req, res) => {
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
            const image = await Image.findOne({ 
                url: popup.imageUrl,
                userId: req.user._id
            });
            
            if (image && image.usedInPopups) {
                // Poista popup kuvan käyttötiedoista
                image.usedInPopups = image.usedInPopups.filter(
                    id => id.toString() !== req.params.id
                );
                await image.save();
            }
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
});

// Hae yksittäisen kuvan tiedot ja käyttö
app.get('/api/images/:id', async (req, res) => {
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
  });

// Route to start Google OAuth login
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback route after Google OAuth login
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/');
    });

// Admin routes
// Fetch all users
app.get('/api/admin/users', async (req, res) => {
    if (req.user && req.user.role === 'admin') {
        try {
            const users = await User.find({});
            res.json(users);
        } catch (err) {
            res.status(500).json({ message: 'Error fetching users', error: err });
        }
    } else {
        res.status(403).send('Access denied');
    }
});

// Update user role
app.post('/api/admin/users/update-role/:id', async (req, res) => {
    if (req.user && req.user.role === 'admin') {
        const userId = req.params.id;
        const { role } = req.body;
        try {
            const user = await User.findById(userId);
            if (user) {
                user.role = role;
                await user.save();
                res.status(200).send('Role updated successfully!');
            } else {
                res.status(404).send('User not found');
            }
        } catch (err) {
            res.status(500).json({ message: 'Error updating role', error: err });
        }
    } else {
        res.status(403).send('Access denied');
    }
});

// Delete user
app.post('/api/admin/users/delete/:id', async (req, res) => {
    if (req.user && req.user.role === 'admin') {
        const userId = req.params.id;
        try {
            const user = await User.findByIdAndDelete(userId);
            if (user) {
                res.status(200).send('User deleted successfully!');
            } else {
                res.status(404).send('User not found');
            }
        } catch (err) {
            res.status(500).json({ message: 'Error deleting user', error: err });
        }
    } else {
        res.status(403).send('Access denied');
    }
});

// Fetch all popups
app.get('/api/admin/popups', async (req, res) => {
    if (req.user && req.user.role === 'admin') {
        try {
            const popups = await Popup.find({});
            res.json(popups);
        } catch (err) {
            console.error('Error fetching popups:', err);
            res.status(500).json({ message: 'Error fetching popups', error: err });
        }
    } else {
        res.status(403).send('Access denied');
    }
});

// Delete popup
app.post('/api/admin/popups/delete/:id', async (req, res) => {
    if (req.user && req.user.role === 'admin') {
        try {
            await Popup.findByIdAndDelete(req.params.id);
            res.sendStatus(200);
        } catch (err) {
            res.status(500).json({ message: 'Error deleting popup', error: err });
        }
    } else {
        res.status(403).send('Access denied');
    }
});
// Embed popup reitti
app.get('/api/popups/embed/:id', async (req, res) => {
    try {
        const popup = await Popup.findById(req.params.id);
        if (!popup) {
            return res.status(404).json({ message: 'Popup not found' });
        }

        // Debug: tarkista palautetaanko kuvan URL oikein
        console.log("Returning popup with image URL:", popup.imageUrl);

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

        res.json(cleanPopup);
    } catch (err) {
        console.error('Error fetching popup:', err);
        res.status(500).json({ message: 'Error fetching popup', error: err });
    }
});

// Reitti kuvien lataamiseksi Firebaseen
app.post('/api/upload', upload.single('image'), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Kirjautuminen vaaditaan' });
    }
  
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Kuvaa ei ladattu' });
      }
  
      console.log("Processing uploaded file:", req.file);
  
      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname);
      
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
});

// Hae käyttäjän kaikki kuvat
app.get('/api/images', async (req, res) => {
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
  });
  
  // Poista kuva
  app.delete('/api/images/:id', async (req, res) => {
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
  });



/*
// TILAPÄINEN: Siivoa tietokanta "default"-arvoista
// Kun menee sivulle http://localhost:3000/api/cleanup-database niin tyhjentää kaikki "default" arvot
// Suorita tämä vain kerran ja poista sitten
app.get('/api/cleanup-database', async (req, res) => {
    try {
        const results = await Popup.updateMany(
            { 'timing.startDate': 'default' },
            { $unset: { 'timing.startDate': 1 } }
        );
        
        const results2 = await Popup.updateMany(
            { 'timing.endDate': 'default' },
            { $unset: { 'timing.endDate': 1 } }
        );
        
        res.json({
            message: 'Database cleaned up successfully',
            startDateResults: results,
            endDateResults: results2
        });
    } catch (err) {
        console.error('Error cleaning up database:', err);
        res.status(500).json({ message: 'Error cleaning up database', error: err });
    }
});
*/

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});