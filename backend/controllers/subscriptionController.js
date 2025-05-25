// controllers/subscriptionController.js
const { query } = require('../db');

// Obține toate planurile de abonament disponibile
exports.getSubscriptionPlans = async (req, res) => {
    try {
        const result = await query('SELECT * FROM subscriptions ORDER BY price ASC');
        
        res.status(200).json({
            success: true,
            plans: result.rows
        });
    } catch (error) {
        console.error('Eroare la obținerea planurilor:', error);
        res.status(500).json({
            success: false,
            message: 'Eroare la obținerea planurilor de abonament'
        });
    }
};

// Verifică abonamentul activ al utilizatorului
exports.checkActiveSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await query(`
            SELECT us.*, s.name as subscription_name
            FROM user_subscriptions us
            JOIN subscriptions s ON us.subscription_id = s.id
            WHERE us.user_id = ? 
            AND us.end_date > datetime('now')
            AND us.payment_status = 'completed'
            ORDER BY us.end_date DESC
            LIMIT 1
        `, [userId]);
        
        const hasActiveSubscription = result.rows.length > 0;
        
        res.status(200).json({
            success: true,
            hasActiveSubscription,
            activeSubscription: hasActiveSubscription ? result.rows[0] : null
        });
    } catch (error) {
        console.error('Eroare la verificarea abonamentului:', error);
        res.status(500).json({
            success: false,
            message: 'Eroare la verificarea abonamentului'
        });
    }
};

// Cumpără un abonament
exports.purchaseSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const { subscription_id } = req.body;
        
        if (!subscription_id) {
            return res.status(400).json({
                success: false,
                message: 'ID-ul abonamentului este obligatoriu'
            });
        }
        
        // Obține detaliile abonamentului
        const subscriptionResult = await query(
            'SELECT * FROM subscriptions WHERE id = ?',
            [subscription_id]
        );
        
        if (subscriptionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Abonamentul nu a fost găsit'
            });
        }
        
        const subscription = subscriptionResult.rows[0];
        
        // Calculează datele de început și sfârșit
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + subscription.duration_days);
        
        // Inserează abonamentul utilizatorului
        const insertResult = await query(`
            INSERT INTO user_subscriptions 
            (user_id, subscription_id, start_date, end_date, payment_status)
            VALUES (?, ?, ?, ?, 'completed')
        `, [
            userId,
            subscription_id,
            startDate.toISOString(),
            endDate.toISOString()
        ]);
        
        // Obține abonamentul nou creat
        const newSubscription = await query(`
            SELECT us.*, s.name as subscription_name
            FROM user_subscriptions us
            JOIN subscriptions s ON us.subscription_id = s.id
            WHERE us.id = ?
        `, [insertResult.rows[0].id]);
        
        res.status(200).json({
            success: true,
            message: 'Abonament cumpărat cu succes',
            subscription: newSubscription.rows[0]
        });
    } catch (error) {
        console.error('Eroare la cumpărarea abonamentului:', error);
        res.status(500).json({
            success: false,
            message: 'Eroare la cumpărarea abonamentului'
        });
    }
};

// Obține istoricul abonamentelor utilizatorului
exports.getUserSubscriptionHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await query(`
            SELECT us.*, s.name as subscription_name, s.price
            FROM user_subscriptions us
            JOIN subscriptions s ON us.subscription_id = s.id
            WHERE us.user_id = ?
            ORDER BY us.created_at DESC
        `, [userId]);
        
        res.status(200).json({
            success: true,
            history: result.rows
        });
    } catch (error) {
        console.error('Eroare la obținerea istoricului:', error);
        res.status(500).json({
            success: false,
            message: 'Eroare la obținerea istoricului abonamentelor'
        });
    }
};