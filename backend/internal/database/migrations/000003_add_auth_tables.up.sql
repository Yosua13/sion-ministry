CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'pekerja', 'jemaat')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'disabled')),
    city_id TEXT REFERENCES cities(id) ON DELETE SET NULL,
    city_name TEXT,
    created_at TEXT NOT NULL,
    approved_at TEXT
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
);

INSERT INTO users (
    id,
    name,
    email,
    password_hash,
    role,
    status,
    created_at,
    approved_at
) VALUES (
    'usr-admin-default',
    'Admin Sion',
    'admin@sionministry.local',
    '$2a$10$tc2fAiO9OJ2nAGIgZDyKkuvo9CWQPIBC.PsFxzfyo1HJbXJe9ZekG',
    'admin',
    'active',
    NOW()::TEXT,
    NOW()::TEXT
) ON CONFLICT (email) DO NOTHING;
