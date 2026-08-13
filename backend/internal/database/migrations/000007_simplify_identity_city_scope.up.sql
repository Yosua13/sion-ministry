-- Simplify identity and authorization around one canonical user record and city scope.
-- This migration is deliberately fail-closed: a member without an email or an invalid
-- user link must be reconciled by a data steward before the production cutover.

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM members m
        WHERE NULLIF(BTRIM(COALESCE(m.email, '')), '') IS NULL
    ) THEN
        RAISE EXCEPTION
            '000007 cannot migrate members without email. Reconcile member email data before retrying.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM members m
        WHERE m.city_id IS NULL OR NULLIF(BTRIM(COALESCE(m.normalized_phone, '')), '') IS NULL
    ) THEN
        RAISE EXCEPTION
            '000007 cannot migrate members without a city or normalized phone. Reconcile required profile data before retrying.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM members m
        WHERE m.user_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = m.user_id)
    ) THEN
        RAISE EXCEPTION
            '000007 found a member.user_id that does not exist in users. Reconcile the broken link before retrying.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM users u
        LEFT JOIN members m ON m.user_id = u.id
        WHERE u.role = 'jemaat'
          AND u.status <> 'disabled'
          AND m.id IS NULL
    ) THEN
        RAISE EXCEPTION
            '000007 found a legacy jemaat account without a member profile. Link it to a member or disable/reclassify it before retrying.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM (
            SELECT LOWER(BTRIM(COALESCE(m.email, u.email))) AS email
            FROM users u
            LEFT JOIN members m ON m.user_id = u.id
            WHERE NULLIF(BTRIM(COALESCE(m.email, u.email)), '') IS NOT NULL
            UNION ALL
            SELECT LOWER(BTRIM(email)) AS email
            FROM members
            WHERE user_id IS NULL
        ) identities
        GROUP BY email
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            '000007 found duplicate email addresses while consolidating members into users. Reconcile duplicate identities before retrying.';
    END IF;
END $$;

-- Preserve the legacy role only long enough to backfill user_roles below.
ALTER TABLE users RENAME COLUMN name TO full_name;
ALTER TABLE users RENAME COLUMN status TO account_status;
ALTER TABLE users RENAME COLUMN approved_at TO activated_at;
-- The old check allows "pending", but not the replacement "invited" value.
-- Drop it before converting values so this migration remains transactional.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ALTER COLUMN email TYPE CITEXT USING LOWER(BTRIM(email));
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ;
ALTER TABLE users ALTER COLUMN activated_at TYPE TIMESTAMPTZ USING NULLIF(activated_at, '')::TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN is_member BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN phone_e164 TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN discipleship_stage TEXT;
ALTER TABLE users ADD COLUMN mentor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN mentor_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN group_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN joined_on DATE;
ALTER TABLE users ADD COLUMN member_status TEXT;
ALTER TABLE users ADD COLUMN profile_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN archived_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN archived_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN archive_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN retention_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE users
SET account_status = CASE account_status
    WHEN 'pending' THEN 'invited'
    WHEN 'active' THEN 'active'
    WHEN 'disabled' THEN 'disabled'
    ELSE 'disabled'
END;
ALTER TABLE users ADD CONSTRAINT users_account_status_check
    CHECK (account_status IN ('invited', 'active', 'disabled'));

-- A member linked to an existing account enriches that account. An unlinked member
-- becomes a new invited account with the member ID retained for foreign-key remapping.
UPDATE users u
SET full_name = m.name,
    email = LOWER(BTRIM(m.email)),
    city_id = m.city_id,
    phone_e164 = m.normalized_phone,
    discipleship_stage = m.discipleship_stage,
    mentor_user_id = m.mentor_user_id,
    mentor_name = COALESCE(m.mentor_name, ''),
    group_name = COALESCE(m.group_name, ''),
    joined_on = m.joined_on,
    member_status = m.status,
    profile_version = m.version,
    archived_at = m.archived_at,
    archived_by = m.archived_by,
    archive_reason = COALESCE(m.archive_reason, ''),
    retention_until = m.retention_until,
    is_member = TRUE,
    updated_at = NOW()
FROM members m
WHERE m.user_id = u.id;

INSERT INTO users (
    id, full_name, email, password_hash, role, account_status, city_id, city_name,
    created_at, activated_at, is_member, phone_e164, discipleship_stage,
    mentor_user_id, mentor_name, group_name, joined_on, member_status,
    profile_version, archived_at, archived_by, archive_reason, retention_until, updated_at
)
SELECT
    m.id, m.name, LOWER(BTRIM(m.email)), NULL, 'jemaat', 'invited', m.city_id, m.city_name,
    COALESCE(m.created_at, NOW()), NULL, TRUE, m.normalized_phone, m.discipleship_stage,
    m.mentor_user_id, COALESCE(m.mentor_name, ''), COALESCE(m.group_name, ''), m.joined_on, m.status,
    m.version, m.archived_at, m.archived_by, COALESCE(m.archive_reason, ''), m.retention_until, NOW()
FROM members m
WHERE m.user_id IS NULL;

ALTER TABLE users ADD CONSTRAINT users_member_status_check
    CHECK (NOT is_member OR member_status IN ('guest', 'prospect', 'active', 'inactive', 'moved', 'deceased', 'archived'));
ALTER TABLE users ADD CONSTRAINT users_members_have_city_check
    CHECK (NOT is_member OR city_id IS NOT NULL);
ALTER TABLE users ADD CONSTRAINT users_members_have_phone_check
    CHECK (NOT is_member OR phone_e164 <> '');
ALTER TABLE users ADD CONSTRAINT users_profile_version_check CHECK (profile_version > 0);
CREATE INDEX idx_users_member_city_status_updated
    ON users(city_id, member_status, updated_at DESC) WHERE is_member = TRUE;
CREATE INDEX idx_users_member_phone ON users(phone_e164) WHERE is_member = TRUE AND phone_e164 <> '';
CREATE INDEX idx_users_member_name_city ON users(LOWER(BTRIM(full_name)), city_id) WHERE is_member = TRUE;

CREATE TABLE user_roles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'pekerja', 'mentor', 'jemaat', 'content_publisher', 'auditor', 'donation_verifier')),
    city_id TEXT REFERENCES cities(id) ON DELETE RESTRICT,
    granted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    CHECK ((role = 'admin' AND city_id IS NULL) OR (role <> 'admin' AND city_id IS NOT NULL))
);
CREATE UNIQUE INDEX idx_user_roles_active_unique
    ON user_roles(user_id, role, COALESCE(city_id, 'global')) WHERE revoked_at IS NULL;
CREATE INDEX idx_user_roles_user_active ON user_roles(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_user_roles_city_active ON user_roles(city_id) WHERE revoked_at IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM role_assignments ra
        WHERE ra.status = 'active'
          AND ra.role <> 'admin'
          AND NOT EXISTS (
              SELECT 1
              FROM cities c
              WHERE (ra.scope_type = 'city' AND c.id = ra.scope_id)
                 OR (ra.scope_type = 'region' AND c.region_id = ra.scope_id)
                 OR (ra.scope_type = 'ministry_unit' AND c.ministry_unit_id = ra.scope_id)
                 OR (ra.scope_type = 'organization' AND c.organization_id = ra.scope_id)
                 OR (ra.scope_type = 'self' AND c.id = (SELECT city_id FROM users WHERE id = ra.user_id))
          )
    ) THEN
        RAISE EXCEPTION
            '000007 found an active non-admin role without a resolvable city. Reconcile the assignment before retrying.';
    END IF;
END $$;

-- Migrate every active old assignment to a global admin or city-scoped role.
INSERT INTO user_roles (id, user_id, role, city_id, granted_by, granted_at)
SELECT 'urole-' || MD5(ra.id || ':' || COALESCE(c.id, 'global')),
       ra.user_id,
       ra.role,
       CASE WHEN ra.role = 'admin' THEN NULL ELSE c.id END,
       ra.approved_by,
       COALESCE(NULLIF(ra.approved_at, '')::TIMESTAMPTZ, NOW())
FROM role_assignments ra
LEFT JOIN cities c ON
    (ra.scope_type = 'city' AND c.id = ra.scope_id)
    OR (ra.scope_type = 'region' AND c.region_id = ra.scope_id)
    OR (ra.scope_type = 'ministry_unit' AND c.ministry_unit_id = ra.scope_id)
    OR (ra.scope_type = 'organization' AND c.organization_id = ra.scope_id)
    OR (ra.scope_type = 'self' AND c.id = (SELECT city_id FROM users WHERE id = ra.user_id))
WHERE ra.status = 'active'
  AND (ra.role = 'admin' OR c.id IS NOT NULL)
ON CONFLICT DO NOTHING;

-- Users that predate role assignments still receive their former active role.
INSERT INTO user_roles (id, user_id, role, city_id, granted_by, granted_at)
SELECT 'urole-legacy-' || MD5(u.id || ':' || u.role),
       u.id,
       u.role,
       CASE WHEN u.role = 'admin' THEN NULL ELSE u.city_id END,
       NULL,
       COALESCE(u.activated_at, u.created_at)
FROM users u
WHERE u.account_status = 'active'
  AND u.role IN ('admin', 'pekerja', 'jemaat')
  AND (u.role = 'admin' OR u.city_id IS NOT NULL)
ON CONFLICT DO NOTHING;

CREATE TABLE account_invitations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_account_invitations_one_open
    ON account_invitations(user_id) WHERE used_at IS NULL AND revoked_at IS NULL;

CREATE TABLE consent_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('unknown', 'granted', 'revoked')),
    channels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    source TEXT NOT NULL DEFAULT '',
    purpose TEXT NOT NULL DEFAULT '',
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_consent_records_user_recorded ON consent_records(user_id, recorded_at DESC);

INSERT INTO consent_records (id, user_id, recorded_by, status, channels, source, purpose, recorded_at, created_at)
SELECT mch.id::TEXT,
       COALESCE(m.user_id, m.id),
       mch.actor_user_id,
       mch.consent_status,
       mch.communication_preferences,
       mch.source,
       mch.purpose,
       mch.recorded_at,
       mch.created_at
FROM member_consent_histories mch
JOIN members m ON m.id = mch.member_id;

INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id, scope_type, scope_id, outcome, metadata, created_at)
SELECT 'audit-profile-' || mh.id::TEXT,
       mh.actor_user_id,
       'profile.' || mh.change_type,
       'user',
       COALESCE(m.user_id, m.id),
       'city',
       m.city_id,
       'success',
       jsonb_build_object('field', mh.field_name, 'oldValue', mh.old_value, 'newValue', mh.new_value, 'reason', mh.reason),
       mh.created_at::TEXT
FROM member_histories mh
JOIN members m ON m.id = mh.member_id;

INSERT INTO audit_logs (id, action, resource_type, resource_id, scope_type, scope_id, outcome, metadata, created_at)
SELECT 'audit-dedupe-' || mdr.id::TEXT,
       'data_quality.duplicate_review_migrated',
       'user',
       COALESCE(m.user_id, m.id),
       'city',
       m.city_id,
       'success',
       jsonb_build_object('candidateMemberId', mdr.candidate_member_id, 'status', mdr.status, 'score', mdr.score, 'note', mdr.decision_note),
       mdr.created_at::TEXT
FROM member_duplicate_reviews mdr
JOIN members m ON m.id = mdr.member_id;

-- Remap journal and attendance references before dropping members.
ALTER TABLE jurnal_pas ADD COLUMN mentee_user_id TEXT;
UPDATE jurnal_pas j
SET mentee_user_id = COALESCE(m.user_id, m.id)
FROM members m
WHERE j.mentee_id = m.id;
ALTER TABLE jurnal_pas DROP CONSTRAINT IF EXISTS jurnal_pas_mentee_id_fkey;
ALTER TABLE jurnal_pas DROP COLUMN mentee_id;
ALTER TABLE jurnal_pas RENAME COLUMN mentee_user_id TO mentee_id;
ALTER TABLE jurnal_pas ADD CONSTRAINT jurnal_pas_mentee_id_fkey
    FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE attendance_checkins ADD COLUMN user_id TEXT;
UPDATE attendance_checkins ac
SET user_id = COALESCE(m.user_id, m.id)
FROM members m
WHERE ac.member_id = m.id;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM attendance_checkins WHERE user_id IS NULL) THEN
        RAISE EXCEPTION '000007 cannot remap attendance check-in without a user.';
    END IF;
END $$;
ALTER TABLE attendance_checkins DROP CONSTRAINT IF EXISTS attendance_checkins_member_id_fkey;
ALTER TABLE attendance_checkins DROP CONSTRAINT IF EXISTS attendance_checkins_city_id_fkey;
ALTER TABLE attendance_checkins DROP COLUMN member_id;
ALTER TABLE attendance_checkins DROP COLUMN city_id;
ALTER TABLE attendance_checkins RENAME COLUMN checked_in_by TO checked_in_by_user_id;
ALTER TABLE attendance_checkins ADD CONSTRAINT attendance_checkins_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE attendance_checkins RENAME TO event_attendances;
ALTER INDEX IF EXISTS idx_attendance_checkins_city RENAME TO idx_event_attendances_checked_in;

-- A revocation is evidence, not a row deletion. Session secrets remain hashed.
ALTER TABLE auth_sessions RENAME COLUMN token TO token_hash;
-- Legacy sessions stored raw bearer tokens. Hash them during the cutover so a
-- database read cannot be replayed; clients must establish a fresh cookie session.
UPDATE auth_sessions SET token_hash = ENCODE(DIGEST(token_hash, 'sha256'), 'hex');
ALTER TABLE auth_sessions ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at::TIMESTAMPTZ;
ALTER TABLE auth_sessions ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ;
ALTER TABLE auth_sessions ALTER COLUMN last_seen_at TYPE TIMESTAMPTZ USING NULLIF(last_seen_at, '')::TIMESTAMPTZ;
ALTER TABLE auth_sessions ALTER COLUMN revoked_at TYPE TIMESTAMPTZ USING NULLIF(revoked_at, '')::TIMESTAMPTZ;
ALTER TABLE auth_sessions ADD COLUMN revoked_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE auth_sessions ADD COLUMN revoke_reason TEXT;
ALTER TABLE auth_sessions ADD CONSTRAINT auth_sessions_token_hash_key UNIQUE(token_hash);
CREATE INDEX idx_auth_sessions_active_user ON auth_sessions(user_id, expires_at DESC)
    WHERE revoked_at IS NULL;

-- City is the only organizational scope. The counters and hierarchy FKs were copies
-- of information available from operational tables and are removed.
ALTER TABLE cities DROP COLUMN organization_id;
ALTER TABLE cities DROP COLUMN ministry_unit_id;
ALTER TABLE cities DROP COLUMN region_id;
ALTER TABLE cities DROP COLUMN workers_count;
ALTER TABLE cities DROP COLUMN members_count;
ALTER TABLE cities DROP COLUMN journals_count;
ALTER TABLE cities DROP COLUMN berita_count;
ALTER TABLE cities DROP COLUMN jurnal_pa_count;

ALTER TABLE users DROP COLUMN role;
ALTER TABLE users DROP COLUMN city_name;
DROP TABLE member_duplicate_reviews;
DROP TABLE member_consent_histories;
DROP TABLE member_histories;
DROP TABLE members;
DROP TABLE role_assignments;
DROP TABLE role_permissions;
DROP TABLE permissions;
DROP TABLE regions;
DROP TABLE ministry_units;
DROP TABLE organizations;
