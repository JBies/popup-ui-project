// server.js
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./db');
const Popup = require('./models/Popup'); // Tuo Popup-malli
require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

// Middleware for parsing JSON
app.use(express.json());

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Route to fetch user info
app.get('/api/user', (req, res) => {
    if (req.user) {
        res.json({ user: req.user });
    } else {
        res.json({ user: null });
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

// Route to create a new popup
app.post('/api/popups', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    const { popupType, content } = req.body;

    try {
        const newPopup = new Popup({
            userId: req.user.googleId,
            popupType,
            content
        });
        await newPopup.save();
        res.status(201).json(newPopup);
    } catch (err) {
        res.status(500).json({ message: 'Error saving popup', error: err });
    }
});

// Route to get user's popups
app.get('/api/popups', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const popups = await Popup.find({ userId: req.user.googleId });
        res.json(popups);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching popups', error: err });
    }
});

// Route to update a popup
app.put('/api/popups/:id', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    const { popupType, content } = req.body;

    try {
        const updatedPopup = await Popup.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.googleId },
            { popupType, content },
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
            userId: req.user.googleId
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
// Esimerkki admin-reitistä
app.get('/admin', (req, res) => {
    if (req.user && req.user.role === 'admin') {
        res.send('Admin dashboard');
    } else {
        res.status(403).send('Access denied');
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});