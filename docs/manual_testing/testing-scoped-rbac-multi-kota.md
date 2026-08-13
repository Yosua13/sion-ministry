# Panduan Manual Testing: Scoped RBAC dan Multi-Kota

**Dokumen Acuan:** `docs/issues/02-scoped-rbac-multi-kota.md`  
**Fitur / Scope:** Authorization Berbasis Scope, Hierarchy Multi-Kota/Unit, Permission Matrix, Audit Access, Revokasi Perangkat Sesi  
**Status Implementasi:** `IMPLEMENTED`  
**Label:** `type:manual-testing`, `type:security`, `priority:P0`, `area:backend`, `area:database`, `area:frontend`, `area:qa`

---

Dokumen ini adalah checklist UAT komprehensif untuk pengujian fitur Scoped RBAC dan Multi-Kota. Pengujian harus dilakukan pada staging atau database lokal yang terisolasi. Jangan menjalankan skenario rollback, manipulasi ID, atau penghapusan data pada produksi.

## 1. Tujuan

Manual testing ini membuktikan bahwa:
- permission dan scope diputuskan oleh backend dengan prinsip default-deny;
- pekerja kota A tidak dapat membaca, mengubah, menghapus, atau menyinkronkan data kota B;
- mentor hanya dapat membuka jurnal mentee aktif yang ditugaskan;
- jemaat hanya dapat membuka data dan jurnalnya sendiri;
- approval, assignment, revocation, akses sensitif, dan sesi perangkat tercatat;
- migrasi `000005_add_scoped_rbac` dapat dijalankan dan di-rollback pada database terisolasi.

## 2. Informasi Pelaksanaan

Isi sebelum pengujian dimulai.

| Informasi | Nilai |
| --- | --- |
| Environment | Lokal / staging |
| URL aplikasi | http://localhost:3000 |
| Branch / Commit | `member-360` |
| Versi database | PostgreSQL 15+ (Migration 000005) |
| Nama tester | QA / Lead Dev |
| Tanggal | 13 Agustus 2026 |
| Browser/perangkat | Chrome / Firefox |
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

## 4. Menjalankan Aplikasi

### Opsi A — Docker Compose

Dari root project:

```powershell
Copy-Item backend/.env.example backend/.env
```

Isi minimal `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `CORS_ALLOWED_ORIGINS`, serta kredensial bootstrap sementara:

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

### Opsi B — Menjalankan Backend & Frontend Terpisah

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

## 5. Data Uji Minimum

Siapkan data berikut melalui registrasi dan halaman **Manajemen User**:

| Akun / Data | Konfigurasi |
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

## 6. Helper Pengujian API Langsung

Login dan simpan token di PowerShell:

```powershell
$BaseUrl = "http://localhost:3000/api"
$LoginBody = @{ email = "pekerja.a@example.test"; password = "<PASSWORD_PEKERJA_A>" } | ConvertTo-Json
$Login = Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/login" -ContentType "application/json" -Headers @{ "X-Device-Name" = "Laptop UAT" } -Body $LoginBody
$TokenA = $Login.token
```

Untuk pengujian negatif (misal mengharapkan `403 Forbidden`):

```powershell
curl.exe -i -H "Authorization: Bearer $TokenA" "$BaseUrl/members"
```

## 7. Checklist Manual Testing

### A. Autentikasi, Registrasi, dan Default-Deny

| ID | Skenario | Langkah | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| AUTH-01 | Registrasi publik tanpa admin | Buka registrasi dan periksa pilihan role. Kirim request API dengan `role: "admin"`. | UI tidak menawarkan admin; request API ditolak `400`. | PASS |
| AUTH-02 | Akun pending | Registrasikan pekerja baru lalu login sebelum approval. | Login ditolak; data operasional tidak dapat diakses. | PASS |
| AUTH-03 | Assignment pending | Buat assignment untuk role yang permission-nya belum dimiliki target, tetapi jangan approve. Login sebagai target dan panggil endpoint permission tersebut. | Permission dari assignment pending belum aktif. | PASS |
| AUTH-04 | Default-deny | Cabut seluruh assignment akun uji, login ulang, lalu panggil `GET /api/cities`. | Backend menolak `403` walaupun record user masih aktif. | PASS |
| AUTH-05 | Assignment kedaluwarsa | Buat dan approve assignment dengan `validUntil` beberapa menit di masa depan. Setelah waktu tersebut lewat, akses endpoint terkait. | Assignment menjadi tidak aktif/kedaluwarsa dan akses ditolak `403`. | PASS |

### B. Hierarchy dan Isolasi Antar-Kota

| ID | Skenario | Langkah | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| SCOPE-01 | Daftar kota berscope | Login sebagai Pekerja A dan buka daftar kota. | Hanya Kota A yang terlihat. Kota B tidak dikirim oleh API. | PASS |
| SCOPE-02 | Daftar anggota berscope | Login sebagai Pekerja A dan buka daftar anggota. | Hanya anggota Kota A yang tampil. | PASS |
| SCOPE-03 | Buat anggota lintas kota | Sebagai Pekerja A, kirim `POST /api/members` dengan `cityId` Kota B. | Backend mengembalikan `403 scope_forbidden`; record tidak dibuat. | PASS |
| SCOPE-04 | Ubah ID lintas kota | Sebagai Pekerja A, kirim `PUT /api/members/<ID_ANGGOTA_B>`. | Backend mengembalikan `403`; data Anggota B tidak berubah. | PASS |
| SCOPE-05 | Archive ID lintas kota | Sebagai Pekerja A, kirim `POST /api/members/<ID_ANGGOTA_B>/archive` dengan alasan valid. | Backend mengembalikan `403`; Anggota B tetap aktif. | PASS |
| SCOPE-06 | Event lintas kota | Sebagai Pekerja A, coba membuat/menghapus kegiatan Kota B dengan ID langsung. | Backend menolak `403`; kegiatan Kota B tidak berubah. | PASS |
| SCOPE-07 | Offline sync lintas kota | Ubah payload `POST /api/sync` sehingga item member/event menunjuk Kota B. | Seluruh request ditolak; tidak ada item lintas kota yang tersimpan. | PASS |
| SCOPE-08 | Scope admin organization | Login Admin UAT dan buka kota/anggota kedua kota. | Admin dapat melihat Kota A dan Kota B karena assignment organization aktif. | PASS |

### C. Jurnal Sensitif dan Relasi Mentor/Mentee

| ID | Skenario | Langkah | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| JOURNAL-01 | Mentor membuat jurnal assigned mentee | Login Mentor A, pilih Anggota A1 pada Jurnal PA, lalu buat jurnal. | Berhasil; jurnal menyimpan `menteeId` A1 dan mentor aktif. | PASS |
| JOURNAL-02 | Mentor membaca jurnal assigned mentee | Login ulang Mentor A dan buka Jurnal PA. | Jurnal Anggota A1 terlihat. | PASS |
| JOURNAL-03 | Mentor membuka mentee tanpa assignment | Gunakan API langsung untuk membuat/membaca jurnal Anggota A2. | Ditolak `403` atau jurnal tidak muncul pada list. | PASS |
| JOURNAL-04 | Mentor lintas kota | Gunakan ID Anggota B pada payload jurnal Mentor A. | Ditolak `403`; jurnal Kota B tidak dibuat/terbaca. | PASS |
| JOURNAL-05 | Jemaat membaca jurnal sendiri | Login Jemaat A1 dan buka Jurnal PA. | Hanya jurnal yang terhubung ke Anggota A1 terlihat. | PASS |
| JOURNAL-06 | Jemaat membaca jurnal orang lain | Sebagai Jemaat A1, coba akses/list jurnal Anggota A2/B melalui manipulasi request. | Jurnal orang lain tidak dikirim atau request ditolak `403`. | PASS |

### D. Role Assignment, Approval, dan Revocation

| ID | Skenario | Langkah | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| ROLE-01 | Buat assignment | Admin membuat assignment untuk user, role, scope type, scope, dan validity tertentu. | Assignment berstatus `pending`; belum memberi akses. | PASS |
| ROLE-02 | Approve assignment | Klik **Setujui** pada assignment pending. | Status menjadi `active`; permission sesuai role dan scope berlaku setelah context dimuat ulang/login ulang. | PASS |
| ROLE-03 | Cegah assignment di luar scope actor | Gunakan admin/manager berscope Kota A untuk membuat assignment Kota B. | Backend menolak request. | PASS |
| ROLE-04 | Cabut assignment | Klik **Cabut** pada assignment aktif. | Status menjadi `revoked`, seluruh sesi target dicabut, dan token lama tidak dapat mengakses API. | PASS |

### E. Perangkat, Sesi, dan Audit Log

| ID | Skenario | Langkah | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| SESSION-01 | Catat perangkat | Login akun yang sama dari dua browser dengan header/nama perangkat berbeda. | Kedua sesi tampil pada **Perangkat & Sesi Aktif**, beserta IP dan waktu aktivitas terakhir. | PASS |
| SESSION-02 | Cabut satu sesi | Cabut salah satu sesi, lalu gunakan token sesi tersebut untuk `GET /api/auth/me`. | Token yang dicabut menerima `401`; sesi lainnya tetap aktif. | PASS |
| SESSION-03 | Kepemilikan sesi | User biasa mencoba mencabut session ID user lain melalui API. | Backend menolak `403`. | PASS |
| AUDIT-01 | Audit perubahan akses | Buat, approve, lalu revoke assignment; approve user; cabut sesi. | Setiap aksi muncul pada **Histori Akses dan Perubahan** dengan actor, resource, outcome, dan timestamp. | PASS |
| AUDIT-02 | Audit permission ditolak | Sebagai jemaat, panggil endpoint yang tidak dimiliki seperti `POST /api/campaigns`, lalu periksa audit log sebagai auditor/admin. | Penolakan permission tercatat dengan outcome `denied`. | PASS |

## 8. Verifikasi Migrasi & Rollback

| ID | Pemeriksaan | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- |
| MIG-01 | Migrasi up dari database kosong | Semua migrasi berhasil (`000005_add_scoped_rbac.up.sql`) dan API sehat. | PASS |
| MIG-02 | Backfill user lama | Assignment admin/pekerja/jemaat sesuai aturan migrasi. | PASS |
| MIG-03 | Rollback `000005` | Down script `000005_add_scoped_rbac.down.sql` selesai tanpa error pada database disposable. | PASS |

## 9. Lembar Persetujuan (Sign-Off Block)

| Peran | Nama Terang | Keputusan | Tanggal | Catatan / Bukti Pengujian |
| --- | --- | --- | --- | --- |
| **Product Owner** | Yosua | Setuju | 13/08/2026 | Approved |
| **Pengurus Pusat** | Yosua | Setuju | 13/08/2026 | Approved |
| **Perwakilan Kota A** | Yosua | Setuju | 13/08/2026 | Approved |
| **Security / Engineering** | Yosua | Setuju | 13/08/2026 | Approved |

---
*Dokumen ini diterbitkan secara resmi untuk verifikasi kualitas dan otorisasi rilis Sion Academy.*
