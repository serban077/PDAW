// backend/controllers/gymEntryController.js - Controller pentru intrări în sală
const { query } = require('../db');
const QRCode = require('qrcode');

// Generează cod QR pentru utilizator
const generateUserQRCode = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verifică dacă utilizatorul are deja un cod QR activ
    const existingQR = await query(
      'SELECT * FROM user_qr_codes WHERE user_id = ? AND is_active = 1',
      [userId]
    );
    
    if (existingQR.rows.length > 0) {
      // Returnează codul QR existent
      const qrData = {
        userId,
        code: existingQR.rows[0].qr_code,
        type: 'gym_entry'
      };
      
      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));
      
      return res.json({
        success: true,
        qrCode: existingQR.rows[0].qr_code,
        qrCodeUrl,
        message: 'Cod QR existent returnat'
      });
    }
    
    // Generează un cod QR nou
    const qrCode = `UNILUX${userId}${Date.now()}${Math.random().toString(36).substring(7)}`;
    
    const qrData = {
      userId,
      code: qrCode,
      type: 'gym_entry'
    };
    
    // Salvează în baza de date
    await query(
      'INSERT INTO user_qr_codes (user_id, qr_code, is_active) VALUES (?, ?, 1)',
      [userId, qrCode]
    );
    
    // Generează imaginea QR
    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));
    
    res.json({
      success: true,
      qrCode,
      qrCodeUrl,
      message: 'Cod QR generat cu succes'
    });
    
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la generarea codului QR'
    });
  }
};

// Scanează cod QR și înregistrează intrarea
const scanQRCode = async (req, res) => {
  try {
    const { qrCode } = req.body;
    
    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: 'Cod QR lipsă'
      });
    }
    
    // Parsează datele QR
    let qrData;
    try {
      qrData = JSON.parse(qrCode);
    } catch (e) {
      // Dacă nu e JSON, tratează ca string simplu
      qrData = { code: qrCode };
    }
    
    // Găsește utilizatorul cu acest cod QR
    const qrResult = await query(
      'SELECT * FROM user_qr_codes WHERE qr_code = ? AND is_active = 1',
      [qrData.code || qrCode]
    );
    
    if (qrResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cod QR invalid sau inactiv'
      });
    }
    
    const userQR = qrResult.rows[0];
    const userId = userQR.user_id;
    
    // Obține datele utilizatorului
    const userResult = await query(
      'SELECT u.*, us.status as subscription_status FROM users u LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = "active" AND us.end_date > datetime("now") WHERE u.id = ?',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilizator negăsit'
      });
    }
    
    const user = userResult.rows[0];
    
    // Verifică dacă utilizatorul are abonament activ
    if (!user.subscription_status) {
      return res.status(403).json({
        success: false,
        message: 'Abonament inactiv. Contactați recepția.',
        user: {
          name: `${user.first_name} ${user.last_name}`,
          email: user.email
        }
      });
    }
    
    // Verifică dacă utilizatorul are o intrare activă (nu a ieșit)
    const activeEntry = await query(
      'SELECT * FROM gym_entries WHERE user_id = ? AND status = "active" ORDER BY entry_time DESC LIMIT 1',
      [userId]
    );
    
    if (activeEntry.rows.length > 0) {
      // Utilizatorul iese din sală
      const entryId = activeEntry.rows[0].id;
      const entryTime = new Date(activeEntry.rows[0].entry_time);
      const exitTime = new Date();
      const duration = Math.round((exitTime - entryTime) / (1000 * 60)); // în minute
      
      await query(
        'UPDATE gym_entries SET exit_time = datetime("now"), status = "completed" WHERE id = ?',
        [entryId]
      );
      
      // Actualizează statisticile
      await updateUserStats(userId);
      
      res.json({
        success: true,
        action: 'exit',
        message: `La revedere, ${user.first_name}! Ați petrecut ${duration} minute în sală.`,
        user: {
          name: `${user.first_name} ${user.last_name}`,
          duration: duration
        }
      });
    } else {
      // Utilizatorul intră în sală
      await query(
        'INSERT INTO gym_entries (user_id, entry_method, status) VALUES (?, "qr_scan", "active")',
        [userId]
      );
      
      // Actualizează ultimul folosit pentru QR
      await query(
        'UPDATE user_qr_codes SET last_used = datetime("now"), usage_count = usage_count + 1 WHERE id = ?',
        [userQR.id]
      );
      
      res.json({
        success: true,
        action: 'entry',
        message: `Bun venit, ${user.first_name}! Antrenament plăcut!`,
        user: {
          name: `${user.first_name} ${user.last_name}`,
          subscription: user.subscription_status
        }
      });
    }
    
  } catch (error) {
    console.error('Error scanning QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la scanarea codului QR'
    });
  }
};

// Obține statisticile utilizatorului
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Actualizează statisticile mai întâi
    await updateUserStats(userId);
    
    // Obține statisticile
    const statsResult = await query(
      'SELECT * FROM user_stats WHERE user_id = ?',
      [userId]
    );
    
    let stats = {};
    if (statsResult.rows.length > 0) {
      stats = statsResult.rows[0];
    } else {
      // Creează statistici noi
      await query(
        'INSERT INTO user_stats (user_id) VALUES (?)',
        [userId]
      );
      stats = {
        total_entries: 0,
        current_month_entries: 0,
        average_duration: 0,
        longest_session: 0,
        favorite_time_slot: 'morning',
        streak_days: 0
      };
    }
    
    // Obține intrările recente
    const recentEntries = await query(`
      SELECT 
        entry_time,
        exit_time,
        CASE 
          WHEN exit_time IS NOT NULL 
          THEN ROUND((JULIANDAY(exit_time) - JULIANDAY(entry_time)) * 24 * 60)
          ELSE NULL 
        END as duration_minutes,
        status
      FROM gym_entries 
      WHERE user_id = ? 
      ORDER BY entry_time DESC 
      LIMIT 10
    `, [userId]);
    
    // Obține statistici săptămânale
    const weeklyStats = await query(`
      SELECT 
        strftime('%w', entry_time) as day_of_week,
        COUNT(*) as entries_count,
        AVG(CASE 
          WHEN exit_time IS NOT NULL 
          THEN ROUND((JULIANDAY(exit_time) - JULIANDAY(entry_time)) * 24 * 60)
          ELSE NULL 
        END) as avg_duration
      FROM gym_entries 
      WHERE user_id = ? 
      AND entry_time >= datetime('now', '-30 days')
      GROUP BY strftime('%w', entry_time)
      ORDER BY day_of_week
    `, [userId]);
    
    res.json({
      success: true,
      stats: {
        ...stats,
        recent_entries: recentEntries.rows,
        weekly_stats: weeklyStats.rows
      }
    });
    
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea statisticilor'
    });
  }
};

// Obține istoricul intrărilor pentru utilizator
const getUserHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE user_id = ?';
    let params = [userId];
    
    if (startDate) {
      whereClause += ' AND entry_time >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND entry_time <= ?';
      params.push(endDate);
    }
    
    const entriesResult = await query(`
      SELECT 
        id,
        entry_time,
        exit_time,
        CASE 
          WHEN exit_time IS NOT NULL 
          THEN ROUND((JULIANDAY(exit_time) - JULIANDAY(entry_time)) * 24 * 60)
          ELSE NULL 
        END as duration_minutes,
        status,
        entry_method,
        location,
        notes
      FROM gym_entries 
      ${whereClause}
      ORDER BY entry_time DESC 
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);
    
    const countResult = await query(`
      SELECT COUNT(*) as total FROM gym_entries ${whereClause}
    `, params);
    
    const totalEntries = countResult.rows[0].total;
    const totalPages = Math.ceil(totalEntries / limit);
    
    res.json({
      success: true,
      entries: entriesResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalEntries,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error getting user history:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea istoricului'
    });
  }
};

// Funcție helper pentru actualizarea statisticilor
const updateUserStats = async (userId) => {
  try {
    // Calculează statistici
    const statsQuery = `
      SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN entry_time >= datetime('now', 'start of month') THEN 1 END) as current_month_entries,
        AVG(CASE 
          WHEN exit_time IS NOT NULL 
          THEN ROUND((JULIANDAY(exit_time) - JULIANDAY(entry_time)) * 24 * 60)
          ELSE NULL 
        END) as average_duration,
        MAX(CASE 
          WHEN exit_time IS NOT NULL 
          THEN ROUND((JULIANDAY(exit_time) - JULIANDAY(entry_time)) * 24 * 60)
          ELSE NULL 
        END) as longest_session,
        MAX(entry_time) as last_entry
      FROM gym_entries 
      WHERE user_id = ? AND status = 'completed'
    `;
    
    const statsResult = await query(statsQuery, [userId]);
    const stats = statsResult.rows[0];
    
    // Calculează time slot preferat
    const timeSlotQuery = `
      SELECT 
        CASE 
          WHEN CAST(strftime('%H', entry_time) AS INTEGER) BETWEEN 6 AND 11 THEN 'morning'
          WHEN CAST(strftime('%H', entry_time) AS INTEGER) BETWEEN 12 AND 17 THEN 'afternoon'
          WHEN CAST(strftime('%H', entry_time) AS INTEGER) BETWEEN 18 AND 21 THEN 'evening'
          ELSE 'night'
        END as time_slot,
        COUNT(*) as count
      FROM gym_entries 
      WHERE user_id = ?
      GROUP BY time_slot
      ORDER BY count DESC
      LIMIT 1
    `;
    
    const timeSlotResult = await query(timeSlotQuery, [userId]);
    const favoriteTimeSlot = timeSlotResult.rows.length > 0 ? timeSlotResult.rows[0].time_slot : 'morning';
    
    // Actualizează sau inserează statisticile
    await query(`
      INSERT OR REPLACE INTO user_stats (
        user_id, total_entries, current_month_entries, average_duration, 
        longest_session, favorite_time_slot, last_entry, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      userId,
      stats.total_entries || 0,
      stats.current_month_entries || 0,
      Math.round(stats.average_duration || 0),
      stats.longest_session || 0,
      favoriteTimeSlot,
      stats.last_entry
    ]);
    
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
};

module.exports = {
  generateUserQRCode,
  scanQRCode,
  getUserStats,
  getUserHistory
};