// controllers/user.controller.js
// Käyttäjätoimintojen kontrollerilogiikka

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
          user.role = role;
          await user.save();
          res.status(200).send('Role updated successfully!');
        } else {
          res.status(404).send('User not found');
        }
      } catch (err) {
        res.status(500).json({ message: 'Error updating role', error: err });
      }
    } else {
      res.status(403).send('Access denied');
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