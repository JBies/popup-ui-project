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
const cookieSecure = process.env.COOKIE_SECURE === 'false';
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:3000', 'https://popupmanager.net', 'https://www.popupmanager.net'];

// Alustetaan Express
const app = express();

// Yhdistetään tietokantaan
connectDB();

// Tärkeä: Määritellään popup-embed.js reitti ENNEN mitään muita middleware-määrityksiä
// Tämä varmistaa, että se käsitellään ennen CORS ja muita middlewareja
app.get('/popup-embed.js', (req, res) => {
    /* CORS-otsikot tarkasti tälle tiedostolle
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // Cross-Origin-Resource-Policy otsikko
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Cache-otsikot
    res.header('Cache-Control', 'public, max-age=86400'); // 1 päivä
    res.header('Content-Type', 'application/javascript');
    */
    // Lähetetään tiedosto - varmista että polku on oikea
    res.sendFile(path.join(__dirname, 'public/popup-embed.js'));
});

// Erillinen CORS-käsittely API:n public-reiteille
app.use('/api/popups/embed', (req, res, next) => {
    next();
});

app.use('/api/popups/view', (req, res, next) => {
    next();
});

app.use('/api/popups/click', (req, res, next) => {
    next();
});

app.use('/api/images', (req, res, next) => {
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
            imgSrc: ["'self'", "data:", "blob:", "https://storage.googleapis.com", "https://lh3.googleusercontent.com"],
            connectSrc: ["'self'", "https://accounts.google.com"],
            frameSrc: ["'self'", "https://accounts.google.com"],
          }
        }
      })
    );
  }

// Gzip-pakkaus
app.use(compression());

// CORS-asetukset - 
if (isProduction) {
    // Rajoitetut CORS-asetukset tuotannossa
    app.use(cors({
        origin: allowedOrigins,
        credentials: true, // Tärkeä istuntojen toiminnalle
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        optionsSuccessStatus: 200 // Yhteensopivuus mobiiliselaimien kanssa
    }));
} else {
    // Kehityksessä sallivammat CORS-asetukset
    app.use(cors({
        origin: true,
        credentials: true
    }));
}

// Perusmiddleware
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ 
    extended: true,
    limit: '10mb' 
}));


// Sessioasetukset
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: cookieSecure, // Käytetään ympäristömuuttujaa, tuotannossa true jos HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 tuntia
    },
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60 // 24 tuntia (sekunteina)
    })
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, '/'), {
    index: false  // Tämä estää express.static:ia tarjoamasta index.html-tiedostoa automaattisesti
}));

// Pääreitti
app.get('/', (req, res) => {
    try {
        console.log("Checking authentication status");
        // Tarkista ensin onko isAuthenticated olemassa
        const isLoggedIn = req.isAuthenticated && typeof req.isAuthenticated === 'function' 
            ? req.isAuthenticated() 
            : false;
            
        console.log("Is authenticated:", isLoggedIn);
        
        if (isLoggedIn) {
            console.log("Serving index.html");
            res.sendFile(path.join(__dirname, '/index.html'));
        } else {
            console.log("Serving landing.html");
            res.sendFile(path.join(__dirname, '/landing.html'));
        }
    } catch (error) {
        console.error("Error in root route:", error);
        res.status(500).send("Server error: " + error.message);
    }
});


// Lisää suora reitti hallintapaneeliin kirjautuneille käyttäjille
app.get('/dashboard', authMiddleware.isUser, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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

  

    