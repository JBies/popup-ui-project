// Parannellut server.js tuotantokäyttöön

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const MongoStore = require('connect-mongo');
const connectDB = require('./db');

// Swagger dokumentaatio
const { swaggerDocs } = require('./swagger');

// Reittien tuonti
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const popupRoutes = require('./routes/popup.routes');
const imageRoutes = require('./routes/image.routes');
const adminRoutes = require('./routes/admin.routes');

// Middleware
const authMiddleware = require('./middleware/auth.middleware');

// Autentikaation asetukset
require('./auth');

// Ympäristömuuttujat
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || 'local-dev-secret';
const cookieSecure = process.env.COOKIE_SECURE === 'true';
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:3000'];

// Alustetaan Express
const app = express();

// Yhdistetään tietokantaan
connectDB();

    // Erillinen CORS-asetus popup-embed.js tiedostolle
    app.use('/popup-embed.js', (req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    });

// Tuotannon turvallisuusmekanismit
if (isProduction) {
    // Helmetin perusasetus, mutta sallitaan tarvittavat ulkoiset resurssit
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                    imgSrc: ["'self'", "data:", "https://storage.googleapis.com", "https://lh3.googleusercontent.com"],
                    connectSrc: ["'self'", "https://accounts.google.com"],
                    frameSrc: ["'self'", "https://accounts.google.com"],
                }
            }
        })
    );
}
    
    // Gzip-pakkaus
    app.use(compression());
    

 // Rajoitetut CORS-asetukset
app.use(cors({
    origin: allowedOrigins,
    credentials: true, // Tärkeä istuntojen toiminnalle
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200 // Yhteensopivuus mobiiliselaimien kanssa

}));

if (isProduction) {
    // Erillinen CORS-asetus popup-embed.js tiedostolle
    app.use('/popup-embed.js', (req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    });
    

} else {
    // Kehityksessä sallivammat CORS-asetukset
    app.use(cors({
        origin: true,
        credentials: true
    }));

}


// Perusmiddleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/')));

// Sessioasetukset
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: cookieSecure, // HTTPS vaaditaan tuotannossa
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 tuntia
    },
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60 // 24 tuntia (sekunteina)
    })
}));

// Autentikointi
app.use(passport.initialize());
app.use(passport.session());

// Pääreitti
app.get('/', authMiddleware.checkPendingStatus, (req, res) => {
    res.sendFile(path.join(__dirname, '/'));
});

// Embedin js tiedosto
app.get('/popup-embed.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'js/components/popup-embed.js')); // Tai mikä tahansa oikea polku
  });

// Pending-näkymä
app.get('/pending', (req, res) => {
    if (!req.user || req.user.role !== 'pending') {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'pending.html'));
});

// Reittien rekisteröinti
app.use('/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/popups', authMiddleware.isUser, popupRoutes);
app.use('/api/upload', authMiddleware.isUser, imageRoutes);
app.use('/api/images', authMiddleware.isUser, imageRoutes);
app.use('/api/admin', authMiddleware.isAdmin, adminRoutes);

// Swagger-dokumentaatio (vain kehitysympäristössä tai admin-käyttäjille)
if (!isProduction) {
    swaggerDocs(app, PORT);
} else {
    // Tuotannossa Swagger vain admineille
    app.use('/api-docs', authMiddleware.isAdmin, (req, res, next) => {
        next();
    });
    swaggerDocs(app, PORT);
}

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
    res.status(500).json({ 
        message: isProduction ? 'Internal server error' : err.message,
        stack: isProduction ? undefined : err.stack
    });
});

// Käynnistä palvelin
app.listen(PORT, () => {
    console.log(`Server running on ${isProduction ? 'production' : 'development'} mode`);
    console.log(`Listening on port ${PORT}`);
});

// Hallittu palvelimen sammutus
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    app.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
}
);

  

    