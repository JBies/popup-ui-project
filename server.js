// server.js
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./db');
const User = require('./models/User'); // Import User model
const Popup = require('./models/Popup'); // Import Popup model
const path = require('path');
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
            timing: timingData
        });
        
        await newPopup.save();
        res.status(201).json(newPopup);
    } catch (err) {
        console.error("Error saving popup:", err);
        res.status(500).json({ message: 'Error saving popup', error: err });
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
        delay,
        showDuration,
        startDate,
        endDate
    } = req.body;

    try {
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
        
        const updatedPopup = await Popup.findOneAndUpdate(
            { _id: req.params.id },
            {
                popupType,
                content,
                width: parseInt(width) || 200,
                height: parseInt(height) || 150,
                position,
                animation,
                backgroundColor,
                textColor,
                timing: timingData
            },
            { new: true }
        );
        
        if (!updatedPopup) {
            return res.status(404).json({ message: 'Popup not found' });
        }
        res.json(updatedPopup);
    } catch (err) {
        console.error("Error updating popup:", err);
        res.status(500).json({ message: 'Error updating popup', error: err });
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

// Route to delete a popup
app.delete('/api/popups/:id', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
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