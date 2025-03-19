// controllers/user.controller.js

const User = require('../models/User');

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
            
            // Tähän lisätä sähköposti-ilmoituksen lähettämisen
            console.log(`Käyttäjä ${user.displayName} (${user.email}) hyväksytty.`);
          }
          
          await user.save();
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
        const user = await User.findByIdAndDelete(userId);
        if (user) {
          res.status(200).send('User deleted successfully!');
        } else {
          res.status(404).send('User not found');
        }
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
}

module.exports = UserController;