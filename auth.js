// auth.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User'); // Import the User model

// Configure the Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, // Google OAuth client ID
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Google OAuth client secret
    callbackURL: "http://localhost:3000/auth/google/callback" // Callback URL after Google login
},
async (accessToken, refreshToken, profile, done) => {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
        user = new User({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0].value,
            role: profile.emails[0].value === 'admin@example.com' ? 'admin' : 'user' // Aseta rooli
        });
        await user.save(); // Save the new user to the database
    }
    done(null, user); // Pass the user to the next step
}));

// Serialize the user for the session
passport.serializeUser((user, done) => {
    done(null, user.id); // Store the user's ID in the session
});

// Deserialize the user from the session
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id); // Retrieve the user from the database
    done(null, user); // Pass the user to the request object
});