// auth.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User'); // Tuodaan User-malli

// Admins list - näitä sähköposteja käytetään automaattiseen admin-rooliin
const ADMIN_EMAILS = [
    'joni.bies@gmail.com',
    // Lisää tähän muut admin-sähköpostit tarvittaessa
];

// Configure the Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, // Google OAuth client ID
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Google OAuth client secret
    callbackURL: "http://localhost:3000/auth/google/callback" // Callback URL after Google login
},
async (accessToken, refreshToken, profile, done) => {
    try {
        // Etsitään käyttäjä ensin
        let user = await User.findOne({ googleId: profile.id });
        
        // Jos käyttäjä löytyi, päivitetään viimeisin kirjautumisaika
        if (user) {
            user.lastLogin = new Date();
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
                lastLogin: new Date()
            });
            await user.save();
        }
        
        done(null, user); // Palautetaan käyttäjä
    } catch (error) {
        console.error('Error in Google authentication:', error);
        done(error, null);
    }
}));

// käyttäjän tallennus sessioon
passport.serializeUser((user, done) => {
    done(null, user.id); 
});

// käyttäjän haku sessiosta
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id); // hae käyttäjä id:n perusteella
        done(null, user); // vie käyttäjä sessioon
    } catch (error) {
        done(error, null);
    }
});