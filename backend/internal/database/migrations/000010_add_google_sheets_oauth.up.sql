-- Only the refresh token is persisted. It is encrypted by the application
-- before reaching this table, so the database never receives it as plaintext.
CREATE TABLE google_sheets_credentials (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    encrypted_refresh_token TEXT NOT NULL,
    connected_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
