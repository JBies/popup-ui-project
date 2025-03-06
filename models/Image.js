// models/Image.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    url: { 
        type: String, 
        required: true 
    },
    size: { 
        type: Number, 
        required: true 
    },
    mimeType: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    usedInPopups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Popup'
    }]
});

module.exports = mongoose.model('Image', imageSchema);