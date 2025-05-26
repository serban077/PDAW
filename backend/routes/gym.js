// routes/gym.js - Rute pentru sistemul de intrări în sală
const express = require('express');
const router = express.Router();
const gymController = require('../controllers/gymEntryController');
const authMiddleware = require('../middlewares/authMiddleware');

// Aplică middleware-ul de autentificare pentru toate rutele
router.use(authMiddleware);

// Rute pentru utilizatori normali
router.get('/qr-code', gymController.generateUserQRCode);
router.get('/stats', gymController.getUserStats);
router.get('/history', gymController.getUserHistory);

// Rute pentru scanarea QR (pentru admin/recepție)
router.post('/scan', gymController.scanQRCode);

module.exports = router;