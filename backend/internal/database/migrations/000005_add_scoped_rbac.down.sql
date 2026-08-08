DROP TABLE IF EXISTS attendance_checkins;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS role_assignments;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;

DROP INDEX IF EXISTS idx_auth_sessions_id;
ALTER TABLE auth_sessions DROP COLUMN IF EXISTS revoked_at;
ALTER TABLE auth_sessions DROP COLUMN IF EXISTS last_seen_at;
ALTER TABLE auth_sessions DROP COLUMN IF EXISTS ip_address;
ALTER TABLE auth_sessions DROP COLUMN IF EXISTS user_agent;
ALTER TABLE auth_sessions DROP COLUMN IF EXISTS device_name;
ALTER TABLE auth_sessions DROP COLUMN IF EXISTS id;

ALTER TABLE job_applications DROP COLUMN IF EXISTS user_id;
ALTER TABLE job_applications DROP COLUMN IF EXISTS city_id;
ALTER TABLE donation_records DROP COLUMN IF EXISTS user_id;
ALTER TABLE donation_records DROP COLUMN IF EXISTS city_id;
ALTER TABLE donation_records DROP COLUMN IF EXISTS verified_at;
ALTER TABLE donation_records DROP COLUMN IF EXISTS verified_by;
ALTER TABLE donation_records DROP COLUMN IF EXISTS status;
ALTER TABLE berita_acaras DROP COLUMN IF EXISTS is_public;
ALTER TABLE jurnal_pas DROP COLUMN IF EXISTS mentor_user_id;
ALTER TABLE jurnal_pas DROP COLUMN IF EXISTS mentee_id;
ALTER TABLE members DROP COLUMN IF EXISTS mentor_user_id;
ALTER TABLE members DROP COLUMN IF EXISTS user_id;
ALTER TABLE cities DROP COLUMN IF EXISTS region_id;
ALTER TABLE cities DROP COLUMN IF EXISTS ministry_unit_id;
ALTER TABLE cities DROP COLUMN IF EXISTS organization_id;

DROP TABLE IF EXISTS regions;
DROP TABLE IF EXISTS ministry_units;
DROP TABLE IF EXISTS organizations;
