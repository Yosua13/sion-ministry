ALTER TABLE members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS normalized_name TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS normalized_phone TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS normalized_email TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS primary_service_point_id TEXT REFERENCES cities(id) ON DELETE RESTRICT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS group_name TEXT NOT NULL DEFAULT '';
ALTER TABLE members ADD COLUMN IF NOT EXISTS owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE members ADD COLUMN IF NOT EXISTS joined_on DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS consent_status TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE members ADD COLUMN IF NOT EXISTS consent_source TEXT NOT NULL DEFAULT '';
ALTER TABLE members ADD COLUMN IF NOT EXISTS consent_purpose TEXT NOT NULL DEFAULT '';
ALTER TABLE members ADD COLUMN IF NOT EXISTS consent_recorded_at TIMESTAMPTZ;
ALTER TABLE members ADD COLUMN IF NOT EXISTS communication_preferences TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE members ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE members ADD COLUMN IF NOT EXISTS archived_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS archive_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE members ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ;
ALTER TABLE members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

INSERT INTO cities (id, name, region, reached_date, workers_count, members_count, journals_count, berita_count, jurnal_pa_count, organization_id, ministry_unit_id, region_id)
SELECT 'city-data-steward-review', 'Perlu Review Data Steward', 'Unassigned', CURRENT_DATE::TEXT, 0, 0, 0, 0, 0,
       'org-sion-ministry', 'unit-sion-academy', 'region-indonesia'
WHERE EXISTS (SELECT 1 FROM members WHERE city_id IS NULL)
ON CONFLICT (id) DO NOTHING;

UPDATE members SET city_id = 'city-data-steward-review', city_name = 'Perlu Review Data Steward' WHERE city_id IS NULL;

UPDATE members
SET normalized_name = LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')),
    normalized_phone = CASE
        WHEN REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g') LIKE '0%' THEN '+62' || SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g') FROM 2)
        WHEN REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g') LIKE '62%' THEN '+' || REGEXP_REPLACE(phone, '[^0-9]', '', 'g')
        WHEN REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g') <> '' THEN '+' || REGEXP_REPLACE(phone, '[^0-9]', '', 'g')
        ELSE ''
    END,
    normalized_email = LOWER(TRIM(COALESCE(email, ''))),
    primary_service_point_id = city_id,
    owner_user_id = COALESCE(user_id, mentor_user_id),
    joined_on = CASE WHEN COALESCE(joined_date, '') ~ '^\d{4}-\d{2}-\d{2}$' THEN joined_date::DATE ELSE CURRENT_DATE END,
    status = CASE WHEN status IN ('active', 'inactive') THEN status ELSE 'prospect' END
WHERE normalized_name IS NULL OR primary_service_point_id IS NULL OR joined_on IS NULL;

ALTER TABLE members ALTER COLUMN normalized_name SET NOT NULL;
ALTER TABLE members ALTER COLUMN normalized_phone SET NOT NULL;
ALTER TABLE members ALTER COLUMN normalized_email SET NOT NULL;
ALTER TABLE members ALTER COLUMN primary_service_point_id SET NOT NULL;
ALTER TABLE members ALTER COLUMN joined_on SET NOT NULL;

ALTER TABLE members DROP CONSTRAINT IF EXISTS members_lifecycle_status_check;
ALTER TABLE members ADD CONSTRAINT members_lifecycle_status_check
    CHECK (status IN ('guest', 'prospect', 'active', 'inactive', 'moved', 'deceased', 'archived'));
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_consent_status_check;
ALTER TABLE members ADD CONSTRAINT members_consent_status_check
    CHECK (consent_status IN ('unknown', 'granted', 'revoked'));
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_version_check;
ALTER TABLE members ADD CONSTRAINT members_version_check CHECK (version > 0);

CREATE INDEX IF NOT EXISTS idx_members_normalized_phone ON members(normalized_phone) WHERE normalized_phone <> '';
CREATE INDEX IF NOT EXISTS idx_members_normalized_email ON members(normalized_email) WHERE normalized_email <> '';
CREATE INDEX IF NOT EXISTS idx_members_normalized_name_city ON members(normalized_name, primary_service_point_id);
CREATE INDEX IF NOT EXISTS idx_members_scope_status_updated ON members(primary_service_point_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_members_owner ON members(owner_user_id);

CREATE TABLE IF NOT EXISTS member_histories (
    id UUID PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    change_type TEXT NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT NOT NULL DEFAULT '',
    new_value TEXT NOT NULL DEFAULT '',
    reason TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_member_histories_member_created ON member_histories(member_id, created_at DESC);

CREATE TABLE IF NOT EXISTS member_consent_histories (
    id UUID PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    consent_status TEXT NOT NULL CHECK (consent_status IN ('unknown', 'granted', 'revoked')),
    communication_preferences TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    source TEXT NOT NULL DEFAULT '',
    purpose TEXT NOT NULL DEFAULT '',
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_member_consent_histories_member_created ON member_consent_histories(member_id, created_at DESC);

CREATE TABLE IF NOT EXISTS member_duplicate_reviews (
    id UUID PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    candidate_member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    match_reasons TEXT[] NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    override_reason TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'merged', 'not_duplicate')),
    decided_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ,
    decision_note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT member_duplicate_reviews_distinct CHECK (member_id <> candidate_member_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_duplicate_pair_pending
    ON member_duplicate_reviews(LEAST(member_id, candidate_member_id), GREATEST(member_id, candidate_member_id))
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_member_duplicate_reviews_status_score ON member_duplicate_reviews(status, score DESC);

INSERT INTO member_histories (id, member_id, actor_user_id, change_type, field_name, new_value, reason)
SELECT MD5(m.id || ':member360-import')::UUID, m.id, m.owner_user_id, 'migration', 'member_360', 'imported', 'Backfill migration 000006'
FROM members m
ON CONFLICT (id) DO NOTHING;

INSERT INTO member_duplicate_reviews (id, member_id, candidate_member_id, match_reasons, score, override_reason)
SELECT MD5(LEAST(a.id, b.id) || ':' || GREATEST(a.id, b.id) || ':duplicate')::UUID,
       LEAST(a.id, b.id), GREATEST(a.id, b.id),
       ARRAY_REMOVE(ARRAY[
           CASE WHEN a.normalized_phone <> '' AND a.normalized_phone = b.normalized_phone THEN 'phone' END,
           CASE WHEN a.normalized_email <> '' AND a.normalized_email = b.normalized_email THEN 'email' END,
           CASE WHEN a.normalized_name = b.normalized_name AND a.primary_service_point_id = b.primary_service_point_id THEN 'name_city' END
       ], NULL),
       CASE
           WHEN (a.normalized_phone <> '' AND a.normalized_phone = b.normalized_phone)
             OR (a.normalized_email <> '' AND a.normalized_email = b.normalized_email) THEN 100
           ELSE 75
       END,
       'Kandidat ditemukan oleh migration 000006; keputusan data steward diperlukan.'
FROM members a
JOIN members b ON a.id < b.id
WHERE (a.normalized_phone <> '' AND a.normalized_phone = b.normalized_phone)
   OR (a.normalized_email <> '' AND a.normalized_email = b.normalized_email)
   OR (a.normalized_name = b.normalized_name AND a.primary_service_point_id = b.primary_service_point_id)
ON CONFLICT DO NOTHING;

INSERT INTO permissions (code, description) VALUES
    ('member.sensitive.read', 'Membaca field sensitif anggota tanpa masking'),
    ('member.export', 'Mengekspor daftar anggota yang telah dimasking'),
    ('member.history.read', 'Membaca histori perubahan anggota'),
    ('member.archive', 'Mengarsipkan anggota sesuai scope')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role, permission_code) VALUES
    ('admin', 'member.sensitive.read'), ('admin', 'member.export'), ('admin', 'member.history.read'), ('admin', 'member.archive'),
    ('pekerja', 'member.sensitive.read'), ('pekerja', 'member.export'), ('pekerja', 'member.history.read'), ('pekerja', 'member.archive'),
    ('auditor', 'member.read'), ('auditor', 'member.export'), ('auditor', 'member.history.read')
ON CONFLICT DO NOTHING;
