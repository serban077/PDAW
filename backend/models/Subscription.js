// models/Subscription.js
const { query } = require('../db');

class Subscription {
  // Obține toate planurile de abonament active
  static async getAllPlans() {
    try {
      const result = await query(
        'SELECT * FROM subscription_plans WHERE active = true ORDER BY price ASC'
      );
      return result.rows;
    } catch (error) {
      console.error('Eroare la obținerea planurilor:', error);
      throw error;
    }
  }

  // Obține un plan după ID
  static async getPlanById(id) {
    try {
      const result = await query(
        'SELECT * FROM subscription_plans WHERE id = $1 AND active = true',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Eroare la obținerea planului:', error);
      throw error;
    }
  }

  // Verifică dacă utilizatorul are un abonament activ
  static async checkActiveSubscription(userId) {
    try {
      const result = await query(`
        SELECT us.*, sp.name as subscription_name, sp.price, sp.features
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        WHERE us.user_id = $1 AND us.end_date > NOW() AND us.status = 'active'
        ORDER BY us.end_date DESC
        LIMIT 1
      `, [userId]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Eroare la verificarea abonamentului activ:', error);
      throw error;
    }
  }

  // Creează un nou abonament pentru utilizator
  static async createUserSubscription(userId, planId, status = 'pending') {
    try {
      // Obține detaliile planului
      const plan = await this.getPlanById(planId);
      if (!plan) {
        throw new Error('Planul de abonament nu a fost găsit');
      }

      // Verifică dacă utilizatorul are deja un abonament activ
      const existingSubscription = await this.checkActiveSubscription(userId);
      if (existingSubscription) {
        throw new Error('Utilizatorul are deja un abonament activ');
      }

      // Calculează datele de început și sfârșit
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration_days);

      // Inserează abonamentul utilizatorului
      const result = await query(`
        INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [userId, planId, startDate, endDate, status]);

      return {
        id: result.rows[0].id,
        userId,
        planId,
        startDate,
        endDate,
        status
      };
    } catch (error) {
      console.error('Eroare la crearea abonamentului utilizator:', error);
      throw error;
    }
  }

  // Actualizează statusul unui abonament
  static async updateSubscriptionStatus(subscriptionId, status) {
    try {
      const result = await query(
        'UPDATE user_subscriptions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, subscriptionId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Eroare la actualizarea statusului abonamentului:', error);
      throw error;
    }
  }

  // Obține istoricul abonamentelor unui utilizator
  static async getUserSubscriptionHistory(userId) {
    try {
      const result = await query(`
        SELECT us.*, sp.name as subscription_name, sp.price, sp.features, sp.duration_days
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        WHERE us.user_id = $1
        ORDER BY us.created_at DESC
      `, [userId]);
      
      return result.rows;
    } catch (error) {
      console.error('Eroare la obținerea istoricului abonamentelor:', error);
      throw error;
    }
  }

  // Activează un abonament după plată
  static async activateSubscription(subscriptionId, paymentId) {
    try {
      const result = await query(`
        UPDATE user_subscriptions 
        SET status = 'active', payment_id = $1, updated_at = NOW() 
        WHERE id = $2 AND status = 'pending'
        RETURNING *
      `, [paymentId, subscriptionId]);

      if (result.rows.length === 0) {
        throw new Error('Abonamentul nu a fost găsit sau nu poate fi activat');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Eroare la activarea abonamentului:', error);
      throw error;
    }
  }

  // Anulează un abonament
  static async cancelSubscription(subscriptionId, userId) {
    try {
      const result = await query(`
        UPDATE user_subscriptions 
        SET status = 'cancelled', updated_at = NOW() 
        WHERE id = $1 AND user_id = $2 AND status IN ('active', 'pending')
        RETURNING *
      `, [subscriptionId, userId]);

      return result.rows[0];
    } catch (error) {
      console.error('Eroare la anularea abonamentului:', error);
      throw error;
    }
  }

  // Verifică dacă un abonament a expirat și îl actualizează
  static async checkAndUpdateExpiredSubscriptions() {
    try {
      const result = await query(`
        UPDATE user_subscriptions 
        SET status = 'expired', updated_at = NOW()
        WHERE end_date < NOW() AND status = 'active'
        RETURNING id, user_id
      `);

      console.log(`Actualizate ${result.rows.length} abonamente expirate`);
      return result.rows;
    } catch (error) {
      console.error('Eroare la verificarea abonamentelor expirate:', error);
      throw error;
    }
  }

  // Căutare abonamente după criterii
  static async searchSubscriptions(criteria = {}) {
    try {
      let query_str = `
        SELECT us.*, sp.name as subscription_name, sp.price, sp.features, sp.duration_days,
               u.first_name, u.last_name, u.email
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        JOIN users u ON us.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (criteria.userId) {
        query_str += ` AND us.user_id = $${paramIndex}`;
        params.push(criteria.userId);
        paramIndex++;
      }

      if (criteria.status) {
        query_str += ` AND us.status = $${paramIndex}`;
        params.push(criteria.status);
        paramIndex++;
      }

      if (criteria.planId) {
        query_str += ` AND us.plan_id = $${paramIndex}`;
        params.push(criteria.planId);
        paramIndex++;
      }

      if (criteria.startDate) {
        query_str += ` AND us.start_date >= $${paramIndex}`;
        params.push(criteria.startDate);
        paramIndex++;
      }

      if (criteria.endDate) {
        query_str += ` AND us.end_date <= $${paramIndex}`;
        params.push(criteria.endDate);
        paramIndex++;
      }

      query_str += ' ORDER BY us.created_at DESC';

      if (criteria.limit) {
        query_str += ` LIMIT $${paramIndex}`;
        params.push(criteria.limit);
        paramIndex++;
      }

      const result = await query(query_str, params);
      return result.rows;
    } catch (error) {
      console.error('Eroare la căutarea abonamentelor:', error);
      throw error;
    }
  }

  // Obține statistici pentru abonamente
  static async getSubscriptionStats() {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_subscriptions,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_subscriptions,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_subscriptions
        FROM user_subscriptions
      `);
      
      return result.rows[0];
    } catch (error) {
      console.error('Eroare la obținerea statisticilor:', error);
      throw error;
    }
  }

  // Obține veniturile pe baza abonamentelor
  static async getRevenueStats() {
    try {
      const result = await query(`
        SELECT 
          sp.name as plan_name,
          sp.price,
          COUNT(us.id) as subscriptions_count,
          SUM(CASE WHEN us.status = 'active' THEN sp.price ELSE 0 END) as active_revenue,
          SUM(sp.price) as total_revenue
        FROM subscription_plans sp
        LEFT JOIN user_subscriptions us ON sp.id = us.plan_id
        GROUP BY sp.id, sp.name, sp.price
        ORDER BY total_revenue DESC
      `);
      
      return result.rows;
    } catch (error) {
      console.error('Eroare la obținerea statisticilor de venituri:', error);
      throw error;
    }
  }

  // Metodele vechi pentru compatibilitate cu codul existent
  static async getAll() {
    return this.getAllPlans();
  }

  static async getById(id) {
    return this.getPlanById(id);
  }

  static async purchase(userId, planId, status = 'pending') {
    return this.createUserSubscription(userId, planId, status);
  }

  static async updatePaymentStatus(subscriptionId, status) {
    return this.updateSubscriptionStatus(subscriptionId, status);
  }
}

module.exports = Subscription;