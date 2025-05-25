-- payment_tables.sql

-- Verifică dacă tabelele există deja și le șterge pentru a evita conflictele (opțional)
-- DROP TABLE IF EXISTS payments;
-- DROP TABLE IF EXISTS subscription_plans;

-- Creează tabelul subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    features TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adaugă coloana payment_method la tabelul subscriptions dacă nu există deja
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN payment_method VARCHAR(20) DEFAULT 'card';
    END IF;
END $$;

-- Adaugă coloana amount la tabelul subscriptions dacă nu există deja
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'amount'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN amount DECIMAL(10, 2);
    END IF;
END $$;

-- Creează tabelul payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    subscription_id INTEGER REFERENCES subscriptions(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_id VARCHAR(100) UNIQUE,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Creează index-uri pentru îmbunătățirea performanței
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);

-- Adaugă timestamp (created_at, updated_at) la tabele dacă nu există deja
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Funcție și trigger pentru actualizarea automată a câmpului updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicare trigger pentru tabelul subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_modtime ON subscriptions;
CREATE TRIGGER update_subscriptions_modtime
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();