// routes/admin.js - Rute actualizate pentru admin
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

// Middleware pentru verificarea rolului de admin
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Acces interzis. Doar administratorii pot accesa această resursă.' 
    });
  }
  next();
};

// Aplică middleware-ul de autentificare și admin pentru toate rutele
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard și statistici
router.get('/dashboard/stats', adminController.getDashboardStats);

// Gestionarea utilizatorilor
router.get('/users', adminController.getUsers);
router.post('/users/:userId/ban', adminController.banUser);
router.post('/users/:userId/unban', adminController.unbanUser);

// Gestionarea abonamentelor
router.get('/subscriptions', adminController.getSubscriptions);

// Gestionarea ban-urilor
router.get('/bans', adminController.getBans);

// Rută de test pentru verificarea accesului admin
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Acces admin confirmat',
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

router.get('/plans', adminController.getPlans);
router.post('/plans', adminController.createPlan);
router.put('/plans/:planId', adminController.updatePlan);
router.delete('/plans/:planId', adminController.deletePlan);
router.post('/users/:userId/change-subscription', adminController.changeUserSubscription);

module.exports = router;