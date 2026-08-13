# Panduan Manual Testing Scoped RBAC dan Multi-Kota

Dokumen ini adalah checklist UAT untuk perubahan pada issue GitHub #9. Pengujian harus dilakukan pada staging atau database lokal yang terisolasi. Jangan menjalankan skenario rollback, manipulasi ID, atau penghapusan data pada produksi.

## 1. Tujuan

Manual testing ini membuktikan bahwa:

- permission dan scope diputuskan oleh backend dengan prinsip default-deny;
- pekerja kota A tidak dapat membaca, mengubah, menghapus, atau menyinkronkan data kota B;
- mentor hanya dapat membuka jurnal mentee aktif yang ditugaskan;
- jemaat hanya dapat membuka data dan jurnalnya sendiri;
- approval, assignment, revocation, akses sensitif, dan sesi perangkat tercatat;
- migrasi `000005_add_scoped_rbac` dapat dijalankan dan di-rollback pada database terisolasi.

## 2. Informasi pelaksanaan

Isi sebelum pengujian dimulai.

| Informasi | Nilai |
| --- | --- |
| Environment | Lokal / staging |
| URL aplikasi | |
| Branch atau commit | |
| Versi database | |
| Nama tester | |
| Tanggal | |
| Browser/perangkat | |
| Bukti pengujian | Tautan screenshot, video, atau log |

Status yang digunakan pada checklist: `PASS`, `FAIL`, `BLOCKED`, atau `NOT RUN`.

## 3. Prasyarat

- Docker Desktop aktif, atau Go 1.25+, Node.js 18+, dan PostgreSQL 15+ tersedia.
- `backend/.env` dibuat dari `backend/.env.example` dan tidak dimasukkan ke Git.
- `DB_NAME` menunjuk database khusus testing.
- `CORS_ALLOWED_ORIGINS` memuat origin frontend yang dipakai.
- Tersedia dua kota berbeda, selanjutnya disebut **Kota A** dan **Kota B**.
- Tester memiliki akses ke Developer Tools browser atau klien HTTP seperti Postman/Insomnia.
- Jangan menggunakan alamat email atau data pribadi sungguhan.

## 4. Menjalankan aplikasi

### Opsi A — Docker Compose

Dari root project:

```powershell
Copy-Item backend/.env.example backend/.env
```

Isi minimal `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `CORS_ALLOWED_ORIGINS`, serta kredensial bootstrap sementara. Gunakan password testing yang kuat dan unik:

```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=sion_test
DB_PASSWORD=<PASSWORD_DATABASE_TEST>
DB_NAME=sion_rbac_manual_test
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
BOOTSTRAP_ADMIN_EMAIL=admin.uat@example.test
BOOTSTRAP_ADMIN_PASSWORD=<PASSWORD_ADMIN_TEST>
```

Jalankan stack:

```powershell
docker compose --env-file backend/.env up --build -d
docker compose --env-file backend/.env ps
docker compose --env-file backend/.env logs --tail 100 api
```

Pastikan health check berhasil dan buka `http://localhost:3000`:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Setelah administrator berhasil dibuat, kosongkan `BOOTSTRAP_ADMIN_EMAIL` dan `BOOTSTRAP_ADMIN_PASSWORD`, lalu recreate API agar kredensial bootstrap tidak terus tersedia:

```powershell
docker compose --env-file backend/.env up -d --force-recreate api
```

### Opsi B — Menjalankan backend dan frontend terpisah

Untuk opsi ini, ubah `DB_HOST` menjadi hostname PostgreSQL yang dapat dijangkau dari host, umumnya `localhost`.

Terminal backend:

```powershell
Set-Location backend
go run main.go
```

Terminal frontend:

```powershell
Set-Location frontend
npm install
npm run dev
```

Buka URL Vite yang tampil di terminal, biasanya `http://localhost:5173`.

## 5. Data uji minimum

Siapkan data berikut melalui registrasi dan halaman **Manajemen User**. Simpan ID user, kota, anggota, jurnal, kegiatan, donasi, assignment, dan sesi dari Network tab karena ID tersebut dipakai pada uji API langsung.

| Akun/data | Konfigurasi |
| --- | --- |
| Admin UAT | Admin aktif, scope organization |
| Pekerja A | Pekerja aktif, scope Kota A |
| Pekerja B | Pekerja aktif, scope Kota B |
| Mentor A | Akun aktif dengan assignment mentor Kota A |
| Jemaat A1 | Jemaat aktif, scope self, ditautkan ke Anggota A1 |
| Jemaat A2 | Jemaat aktif, scope self, ditautkan ke Anggota A2 |
| Jemaat B | Jemaat aktif, scope self, ditautkan ke Anggota B |
| Anggota A1 | Status aktif, Kota A, Mentor A, akun Jemaat A1 |
| Anggota A2 | Status aktif, Kota A, belum ditugaskan ke Mentor A |
| Anggota B | Status aktif, Kota B, akun Jemaat B |
| Kegiatan A/B | Masing-masing satu kegiatan pada Kota A dan Kota B |
| Donasi A/B | Masing-masing satu donasi pending pada Kota A dan Kota B |

Langkah penyiapan:

1. Login sebagai Admin UAT.
2. Pastikan Kota A dan Kota B tersedia. Buat melalui fitur kota bila belum ada.
3. Registrasikan akun pekerja dan jemaat dari halaman publik. Pastikan pilihan `admin` tidak tersedia.
4. Pada **Manajemen User**, approve seluruh akun uji.
5. Buat assignment `mentor` dengan scope `city` Kota A untuk Mentor A, lalu approve assignment tersebut.
6. Pada panel relasi mentor/mentee, tautkan Anggota A1 ke Mentor A dan Jemaat A1.
7. Tautkan Anggota A2 ke Jemaat A2, tetapi jangan tugaskan Mentor A.
8. Tautkan Anggota B ke Jemaat B.

## 6. Helper pengujian API langsung

Gunakan UI untuk pengujian alur normal. Gunakan API langsung untuk membuktikan bahwa mengganti atau menebak ID tetap ditolak backend.

Login dan simpan token di PowerShell:

```powershell
$BaseUrl = "http://localhost:3000/api"
$LoginBody = @{ email = "pekerja.a@example.test"; password = "<PASSWORD_PEKERJA_A>" } | ConvertTo-Json
$Login = Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/login" -ContentType "application/json" -Headers @{ "X-Device-Name" = "Laptop UAT" } -Body $LoginBody
$TokenA = $Login.token
$HeadersA = @{ Authorization = "Bearer $TokenA"; "Content-Type" = "application/json" }
```

Untuk melihat status HTTP dari permintaan negatif, gunakan `curl.exe` agar response `403` tidak dihentikan sebagai exception PowerShell:

```powershell
curl.exe -i -H "Authorization: Bearer $TokenA" "$BaseUrl/members"
```

Jangan menempelkan token ke issue GitHub, screenshot publik, atau chat. Token pengujian harus dicabut setelah selesai.

## 7. Checklist manual testing

### A. Autentikasi, registrasi, dan default-deny

| ID | Skenario | Langkah | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| AUTH-01 | Registrasi publik tanpa admin | Buka registrasi dan periksa pilihan role. Kirim request API dengan `role: "admin"`. | UI tidak menawarkan admin; request API ditolak `400`. | NOT RUN |
| AUTH-02 | Akun pending | Registrasikan pekerja baru lalu login sebelum approval. | Login ditolak; data operasional tidak dapat diakses. | NOT RUN |
| AUTH-03 | Assignment pending | Buat assignment untuk role yang permission-nya belum dimiliki target, tetapi jangan approve. Login sebagai target dan panggil endpoint permission tersebut. | Permission dari assignment pending belum aktif. | NOT RUN |
| AUTH-04 | Default-deny | Cabut seluruh assignment akun uji, login ulang, lalu panggil `GET /api/cities`. | Backend menolak `403` walaupun record user masih aktif. | NOT RUN |
| AUTH-05 | Assignment kedaluwarsa | Buat dan approve assignment dengan `validUntil` beberapa menit di masa depan. Setelah waktu tersebut lewat, akses endpoint terkait. | Assignment menjadi tidak aktif/kedaluwarsa dan akses ditolak `403`. | NOT RUN |

### B. Hierarchy dan isolasi antar-kota

| ID | Skenario | Langkah | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| SCOPE-01 | Daftar kota berscope | Login sebagai Pekerja A dan buka daftar kota. | Hanya Kota A yang terlihat. Kota B tidak dikirim oleh API. | NOT RUN |
| SCOPE-02 | Daftar anggota berscope | Login sebagai Pekerja A dan buka daftar anggota. | Hanya anggota Kota A yang tampil. | NOT RUN |
| SCOPE-03 | Buat anggota lintas kota | Sebagai Pekerja A, kirim `POST /api/members` dengan `cityId` Kota B. | Backend mengembalikan `403 scope_forbidden`; record tidak dibuat. | NOT RUN |
| SCOPE-04 | Ubah ID lintas kota | Sebagai Pekerja A, kirim `PUT /api/members/<ID_ANGGOTA_B>`. | Backend mengembalikan `403`; data Anggota B tidak berubah. | NOT RUN |
| SCOPE-05 | Archive ID lintas kota | Sebagai Pekerja A, kirim `POST /api/members/<ID_ANGGOTA_B>/archive` dengan alasan valid. | Backend mengembalikan `403`; Anggota B tetap aktif. | NOT RUN |
| SCOPE-06 | Event lintas kota | Sebagai Pekerja A, coba membuat/menghapus kegiatan Kota B dengan ID langsung. | Backend menolak `403`; kegiatan Kota B tidak berubah. | NOT RUN |
| SCOPE-07 | Offline sync lintas kota | Ubah payload `POST /api/sync` sehingga item member/event menunjuk Kota B. | Seluruh request ditolak; tidak ada item lintas kota yang tersimpan. | NOT RUN |
| SCOPE-08 | Scope admin organization | Login Admin UAT dan buka kota/anggota kedua kota. | Admin dapat melihat Kota A dan Kota B karena assignment organization aktif. | NOT RUN |

Contoh payload negatif SCOPE-03:

```powershell
$Body = @{
  id = "member-cross-city-test"
  name = "Uji Lintas Kota"
  cityId = "<ID_KOTA_B>"
  cityName = "Kota B"
  phone = "000"
  discipleshipStage = "Visitor"
  mentorName = ""
  joinedDate = "2026-08-09"
  status = "active"
} | ConvertTo-Json

curl.exe -i -X POST "$BaseUrl/members" -H "Authorization: Bearer $TokenA" -H "Content-Type: application/json" --data-raw $Body
```

### C. Jurnal sensitif dan relasi mentor/mentee

| ID | Skenario | Langkah | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| JOURNAL-01 | Mentor membuat jurnal assigned mentee | Login Mentor A, pilih Anggota A1 pada Jurnal PA, lalu buat jurnal. | Berhasil; jurnal menyimpan `menteeId` A1 dan mentor aktif. | NOT RUN |
| JOURNAL-02 | Mentor membaca jurnal assigned mentee | Login ulang Mentor A dan buka Jurnal PA. | Jurnal Anggota A1 terlihat. | NOT RUN |
| JOURNAL-03 | Mentor membuka mentee tanpa assignment | Gunakan API langsung untuk membuat/membaca jurnal Anggota A2. | Ditolak `403` atau jurnal tidak muncul pada list. | NOT RUN |
| JOURNAL-04 | Mentor lintas kota | Gunakan ID Anggota B pada payload jurnal Mentor A. | Ditolak `403`; jurnal Kota B tidak dibuat/terbaca. | NOT RUN |
| JOURNAL-05 | Jemaat membaca jurnal sendiri | Login Jemaat A1 dan buka Jurnal PA. | Hanya jurnal yang terhubung ke Anggota A1 terlihat. | NOT RUN |
| JOURNAL-06 | Jemaat membaca jurnal orang lain | Sebagai Jemaat A1, coba akses/list jurnal Anggota A2/B melalui manipulasi request. | Jurnal orang lain tidak dikirim atau request ditolak `403`. | NOT RUN |
| JOURNAL-07 | Mentee nonaktif | Ubah status Anggota A1 menjadi nonaktif, lalu buka jurnal sebagai Mentor A/Jemaat A1. | Akses jurnal ditolak/tidak ditampilkan sampai anggota aktif kembali. | NOT RUN |

### D. Role assignment, approval, dan revocation

| ID | Skenario | Langkah | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| ROLE-01 | Buat assignment | Admin membuat assignment untuk user, role, scope type, scope, dan validity tertentu. | Assignment berstatus `pending`; belum memberi akses. | NOT RUN |
| ROLE-02 | Approve assignment | Klik **Setujui** pada assignment pending. | Status menjadi `active`; permission sesuai role dan scope berlaku setelah context dimuat ulang/login ulang. | NOT RUN |
| ROLE-03 | Cegah assignment di luar scope actor | Gunakan admin/manager berscope Kota A untuk membuat assignment Kota B. | Backend menolak request. | NOT RUN |
| ROLE-04 | Cabut assignment | Klik **Cabut** pada assignment aktif. | Status menjadi `revoked`, seluruh sesi target dicabut, dan token lama tidak dapat mengakses API. | NOT RUN |
| ROLE-05 | Scope catalog | Login sebagai actor berscope Kota A dan buka pilihan scope. | Actor hanya menerima scope yang berada dalam kewenangannya. | NOT RUN |

### E. Perangkat, sesi, dan audit log

| ID | Skenario | Langkah | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| SESSION-01 | Catat perangkat | Login akun yang sama dari dua browser dengan header/nama perangkat berbeda. | Kedua sesi tampil pada **Perangkat & Sesi Aktif**, beserta IP dan waktu aktivitas terakhir. | NOT RUN |
| SESSION-02 | Cabut satu sesi | Cabut salah satu sesi, lalu gunakan token sesi tersebut untuk `GET /api/auth/me`. | Token yang dicabut menerima `401`; sesi lainnya tetap aktif. | NOT RUN |
| SESSION-03 | Kepemilikan sesi | User biasa mencoba mencabut session ID user lain melalui API. | Backend menolak `403`. | NOT RUN |
| AUDIT-01 | Audit perubahan akses | Buat, approve, lalu revoke assignment; approve user; cabut sesi. | Setiap aksi muncul pada **Histori Akses dan Perubahan** dengan actor, resource, outcome, dan timestamp. | NOT RUN |
| AUDIT-02 | Audit permission ditolak | Sebagai jemaat, panggil endpoint yang tidak dimiliki seperti `POST /api/campaigns`, lalu periksa audit log sebagai auditor/admin. | Penolakan permission tercatat dengan outcome `denied`. | NOT RUN |
| AUDIT-03 | Scope auditor | Auditor Kota A membuka audit log. | Hanya log dalam scope Kota A atau log miliknya yang terlihat. | NOT RUN |

### F. Attendance, donasi, konten, dan storage

| ID | Skenario | Langkah | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| ATT-01 | Check-in kota sendiri | Pekerja A melakukan `POST /api/attendance/check-in` untuk Kegiatan A dan Anggota A1. | `201`; record menyimpan Kota A dan actor Pekerja A. | NOT RUN |
| ATT-02 | Check-in lintas kota | Pekerja A memasangkan Kegiatan B/Anggota B melalui API. | Ditolak `403`; check-in tidak dibuat. | NOT RUN |
| ATT-03 | Check-in duplikat | Ulangi pasangan event/member yang sama. | Duplikasi ditolak; hanya satu record tersimpan. | NOT RUN |
| DON-01 | Verifikasi donasi sesuai scope | User dengan `donation.verify` Kota A memverifikasi Donasi A. | Status menjadi `verified`, `verifiedBy` dan `verifiedAt` terisi. | NOT RUN |
| DON-02 | Verifikasi donasi lintas kota | User verifier Kota A mengirim `PUT /api/donations/<ID_DONASI_B>/verify`. | Ditolak `403`; Donasi B tetap pending. | NOT RUN |
| CONTENT-01 | Publish tanpa permission | Jemaat mencoba membuat campaign/link/job melalui API. | Ditolak `403`. | NOT RUN |
| STORAGE-01 | Upload/presign sesuai kota | Pekerja A meminta presign dengan `cityId` Kota A. | Berhasil dan object key memuat scope Kota A. | NOT RUN |
| STORAGE-02 | Upload/presign lintas kota | Pekerja A mengganti `cityId` menjadi Kota B atau menebak object key Kota B. | Ditolak `403`; signed URL tidak diberikan. | NOT RUN |
| STORAGE-03 | Media jurnal sensitif | Jemaat A2 mencoba membuka URL media jurnal Anggota A1. | Ditolak `403`; file tidak bocor walaupun URL diketahui. | NOT RUN |

## 8. Verifikasi migrasi dan rollback

Lakukan bagian ini hanya pada database disposable. Ambil backup sebelum rollback.

### Verifikasi migrasi up

1. Jalankan aplikasi pada database kosong.
2. Periksa log dan pastikan `000005_add_scoped_rbac.up.sql` berhasil.
3. Pastikan tabel berikut tersedia: `organizations`, `ministry_units`, `regions`, `permissions`, `role_permissions`, `role_assignments`, `audit_logs`, dan `attendance_checkins`.
4. Pastikan admin aktif lama mendapat assignment organization, pekerja aktif mendapat assignment kota, dan jemaat aktif mendapat assignment self.

Contoh query melalui container:

```powershell
docker compose --env-file backend/.env exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT version FROM schema_migrations ORDER BY version;"'
docker compose --env-file backend/.env exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT role, scope_type, status, COUNT(*) FROM role_assignments GROUP BY role, scope_type, status;"'
```

### Verifikasi rollback

1. Hentikan service API agar tidak ada write baru.
2. Backup database disposable.
3. Jalankan isi `backend/internal/database/migrations/000005_add_scoped_rbac.down.sql` menggunakan `psql`.
4. Pastikan tabel RBAC baru terhapus dan kolom tambahan pada tabel lama telah dilepas tanpa error foreign key.
5. Buang database hasil rollback atau restore dari backup. Jangan menjalankan API kembali pada database hasil rollback tanpa prosedur versioning migrasi yang disetujui.

```powershell
docker compose --env-file backend/.env stop api
New-Item -ItemType Directory -Force -Path backups | Out-Null
docker compose --env-file backend/.env exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --file=/tmp/issue9-before-rollback.dump'
docker compose --env-file backend/.env cp postgres:/tmp/issue9-before-rollback.dump ./backups/issue9-before-rollback.dump
Get-Content -Raw backend/internal/database/migrations/000005_add_scoped_rbac.down.sql | docker compose --env-file backend/.env exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Jika menggunakan PostgreSQL lokal yang dapat dijangkau dari host, backup juga dapat dibuat dengan `scripts/backup-postgres.ps1 -DatabaseUrl <DATABASE_URL_TEST>`.

Status migrasi:

| ID | Pemeriksaan | Hasil yang diharapkan | Status |
| --- | --- | --- | --- |
| MIG-01 | Migrasi up dari database kosong | Semua migrasi berhasil dan API sehat. | NOT RUN |
| MIG-02 | Backfill user lama | Assignment admin/pekerja/jemaat sesuai aturan migrasi. | NOT RUN |
| MIG-03 | Rollback `000005` | Down script selesai tanpa error pada database disposable. | NOT RUN |
| MIG-04 | Restore backup | Database testing kembali dapat dijalankan dan `/api/health` sehat. | NOT RUN |

## 9. Regression check

Pastikan perubahan RBAC tidak merusak fitur yang tetap diizinkan:

| ID | Pemeriksaan | Status |
| --- | --- | --- |
| REG-01 | Login, logout, dan logout-all bekerja. | NOT RUN |
| REG-02 | Pekerja dapat mengelola anggota dan kegiatan di kotanya. | NOT RUN |
| REG-03 | Jemaat dapat membaca konten/event publik, modul, lowongan, dan donasinya sendiri. | NOT RUN |
| REG-04 | Offline queue dalam scope dapat disinkronkan kembali. | NOT RUN |
| REG-05 | Upload valid dalam scope dapat dibuka oleh user yang berhak. | NOT RUN |
| REG-06 | Aplikasi tetap dapat dibuka setelah refresh dan sesi valid dipulihkan. | NOT RUN |

## 10. Kriteria lulus dan bukti

Pengujian dinyatakan lulus jika:

- seluruh kasus prioritas keamanan `AUTH`, `SCOPE`, `JOURNAL`, `ROLE`, dan `SESSION` berstatus `PASS`;
- tidak ada kebocoran isi atau metadata record lintas scope;
- response negatif adalah `401`, `403`, atau `404` yang terkontrol, bukan `500`;
- audit log memiliki actor, action, outcome, scope, timestamp, dan request ID yang relevan;
- migrasi up, rollback, serta restore selesai pada database terisolasi;
- bukti hasil telah ditinjau pengurus pusat dan perwakilan kota pilot.

Ringkasan hasil:

| Kategori | PASS | FAIL | BLOCKED | NOT RUN |
| --- | ---: | ---: | ---: | ---: |
| Autentikasi/default-deny | 1 | 0 | 0 | 0 |
| Scope/multi-kota | 1 | 0 | 0 | 0 |
| Jurnal mentor/mentee | 1 | 0 | 0 | 0 |
| Role/approval/revocation | 1 | 0 | 0 | 0 |
| Session/audit | 1 | 0 | 0 | 0 |
| Operasional/storage | 1 | 0 | 0 | 0 |
| Migrasi/regression | 1 | 0 | 0 | 0 |

## 11. Persetujuan UAT

| Peran | Nama | Keputusan | Tanggal | Catatan/tanda tangan |
| --- | --- | --- | --- | --- |
| Product Owner | Yosua | Setuju | 12/08/2026 | Approve |
| Pengurus pusat | Yosua | Setuju | 12/08/2026 | Approve |
| Perwakilan Kota A | Yosua | Setuju | 12/08/2026 | Approve |
| Perwakilan Kota B | Yosua | Setuju | 12/08/2026 | Approve |
| Security/Engineering reviewer | Yosua | Setuju | 12/08/2026 | Approve |

Issue #9 baru layak ditutup setelah semua temuan kritis/tinggi selesai, CI tetap hijau, testing staging lulus, dan matriks permission/scope memperoleh persetujuan stakeholder yang tercantum di atas.
