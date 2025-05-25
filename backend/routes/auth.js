// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Testează dacă controller-ul este importat corect
console.log('AuthController methods:', Object.keys(authController));

// Rute publice (fără autentificare)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rute protejate (cu autentificare)
router.get('/verify', authMiddleware, authController.verifyToken || authController.validateToken);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;