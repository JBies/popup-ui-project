// auth-clean.js - Simple ASCII version
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User'); 

// Admin emails
const ADMIN_EMAILS = ['joni.bies@gmail.com'];

// Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google callback received');
        
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            user.lastLogin = new Date();
            await user.save();
        } else {
            let role = 'pending';
            
            if (profile.emails && profile.emails.length > 0) {
                const email = profile.emails[0].value;
                if (ADMIN_EMAILS.includes(email)) {
                    role = 'admin';
                }
            }
            
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
        
        done(null, user);
    } catch (error) {
        console.error('Auth error:', error);
        done(error, null);
    }
}));

// User serialization
passport.serializeUser((user, done) => {
    done(null, user.id); 
});

// User deserialization
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
