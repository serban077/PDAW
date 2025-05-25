const { query, io } = require('../server');

const getUsers = async (req, res) => {
  const { rows } = await query('SELECT id, username, role, created_at FROM users');
  res.json(rows);
};

const banUser = async (req, res) => {
  try {
    await query('BEGIN');

    // Adaugă ban
    await query(
      `INSERT INTO bans (user_id, banned_by, expires_at)
      VALUES ($1, $2, $3)`,
      [req.params.userId, req.user.id, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] // 30 zile
    );

    // Actualizează status utilizator
    await query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['banned', req.params.userId]
    );

    await query('COMMIT');
    
    io.emit('user-banned', { userId: req.params.userId });
    res.send('Utilizator banat cu succes');
  } catch (err) {
    await query('ROLLBACK');
    res.status(500).send('Eroare la banare utilizator');
  }
};

module.exports = { getUsers, banUser };