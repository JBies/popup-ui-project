// Popup.js
const mongoose = require('mongoose');

const popupSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    popupType: { type: String, required: true },
    content: { 
        type: String, 
        default: ''
    },
    width: { type: Number, default: 200 },
    height: { type: Number, default: 150 },
    position: { type: String, default: 'center' },
    animation: { type: String, default: 'none' },
    backgroundColor: { type: String, default: '#ffffff' },
    textColor: { type: String, default: '#000000' },
    imageUrl: { 
        type: String, 
        default: ''
    },
    timing: {
        delay: { type: Number, default: 0 },
        showDuration: { type: Number, default: 0 },
        frequency: { type: String, default: 'always' },
        startDate: { type: String, default: "default" },
        endDate: { type: String, default: "default" }
    },
    createdAt: { type: Date, default: Date.now }
});

// Yksinkertaistamme pre-save hook -validaatiota ja lisäämme enemmän lokitusta
popupSchema.pre('save', function(next) {
    console.log("Pre-save hook running with data:", {
        popupType: this.popupType,
        content: this.content,
        imageUrl: this.imageUrl
    });
    
    // Tarkista että vähintään joko content tai imageUrl on annettu
    if ((!this.content || this.content.trim() === '') && 
        (!this.imageUrl || this.imageUrl.trim() === '')) {
        console.log("Validation failed: No content or image");
        next(new Error('Popupissa on oltava joko sisältöä tai kuva'));
    } else if (this.popupType === 'image' && (!this.imageUrl || this.imageUrl.trim() === '')) {
        console.log("Validation failed: Image type requires image URL");
        next(new Error('Kuva on pakollinen, kun popupin tyyppi on "Image"'));
    } else {
        console.log("Validation passed");
        next();
    }
});

module.exports = mongoose.model('Popup', popupSchema);