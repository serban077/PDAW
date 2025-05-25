const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

// Middleware pentru verificarea rolului de admin
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acces interzis' });
  }
  next();
};

// Toate rutele admin necesită autentificare și rol de admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Rute pentru administrarea utilizatorilor
router.get('/users', adminController.getUsers);
router.post('/ban-user', adminController.banUser);
router.post('/unban-user', adminController.unbanUser || ((req, res) => {
  res.status(501).json({ message: 'Funcționalitate neimplementată' });
}));

// Rute pentru administrarea abonamentelor
router.get('/subscriptions', adminController.getSubscriptions || ((req, res) => {
  res.status(501).json({ message: 'Funcționalitate neimplementată' });
}));
router.post('/add-subscription', adminController.addSubscription || ((req, res) => {
  res.status(501).json({ message: 'Funcționalitate neimplementată' });
}));

// Rută de test (înlocuiește cu metoda ta reală sau elimină)
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Rută admin funcțională' });
});

module.exports = router;