const { query } = require('../db');

module.exports = {
  findByUsername: async (username) => {
    const { rows } = await query('SELECT * FROM users WHERE username = $1', [username]);
    return rows[0];
  },
  
  findById: async (id) => {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0];
  },
  
  create: async (username, passwordHash, email = null) => {
    const { rows } = await query(
      'INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING *',
      [username, passwordHash, email]
    );
    return rows[0];
  },
  
  ban: async (userId, adminId) => {
    await query('UPDATE users SET role = $1 WHERE id = $2', ['banned', userId]);
    await query(
      'INSERT INTO bans (user_id, banned_by) VALUES ($1, $2)',
      [userId, adminId]
    );
  },
  
  // 2FA related methods
  setup2FA: async (userId, tempSecret, method = 'app') => {
    await query(
      'UPDATE users SET temp_two_factor_secret = $1, two_factor_method = $2 WHERE id = $3',
      [tempSecret, method, userId]
    );
  },
  
  enable2FA: async (userId) => {
    const { rows } = await query(
      'UPDATE users SET has_2fa = TRUE, two_factor_secret = temp_two_factor_secret, temp_two_factor_secret = NULL WHERE id = $1 RETURNING *',
      [userId]
    );
    return rows[0];
  },
  
  disable2FA: async (userId) => {
    await query(
      'UPDATE users SET has_2fa = FALSE, two_factor_secret = NULL, two_factor_method = NULL WHERE id = $1',
      [userId]
    );
  },
  
  updateEmail: async (userId, email) => {
    const { rows } = await query(
      'UPDATE users SET email = $1 WHERE id = $2 RETURNING *',
      [email, userId]
    );
    return rows[0];
  },
  
  updateProfile: async (userId, data) => {
    const sets = [];
    const values = [];
    let counter = 1;
    
    // Dynamically build the SET part of the query based on provided data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Convert camelCase to snake_case for PostgreSQL
        const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        sets.push(`${columnName} = $${counter}`);
        values.push(value);
        counter++;
      }
    });
    
    if (sets.length === 0) return null;
    
    values.push(userId);
    
    const { rows } = await query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${counter} RETURNING *`,
      values
    );
    
    return rows[0];
  },

  // Find user by ID
findById: async (id) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
},

// Get user subscriptions
getSubscriptions: async (userId) => {
  const { rows } = await query(
    'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY start_date DESC',
    [userId]
  );
  return rows;
},
  

};

