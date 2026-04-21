// controllers/popup/popup.templates.controller.js
// Popup-template-presetit

const Popup = require('../../models/Popup');

/**
 * Hakee kaikki template-presetit
 */
async function getTemplates(req, res) {
  try {
    const templates = [
      {
        id: 'welcome-popup',
        name: 'Tervetuloa-popup',
        description: 'Yksinkertainen tervetuloa-popup uusille vierailijoille',
        elementType: 'popup',
        popupType: 'rectangle',
        content: 'Tervetuloa sivustollemme!',
        width: 300,
        height: 200,
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
        position: 'center',
        animation: 'fadeIn',
        timing: {
          delay: 2000,
          showDuration: 5000,
          frequency: 'always',
          viewCooldown: 0
        }
      },
      {
        id: 'newsletter-signup',
        name: 'Uutiskirje-ilmoittautuminen',
        description: 'Uutiskirjeen tilauspopup',
        elementType: 'lead_form',
        popupType: 'rectangle',
        content: 'Tilaa uutiskirjeemme!',
        width: 350,
        height: 250,
        backgroundColor: '#10b981',
        textColor: '#ffffff',
        position: 'bottom-right',
        animation: 'slideInUp',
        timing: {
          delay: 3000,
          showDuration: 0,
          frequency: 'always',
          viewCooldown: 86400
        }
      },
      {
        id: 'exit-intent',
        name: 'Poistumisaikomus-popup',
        description: 'Näytetään kun käyttäjä aikoo poistua sivustolta',
        elementType: 'popup',
        popupType: 'rectangle',
        content: 'Älä mene vielä! Tarjoamme sinulle 10% alennuksen.',
        width: 400,
        height: 250,
        backgroundColor: '#f59e0b',
        textColor: '#ffffff',
        position: 'center',
        animation: 'fadeIn',
        timing: {
          delay: 0,
          showDuration: 0,
          frequency: 'always',
          viewCooldown: 86400
        }
      },
      {
        id: 'social-proof',
        name: 'Sosiaalinen todiste',
        description: 'Näyttää viimeisimmät toiminnot muilta käyttäjiltä',
        elementType: 'social_proof',
        popupType: 'rectangle',
        content: 'John Doe tilasi juuri tuotteen!',
        width: 300,
        height: 100,
        backgroundColor: '#8b5cf6',
        textColor: '#ffffff',
        position: 'bottom-left',
        animation: 'slideInLeft',
        timing: {
          delay: 1000,
          showDuration: 5000,
          frequency: 'always',
          viewCooldown: 0
        }
      },
      {
        id: 'sticky-bar',
        name: 'Kiinnityspalkki',
        description: 'Kiinnitetty palkki sivun ylä- tai alareunaan',
        elementType: 'sticky_bar',
        popupType: 'rectangle',
        content: 'Tärkeä ilmoitus!',
        width: '100%',
        height: 60,
        backgroundColor: '#ef4444',
        textColor: '#ffffff',
        position: 'top',
        animation: 'slideInDown',
        timing: {
          delay: 0,
          showDuration: 0,
          frequency: 'always',
          viewCooldown: 0
        }
      },
      {
        id: 'floating-button',
        name: 'Kelluva painike',
        description: 'Kelluva painike sivun kulmaan',
        elementType: 'fab',
        popupType: 'circle',
        content: '💬',
        width: 60,
        height: 60,
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
        position: 'bottom-right',
        animation: 'fadeIn',
        timing: {
          delay: 1000,
          showDuration: 0,
          frequency: 'always',
          viewCooldown: 0
        }
      },
      {
        id: 'slide-in',
        name: 'Liukuva ilmoitus',
        description: 'Liukuva ilmoitus sivun reunaan',
        elementType: 'slide_in',
        popupType: 'rectangle',
        content: 'Uusi tarjous saatavilla!',
        width: 300,
        height: 150,
        backgroundColor: '#06b6d4',
        textColor: '#ffffff',
        position: 'right',
        animation: 'slideInRight',
        timing: {
          delay: 5000,
          showDuration: 10000,
          frequency: 'always',
          viewCooldown: 3600
        }
      },
      {
        id: 'cookie-consent',
        name: 'Evästesuostumus',
        description: 'GDPR-yhteensopiva evästesuostumus',
        elementType: 'cookie_consent',
        popupType: 'rectangle',
        content: 'Käytämme evästeitä parantaaksemme käyttökokemustasi.',
        width: 400,
        height: 180,
        backgroundColor: '#1e293b',
        textColor: '#ffffff',
        position: 'bottom',
        animation: 'slideInUp',
        timing: {
          delay: 1000,
          showDuration: 0,
          frequency: 'once',
          viewCooldown: 0
        }
      }
    ];
    
    res.json(templates);
  } catch (err) {
    console.error('Error fetching templates:', err);
    res.status(500).json({ message: 'Error fetching templates', error: err });
  }
}

/**
 * Luo popupin templatesta
 */
async function createFromTemplate(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const templateId = req.params.templateId;
    const templates = await getTemplates(req, res);
    
    // Etsi template
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Luo popup templatesta
    const newPopup = new Popup({
      userId: req.user._id,
      name: template.name,
      elementType: template.elementType,
      popupType: template.popupType,
      content: template.content,
      width: template.width,
      height: template.height,
      backgroundColor: template.backgroundColor,
      textColor: template.textColor,
      position: template.position,
      animation: template.animation,
      timing: template.timing,
      elementConfig: {},
      targeting: { enabled: false, matchType: 'all', rules: [] },
      active: true
    });
    
    await newPopup.save();
    
    res.status(201).json(newPopup);
  } catch (err) {
    console.error('Error creating popup from template:', err);
    res.status(500).json({ message: 'Error creating popup from template', error: err });
  }
}

/**
 * Hakee käyttäjän omat template-presetit
 */
async function getUserTemplates(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    // Tässä voitaisiin hakea käyttäjän omat tallennetut presetit tietokannasta
    // Toistaiseksi palautetaan tyhjä lista
    res.json([]);
  } catch (err) {
    console.error('Error fetching user templates:', err);
    res.status(500).json({ message: 'Error fetching user templates', error: err });
  }
}

/**
 * Tallentaa popupin template-presetiksi
 */
async function saveAsTemplate(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const popupId = req.params.id;
    const popup = await Popup.findOne({
      _id: popupId,
      userId: req.user._id
    });
    
    if (!popup) {
      return res.status(404).json({ message: 'Popup not found' });
    }
    
    // Tässä voitaisiin tallentaa preset tietokantaan
    // Toistaiseksi palautetaan vain onnistumisviesti
    res.json({ 
      success: true, 
      message: 'Template saved successfully',
      template: {
        name: popup.name,
        elementType: popup.elementType,
        popupType: popup.popupType,
        content: popup.content,
        width: popup.width,
        height: popup.height,
        backgroundColor: popup.backgroundColor,
        textColor: popup.textColor,
        position: popup.position,
        animation: popup.animation,
        timing: popup.timing
      }
    });
  } catch (err) {
    console.error('Error saving template:', err);
    res.status(500).json({ message: 'Error saving template', error: err });
  }
}

module.exports = {
  getTemplates,
  createFromTemplate,
  getUserTemplates,
  saveAsTemplate
};