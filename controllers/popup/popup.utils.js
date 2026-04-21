// controllers/popup/popup.utils.js
// Yhteiset apufunktiot popup-moduuleille

const { bucket } = require('../../firebase');
const Image = require('../../models/Image');

// IP-pohjainen näyttökertojen deduplikointi: sama IP + elementti lasketaan kerran tunnissa.
// Avain: "<ip>:<popupId>", arvo: timestamp (ms) milloin viimeksi laskettiin.
const viewCache = new Map();

/**
 * Tarkistaa onko näyttö duplikaatti IP:n ja cooldown-ajan perusteella
 */
function isViewDuplicate(ip, popupId, cooldownMs) {
  const key = `${ip}:${popupId}`;
  const last = viewCache.get(key);
  const now = Date.now();
  if (last && now - last < cooldownMs) return true;
  viewCache.set(key, now);
  // Siivoa vanhentuneet merkinnät satunnaisesti (n. 1% kutsuista)
  if (Math.random() < 0.01) {
    for (const [k, t] of viewCache) {
      if (now - t >= cooldownMs) viewCache.delete(k);
    }
  }
  return false;
}

/**
 * Generoi allekirjoitetun URL:in Firebase Storagesta firebasePath:n perusteella.
 * Jos generointi epäonnistuu, palautetaan alkuperäinen URL.
 */
async function refreshImageUrl(imageUrl, imageFirebasePath) {
  if (!imageFirebasePath) return imageUrl;
  try {
    const [signedUrl] = await bucket.file(imageFirebasePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 päivää
      version: 'v4'
    });
    return signedUrl;
  } catch (e) {
    console.error('Image URL refresh failed:', e.message);
    return imageUrl;
  }
}

/**
 * Hakee popup-dokumentille Image-tietueen firebasePath:n perusteella imageUrl:lla.
 */
async function getImageFirebasePath(userId, imageUrl) {
  if (!imageUrl) return '';
  try {
    const img = await Image.findOne({ userId, firebasePath: { $exists: true, $ne: '' } }).where('url').in([imageUrl]).lean();
    return img?.firebasePath || '';
  } catch (e) {
    return '';
  }
}

/**
 * Päivittää kuvan käyttötiedot uuden popupin luonnin yhteydessä
 */
async function updateImageUsage(userId, imageUrl, popupId) {
  if (!imageUrl) return;
  
  try {
    // Etsi kuva URL:n perusteella
    const image = await Image.findOne({ 
      url: imageUrl,
      userId: userId
    });
    
    if (image) {
      // Lisää popup kuvan käyttötietoihin
      if (!image.usedInPopups) {
        image.usedInPopups = [];
      }
      
      if (!image.usedInPopups.includes(popupId)) {
        image.usedInPopups.push(popupId);
        await image.save();
      }
    }
  } catch (error) {
    console.error('Error updating image usage:', error);
  }
}

/**
 * Päivittää kuvan käyttöviittaukset, kun popupin kuvaa vaihdetaan
 */
async function updateImageReferences(userId, oldImageUrl, newImageUrl, popupId) {
  try {
    // Jos vanha kuva on vaihdettu, poista viittaus vanhasta kuvasta
    if (oldImageUrl) {
      await removeImageReference(userId, oldImageUrl, popupId);
    }
    
    // Jos uusi kuva on määritetty, lisää viittaus uuteen kuvaan
    if (newImageUrl) {
      await updateImageUsage(userId, newImageUrl, popupId);
    }
  } catch (error) {
    console.error('Error updating image references:', error);
  }
}

/**
 * Poistaa kuvan käyttöviittauksen
 */
async function removeImageReference(userId, imageUrl, popupId) {
  if (!imageUrl) return;
  
  try {
    const image = await Image.findOne({ 
      url: imageUrl,
      userId: userId
    });
    
    if (image && image.usedInPopups) {
      image.usedInPopups = image.usedInPopups.filter(id => id.toString() !== popupId.toString());
      await image.save();
    }
  } catch (error) {
    console.error('Error removing image reference:', error);
  }
}

/**
 * Luo timing-data objektin request bodysta
 */
function createTimingDataFromRequest(body) {
  const { delay, showDuration, frequency, viewCooldown, startDate, endDate } = body;
  
  const timingData = {
    delay: parseInt(delay) || 0,
    showDuration: parseInt(showDuration) || 0,
    frequency: frequency || 'always',
    viewCooldown: [0, 3600, 86400].includes(parseInt(viewCooldown)) ? parseInt(viewCooldown) : 0
  };

  // Tallenna päivämäärät suoraan stringinä (ei new Date() — se rikkoo String-kentän)
  if (startDate && startDate !== 'default' && startDate !== 'null' && startDate !== '') {
    timingData.startDate = startDate;
  } else {
    timingData.startDate = 'default';
  }

  if (endDate && endDate !== 'default' && endDate !== 'null' && endDate !== '') {
    timingData.endDate = endDate;
  } else {
    timingData.endDate = 'default';
  }

  return timingData;
}

/**
 * Tarkistaa käyttäjän rajat ennen popupin luontia/päivitystä
 */
async function checkUserLimits(user, body, existingPopup = null) {
  if (user.role === 'admin') {
    return { allowed: true };
  }

  const errors = [];
  
  // Kokonaisraja
  const userPopupCount = await require('../../models/Popup').countDocuments({ userId: user._id });
  if (userPopupCount >= user.popupLimit) {
    return {
      allowed: false,
      error: {
        message: `Olet käyttänyt kaikki ${user.popupLimit} elementtiäsi. Päivitä Pro-tiliin saadaksesi 20 elementtiä – vain 4,90€/kk.`,
        limitReached: true,
        limitType: 'total'
      }
    };
  }

  // Per-tyyppi-raja
  const elType = body.elementType || 'popup';
  const typeLimit = user.limits?.[elType];
  if (typeof typeLimit === 'number') {
    const typeCount = await require('../../models/Popup').countDocuments({ 
      userId: user._id, 
      elementType: elType 
    });
    if (typeCount >= typeLimit) {
      return {
        allowed: false,
        error: {
          message: typeLimit === 0
            ? `${elType.replace('_',' ')} on saatavilla Pro-tilissä. Ota yhteyttä tukeen.`
            : `Olet käyttänyt tyypin "${elType.replace('_',' ')}" rajan (${typeLimit} kpl). Ota yhteyttä tukeen.`,
          limitReached: true,
          limitType: 'per_type',
          feature: elType
        }
      };
    }
  }

  // customScripts Pro-tarkistus
  const incomingCustomScripts = body.elementConfig?.customScripts;
  if (incomingCustomScripts?.trim() && !user.limits?.canUseCustomScripts) {
    return {
      allowed: false,
      error: {
        message: 'Vapaa JS-koodi (Muu koodi -kenttä) on saatavilla Pro-tilissä. Ota yhteyttä tukeen.',
        feature: 'custom_scripts'
      }
    };
  }

  // Targeting-oikeus tarkistus
  const incomingTargeting = body.targeting;
  if (incomingTargeting?.rules?.length > 0 && !user.limits?.canUseTargeting) {
    return {
      allowed: false,
      error: {
        message: 'Targeting on saatavilla Pro-tilissä. Ota yhteyttä tukeen.',
        feature: 'targeting'
      }
    };
  }

  return { allowed: true };
}

module.exports = {
  isViewDuplicate,
  refreshImageUrl,
  getImageFirebasePath,
  updateImageUsage,
  updateImageReferences,
  removeImageReference,
  createTimingDataFromRequest,
  checkUserLimits
};