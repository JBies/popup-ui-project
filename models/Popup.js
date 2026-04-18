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
    // Firebase Storage polku allekirjoitettujen URL:ien uudelleengenerointia varten
    imageFirebasePath: {
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
        leads: { type: Number, default: 0 },
        lastViewed: { type: Date },
        lastClicked: { type: Date },
        statsResetAt: { type: Date }
    },
    // Uusi elementtityyppi (Phase 1+)
    elementType: {
        type: String,
        enum: ['popup', 'sticky_bar', 'fab', 'slide_in', 'social_proof', 'scroll_progress', 'lead_form', 'stats_only', 'cookie_consent'],
        default: 'popup'
    },
    // Targeting Engine v2
    targeting: {
        enabled:   { type: Boolean, default: false },
        matchType: { type: String, default: 'all' }, // 'all' = AND, 'any' = OR
        rules: [{
            type:     { type: String }, // url|device|scroll_depth|time_on_site|referrer|new_vs_returning|day_of_week|hour_of_day
            operator: { type: String }, // contains|equals|starts_with|is|greater_than|less_than
            value:    { type: String }
        }]
    },
    // Elementtikohtainen konfiguraatio
    elementConfig: {
        // Sticky Bar
        barPosition:        { type: String, default: 'bottom' },
        barText:            { type: String, default: '' },
        ctaButtons:         { type: Array, default: [] },
        showDismiss:        { type: Boolean, default: true },
        dismissCookieDays:  { type: Number, default: 0 },
        // FAB
        fabPosition:        { type: String, default: 'bottom-right' },
        fabIcon:            { type: String, default: 'fa-comment' },
        fabColor:           { type: String, default: '#1a56db' },
        fabSize:            { type: String, default: 'md' },
        fabAction:          { type: String, default: 'link' },
        fabUrl:             { type: String, default: '' },
        fabModalContent:    { type: String, default: '' },
        pulseAnimation:     { type: Boolean, default: false },
        // Slide-in
        slideInPosition:    { type: String, default: 'bottom-right' },
        slideInWidth:       { type: Number, default: 320 },
        slideInTrigger:     { type: String, default: 'time' },
        slideInTriggerValue:{ type: Number, default: 5 },
        showCloseButton:    { type: Boolean, default: true },
        lastTemplate:       { type: String, default: '' },
        tplFields:          { type: mongoose.Schema.Types.Mixed, default: {} },
        // Popup v2 alatyypit
        popupSubtype:       { type: String, default: 'announcement' },
        // Social Proof
        proofText:          { type: String, default: '{count} henkilöä katsoo nyt tätä sivua' },
        proofCount:         { type: Number, default: 0 }, // 0 = käytä oikeita tilastoja
        proofIcon:          { type: String, default: '👥' },
        proofDuration:      { type: Number, default: 5 }, // sekuntia
        proofPosition:      { type: String, default: 'bottom-left' },
        proofInterval:      { type: Number, default: 8 }, // sekuntia näyttöjen välillä
        // Scroll Progress Bar
        progressColor:      { type: String, default: '#2563eb' },
        progressHeight:     { type: Number, default: 4 },
        progressPosition:   { type: String, default: 'top' },
        // Lead Form
        leadTitle:          { type: String, default: '' },
        leadSubtitle:       { type: String, default: '' },
        leadFields:         { type: Array, default: [] },
        leadSubmitText:     { type: String, default: 'Lähetä' },
        leadSuccessMsg:     { type: String, default: 'Kiitos! Olemme yhteydessä pian.' },
        leadNotifyEmail:    { type: String, default: '' },
        // Cookie Consent
        bannerText:         { type: String, default: '' },
        allowBtnLabel:      { type: String, default: 'Hyväksy' },
        denyBtnLabel:       { type: String, default: 'Hylkää' },
        allowBtnColor:      { type: String, default: '#22c55e' },
        denyBtnColor:       { type: String, default: '#6b7280' },
        infoBtnLabel:       { type: String, default: 'Lisätietoja' },
        infoText:           { type: String, default: '' },
        // Kuinka usein banneri näytetään uudelleen
        consentFrequency:   { type: String, default: 'once' }, // 'always'|'once'|'annual'|'monthly'
        // Tracking-integraatiot (ladataan vasta suostumuksen jälkeen)
        gaId:               { type: String, default: '' }, // Google Analytics 4: G-XXXXXXXXXX
        gtmId:              { type: String, default: '' }, // Google Tag Manager: GTM-XXXXXXX
        fbPixelId:          { type: String, default: '' }, // Facebook Pixel ID
        customScripts:      { type: String, default: '' }  // Vapaa JS-koodi suostumuksen jälkeen
    },
    siteId: { type: mongoose.Schema.Types.ObjectId, default: null },
    version: { type: Number, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    active:    { type: Boolean, default: true },
    campaign:  { type: String, default: '' },
    abTest: {
        enabled:        { type: Boolean, default: false },
        variantBConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
        traffic:        { type: Number, default: 50 }
    }
});

// pre-save hook
popupSchema.pre('save', function(next) {
    // Uudet elementtityypit ja stats_only eivät tarvitse content/image -validaatiota
    const skipValidation = ['stats_only', 'sticky_bar', 'fab', 'slide_in', 'social_proof', 'scroll_progress', 'lead_form', 'cookie_consent'].includes(this.elementType)
        || this.popupType === 'stats_only';

    if (skipValidation) {
        next();
        return;
    }

    if ((!this.content || this.content.trim() === '') &&
        (!this.imageUrl || this.imageUrl.trim() === '')) {
        next(new Error('Popupissa on oltava joko sisältöä tai kuva'));
    } else if (this.popupType === 'image' && (!this.imageUrl || this.imageUrl.trim() === '')) {
        next(new Error('Kuva on pakollinen, kun popupin tyyppi on "Image"'));
    } else {
        next();
    }
});

module.exports = mongoose.model('Popup', popupSchema);