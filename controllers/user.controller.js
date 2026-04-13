// controllers/user.controller.js

const User = require('../models/User');
const { logAudit } = require('../utils/audit');
const { sendMail } = require('../utils/email');
const { buildWelcomeEmail } = require('../utils/email-templates');

// Rate limit testisähköpostille: max 1 per tunti per käyttäjä (in-memory, nollautuu serverin käynnistyksellä)
const testEmailCooldown = new Map();

/**
 * UserController vastaa käyttäjien hallinnan toimintalogiikasta
 */
class UserController {
  /**
   * Hakee kirjautuneen käyttäjän tiedot
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getCurrentUser(req, res) {
    if (req.user) {
      res.json({ user: req.user }); // Lähetä käyttäjän tiedot
    } else {
      res.json({ user: null }); // Jos käyttäjä ei ole kirjautunut
    }
  }

  /**
   * (Admin) Hakee kaikki käyttäjät
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllUsers(req, res) {
    if (req.user && req.user.role === 'admin') {
      try {
        const users = await User.find({});
        res.json(users);
      } catch (err) {
        res.status(500).json({ message: 'Error fetching users', error: err });
      }
    } else {
      res.status(403).send('Access denied');
    }
  }

  /**
   * (Admin) Päivittää käyttäjän roolin
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateUserRole(req, res) {
    if (req.user && req.user.role === 'admin') {
      const userId = req.params.id;
      const { role } = req.body;
      
      try {
        const user = await User.findById(userId);
        if (user) {
          // Tallennetaan aiempi rooli
          const previousRole = user.role;
          
          // Päivitetään uusi rooli
          user.role = role;
          
          // Jos käyttäjä hyväksytään pending-tilasta
          if (previousRole === 'pending' && role === 'user') {
            user.approvedAt = new Date();
          }

          await user.save();

          // Tervetulosähköposti uudelle käyttäjälle
          if (previousRole === 'pending' && role === 'user') {
            (async () => {
              try {
                const { subject, html } = buildWelcomeEmail(user.displayName);
                await sendMail(user.email, subject, html);
              } catch (e) {
                console.error('[user] Tervetulosähköpostivirhe:', e.message);
              }
            })();
          }

          // Audit-loki
          const auditAction = (previousRole === 'pending' && role === 'user')
            ? 'user_approved'
            : 'role_change';
          await logAudit(req, auditAction, user, { from: previousRole, to: role });

          res.status(200).json({
            message: 'Role updated successfully!',
            user: {
              id: user._id,
              displayName: user.displayName,
              email: user.email,
              role: user.role,
              approvedAt: user.approvedAt
            }
          });
        } else {
          res.status(404).json({ message: 'User not found' });
        }
      } catch (err) {
        res.status(500).json({ message: 'Error updating role', error: err });
      }
    } else {
      res.status(403).json({ message: 'Access denied' });
    }
  }

  /**
   * (Admin) Poistaa käyttäjän
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteUser(req, res) {
    if (req.user && req.user.role === 'admin') {
      const userId = req.params.id;
      
      try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).send('User not found');

        // Tallenna tiedot ennen poistoa audit-lokia varten
        const snapshot = { email: user.email, displayName: user.displayName, role: user.role };
        await User.findByIdAndDelete(userId);

        // Audit-loki
        await logAudit(req, 'user_deleted', snapshot, snapshot);

        res.status(200).send('User deleted successfully!');
      } catch (err) {
        res.status(500).json({ message: 'Error deleting user', error: err });
      }
    } else {
      res.status(403).send('Access denied');
    }
  }

  /**
 * Päivittää käyttäjän popup-limiitin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
static async updateUserPopupLimit(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  const userId = req.params.id;
  const { popupLimit } = req.body;
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Validoi että rajoitus on positiivinen kokonaisluku
    const limit = parseInt(popupLimit);
    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({ message: 'Invalid popup limit value' });
    }
    
    user.popupLimit = limit;
    await user.save();
    
    res.status(200).json({ 
      message: 'Popup limit updated successfully!',
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        popupLimit: user.popupLimit
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating popup limit', error: err });
  }
}

  /**
   * (Admin) Päivittää käyttäjän per-tyyppi-rajoitukset
   */
  static async updateUserLimits(req, res) {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const {
        sticky_bar, fab, slide_in, popup, social_proof, scroll_progress, lead_form,
        canUseTargeting, canUseAnalytics, canUseTemplates, canUseAbTest, canUseCampaigns, canUseWebhooks,
        popupLimit
      } = req.body;

      const b = (val, fallback) => val !== undefined ? !!val : fallback;
      const n = (val, fallback) => val !== undefined ? (parseInt(val) ?? fallback) : fallback;

      user.limits = {
        sticky_bar:      n(sticky_bar,      user.limits?.sticky_bar      ?? 1),
        fab:             n(fab,             user.limits?.fab             ?? 1),
        slide_in:        n(slide_in,        user.limits?.slide_in        ?? 1),
        popup:           n(popup,           user.limits?.popup           ?? 1),
        social_proof:    n(social_proof,    user.limits?.social_proof    ?? 1),
        scroll_progress: n(scroll_progress, user.limits?.scroll_progress ?? 1),
        lead_form:       n(lead_form,       user.limits?.lead_form       ?? 0),
        canUseTargeting: b(canUseTargeting, user.limits?.canUseTargeting ?? false),
        canUseAnalytics: b(canUseAnalytics, user.limits?.canUseAnalytics ?? true),
        canUseTemplates: b(canUseTemplates, user.limits?.canUseTemplates ?? true),
        canUseAbTest:    b(canUseAbTest,    user.limits?.canUseAbTest    ?? false),
        canUseCampaigns: b(canUseCampaigns, user.limits?.canUseCampaigns ?? false),
        canUseWebhooks:  b(canUseWebhooks,  user.limits?.canUseWebhooks  ?? false),
      };
      if (popupLimit) user.popupLimit = parseInt(popupLimit) || user.popupLimit;

      await user.save();

      // Audit-loki
      await logAudit(req, 'limits_updated', user, {
        popupLimit: user.popupLimit,
        limits: user.limits
      });

      res.json({ message: 'Limits updated', user });
    } catch (err) {
      res.status(500).json({ message: 'Error updating limits', error: err.toString() });
    }
  }

  /**
   * Käsittelee uloskirjautumisen
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async logout(req, res) {
    req.logout((err) => {
      if (err) {
        return res.status(500).send('Error logging out');
      }
      res.redirect('/');
    });
  }

  /**
   * Päivittää kirjautuneen käyttäjän sähköposti-ilmoitusasetukset
   */
  static async updateNotificationSettings(req, res) {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const { leadAlert, weeklyReport, notifyEmail } = req.body;

      // Validoi sähköpostiosoite jos annettu
      if (notifyEmail && notifyEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(notifyEmail.trim())) {
          return res.status(400).json({ message: 'Virheellinen sähköpostiosoite' });
        }
      }

      const update = {};
      if (leadAlert    !== undefined) update['emailNotifications.leadAlert']    = !!leadAlert;
      if (weeklyReport !== undefined) update['emailNotifications.weeklyReport'] = !!weeklyReport;
      if (notifyEmail  !== undefined) update['emailNotifications.notifyEmail']  = (notifyEmail || '').trim();

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: update },
        { new: true }
      ).select('emailNotifications email displayName');

      res.json({ success: true, emailNotifications: user.emailNotifications });
    } catch (err) {
      res.status(500).json({ message: 'Asetuksien tallennus epäonnistui', error: err.toString() });
    }
  }

  /**
   * Lähettää testisähköpostin käyttäjälle
   */
  static async sendTestEmail(req, res) {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // Rate limit: max 1 testisähköposti per tunti per käyttäjä
    const userId = String(req.user._id);
    const lastSent = testEmailCooldown.get(userId);
    const ONE_HOUR = 60 * 60 * 1000;
    if (lastSent && Date.now() - lastSent < ONE_HOUR) {
      const minLeft = Math.ceil((ONE_HOUR - (Date.now() - lastSent)) / 60000);
      return res.status(429).json({ message: `Odota vielä ${minLeft} minuuttia ennen uutta testiviestiä.` });
    }

    try {
      const { buildTestEmail } = require('../utils/email-templates');
      const user = await User.findById(req.user._id).select('email emailNotifications displayName').lean();
      const toEmail = user.emailNotifications?.notifyEmail?.trim() || user.email;
      if (!toEmail) return res.status(400).json({ message: 'Ei sähköpostiosoitetta' });
      const { subject, html } = buildTestEmail(user.displayName);
      const ok = await sendMail(toEmail, subject, html);
      if (ok) {
        testEmailCooldown.set(userId, Date.now());
        res.json({ success: true, to: toEmail });
      } else {
        res.status(500).json({ message: 'Sähköpostin lähetys epäonnistui. Tarkista SMTP-asetukset.' });
      }
    } catch (err) {
      res.status(500).json({ message: 'Virhe testisähköpostin lähetyksessä', error: err.toString() });
    }
  }

  static async getWebhooks(req, res) {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.user._id).select('webhooks');
    res.json(user?.webhooks || []);
  }

  static async addWebhook(req, res) {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { name, url, events } = req.body;
    if (!url) return res.status(400).json({ message: 'URL required' });

    // SSRF-suojaus: salli vain https:// julkisiin osoitteisiin
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') {
        return res.status(400).json({ message: 'Webhook URL täytyy olla HTTPS-osoite' });
      }
      const host = parsed.hostname.toLowerCase();
      const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
      if (blocked.includes(host) || host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')) {
        return res.status(400).json({ message: 'Sisäverkko-osoitteet eivät ole sallittuja' });
      }
    } catch {
      return res.status(400).json({ message: 'Virheellinen URL-osoite' });
    }
    try {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $push: { webhooks: { name: name || url, url, events: events || ['click'] } } },
        { new: true }
      );
      res.json(user.webhooks);
    } catch (err) {
      res.status(500).json({ message: 'Error adding webhook' });
    }
  }

  static async deleteWebhook(req, res) {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    try {
      await User.findByIdAndUpdate(req.user._id, { $pull: { webhooks: { _id: req.params.id } } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting webhook' });
    }
  }
}

module.exports = UserController;