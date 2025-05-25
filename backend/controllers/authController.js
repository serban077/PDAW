// controllers/authController.js - Adaptat pentru SQLite
const bcrypt = require('bcryptjs'); // sau bcrypt
const jwt = require('jsonwebtoken');
const { query } = require('../db');

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Funcții helper pentru User (înlocuind modelul ORM)
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
        INSERT INTO users (username, password, email, first_name, last_name)
        VALUES (?, ?, ?, ?, ?)
      `, [username, hashedPassword, email, firstName, lastName]);
      
      const userId = result.rows[0].id;
      return { id: userId, username, email, first_name: firstName, last_name: lastName };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
};

// Înregistrare simplificată (fără 2FA pentru început)
exports.register = async (req, res) => {
  try {
    const { username, password, email, first_name, last_name } = req.body;

    console.log(`Register attempt: ${username}, Email: ${email}`);

    // Validare input
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

    // Verifică dacă utilizatorul există deja
    const existingUser = await UserHelper.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Numele de utilizator sau email-ul este deja folosit' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Creează utilizatorul
    const user = await UserHelper.create(username, hashedPassword, email, first_name, last_name);
    console.log(`User created: ID ${user.id}`);

    // Generează token JWT
    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`Registration complete for user ${user.id}`);
    
    return res.status(201).json({
      success: true,
      message: 'Utilizator creat cu succes!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      },
      userId: user.id
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Eroare la înregistrare' 
    });
  }
};

// Login simplificat (fără 2FA pentru început)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`Login attempt: ${username}`);

    // Validare input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username și parola sunt obligatorii'
      });
    }

    // Găsește utilizatorul
    const user = await UserHelper.findByUsername(username);

    if (!user) {
      console.log(`Login failed: User ${username} not found`);
      return res.status(401).json({ 
        success: false,
        message: 'Credențiale invalide' 
      });
    }

    // Verifică parola
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Login failed: Invalid password for ${username}`);
      return res.status(401).json({ 
        success: false,
        message: 'Credențiale invalide' 
      });
    }

    // Generează token JWT
    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`Login successful for user ${user.id}`);
    
    return res.status(200).json({
      success: true,
      message: 'Autentificare cu succes!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      },
      userId: user.id,
      isAdmin: false // Poți adăuga logica pentru admin aici
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Eroare la autentificare' 
    });
  }
};

// Verificare token (pentru middleware)
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
        last_name: user.last_name
      }
    });

  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la verificarea token-ului'
    });
  }
};

// Logout (simplu)
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Deconectare reușită'
  });
};

// Validare token (pentru frontend)
exports.validateToken = async (req, res) => {
  return res.status(200).json({
    success: true,
    valid: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email
    }
  });
};