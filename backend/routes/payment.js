// routes/payment.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Obține configurația Stripe (cheia publică) - accesibil public
router.get('/stripe-config', paymentController.getStripeConfig);

// Obține planurile de abonament - accesibil public
router.get('/plans', paymentController.getPlans);

// Creează Payment Intent pentru Stripe Elements - necesită autentificare
router.post('/create-payment-intent', authMiddleware, paymentController.createPaymentIntent);

// Confirmă plata și activează abonamentul - necesită autentificare
router.post('/payment-success', authMiddleware, paymentController.confirmPayment);

// Verifică statusul unei plăți - necesită autentificare
router.get('/status/:sessionId', authMiddleware, paymentController.checkPaymentStatus);

// Obține istoricul plăților - necesită autentificare
router.get('/history', authMiddleware, paymentController.getPaymentHistory);

// Webhook Stripe (fără middleware de autentificare)
router.post('/webhook', express.raw({type: 'application/json'}), paymentController.handleWebhook);

// Rute compatibile cu codul frontend existent
router.post('/process', authMiddleware, paymentController.createPaymentIntent); // Alias pentru create-payment-intent

module.exports = router;