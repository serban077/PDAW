-- Complete migration to fix all database issues
-- Run this to ensure everything is properly set up

-- Drop old subscriptions table if it exists (this might not exist)
DROP TABLE IF EXISTS subscriptions;

-- Ensure subscription_plans table exists with correct structure
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 30,
    features TEXT, -- JSON string for features
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ensure user_subscriptions table has correct structure
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL, -- This should reference subscription_plans.id
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
);

-- Insert or update subscription plans
INSERT OR REPLACE INTO subscription_plans (id, name, description, price, duration_days, features, active)
VALUES 
(1, 'BASIC', 'Abonament de bază pentru începători', 150.00, 30, '["Acces la sală 3 zile/săptămână", "Orar limitat (8:00 - 16:00)", "Acces la echipamentele de bază", "Fără antrenor personal"]', 1),
(2, 'PREMIUM', 'Abonament premium cu beneficii extra', 250.00, 30, '["Acces la sală 5 zile/săptămână", "Orar complet", "Acces la toate echipamentele", "1 ședință/lună cu antrenor"]', 1),
(3, 'FULL', 'Abonament VIP cu toate beneficiile', 350.00, 30, '["Acces nelimitat la sală", "Orar complet + weekend", "Acces la toate facilitățile", "3 ședințe/lună cu antrenor", "Plan personalizat de antrenament"]', 1);

-- Verify the setup
SELECT 'Migration completed successfully. Subscription plans:' as message;
SELECT id, name, price, duration_days FROM subscription_plans WHERE active = 1;