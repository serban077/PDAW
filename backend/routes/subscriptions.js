// routes/subscriptions.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Aplică middleware-ul de autentificare pentru toate rutele
router.use(authMiddleware);

// Rute pentru abonamente
router.get('/plans', subscriptionController.getSubscriptionPlans);
router.get('/check-active', subscriptionController.checkActiveSubscription);
router.post('/purchase', subscriptionController.purchaseSubscription);
router.get('/history', subscriptionController.getUserSubscriptionHistory);

module.exports = router;