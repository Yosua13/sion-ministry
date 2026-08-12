# P0: Implementasi multi-unit, multi-kota, dan authorization berbasis scope

**Labels:** `type:epic`, `type:feature`, `type:security`, `priority:P0`, `area:backend`, `area:database`, `area:frontend`, `area:qa`, `needs:stakeholder-decision`  
**Milestone:** `Fase 0 - Discovery & Hardening`  
**Estimasi:** 2-3 minggu  
**Dependencies:** Workshop role, unit, kota/service point, dan policy akses jurnal.

## Keputusan implementasi

Hierarchy disimpan sebagai `organizations -> ministry_units -> regions -> cities`. Migrasi menyediakan master awal `Sion Ministry -> Sion Academy -> Indonesia`, lalu menghubungkan kota lama ke hierarchy tersebut. `role_assignments` adalah sumber kebenaran authorization dan menyimpan role, jenis scope, ID scope, status, masa berlaku, approver, waktu approval, serta waktu revocation.

Policy backend bersifat default-deny. User aktif tanpa assignment aktif tetap menerima `403`. Middleware permission dijalankan pada seluruh endpoint operasional, sedangkan handler memfilter record dan memvalidasi resource ID maupun payload berdasarkan scope. UI hanya membantu navigasi; keputusan terakhir selalu berada di backend.

Data lama dimigrasikan dengan aturan berikut:

- Admin aktif mendapat assignment `admin` pada organisasi Sion Ministry.
- Pekerja aktif yang memiliki `city_id` mendapat assignment `pekerja` pada kota tersebut.
- Jemaat aktif mendapat assignment `jemaat` dengan scope `self`.
- Jurnal lama tanpa `mentee_id` dan `mentor_user_id` tidak otomatis dibuka kepada jemaat/mentor. Admin harus menautkan akun anggota dan mentor melalui UI agar tidak terjadi pencocokan nama yang tidak aman.

## Matriks permission minimum

| Role assignment | Scope umum | Permission utama |
| --- | --- | --- |
| `admin` | organization/unit/region/city | seluruh permission di dalam scope |
| `pekerja` | city | member read/write, jurnal mentee aktif, event manage, attendance check-in, donation verify, upload, sync |
| `mentor` | city | member read, jurnal mentee aktif, konten, upload, AI |
| `jemaat` | self | data dan jurnal sendiri, konten/event publik, donasi sendiri, lamaran sendiri, modul, AI |
| `content_publisher` | organization/unit/region/city | content publish, event manage, job/module publish |
| `donation_verifier` | organization/unit/region/city | donation read/verify |
| `auditor` | organization/unit/region/city | audit read |

Permission tersimpan sebagai master `permissions` dan `role_permissions`. Scope organisasi, unit, dan region diuraikan menjadi daftar kota yang sah. Assignment di luar kewenangan actor, object key S3 kota lain, media lokal yang tidak terkait record sah, ID record lintas kota, dan item offline sync lintas kota ditolak.

## Operasional admin

Halaman **Manajemen User** menyediakan approval akun beserta scope awal, pembuatan/approval/revocation role assignment, penautan akun anggota dengan mentor, daftar perangkat/sesi aktif, pencabutan sesi, dan histori audit. Revocation assignment juga mencabut seluruh sesi user terkait agar permission lama tidak tetap dapat digunakan.

Endpoint utama:

- `GET/POST/PUT/DELETE /api/auth/role-assignments`
- `POST /api/auth/mentorships`
- `GET /api/auth/scopes`
- `GET /api/auth/audit-logs`
- `GET/DELETE /api/auth/sessions`
- `GET/POST /api/attendance`
- `PUT /api/donations/:id/verify`

Migration `000005_add_scoped_rbac.up.sql` dan rollback `000005_add_scoped_rbac.down.sql` mencakup hierarchy, assignment, permission, audit, session device, relasi mentor/mentee, attendance, serta scope donasi dan lamaran. Integration test menggunakan PostgreSQL terisolasi dan membuktikan cross-city denial, self access, assigned mentor, unassigned mentor denial, serta default-deny tanpa assignment.

Panduan eksekusi UAT, data uji, expected result, pengujian API langsung, dan lembar persetujuan tersedia di [Panduan Manual Testing Scoped RBAC dan Multi-Kota](testing-scoped-rbac-multi-kota.md).

## Mengapa

Role global `admin`, `pekerja`, dan `jemaat` belum mencegah akses data lintas kota atau jurnal sensitif. Role menentukan aksi; scope menentukan record mana yang boleh diakses. Keduanya wajib diterapkan pada backend.

## Ruang Lingkup

- Hierarchy `organization -> ministry unit -> region -> city/service point` dan master data.
- `role_assignments` berisi role, scope, masa berlaku, status, dan approver.
- Permission minimum: member read/write, journal sensitive read, event manage, attendance check-in, donation verify, content publish, audit read.
- Policy backend default-deny untuk seluruh query/command; frontend hanya menyembunyikan navigasi sebagai UX.
- Jemaat hanya membaca data sendiri/konten publik; mentor hanya jurnal mentee aktif; hapus akses jurnal global jemaat.
- UI admin untuk assignment, approval, scope, perangkat, dan histori akses.

## Acceptance Criteria

- [x] Semua endpoint operasional memverifikasi permission dan scope pada backend.
- [x] Pekerja kota A tidak dapat membaca, mengubah, menyinkronkan, mengunduh media, atau menebak record kota B.
- [x] Mentor hanya membuka jurnal mentee aktif yang ditugaskan; jemaat hanya membuka jurnal miliknya sendiri.
- [x] Registrasi publik tidak menawarkan role admin; role internal ditetapkan dan disetujui user berwenang.
- [x] Perubahan role, scope, approval, mentorship, akses sensitif, dan revokasi sesi tercatat.

## Definition of Done

- [ ] Matriks permission/scope disetujui pengurus pusat dan kota pilot.
- [x] Migrasi schema serta script migrasi data awal mempunyai rollback yang telah dieksekusi pada database terisolasi.
- [x] Semua endpoint lama yang relevan memakai policy baru; endpoint self-session juga memverifikasi kepemilikan target.
- [x] Integration test mencakup cross-city, self access, assigned mentor, unassigned mentor, dan default-deny.
- [x] Security review mencakup API langsung, offline sync, local upload, signed object key, assignment, approval, dan revokasi perangkat.
