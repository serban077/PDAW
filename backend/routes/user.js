// routes/user.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Aplică middleware-ul de autentificare pentru toate rutele
router.use(authMiddleware);

// Rute pentru profil utilizator
router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateProfile);

// Rute pentru verificarea abonamentului (compatibilitate cu frontend)
router.get('/check-subscription', subscriptionController.checkActiveSubscription);

// Rute pentru istoricul utilizatorului
router.get('/subscription-history', subscriptionController.getUserSubscriptionHistory);

module.exports = router;