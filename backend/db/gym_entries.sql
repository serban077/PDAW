-- Adaugă aceste tabele în baza de date pentru sistemul de intrări
-- Rulează în SQLite/MySQL după structura existentă

-- Tabel pentru intrările în sală
CREATE TABLE IF NOT EXISTS gym_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    entry_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    exit_time DATETIME NULL,
    entry_method TEXT DEFAULT 'qr_scan', -- qr_scan, manual, card
    status TEXT DEFAULT 'active', -- active, completed
    location TEXT DEFAULT 'main_gym', -- main_gym, cardio_area, weights_area
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel pentru codurile QR ale utilizatorilor  
CREATE TABLE IF NOT EXISTS user_qr_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    qr_code TEXT NOT NULL UNIQUE,
    expires_at DATETIME NULL, -- NULL = nu expiră niciodată
    is_active BOOLEAN DEFAULT 1,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used DATETIME NULL,
    usage_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel pentru statistici rapide (cache)
CREATE TABLE IF NOT EXISTS user_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    total_entries INTEGER DEFAULT 0,
    current_month_entries INTEGER DEFAULT 0,
    average_duration INTEGER DEFAULT 0, -- în minute
    longest_session INTEGER DEFAULT 0, -- în minute
    favorite_time_slot TEXT DEFAULT 'morning', -- morning, afternoon, evening, night
    last_entry DATETIME NULL,
    streak_days INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index-uri pentru performanță
CREATE INDEX IF NOT EXISTS idx_gym_entries_user_id ON gym_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_entries_entry_time ON gym_entries(entry_time);
CREATE INDEX IF NOT EXISTS idx_gym_entries_status ON gym_entries(status);
CREATE INDEX IF NOT EXISTS idx_user_qr_codes_qr_code ON user_qr_codes(qr_code);
CREATE INDEX IF NOT EXISTS idx_user_qr_codes_user_id ON user_qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_qr_codes_active ON user_qr_codes(is_active);

-- Trigger pentru actualizarea automată a updated_at
CREATE TRIGGER IF NOT EXISTS update_gym_entries_updated_at 
    AFTER UPDATE ON gym_entries
    BEGIN
        UPDATE gym_entries SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_user_stats_updated_at 
    AFTER UPDATE ON user_stats
    BEGIN
        UPDATE user_stats SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Funcție pentru generarea codurilor QR unice
-- Această funcție va fi implementată în backend pentru a genera coduri unice

-- Inserare date de test (opțional)
-- INSERT INTO user_qr_codes (user_id, qr_code) 
-- SELECT id, 'QR' || PRINTF('%06d', id) || SUBSTR(REPLACE(HEX(RANDOMBLOB(4)), '-', ''), 1, 8)
-- FROM users 
-- WHERE role = 'user' AND id NOT IN (SELECT user_id FROM user_qr_codes);

-- Verificare
SELECT 'Tables created successfully for gym entry system' as status;