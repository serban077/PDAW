// controllers/adminController.js - Controller complet pentru admin
const { query } = require('../db');

// Obține toți utilizatorii cu informații despre abonamente
const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let baseQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.created_at,
        COUNT(us.id) as total_subscriptions,
        COUNT(CASE WHEN us.status = 'active' AND us.end_date > datetime('now') THEN 1 END) as active_subscriptions,
        MAX(us.end_date) as latest_subscription_end
      FROM users u
      LEFT JOIN user_subscriptions us ON u.id = us.user_id
    `;
    
    let whereClause = " WHERE u.role != 'admin'";
    let params = [];
    
    if (search) {
      whereClause += ` AND (
        u.username LIKE ? OR 
        u.email LIKE ? OR 
        u.first_name LIKE ? OR 
        u.last_name LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      ${whereClause}
    `;
    
    const fullQuery = `
      ${baseQuery}
      ${whereClause}
      GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.created_at
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    // Execută query-urile
    const [usersResult, countResult] = await Promise.all([
      query(fullQuery, params),
      query(countQuery, params.slice(0, -2)) // Exclude limit și offset pentru count
    ]);
    
    const totalUsers = countResult.rows[0].total;
    const totalPages = Math.ceil(totalUsers / limit);
    
    res.json({
      success: true,
      users: usersResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea utilizatorilor'
    });
  }
};

// Banează un utilizator
const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    
    // Verifică dacă utilizatorul există și nu este admin
    const userResult = await query('SELECT * FROM users WHERE id = ? AND role != ?', [userId, 'admin']);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilizatorul nu a fost găsit sau nu poate fi banat'
      });
    }
    
    const user = userResult.rows[0];
    
    // Verifică dacă utilizatorul este deja banat
    if (user.role === 'banned') {
      return res.status(400).json({
        success: false,
        message: 'Utilizatorul este deja banat'
      });
    }
    
    // Inițiază tranzacția
    await query('BEGIN TRANSACTION');
    
    try {
      // Adaugă înregistrarea de ban
      await query(`
        INSERT INTO bans (user_id, banned_by, reason, created_at, expires_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now', '+30 days'))
      `, [userId, adminId, reason || 'Încălcarea regulamentului']);
      
      // Actualizează rolul utilizatorului
      await query('UPDATE users SET role = ? WHERE id = ?', ['banned', userId]);
      
      // Dezactivează abonamentele active
      await query(`
        UPDATE user_subscriptions 
        SET status = 'cancelled', updated_at = datetime('now')
        WHERE user_id = ? AND status = 'active'
      `, [userId]);
      
      await query('COMMIT');
      
      res.json({
        success: true,
        message: 'Utilizatorul a fost banat cu succes'
      });
      
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la banarea utilizatorului'
    });
  }
};

// Debanează un utilizator
const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verifică dacă utilizatorul există și este banat
    const userResult = await query('SELECT * FROM users WHERE id = ? AND role = ?', [userId, 'banned']);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilizatorul nu a fost găsit sau nu este banat'
      });
    }
    
    await query('BEGIN TRANSACTION');
    
    try {
      // Actualizează rolul utilizatorului înapoi la user
      await query('UPDATE users SET role = ? WHERE id = ?', ['user', userId]);
      
      // Marchează ban-ul ca expirat
      await query(`
        UPDATE bans 
        SET expires_at = datetime('now')
        WHERE user_id = ? AND expires_at > datetime('now')
      `, [userId]);
      
      await query('COMMIT');
      
      res.json({
        success: true,
        message: 'Utilizatorul a fost debanat cu succes'
      });
      
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la debanarea utilizatorului'
    });
  }
};

// Obține toate abonamentele cu detalii
const getSubscriptions = async (req, res) => {
  try {
    const { 
      status, 
      search, 
      startDate, 
      endDate,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let baseQuery = `
      SELECT 
        us.id,
        us.start_date,
        us.end_date,
        us.status,
        us.created_at,
        sp.name as plan_name,
        sp.price,
        sp.duration_days,
        u.id as user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        p.amount as paid_amount,
        p.payment_method,
        p.created_at as payment_date
      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      LEFT JOIN payments p ON us.id = p.subscription_id
    `;
    
    let whereConditions = [];
    let params = [];
    
    if (status) {
      whereConditions.push('us.status = ?');
      params.push(status);
    }
    
    if (search) {
      whereConditions.push(`(
        u.username LIKE ? OR 
        u.email LIKE ? OR 
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR
        sp.name LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (startDate) {
      whereConditions.push('us.start_date >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push('us.end_date <= ?');
      params.push(endDate);
    }
    
    let whereClause = '';
    if (whereConditions.length > 0) {
      whereClause = ' WHERE ' + whereConditions.join(' AND ');
    }
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      ${whereClause}
    `;
    
    const fullQuery = `
      ${baseQuery}
      ${whereClause}
      ORDER BY us.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    const [subscriptionsResult, countResult] = await Promise.all([
      query(fullQuery, params),
      query(countQuery, params.slice(0, -2))
    ]);
    
    const totalSubscriptions = countResult.rows[0].total;
    const totalPages = Math.ceil(totalSubscriptions / limit);
    
    res.json({
      success: true,
      subscriptions: subscriptionsResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalSubscriptions,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea abonamentelor'
    });
  }
};

// Obține statistici pentru dashboard
const getDashboardStats = async (req, res) => {
  try {
    const statsQueries = [
      // Total utilizatori activi
      query("SELECT COUNT(*) as count FROM users WHERE role = 'user'"),
      
      // Total utilizatori banați
      query("SELECT COUNT(*) as count FROM users WHERE role = 'banned'"),
      
      // Abonamente active
      query(`
        SELECT COUNT(*) as count 
        FROM user_subscriptions 
        WHERE status = 'active' AND end_date > datetime('now')
      `),
      
      // Venituri luna curentă
      query(`
        SELECT COALESCE(SUM(p.amount), 0) as revenue
        FROM payments p
        WHERE p.status = 'completed'
        AND strftime('%Y-%m', p.created_at) = strftime('%Y-%m', 'now')
      `),
      
      // Abonamente noi luna curentă
      query(`
        SELECT COUNT(*) as count
        FROM user_subscriptions us
        WHERE strftime('%Y-%m', us.created_at) = strftime('%Y-%m', 'now')
      `),
      
      // Top planuri de abonament
      query(`
        SELECT 
          sp.name,
          COUNT(us.id) as subscriptions_count,
          SUM(p.amount) as total_revenue
        FROM subscription_plans sp
        LEFT JOIN user_subscriptions us ON sp.id = us.plan_id
        LEFT JOIN payments p ON us.id = p.subscription_id AND p.status = 'completed'
        GROUP BY sp.id, sp.name
        ORDER BY subscriptions_count DESC
        LIMIT 5
      `),
      
      // Utilizatori înregistrați în ultimele 30 de zile
      query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users 
        WHERE created_at >= datetime('now', '-30 days')
        AND role = 'user'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `)
    ];
    
    const [
      totalUsers,
      bannedUsers,
      activeSubscriptions,
      monthlyRevenue,
      newSubscriptions,
      topPlans,
      userGrowth
    ] = await Promise.all(statsQueries);
    
    res.json({
      success: true,
      stats: {
        totalUsers: totalUsers.rows[0].count,
        bannedUsers: bannedUsers.rows[0].count,
        activeSubscriptions: activeSubscriptions.rows[0].count,
        monthlyRevenue: monthlyRevenue.rows[0].revenue || 0,
        newSubscriptions: newSubscriptions.rows[0].count,
        topPlans: topPlans.rows,
        userGrowth: userGrowth.rows
      }
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea statisticilor'
    });
  }
};

// Obține toate ban-urile
const getBans = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        b.id,
        b.reason,
        b.created_at as banned_at,
        b.expires_at,
        u.id as user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        admin.username as banned_by_username
      FROM bans b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN users admin ON b.banned_by = admin.id
      WHERE b.expires_at > datetime('now')
      ORDER BY b.created_at DESC
    `);
    
    res.json({
      success: true,
      bans: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching bans:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea ban-urilor'
    });
  }
};

// Adaugă aceste funcții noi ÎNAINTE de module.exports

// Get all subscription plans for admin management
const getPlans = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM subscription_plans 
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      plans: result.rows
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea planurilor'
    });
  }
};

// Create new subscription plan
const createPlan = async (req, res) => {
  try {
    const { name, description, price, duration_days, features, active } = req.body;
    
    if (!name || !price || !duration_days) {
      return res.status(400).json({
        success: false,
        message: 'Numele, prețul și durata sunt obligatorii'
      });
    }
    
    const featuresJson = JSON.stringify(features || []);
    
    const result = await query(`
      INSERT INTO subscription_plans (name, description, price, duration_days, features, active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, description, price, duration_days, featuresJson, active !== false]);
    
    res.json({
      success: true,
      message: 'Planul a fost creat cu succes',
      planId: result.rows[0].id
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la crearea planului'
    });
  }
};

// Update subscription plan
const updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { name, description, price, duration_days, features, active } = req.body;
    
    if (!name || !price || !duration_days) {
      return res.status(400).json({
        success: false,
        message: 'Numele, prețul și durata sunt obligatorii'
      });
    }
    
    const featuresJson = JSON.stringify(features || []);
    
    await query(`
      UPDATE subscription_plans 
      SET name = ?, description = ?, price = ?, duration_days = ?, features = ?, active = ?
      WHERE id = ?
    `, [name, description, price, duration_days, featuresJson, active !== false, planId]);
    
    res.json({
      success: true,
      message: 'Planul a fost actualizat cu succes'
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la actualizarea planului'
    });
  }
};

// Delete subscription plan
const deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    
    // Check if plan has active subscriptions
    const activeSubsResult = await query(`
      SELECT COUNT(*) as count 
      FROM user_subscriptions 
      WHERE plan_id = ? AND status = 'active' AND end_date > datetime('now')
    `, [planId]);
    
    if (activeSubsResult.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Nu se poate șterge planul deoarece există abonamente active pentru acest plan'
      });
    }
    
    await query('DELETE FROM subscription_plans WHERE id = ?', [planId]);
    
    res.json({
      success: true,
      message: 'Planul a fost șters cu succes'
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la ștergerea planului'
    });
  }
};

// Change user subscription
const changeUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { planId } = req.body;
    
    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'ID-ul planului este obligatoriu'
      });
    }
    
    // Get plan details
    const planResult = await query('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
    
    if (planResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Planul nu a fost găsit'
      });
    }
    
    const plan = planResult.rows[0];
    
    await query('BEGIN TRANSACTION');
    
    try {
      // Cancel existing active subscriptions
      await query(`
        UPDATE user_subscriptions 
        SET status = 'cancelled' 
        WHERE user_id = ? AND status = 'active' AND end_date > datetime('now')
      `, [userId]);
      
      // Create new subscription
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString();
      
      await query(`
        INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, status)
        VALUES (?, ?, ?, ?, 'active')
      `, [userId, planId, startDate, endDate]);
      
      await query('COMMIT');
      
      res.json({
        success: true,
        message: 'Abonamentul utilizatorului a fost schimbat cu succes'
      });
      
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error changing user subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la schimbarea abonamentului'
    });
  }
};

// ACUM ÎNLOCUIEȘTE module.exports cu:
module.exports = { 
  getUsers, 
  banUser, 
  unbanUser, 
  getSubscriptions, 
  getDashboardStats,
  getBans,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  changeUserSubscription
};