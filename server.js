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

// Route to create a new popup
app.post('/api/popups', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    const { popupType, content } = req.body;

    try {
        const newPopup = new Popup({
            userId: req.user._id, // Ensure userId is stored as ObjectId
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
        const popups = await Popup.find({ userId: req.user._id });
        res.json(popups);
    } catch (err) {
        console.error('Error fetching popups:', err);
        res.status(500).json({ message: 'Error fetching popups', error: err });
    }
});

// Route to update a popup
app.put('/api/popups/:id', async (req, res) => {
    if (!req.user) {
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
        content,
        timing
    } = req.body;

    try {
        const updatedPopup = await Popup.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            {
                popupType,
                width,
                height,
                position,
                animation,
                backgroundColor,
                textColor,
                content,
                timing
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});