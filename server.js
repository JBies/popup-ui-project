// Parannellut server.js tuotantokäyttöön

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const MongoStore = require('connect-mongo');
const rateLimit = require('express-rate-limit');
const connectDB = require('./db');

// Swagger dokumentaatio
const { swaggerDocs } = require('./swagger');

// Reittien tuonti
const authRoutes    = require('./routes/auth.routes');
const userRoutes    = require('./routes/user.routes');
const popupRoutes   = require('./routes/popup.routes');
const imageRoutes   = require('./routes/image.routes');
const adminRoutes   = require('./routes/admin.routes');
const reportsRoutes = require('./routes/reports.routes');

// Middleware
const authMiddleware = require('./middleware/auth.middleware');

// Autentikaation asetukset
require('./auth');

// Ympäristömuuttujat
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || 'local-dev-secret';
// secure=true tuotannossa (HTTPS vaaditaan), voi ylikirjoittaa COOKIE_SECURE=false kehityksessä
const cookieSecure = process.env.COOKIE_SECURE === 'true' || (isProduction && process.env.COOKIE_SECURE !== 'false');
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:3000', 'https://popupmanager.net', 'https://www.popupmanager.net'];

// Alustetaan Express
const app = express();

// Luota reverse proxyn (Nginx/Cloudflare) asettamiin X-Forwarded-For -headereihin.
// Tarvitaan kun sovellus pyörii proxyn takana – ilman tätä rate-limiter kaatuu.
// Arvo 1 = luota yhteen proxy-tasoon (Nginx). Jos Cloudflaren takana, vaihda 2:ksi.
app.set('trust proxy', 1);

// Yhdistetään tietokantaan
connectDB();

// Ajoitetut tehtävät (viikkoraportti ym.)
const { initScheduler } = require('./utils/scheduler');
initScheduler();

// Tärkeä: Määritellään popup-embed.js reitti ENNEN mitään muita middleware-määrityksiä
// Tämä varmistaa, että se käsitellään ennen CORS ja muita middlewareja
// ui-embed.js – uusi embed-skripti kaikille elementtityypeille
app.get('/ui-embed.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/ui-embed.js'));
});

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

// /api/popups/site – julkinen reitti, Nginx ei lisää CORS-headeria tälle polulle
// /embed/, /view/, /click/ ja /api/leads saavat CORS-headerit Nginxiltä – ei lisätä kahdesti
const embedCors = cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] });
app.options('/api/popups/site/*', embedCors);
app.use('/api/popups/site', embedCors);

// Poista CSP admin-reiteiltä
app.use('/admin-popups.html', (req, res, next) => {
    res.setHeader('Content-Security-Policy', '');
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
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'"], // Salli inline event handlerit
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

// ─── Rate Limiting ───────────────────────────────────────────────────────────

// Auth-endpointit: max 20 yritystä 15 min sisällä (bruteforce-suojaus)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Liian monta kirjautumisyritystä. Yritä uudelleen 15 minuutin kuluttua.' }
});
app.use('/auth/', authLimiter);

// Julkiset embed-endpointit: max 200 pyyntöä 1 min sisällä per IP
const embedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Liian monta pyyntöä. Yritä hetken kuluttua.' }
});
app.use('/api/popups/embed', embedLimiter);
app.use('/api/popups/view', embedLimiter);
app.use('/api/popups/click', embedLimiter);
app.use('/api/popups/site', embedLimiter);
app.use('/api/leads/submit', embedLimiter);

// Yleinen API-raja: max 300 pyyntöä 1 min sisällä per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user && req.user.role === 'admin'
});
app.use('/api/', apiLimiter);

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

// Public lead submission (no auth) – after body parser
// (mounted here so express.json() is already active)

// Perusmiddleware
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
}));

// Public lead submission – no auth required (from embed script on any site)
app.use('/api/leads', require('./routes/lead.routes'));

// Sessioasetukset
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: cookieSecure,  // true tuotannossa (HTTPS), false kehityksessä
        httpOnly: true,
        sameSite: 'lax',       // suojaa CSRF-hyökkäyksiltä
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

// Pääreitti – aina uusi landing page, JS hoitaa kirjautuneen uudelleenohjauksen
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, '/index.html'));
    } catch (error) {
        console.error("Error in root route:", error);
        res.status(500).send("Server error: " + error.message);
    }
});


// Uusi dashboard
app.get('/dashboard', authMiddleware.isUser, (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});



// Pending-näkymä
app.get('/pending', (req, res) => {
    if (!req.user || req.user.role !== 'pending') {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'pending.html'));
});

app.get('/testisivu', (req, res) => {
    res.sendFile(path.join(__dirname, 'testisivu.html'));
});

// Reittien rekisteröinti
app.use('/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/popups', authMiddleware.isUser, popupRoutes);
app.use('/api/reports', authMiddleware.isUser, reportsRoutes);
app.use('/api/upload', authMiddleware.isUser, imageRoutes);
app.use('/api/images', authMiddleware.isUser, imageRoutes);
app.use('/api/admin', authMiddleware.isAdmin, adminRoutes);
const LeadController = require('./controllers/lead.controller');
app.get('/api/leads', authMiddleware.isUser, LeadController.getLeads);
app.get('/api/leads/:popupId', authMiddleware.isUser, LeadController.getLeadsByPopup);

// --- Sivustot (Sites) API ---
const User = require('./models/User');
const Popup = require('./models/Popup');

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// GET /api/sites – käyttäjän kaikki sivustot
app.get('/api/sites', authMiddleware.isUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    res.json(user.sites || []);
  } catch (err) {
    res.status(500).json({ message: 'Virhe sivustojen haussa', error: err.toString() });
  }
});

// POST /api/sites – luo uusi sivusto
app.post('/api/sites', authMiddleware.isUser, async (req, res) => {
  try {
    const { name, domain } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Nimi on pakollinen' });
    const token = uuidv4();
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { sites: { name: name.trim(), domain: (domain || '').trim(), token } } },
      { new: true }
    );
    const created = user.sites[user.sites.length - 1];
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: 'Sivuston luonti epäonnistui', error: err.toString() });
  }
});

// DELETE /api/sites/:siteId – poista sivusto
app.delete('/api/sites/:siteId', authMiddleware.isUser, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { sites: { _id: req.params.siteId } } }
    );
    // Irrota elementit tästä sivustosta (aseta siteId null)
    await Popup.updateMany(
      { userId: req.user._id, siteId: req.params.siteId },
      { $set: { siteId: null } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Sivuston poisto epäonnistui', error: err.toString() });
  }
});

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

  

    