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

// Tuotannon turvallisuusmekanismit
if (isProduction) {
    // Helmetin perusasetus, jolla parannettu CSP
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
                    scriptSrcElem: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
                    scriptSrcAttr: ["'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                    styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                    imgSrc: ["'self'", "data:", "https://storage.googleapis.com"],
                    connectSrc: ["'self'"]
                }
            }
        })
    );
    
    // Gzip-pakkaus
    app.use(compression());
    
    // Rajoitetut CORS-asetukset
    app.use(cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
} else {
    // Kehityksessä sallivammat CORS-asetukset
    app.use(cors({
        origin: true,
        credentials: true
    }));
}

// Perusmiddleware
app.use(express.json());
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

// Varmista että myös HTML-tiedostot toimivat oikein
app.get('*.html', (req, res) => {
    console.log(`Serving HTML file: ${req.path}`);
    res.sendFile(path.join(__dirname, req.path));
});

// Lisää erillinen reitti landing.html:lle
app.get('/landing.html', (req, res) => {
    console.log('Serving landing.html');
    res.sendFile(path.join(__dirname, 'landing.html'));
});

// Lisää varasuunnitelma kaikkien tiedostojen etsimiseen
app.get('*', (req, res, next) => {
    if (!req.path.includes('.')) {
        // Tämä on todennäköisesti API-kutsu tai muu dynaaminen reitti
        return next();
    }
    
    const filePath = path.join(__dirname, req.path);
    
    // Tarkista onko tiedosto olemassa
    try {
        if (require('fs').existsSync(filePath)) {
            console.log(`Serving file: ${req.path}`);
            return res.sendFile(filePath);
        }
    } catch (err) {
        console.error(`Error checking file ${filePath}:`, err);
    }
    
    // Jos tiedostoa ei löydy, jatka seuraavaan käsittelijään
    next();
});

// Pääreitti
app.get('/', authMiddleware.checkPendingStatus, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Embedin js tiedosto
app.use('/popup-embed.js', express.static(path.join(__dirname, 'popup-embed.js')));

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
});