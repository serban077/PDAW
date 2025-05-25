// controllers/authController.js - Actualizat cu suport pentru admin
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const UserHelper = {
  async findByUsername(username) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, username]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  },

  async findById(id) {
    try {
      const result = await query('SELECT * FROM users WHERE id = ?', [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  },

  async create(username, hashedPassword, email, firstName = '', lastName = '') {
    try {
      const result = await query(`
        INSERT INTO users (username, password, email, first_name, last_name, role)
        VALUES (?, ?, ?, ?, ?, 'user')
      `, [username, hashedPassword, email, firstName, lastName]);
      
      const userId = result.rows[0].id;
      return { 
        id: userId, 
        username, 
        email, 
        first_name: firstName, 
        last_name: lastName,
        role: 'user'
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
};

exports.register = async (req, res) => {
  try {
    const { username, password, email, first_name, last_name } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ 
        success: false,
        message: 'Username, email și parola sunt obligatorii' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Parola trebuie să aibă cel puțin 6 caractere'
      });
    }

    const existingUser = await UserHelper.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Numele de utilizator sau email-ul este deja folosit' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await UserHelper.create(username, hashedPassword, email, first_name, last_name);

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Utilizator creat cu succes!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      },
      userId: user.id,
      isAdmin: user.role === 'admin'
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Eroare la înregistrare' 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username și parola sunt obligatorii'
      });
    }

    const user = await UserHelper.findByUsername(username);

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Credențiale invalide' 
      });
    }

    // Verifică dacă utilizatorul este banat
    if (user.role === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Contul dvs. a fost suspendat. Contactați administratorul.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Credențiale invalide' 
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Autentificare cu succes!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      },
      userId: user.id,
      isAdmin: user.role === 'admin'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Eroare la autentificare' 
    });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await UserHelper.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilizator negăsit'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      },
      isAdmin: user.role === 'admin'
    });

  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la verificarea token-ului'
    });
  }
};

exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Deconectare reușită'
  });
};

exports.validateToken = async (req, res) => {
  return res.status(200).json({
    success: true,
    valid: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    },
    isAdmin: req.user.role === 'admin'
  });
};