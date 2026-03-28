// auth.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User'); // Tuodaan User-malli
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// Admins list - näitä sähköposteja käytetään automaattiseen admin-rooliin
const ADMIN_EMAILS = [
    'joni.bies@gmail.com',
    // Lisää tähän muut admin-sähköpostit tarvittaessa
];

// Configure the Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, // Google OAuth client ID
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Google OAuth client secret
    callbackURL: process.env.GOOGLE_CALLBACK_URL // Callback URL after Google login
},
async (accessToken, refreshToken, profile, done) => {
    try {
        // Etsitään käyttäjä ensin
        let user = await User.findOne({ googleId: profile.id });
        
        // Jos käyttäjä löytyi, päivitetään viimeisin kirjautumisaika + tarkista admin-rooli
        if (user) {
            user.lastLogin = new Date();
            // Varmista admin-rooli aina kirjautuessa (ei vain rekisteröityessä)
            if (profile.emails?.[0]?.value && ADMIN_EMAILS.includes(profile.emails[0].value) && user.role !== 'admin') {
                user.role = 'admin';
            }
            // Generoi siteToken jos puuttuu
            if (!user.siteToken) { user.siteToken = uuidv4(); }
            await user.save();
        } else {
            // Määritetään rooli sähköpostin perusteella
            let role = 'pending'; // Oletusosoite on nyt "pending"
            
            // Määritetään automaattisesti admin-rooli tietyille sähköposteille
            if (profile.emails && profile.emails.length > 0) {
                const email = profile.emails[0].value;
                if (ADMIN_EMAILS.includes(email)) {
                    role = 'admin';
                }
            }
            
            // Luodaan uusi käyttäjä
            user = new User({
                googleId: profile.id,
                displayName: profile.displayName,
                email: profile.emails[0].value,
                role: role,
                profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
                registeredAt: new Date(),
                lastLogin: new Date(),
                siteToken: uuidv4()
            });
            await user.save();
        }
        
        done(null, user); // Palautetaan käyttäjä
    } catch (error) {
        console.error('Error in Google authentication:', error);
        done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id); 
});

passport.deserializeUser(async (id, done) => {
    try {
        console.log('Deserializing user ID:', id);
        const user = await User.findById(id); // hae käyttäjä id:n perusteella
        console.log('Deserialized user:', user ? 'User found' : 'User not found');
        done(null, user); // vie käyttäjä sessioon
    } catch (error) {
        console.error('Error in deserializeUser:', error);
        done(error, null);
    }
});

module.exports = passport;