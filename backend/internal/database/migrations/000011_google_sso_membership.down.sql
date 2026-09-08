DROP TABLE IF EXISTS role_change_requests;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
    CHECK (role IN ('admin', 'pekerja', 'mentor', 'jemaat', 'content_publisher', 'auditor', 'donation_verifier'));
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;
ALTER TABLE users ADD CONSTRAINT users_account_status_check
    CHECK (account_status IN ('invited', 'active', 'disabled'));
DROP INDEX IF EXISTS idx_users_google_subject_unique;
ALTER TABLE users DROP COLUMN IF EXISTS google_subject;
ALTER TABLE users DROP COLUMN IF EXISTS campus;
ALTER TABLE users DROP COLUMN IF EXISTS cohort;
ALTER TABLE users DROP COLUMN IF EXISTS major;
