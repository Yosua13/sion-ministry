-- Google SSO is the canonical login identity. Password columns are retained only
-- for backwards-compatible historical records and are no longer used by routes.
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_subject TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_subject_unique
    ON users(google_subject) WHERE google_subject IS NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS campus TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS cohort TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS major TEXT NOT NULL DEFAULT '';

-- Pending SSO accounts do not receive an effective role until their profile has a
-- city and phone number and an administrator approves them.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;
UPDATE users SET account_status = 'pending' WHERE account_status = 'invited';
ALTER TABLE users ADD CONSTRAINT users_account_status_check
    CHECK (account_status IN ('pending', 'active', 'disabled'));

ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
UPDATE user_roles SET revoked_at = NOW()
WHERE revoked_at IS NULL AND role NOT IN ('admin', 'pekerja', 'jemaat');
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
    CHECK (role IN ('admin', 'pekerja', 'jemaat'));

CREATE TABLE IF NOT EXISTS role_change_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_role TEXT NOT NULL CHECK (requested_role IN ('jemaat', 'pekerja', 'admin')),
    reason TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_change_requests_one_pending
    ON role_change_requests(user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_role_change_requests_status_created
    ON role_change_requests(status, created_at DESC);
