-- db/subscription_tables.sql

-- Tabel pentru planurile de abonament
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 30,
    features TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru abonamentele utilizatorilor
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, expired, cancelled, failed
    payment_id VARCHAR(255), -- ID-ul plății de la Stripe
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
);

-- Tabel pentru plăți
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subscription_id INTEGER NOT NULL, -- referință la user_subscriptions.id
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'card',
    payment_id VARCHAR(255), -- ID-ul tranzacției de la Stripe
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE
);

-- Creează index-uri pentru îmbunătățirea performanței
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Funcție pentru actualizarea automată a câmpului updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger pentru tabelul subscription_plans
DROP TRIGGER IF EXISTS update_subscription_plans_modtime ON subscription_plans;
CREATE TRIGGER update_subscription_plans_modtime
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Trigger pentru tabelul user_subscriptions
DROP TRIGGER IF EXISTS update_user_subscriptions_modtime ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_modtime
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Trigger pentru tabelul payments
DROP TRIGGER IF EXISTS update_payments_modtime ON payments;
CREATE TRIGGER update_payments_modtime
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Inserează planurile de abonament implicite (dacă tabelul este gol)
INSERT INTO subscription_plans (name, description, price, duration_days, features)
SELECT 'BASIC', 'Acces de bază la sală', 150.00, 30, 
       ARRAY['Acces la sală 3 zile/săptămână', 'Orar limitat (8:00 - 16:00)', 'Acces la echipamentele de bază', 'Fără antrenor personal']
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'BASIC');

INSERT INTO subscription_plans (name, description, price, duration_days, features)
SELECT 'PREMIUM', 'Acces premium la sală', 250.00, 30, 
       ARRAY['Acces la sală 5 zile/săptămână', 'Orar complet', 'Acces la toate echipamentele', '1 ședință/lună cu antrenor']
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'PREMIUM');

INSERT INTO subscription_plans (name, description, price, duration_days, features)
SELECT 'FULL', 'Acces complet la toate facilitățile', 350.00, 30, 
       ARRAY['Acces nelimitat la sală', 'Orar complet + weekend', 'Acces la toate facilitățile', '3 ședințe/lună cu antrenor', 'Plan personalizat de antrenament']
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'FULL');

INSERT INTO subscription_plans (name, description, price, duration_days, features)
SELECT 'ANNUAL BASIC', 'Abonament anual de bază', 1500.00, 365, 
       ARRAY['Acces la sală 3 zile/săptămână', 'Orar limitat (8:00 - 16:00)', 'Acces la echipamentele de bază', 'Economisești 20% față de abonamentul lunar']
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'ANNUAL BASIC');

INSERT INTO subscription_plans (name, description, price, duration_days, features)
SELECT 'ANNUAL PREMIUM', 'Acces premium anual la sală', 2500.00, 365, 
       ARRAY['Acces la sală 5 zile/săptămână', 'Orar complet', 'Acces la toate echipamentele', '12 ședințe/an cu antrenor', 'Economisești 25% față de abonamentul lunar']
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'ANNUAL PREMIUM');

-- Funcție pentru curățarea automată a abonamentelor expirate
CREATE OR REPLACE FUNCTION cleanup_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE user_subscriptions 
    SET status = 'expired', updated_at = NOW()
    WHERE end_date < NOW() AND status = 'active';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- View pentru abonamentele active cu detalii complete
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    us.id,
    us.user_id,
    u.first_name,
    u.last_name,
    u.email,
    sp.name as plan_name,
    sp.price,
    sp.duration_days,
    sp.features,
    us.start_date,
    us.end_date,
    us.status,
    us.created_at,
    CASE 
        WHEN us.end_date > NOW() THEN EXTRACT(DAYS FROM (us.end_date - NOW()))::INTEGER
        ELSE 0
    END as days_remaining
FROM user_subscriptions us
JOIN users u ON us.user_id = u.id
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.status = 'active';

-- View pentru statistici abonamente
CREATE OR REPLACE VIEW subscription_stats AS
SELECT 
    sp.name as plan_name,
    sp.price,
    COUNT(us.id) as total_subscriptions,
    COUNT(CASE WHEN us.status = 'active' THEN 1 END) as active_subscriptions,
    COUNT(CASE WHEN us.status = 'expired' THEN 1 END) as expired_subscriptions,
    COUNT(CASE WHEN us.status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
    SUM(CASE WHEN us.status = 'active' THEN sp.price ELSE 0 END) as active_revenue,
    AVG(CASE WHEN us.status IN ('active', 'expired', 'cancelled') THEN sp.price END) as avg_revenue_per_subscription
FROM subscription_plans sp
LEFT JOIN user_subscriptions us ON sp.id = us.plan_id
WHERE sp.active = true
GROUP BY sp.id, sp.name, sp.price
ORDER BY sp.price;