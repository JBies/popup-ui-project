const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env file

// Function to connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected'); // Log success message
    } catch (err) {
        console.error('MongoDB connection error:', err); // Log error message
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB; // Export the connectDB function