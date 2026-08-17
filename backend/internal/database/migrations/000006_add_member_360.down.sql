DELETE FROM role_permissions WHERE permission_code IN ('member.sensitive.read', 'member.export', 'member.history.read', 'member.archive');
DELETE FROM permissions WHERE code IN ('member.sensitive.read', 'member.export', 'member.history.read', 'member.archive');

DROP TABLE IF EXISTS member_duplicate_reviews;
DROP TABLE IF EXISTS member_consent_histories;
DROP TABLE IF EXISTS member_histories;

DROP INDEX IF EXISTS idx_members_owner;
DROP INDEX IF EXISTS idx_members_scope_status_updated;
DROP INDEX IF EXISTS idx_members_normalized_name_city;
DROP INDEX IF EXISTS idx_members_normalized_email;
DROP INDEX IF EXISTS idx_members_normalized_phone;

ALTER TABLE members DROP CONSTRAINT IF EXISTS members_version_check;
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_consent_status_check;
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_lifecycle_status_check;

ALTER TABLE members DROP COLUMN IF EXISTS updated_at;
ALTER TABLE members DROP COLUMN IF EXISTS created_at;
ALTER TABLE members DROP COLUMN IF EXISTS archive_reason;
ALTER TABLE members DROP COLUMN IF EXISTS retention_until;
ALTER TABLE members DROP COLUMN IF EXISTS archived_by;
ALTER TABLE members DROP COLUMN IF EXISTS archived_at;
ALTER TABLE members DROP COLUMN IF EXISTS communication_preferences;
ALTER TABLE members DROP COLUMN IF EXISTS consent_recorded_at;
ALTER TABLE members DROP COLUMN IF EXISTS consent_purpose;
ALTER TABLE members DROP COLUMN IF EXISTS consent_source;
ALTER TABLE members DROP COLUMN IF EXISTS consent_status;
ALTER TABLE members DROP COLUMN IF EXISTS joined_on;
ALTER TABLE members DROP COLUMN IF EXISTS version;
ALTER TABLE members DROP COLUMN IF EXISTS owner_user_id;
ALTER TABLE members DROP COLUMN IF EXISTS group_name;
ALTER TABLE members DROP COLUMN IF EXISTS primary_service_point_id;
ALTER TABLE members DROP COLUMN IF EXISTS normalized_email;
ALTER TABLE members DROP COLUMN IF EXISTS normalized_phone;
ALTER TABLE members DROP COLUMN IF EXISTS normalized_name;
ALTER TABLE members DROP COLUMN IF EXISTS email;

UPDATE members SET city_id = NULL, city_name = '' WHERE city_id = 'city-data-steward-review';
DELETE FROM cities WHERE id = 'city-data-steward-review';
