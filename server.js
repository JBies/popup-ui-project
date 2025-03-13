// server.js
// Sovelluksen pääsisääntulopiste

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const connectDB = require('./db');

// Reittien tuonti
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const popupRoutes = require('./routes/popup.routes');
const imageRoutes = require('./routes/image.routes');
const adminRoutes = require('./routes/admin.routes');

// Autentikaation asetukset
require('./auth');

// Alustetaan Express
const app = express();
const PORT = process.env.PORT || 3000;

// Yhdistetään tietokantaan
connectDB();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(passport.initialize());
app.use(passport.session());

// Embedin js tiedosto
app.use('/popup-embed.js', express.static(path.join(__dirname, 'popup-embed.js')));

// Sovelluksen päänäkymä
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Reittien rekisteröinti
app.use('/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/popups', popupRoutes);
app.use('/api', imageRoutes);
app.use('/api/admin', adminRoutes);

// Ohjaa staattiset .html-sivut
app.get('*.html', (req, res) => {
    res.sendFile(path.join(__dirname, req.path));
});

// Käsittele mahdolliset 404-virheet
app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
});

// Käsittele palvelinvirheet
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Käynnistä palvelin
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});