-- backend/db/admin_init.sql
-- Rulează acest script pentru a adăuga tabelurile necesare pentru admin dashboard

-- Adaugă coloana role în tabelul users dacă nu există
PRAGMA table_info(users);

-- Dacă nu vezi coloana 'role' în rezultat, rulează:
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

-- Creează tabelul pentru bans
CREATE TABLE IF NOT EXISTS bans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Creează index-uri pentru performanță
CREATE INDEX IF NOT EXISTS idx_bans_user_id ON bans(user_id);
CREATE INDEX IF NOT EXISTS idx_bans_admin_id ON bans(admin_id);
CREATE INDEX IF NOT EXISTS idx_bans_is_active ON bans(is_active);

-- Creează un utilizator admin (înlocuiește cu ID-ul real al utilizatorului tău)
-- UPDATE users SET role = 'admin' WHERE id = 1; -- Înlocuiește 1 cu ID-ul tău

-- Sau pentru a face primul utilizator admin:
-- UPDATE users SET role = 'admin' WHERE id = (SELECT MIN(id) FROM users);

-- Verificare finală
SELECT 'Tabele create cu succes!' as status;