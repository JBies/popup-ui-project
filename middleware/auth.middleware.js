// middleware/auth.middleware.js
// Autentikaation ja käyttäjäoikeuksien tarkistaminen

/**
 * Tarkistaa, onko käyttäjä kirjautunut
 */
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Kirjautuminen vaaditaan' });
  };
  
  /**
   * Tarkistaa, onko käyttäjällä user-oikeudet (user tai admin)
   */
  const isUser = (req, res, next) => {
    if (req.isAuthenticated() && (req.user.role === 'user' || req.user.role === 'admin')) {
      return next();
    }
    
    if (req.isAuthenticated() && req.user.role === 'pending') {
      return res.status(403).json({ 
        message: 'Käyttäjätilisi odottaa hyväksyntää',
        status: 'pending' 
      });
    }
    
    res.status(401).json({ message: 'Kirjautuminen vaaditaan' });
  };
  
  /**
   * Tarkistaa, onko käyttäjällä admin-oikeudet
   */
  const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    res.status(403).json({ message: 'Ei oikeuksia' });
  };
  
  /**
   * Tarkistaa, onko käyttäjä väliaikaistilassa (pending)
   * Jos on, ohjaa pending-näkymään
   */
  const checkPendingStatus = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'pending') {
      return res.redirect('/pending');
    }
    next();
  };
  
  module.exports = {
    isAuthenticated,
    isUser,
    isAdmin,
    checkPendingStatus
  };