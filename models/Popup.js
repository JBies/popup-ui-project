// models/Popup.js
const mongoose = require('mongoose');

const popupSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, default: 'Unnamed Popup' }, 
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
    // Linkki-kenttä
    linkUrl: {
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
    // Tilastokenttä
    statistics: {
        views: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        lastViewed: { type: Date },
        lastClicked: { type: Date }
    },
    version: { type: Number, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

//  pre-save hook -validaatiota ja lokitus
popupSchema.pre('save', function(next) {
    console.log("Pre-save hook running with data:", {
        name: this.name,
        popupType: this.popupType,
        content: this.content,
        imageUrl: this.imageUrl,
        linkUrl: this.linkUrl
    });
    
    // Tilastojenkerääjä-tyyppi ei tarvitse sisältöä eikä kuvaa
    if (this.popupType === 'stats_only') {
        console.log("Stats-only popup validation passed");
        next();
        return;
    }
    
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