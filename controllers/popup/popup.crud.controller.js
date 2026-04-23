// controllers/popup/popup.crud.controller.js
// Popup CRUD-toiminnot (create, read, update, delete)

const Popup = require('../../models/Popup');
const PageElement = require('../../models/PageElement');
const ScrollStats = require('../../models/ScrollStats');
const AuditLog = require('../../models/AuditLog');
const { triggerWebhooks } = require('../../utils/webhooks');
const {
  refreshImageUrl,
  updateImageUsage,
  updateImageReferences,
  removeImageReference,
  createTimingDataFromRequest,
  checkUserLimits
} = require('./popup.utils');

/**
 * Luo uuden popupin
 */
async function createPopup(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Tarkista käyttäjän rajat
  const limitCheck = await checkUserLimits(req.user, req.body);
  if (!limitCheck.allowed) {
    return res.status(403).json(limitCheck.error);
  }

  const {
    name,
    popupType,
    elementType,
    elementConfig,
    targeting,
    content,
    width,
    height,
    position,
    animation,
    backgroundColor,
    textColor,
    imageUrl,
    imageFirebasePath,
    linkUrl,
    delay,
    showDuration,
    startDate,
    endDate,
    active,
    campaign,
    abTest,
    frequency,
    viewCooldown,
    siteId
  } = req.body;

  try {
    const timingData = createTimingDataFromRequest(req.body);

    // stats_only-tyyppi asettaa popupTypen automaattisesti
    const resolvedPopupType = (elementType === 'stats_only') ? 'stats_only' : (popupType || 'rectangle');

    // Luo uusi popup
    const newPopup = new Popup({
      userId: req.user._id,
      name: name || 'Unnamed Popup',
      elementType: elementType || 'popup',
      elementConfig: elementConfig || {},
      targeting: targeting || { enabled: false, matchType: 'all', rules: [] },
      popupType: resolvedPopupType,
      content,
      width: parseInt(width) || 200,
      height: parseInt(height) || 150,
      position,
      animation,
      backgroundColor,
      textColor,
      imageUrl,
      imageFirebasePath: imageFirebasePath || '',
      linkUrl,
      timing: timingData,
      active: active !== undefined ? active : true,
      campaign: campaign || '',
      abTest: abTest || { enabled: false },
      siteId: siteId || null
    });
    
    await newPopup.save();
    
    // Jos popup käyttää kuvaa, päivitä kuvan käyttötiedot
    if (imageUrl) {
      await updateImageUsage(req.user._id, imageUrl, newPopup._id);
    }
    
    res.status(201).json(newPopup);
  } catch (err) {
    console.error("Error saving popup:", err);
    res.status(500).json({ message: 'Error saving popup', error: err.toString() });
  }
}

/**
 * Hakee käyttäjän kaikki popupit
 */
async function getUserPopups(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const popups = await Popup.find({ userId: req.user._id }).lean();
    
    // Hae lisätilastot jokaiselle popupille rinnakkain
    const enhancedPopups = await Promise.all(popups.map(async p => {
      // Päivitä kuvan URL:it jos firebasePath on tallennettu
      if (p.imageUrl && p.imageFirebasePath) {
        p.imageUrl = await refreshImageUrl(p.imageUrl, p.imageFirebasePath);
      }
      
      // Hae sivuelementtien klikit yhteensä
      let pageElementsClicks = 0;
      try {
        const pageElements = await PageElement.find({ popupId: p._id }).lean();
        pageElementsClicks = pageElements.reduce((sum, el) => sum + (el.clicks || 0), 0);
      } catch (e) {
        console.error('Error fetching page elements for popup', p._id, e);
      }
      
      // Hae vieritystilastot
      let scrollStats = null;
      try {
        const scrollData = await ScrollStats.find({ popupId: p._id }).lean();
        if (scrollData.length > 0) {
          const totalSessions = scrollData.reduce((sum, s) => sum + (s.sessions || 0), 0);
          const totalDepth = scrollData.reduce((sum, s) => sum + (s.avgDepth || 0) * (s.sessions || 0), 0);
          const avgDepth = totalSessions > 0 ? Math.round(totalDepth / totalSessions) : 0;
          
          scrollStats = {
            sessions: totalSessions,
            avgDepth: avgDepth,
            lastUpdated: scrollData[scrollData.length - 1]?.date || new Date()
          };
        }
      } catch (e) {
        console.error('Error fetching scroll stats for popup', p._id, e);
      }
      
      // Lisää sivuelementtien klikit ja vieritystilastot popup-objektiin
      p.pageElementsClicks = pageElementsClicks;
      if (scrollStats) {
        p.scrollStats = scrollStats;
      }
      
      return p;
    }));
    
    res.json(enhancedPopups);
  } catch (err) {
    console.error('Error fetching popups:', err);
    res.status(500).json({ message: 'Error fetching popups', error: err });
  }
}

/**
 * Päivittää olemassa olevan popupin
 */
async function updatePopup(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Targeting-oikeus tarkistus
  const incomingTargeting = req.body.targeting;
  if (req.user.role !== 'admin' && incomingTargeting?.rules?.length > 0 && !req.user.limits?.canUseTargeting) {
    return res.status(403).json({
      message: 'Targeting on saatavilla Pro-tilissä. Ota yhteyttä tukeen.',
      feature: 'targeting'
    });
  }

  // customScripts Pro-tarkistus
  const incomingCustomScripts = req.body.elementConfig?.customScripts;
  if (req.user.role !== 'admin' && incomingCustomScripts?.trim()) {
    if (!req.user.limits?.canUseCustomScripts) {
      return res.status(403).json({
        message: 'Vapaa JS-koodi (Muu koodi -kenttä) on saatavilla Pro-tilissä. Ota yhteyttä tukeen.',
        feature: 'custom_scripts'
      });
    }
  }

  const {
    name,
    popupType,
    elementType,
    elementConfig,
    targeting,
    content,
    width,
    height,
    position,
    animation,
    backgroundColor,
    textColor,
    imageUrl,
    imageFirebasePath,
    linkUrl,
    delay,
    showDuration,
    startDate,
    endDate,
    active,
    campaign,
    abTest,
    frequency,
    viewCooldown,
    siteId
  } = req.body;

  try {
    // Hae popup ensin, jotta voimme tarkistaa aiemman image URL:n
    const oldPopup = await Popup.findOne({ 
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!oldPopup) {
      return res.status(404).json({ message: 'Popup not found' });
    }
    
    const oldImageUrl = oldPopup.imageUrl;

    // Tarkista onko kuva vaihtunut
    const imageChanged = oldPopup.imageUrl !== imageUrl;

    // Käsittele päivämäärät oikein
    const timingData = createTimingDataFromRequest(req.body);

    // stats_only-tyyppi asettaa popupTypen automaattisesti
    const resolvedPopupType = (elementType === 'stats_only') ? 'stats_only' : (popupType || 'rectangle');

    // Päivitä popup – käytä $set jotta vain lähetetyt kentät päivittyvät
    const updateFields = {};
    
    // Nimi: säilytä vanha jos name on undefined tai tyhjä
    if (name !== undefined && name !== null) {
      updateFields.name = name.trim() || 'Unnamed Popup';
    }
    if (elementType) updateFields.elementType = elementType;
    if (elementConfig) updateFields.elementConfig = elementConfig;
    if (targeting !== undefined) updateFields.targeting = targeting;
    updateFields.popupType = resolvedPopupType;
    updateFields.content = content;
    updateFields.width = parseInt(width) || 200;
    updateFields.height = parseInt(height) || 150;
    updateFields.position = position;
    updateFields.animation = animation;
    updateFields.backgroundColor = backgroundColor;
    updateFields.textColor = textColor;
    updateFields.imageUrl = imageUrl;
    updateFields.imageFirebasePath = imageFirebasePath || '';
    updateFields.linkUrl = linkUrl;
    updateFields.timing = timingData;
    if (active !== undefined) updateFields.active = active;
    if (campaign !== undefined) updateFields.campaign = campaign;
    if (abTest !== undefined) updateFields.abTest = abTest;
    updateFields.siteId = siteId || null;
    if (imageChanged) updateFields.version = Date.now();

    const updatedPopup = await Popup.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: updateFields },
      { new: true }
    );
    
    // Käsittele kuvan käyttötietojen päivitys
    if (oldImageUrl !== imageUrl) {
      // Jos kuva on vaihdettu, päivitä kuvatiedot
      await updateImageReferences(req.user._id, oldImageUrl, imageUrl, req.params.id);
    }
    
    if (!updatedPopup) {
      return res.status(404).json({ message: 'Popup not found' });
    }

    // Audit log: jos customScripts muuttui, kirjaa se
    const oldScripts = (oldPopup.elementConfig?.customScripts || '').trim();
    const newScripts = (incomingCustomScripts || '').trim();
    if (oldScripts !== newScripts) {
      try {
        await AuditLog.create({
          action: 'custom_scripts_changed',
          adminId:    req.user._id,
          adminEmail: req.user.email,
          targetId:   req.user._id,
          targetEmail:req.user.email,
          details: {
            popupId:   req.params.id,
            popupName: updatedPopup.name,
            hadScript: oldScripts.length > 0,
            hasScript: newScripts.length > 0,
            scriptLength: newScripts.length,
          },
          ip: req.ip,
        });
      } catch (logErr) {
        console.warn('[AuditLog] custom_scripts_changed kirjaus epäonnistui:', logErr.message);
      }
    }

    res.json(updatedPopup);
  } catch (err) {
    console.error("Error updating popup:", err);
    res.status(500).json({ message: 'Error updating popup', error: err.toString() });
  }
}

/**
 * Poistaa popupin
 */
async function deletePopup(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    // Hae popup ensin
    const popup = await Popup.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!popup) {
      return res.status(404).json({ message: 'Popup not found' });
    }
    
    // Jos popup käyttää kuvaa, päivitä kuvan käyttötiedot
    if (popup.imageUrl) {
      await removeImageReference(req.user._id, popup.imageUrl, req.params.id);
    }
    
    // Poista popup
    const deletedPopup = await Popup.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!deletedPopup) {
      return res.status(404).json({ message: 'Popup not found' });
    }

    // Cascade-delete sivun seuranta -data
    await PageElement.deleteMany({ popupId: req.params.id });
    await ScrollStats.deleteMany({ popupId: req.params.id });

    res.json({ message: 'Popup deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting popup', error: err });
  }
}

/**
 * Hakee yksittäisen popupin embed-käyttöä varten
 */
async function getEmbedPopup(req, res) {
  try {
    const popup = await Popup.findById(req.params.id);
    if (!popup) {
      return res.status(404).json({ message: 'Popup not found' });
    }

    // Tehdään popupista kopio, jotta voimme muokata sitä ilman että tallennetaan muutokset
    const cleanPopup = popup.toObject();

    // Puhdistetaan päivämäärät
    if (cleanPopup.timing) {
      // Varmistetaan että delay ja duration ovat numeroita
      cleanPopup.timing.delay = parseInt(cleanPopup.timing.delay) || 0;
      cleanPopup.timing.showDuration = parseInt(cleanPopup.timing.showDuration) || 0;
      
      // Poistetaan "default" arvot
      if (cleanPopup.timing.startDate === 'default') {
        delete cleanPopup.timing.startDate;
      }
      
      if (cleanPopup.timing.endDate === 'default') {
        delete cleanPopup.timing.endDate;
      }
    }

    // Päivitä kuvan URL jos firebasePath on tallennettu
    if (cleanPopup.imageUrl && cleanPopup.imageFirebasePath) {
      cleanPopup.imageUrl = await refreshImageUrl(cleanPopup.imageUrl, cleanPopup.imageFirebasePath);
    }

    // Add no-cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json(cleanPopup);
  } catch (err) {
    console.error('Error fetching popup:', err);
    res.status(500).json({ message: 'Error fetching popup', error: err });
  }
}

module.exports = {
  createPopup,
  getUserPopups,
  updatePopup,
  deletePopup,
  getEmbedPopup
};