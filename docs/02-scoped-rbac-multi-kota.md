# P0: Implementasi multi-unit, multi-kota, dan authorization berbasis scope

**Labels:** `type:epic`, `type:feature`, `type:security`, `priority:P0`, `area:backend`, `area:database`, `area:frontend`, `area:qa`, `needs:stakeholder-decision`  
**Milestone:** `Fase 0 - Discovery & Hardening`  
**Estimasi:** 2-3 minggu  
**Dependencies:** Workshop role, unit, kota/service point, dan policy akses jurnal.

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

- [ ] Semua endpoint operasional memverifikasi role dan scope pada backend.
- [ ] Pekerja kota A tidak dapat membaca, mengubah, atau menebak record kota B.
- [ ] Mentor hanya membuka jurnal mentee yang ditugaskan; jemaat tidak membuka jurnal orang lain.
- [ ] Registrasi publik tidak menawarkan role admin; role internal ditetapkan user berwenang.
- [ ] Perubahan role, scope, approval, dan revokasi sesi tercatat.

## Definition of Done

- [ ] Matriks permission/scope disetujui pengurus pusat dan kota pilot.
- [ ] Migrasi schema serta script migrasi data awal mempunyai rollback.
- [ ] Semua endpoint lama yang relevan memakai policy baru.
- [ ] Integration test mencakup cross-city, self access, assigned mentor, dan forbidden case.
- [ ] Security review membuktikan tidak ada bypass melalui API langsung.
