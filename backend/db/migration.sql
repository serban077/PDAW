-- Crearea tabelului pentru ban-uri
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

-- Creează index pentru performanță
CREATE INDEX IF NOT EXISTS idx_bans_user_id ON bans(user_id);
CREATE INDEX IF NOT EXISTS idx_bans_expires_at ON bans(expires_at);

-- Actualizează tabelul user_subscriptions dacă nu există deja coloana updated_at
ALTER TABLE user_subscriptions ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Actualizează tabelul subscription_plans dacă nu există
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

-- Inserează planuri de test dacă nu există
INSERT OR IGNORE INTO subscription_plans (id, name, description, price, duration_days, features, active)
VALUES 
(1, 'BASIC', 'Abonament de bază pentru începători', 150.00, 30, '["Acces la sală 3 zile/săptămână", "Orar limitat (8:00 - 16:00)", "Acces la echipamentele de bază", "Fără antrenor personal"]', 1),
(2, 'PREMIUM', 'Abonament premium cu beneficii extra', 250.00, 30, '["Acces la sală 5 zile/săptămână", "Orar complet", "Acces la toate echipamentele", "1 ședință/lună cu antrenor"]', 1),
(3, 'FULL', 'Abonament VIP cu toate beneficiile', 350.00, 30, '["Acces nelimitat la sală", "Orar complet + weekend", "Acces la toate facilitățile", "3 ședințe/lună cu antrenor", "Plan personalizat de antrenament"]', 1);

-- Tabel pentru plăți dacă nu există
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