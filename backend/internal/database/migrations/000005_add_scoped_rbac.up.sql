CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ministry_units (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS regions (
    id TEXT PRIMARY KEY,
    ministry_unit_id TEXT NOT NULL REFERENCES ministry_units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT NOT NULL
);

INSERT INTO organizations (id, name, created_at)
VALUES ('org-sion-ministry', 'Sion Ministry', NOW()::TEXT)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ministry_units (id, organization_id, name, created_at)
VALUES ('unit-sion-academy', 'org-sion-ministry', 'Sion Academy', NOW()::TEXT)
ON CONFLICT (id) DO NOTHING;

INSERT INTO regions (id, ministry_unit_id, name, created_at)
VALUES ('region-indonesia', 'unit-sion-academy', 'Indonesia', NOW()::TEXT)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE cities ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE RESTRICT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS ministry_unit_id TEXT REFERENCES ministry_units(id) ON DELETE RESTRICT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS region_id TEXT REFERENCES regions(id) ON DELETE RESTRICT;
UPDATE cities SET
    organization_id = COALESCE(organization_id, 'org-sion-ministry'),
    ministry_unit_id = COALESCE(ministry_unit_id, 'unit-sion-academy'),
    region_id = COALESCE(region_id, 'region-indonesia');
ALTER TABLE cities ALTER COLUMN organization_id SET DEFAULT 'org-sion-ministry';
ALTER TABLE cities ALTER COLUMN ministry_unit_id SET DEFAULT 'unit-sion-academy';
ALTER TABLE cities ALTER COLUMN region_id SET DEFAULT 'region-indonesia';

ALTER TABLE members ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS mentor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_mentor_user_id ON members(mentor_user_id);

ALTER TABLE jurnal_pas ADD COLUMN IF NOT EXISTS mentee_id TEXT REFERENCES members(id) ON DELETE SET NULL;
ALTER TABLE jurnal_pas ADD COLUMN IF NOT EXISTS mentor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_jurnal_pas_mentee_id ON jurnal_pas(mentee_id);
CREATE INDEX IF NOT EXISTS idx_jurnal_pas_mentor_user_id ON jurnal_pas(mentor_user_id);

ALTER TABLE berita_acaras ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE donation_records ADD COLUMN IF NOT EXISTS city_id TEXT REFERENCES cities(id) ON DELETE SET NULL;
ALTER TABLE donation_records ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE donation_records ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected'));
ALTER TABLE donation_records ADD COLUMN IF NOT EXISTS verified_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE donation_records ADD COLUMN IF NOT EXISTS verified_at TEXT;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS city_id TEXT REFERENCES cities(id) ON DELETE SET NULL;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS device_name TEXT;
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS last_seen_at TEXT;
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS revoked_at TEXT;
UPDATE auth_sessions SET id = 'ses-' || MD5(token) WHERE id IS NULL OR id = '';
ALTER TABLE auth_sessions ALTER COLUMN id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_sessions_id ON auth_sessions(id);

CREATE TABLE IF NOT EXISTS permissions (
    code TEXT PRIMARY KEY,
    description TEXT NOT NULL
);

INSERT INTO permissions (code, description) VALUES
    ('user.manage', 'Mengelola dan menyetujui pengguna'),
    ('assignment.manage', 'Mengelola role dan scope'),
    ('audit.read', 'Membaca audit log'),
    ('city.read', 'Membaca master kota sesuai scope'),
    ('city.manage', 'Mengelola hierarchy dan kota'),
    ('member.read', 'Membaca data anggota sesuai scope'),
    ('member.write', 'Membuat dan mengubah anggota sesuai scope'),
    ('member.delete', 'Menghapus anggota sesuai scope'),
    ('journal.sensitive.read', 'Membaca jurnal sensitif sesuai relasi'),
    ('journal.write', 'Membuat jurnal untuk mentee aktif'),
    ('journal.delete', 'Menghapus jurnal sesuai scope'),
    ('event.read', 'Membaca berita acara sesuai scope atau publik'),
    ('event.manage', 'Mengelola berita acara sesuai scope'),
    ('event.delete', 'Menghapus berita acara sesuai scope'),
    ('attendance.check_in', 'Mencatat kehadiran kegiatan'),
    ('donation.read', 'Membaca kampanye dan donasi sesuai scope'),
    ('donation.create', 'Mencatat donasi milik sendiri'),
    ('donation.verify', 'Memverifikasi donasi sesuai scope'),
    ('content.read', 'Membaca konten publik'),
    ('content.publish', 'Menerbitkan konten global'),
    ('job.read', 'Membaca lowongan publik'),
    ('job.apply', 'Mengirim lamaran milik sendiri'),
    ('application.read', 'Membaca lamaran sesuai scope'),
    ('module.read', 'Membaca modul pembelajaran'),
    ('module.publish', 'Mengubah modul pembelajaran'),
    ('upload.write', 'Mengunggah media'),
    ('ai.use', 'Menggunakan asisten AI'),
    ('sync.write', 'Mengirim sinkronisasi berscope')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS role_permissions (
    role TEXT NOT NULL,
    permission_code TEXT NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
    PRIMARY KEY (role, permission_code)
);

INSERT INTO role_permissions (role, permission_code)
SELECT 'admin', code FROM permissions
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_code) VALUES
    ('pekerja', 'city.read'), ('pekerja', 'member.read'), ('pekerja', 'member.write'),
    ('pekerja', 'journal.sensitive.read'), ('pekerja', 'journal.write'),
    ('pekerja', 'event.read'), ('pekerja', 'event.manage'), ('pekerja', 'attendance.check_in'),
    ('pekerja', 'donation.read'), ('pekerja', 'donation.verify'), ('pekerja', 'content.read'),
    ('pekerja', 'job.read'), ('pekerja', 'application.read'), ('pekerja', 'upload.write'),
    ('pekerja', 'module.read'), ('pekerja', 'ai.use'), ('pekerja', 'sync.write'),
    ('mentor', 'city.read'), ('mentor', 'member.read'), ('mentor', 'journal.sensitive.read'),
    ('mentor', 'journal.write'), ('mentor', 'event.read'), ('mentor', 'content.read'),
    ('mentor', 'job.read'), ('mentor', 'module.read'), ('mentor', 'upload.write'), ('mentor', 'ai.use'),
    ('jemaat', 'city.read'), ('jemaat', 'member.read'), ('jemaat', 'journal.sensitive.read'),
    ('jemaat', 'event.read'), ('jemaat', 'donation.read'), ('jemaat', 'donation.create'),
    ('jemaat', 'content.read'), ('jemaat', 'job.read'), ('jemaat', 'job.apply'), ('jemaat', 'application.read'),
    ('jemaat', 'module.read'), ('jemaat', 'ai.use'),
    ('content_publisher', 'content.read'), ('content_publisher', 'content.publish'),
    ('content_publisher', 'event.read'), ('content_publisher', 'event.manage'),
    ('content_publisher', 'job.read'), ('content_publisher', 'module.read'),
    ('content_publisher', 'module.publish'), ('content_publisher', 'upload.write'),
    ('auditor', 'audit.read'), ('auditor', 'city.read'),
    ('donation_verifier', 'city.read'), ('donation_verifier', 'donation.read'),
    ('donation_verifier', 'donation.verify')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS role_assignments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    scope_type TEXT NOT NULL CHECK (scope_type IN ('organization', 'ministry_unit', 'region', 'city', 'self')),
    scope_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked', 'expired')),
    valid_from TEXT NOT NULL,
    valid_until TEXT,
    approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TEXT,
    revoked_at TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_role_assignments_user_status ON role_assignments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_role_assignments_scope ON role_assignments(scope_type, scope_id);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    scope_type TEXT,
    scope_id TEXT,
    outcome TEXT NOT NULL CHECK (outcome IN ('success', 'denied', 'failure')),
    request_id TEXT,
    ip_address TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON audit_logs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

CREATE TABLE IF NOT EXISTS attendance_checkins (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES berita_acaras(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    checked_in_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    checked_in_at TEXT NOT NULL,
    UNIQUE (event_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_attendance_checkins_city ON attendance_checkins(city_id, checked_in_at DESC);

INSERT INTO role_assignments (id, user_id, role, scope_type, scope_id, status, valid_from, approved_by, approved_at, created_at)
SELECT 'ra-' || MD5(u.id || ':admin:organization'), u.id, 'admin', 'organization', 'org-sion-ministry', 'active',
       u.created_at, u.id, COALESCE(NULLIF(u.approved_at, ''), u.created_at), u.created_at
FROM users u WHERE u.role = 'admin' AND u.status = 'active'
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_assignments (id, user_id, role, scope_type, scope_id, status, valid_from, approved_by, approved_at, created_at)
SELECT 'ra-' || MD5(u.id || ':pekerja:' || u.city_id), u.id, 'pekerja', 'city', u.city_id, 'active',
       u.created_at, NULL, COALESCE(NULLIF(u.approved_at, ''), u.created_at), u.created_at
FROM users u WHERE u.role = 'pekerja' AND u.status = 'active' AND u.city_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_assignments (id, user_id, role, scope_type, scope_id, status, valid_from, approved_by, approved_at, created_at)
SELECT 'ra-' || MD5(u.id || ':jemaat:self'), u.id, 'jemaat', 'self', u.id, 'active',
       u.created_at, NULL, COALESCE(NULLIF(u.approved_at, ''), u.created_at), u.created_at
FROM users u WHERE u.role = 'jemaat' AND u.status = 'active'
ON CONFLICT (id) DO NOTHING;
