// db/index.js
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
                has2FA INTEGER DEFAULT 0,
                twofa_secret TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                duration_days INTEGER NOT NULL,
                description TEXT,
                features TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS user_subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                subscription_id INTEGER NOT NULL,
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                payment_status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
            )
        `);

        // Inserează niște abonamente de test dacă nu există
        const existingPlans = await query('SELECT COUNT(*) as count FROM subscriptions');
        if (existingPlans.rows[0].count === 0) {
            await query(`
                INSERT INTO subscriptions (name, price, duration_days, description, features)
                VALUES 
                ('Basic', 99.99, 30, 'Abonament de bază pentru începători', '["Acces la sală", "Program de bază"]'),
                ('Premium', 199.99, 30, 'Abonament premium cu beneficii extra', '["Acces la sală", "Antrenor personal", "Program avansat"]'),
                ('VIP', 299.99, 30, 'Abonament VIP cu toate beneficiile', '["Acces la sală", "Antrenor personal", "Masaj", "Nutriție"]')
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