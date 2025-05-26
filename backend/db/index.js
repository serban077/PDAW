// db/index.js - Versiune reparată
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'unilux.db');
let db;

// Inițializează conexiunea SQLite
const initDB = () => {
    if (!db) {
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening SQLite database:', err);
            } else {
                console.log('Connected to SQLite database');
            }
        });
    }
    return db;
};

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        const database = initDB();
        
        // Convertește PostgreSQL syntax ($1, $2) la SQLite syntax (?, ?)
        const sqliteSQL = sql.replace(/\$(\d+)/g, '?');
        
        if (sqliteSQL.trim().toUpperCase().startsWith('SELECT')) {
            database.all(sqliteSQL, params, (err, rows) => {
                if (err) reject(err);
                else resolve({ rows });
            });
        } else if (sqliteSQL.trim().toUpperCase().startsWith('INSERT')) {
            database.run(sqliteSQL, params, function(err) {
                if (err) reject(err);
                else resolve({ 
                    rows: [{ id: this.lastID }], 
                    rowCount: this.changes 
                });
            });
        } else {
            database.run(sqliteSQL, params, function(err) {
                if (err) reject(err);
                else resolve({ 
                    rows: [], 
                    rowCount: this.changes 
                });
            });
        }
    });
};

const initializeDatabase = async () => {
    try {
        console.log('Initializing SQLite database...');
        
        // Creează tabelele de bază
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                role TEXT DEFAULT 'user',
                has2FA INTEGER DEFAULT 0,
                twofa_secret TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Folosește subscription_plans în loc de subscriptions
        await query(`
            CREATE TABLE IF NOT EXISTS subscription_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                duration_days INTEGER NOT NULL DEFAULT 30,
                features TEXT,
                active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS user_subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                plan_id INTEGER NOT NULL,
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                status TEXT DEFAULT 'pending',
                payment_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
            )
        `);

        // Tabelele pentru gym
        await query(`
            CREATE TABLE IF NOT EXISTS gym_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                entry_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                exit_time DATETIME NULL,
                entry_method TEXT DEFAULT 'qr_scan',
                status TEXT DEFAULT 'active',
                location TEXT DEFAULT 'main_gym',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS user_qr_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL UNIQUE,
                qr_code TEXT NOT NULL UNIQUE,
                expires_at DATETIME NULL,
                is_active BOOLEAN DEFAULT 1,
                generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used DATETIME NULL,
                usage_count INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS user_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL UNIQUE,
                total_entries INTEGER DEFAULT 0,
                current_month_entries INTEGER DEFAULT 0,
                average_duration INTEGER DEFAULT 0,
                longest_session INTEGER DEFAULT 0,
                favorite_time_slot TEXT DEFAULT 'morning',
                last_entry DATETIME NULL,
                streak_days INTEGER DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Inserează planurile de abonament dacă nu există
        const existingPlans = await query('SELECT COUNT(*) as count FROM subscription_plans');
        if (existingPlans.rows[0].count === 0) {
            await query(`
                INSERT INTO subscription_plans (name, description, price, duration_days, features, active)
                VALUES 
                ('BASIC', 'Abonament de bază pentru începători', 150.00, 30, '["Acces la sală 3 zile/săptămână", "Orar limitat (8:00 - 16:00)", "Acces la echipamentele de bază", "Fără antrenor personal"]', 1),
                ('PREMIUM', 'Abonament premium cu beneficii extra', 250.00, 30, '["Acces la sală 5 zile/săptămână", "Orar complet", "Acces la toate echipamentele", "1 ședință/lună cu antrenor"]', 1),
                ('FULL', 'Abonament VIP cu toate beneficiile', 350.00, 30, '["Acces nelimitat la sală", "Orar complet + weekend", "Acces la toate facilitățile", "3 ședințe/lună cu antrenor", "Plan personalizat de antrenament"]', 1)
            `);
            console.log('Inserted default subscription plans');
        }
        
        console.log('Database initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

module.exports = {
    query,
    initializeDatabase
};