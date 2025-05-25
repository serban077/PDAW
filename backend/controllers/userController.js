// controllers/userController.js
const { query } = require('../db');

// Obține profilul utilizatorului
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await query(
            'SELECT id, username, email, first_name, last_name, created_at FROM users WHERE id = $1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Utilizator negăsit' });
        }
        
        res.status(200).json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Eroare la obținerea profilului utilizatorului:', error);
        res.status(500).json({ success: false, message: 'Eroare la obținerea profilului' });
    }
};

// ADAUGĂ ACEASTĂ FUNCȚIE NOUĂ
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { first_name, last_name, username } = req.body;
        
        const result = await query(
            'UPDATE users SET first_name = $1, last_name = $2, username = $3 WHERE id = $4 RETURNING id, username, email, first_name, last_name',
            [first_name, last_name, username, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Utilizator negăsit' });
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Profil actualizat cu succes',
            user: result.rows[0] 
        });
    } catch (error) {
        console.error('Eroare la actualizarea profilului:', error);
        res.status(500).json({ success: false, message: 'Eroare la actualizarea profilului' });
    }
};

// Verifică dacă utilizatorul are un abonament activ
exports.checkActiveSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await query(
            `SELECT us.id, us.start_date, us.end_date, us.payment_status,
             s.name AS subscription_name
             FROM user_subscriptions us
             JOIN subscriptions s ON us.subscription_id = s.id
             WHERE us.user_id = $1
             AND us.end_date > CURRENT_TIMESTAMP
             AND us.payment_status = 'completed'
             LIMIT 1`,
            [userId]
        );
        
        const hasActiveSubscription = result.rows.length > 0;
        res.status(200).json({
            success: true,
            hasActiveSubscription,
            activeSubscription: hasActiveSubscription ? result.rows[0] : null
        });
    } catch (error) {
        console.error('Eroare la verificarea abonamentului:', error);
        res.status(500).json({ success: false, message: 'Eroare la verificarea abonamentului' });
    }
};