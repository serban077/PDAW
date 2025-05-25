// middlewares/authMiddleware.js - Actualizat cu suport pentru roluri
const jwt = require('jsonwebtoken');
const { query } = require('../db');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token de acces lipsă'
            });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

        const result = await query(
            'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = ?',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Utilizator invalid'
            });
        }

        const user = result.rows[0];

        // Verifică dacă utilizatorul este banat
        if (user.role === 'banned') {
            return res.status(403).json({
                success: false,
                message: 'Contul dvs. a fost suspendat. Contactați administratorul.'
            });
        }

        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token invalid'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirat'
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Eroare la verificarea autentificării'
        });
    }
};

module.exports = authMiddleware;