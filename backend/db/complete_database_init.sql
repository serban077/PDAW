-- Complete Database Initialization for Unilux Fitness
-- This file creates all necessary tables and initial data

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'user',
    has2FA INTEGER DEFAULT 0,
    twofa_secret TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 30,
    features TEXT, -- JSON string pentru features
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, active, expired, cancelled
    payment_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subscription_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'card',
    payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE
);

-- Create bans table
CREATE TABLE IF NOT EXISTS bans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    banned_by INTEGER NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (banned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_bans_user_id ON bans(user_id);
CREATE INDEX IF NOT EXISTS idx_bans_expires_at ON bans(expires_at);

-- Insert default subscription plans
INSERT OR IGNORE INTO subscription_plans (id, name, description, price, duration_days, features, active)
VALUES 
(1, 'BASIC', 'Abonament de bază pentru începători', 150.00, 30, '["Acces la sală 3 zile/săptămână", "Orar limitat (8:00 - 16:00)", "Acces la echipamentele de bază", "Fără antrenor personal"]', 1),
(2, 'PREMIUM', 'Abonament premium cu beneficii extra', 250.00, 30, '["Acces la sală 5 zile/săptămână", "Orar complet", "Acces la toate echipamentele", "1 ședință/lună cu antrenor"]', 1),
(3, 'FULL', 'Abonament VIP cu toate beneficiile', 350.00, 30, '["Acces nelimitat la sală", "Orar complet + weekend", "Acces la toate facilitățile", "3 ședințe/lună cu antrenor", "Plan personalizat de antrenament"]', 1);

-- Create admin user (optional - comentează dacă nu vrei)
-- Password: admin123 (hashed with bcrypt)
INSERT OR IGNORE INTO users (id, username, email, password, first_name, last_name, role, created_at)
VALUES (1, 'admin', 'admin@unilux.ro', '$2b$10$XeJlGjOEhTBHlQ.JcBF1..vGhfOOGjqQ5C4kzZsXjMGOQGGjWrH6u', 'Admin', 'User', 'admin', CURRENT_TIMESTAMP);

-- Verification query
SELECT 'Database initialized successfully' as status;