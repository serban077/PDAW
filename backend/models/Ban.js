const { query } = require('../db');

module.exports = {
  findAll: async () => {
    const { rows } = await query(`
      SELECT b.*, u.username as banned_username 
      FROM bans b
      JOIN users u ON b.user_id = u.id
    `);
    return rows;
  }
};