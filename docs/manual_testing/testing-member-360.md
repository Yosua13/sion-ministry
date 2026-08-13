# Panduan Manual Testing: Member 360 & Data Governance

**Dokumen Acuan:** `docs/issues/03-member-360-data-governance.md`  
**Fitur / Scope:** Identitas Kanonis Member, Deduplikasi Data, Peninjauan Data Steward, Histori Pelayanan & Consent Append-Only, Masked Export, Versioning Optimistik  
**Status Implementasi:** `IMPLEMENTED`  
**Label:** `type:manual-testing`, `type:feature`, `priority:P0`, `area:backend`, `area:database`, `area:frontend`, `area:qa`

---

Dokumen ini adalah checklist UAT komprehensif untuk pengujian modul **Member 360**. Pengujian harus dilakukan pada staging atau database terisolasi. Jangan menjalankan script rollback atau override data pada lingkungan produksi.

---

## 1. Tujuan Pengujian

Manual testing ini bertujuan memastikan bahwa:
- Setiap anggota teridentifikasi secara unik melalui ID UUID, nomor telepon format E.164, dan email ter-normalisasi.
- Sistem mendeteksi potensi duplikat sebelum pembuatan/pembaruan profil dan memerlukan alasan minimal 10 karakter untuk override.
- Alur peninjauan *Data Steward* (`member_duplicate_reviews`) bekerja untuk mencatat keputusan penyelesaian duplikat.
- Setiap perubahan kota, mentor, kelompok, status, dan persetujuan (consent) dicatat secara *append-only* beserta identitas aktor.
- *Optimistic concurrency control* (`version`) mencegah *lost update* saat terjadi pembaruan bersamaan.
- Ekspor data CSV/XLSX selalu membatasi scope, memverifikasi alasan ekspor (minimal 10 karakter), mem-mask data sensitif, dan mencatat event audit.

---

## 2. Prasyarat Lingkungan Uji

1. Backend dan Frontend berjalan dengan `Migration 000006_add_member_360` telah diaplikasikan.
2. Memiliki akun dengan role berikut:
   - **Admin Organization** (akses penuh & audit log).
   - **Pekerja Kota A** & **Pekerja Kota B** (scope terisolasi).
   - **Auditor Kota A** (akses ter-masking untuk audit data).
   - **Jemaat A** (akses terautentikasi scope self).
3. Database PostgreSQL terisolasi untuk menguji migrasi dan script laporan duplikat (`scripts/member360-duplicate-report.ps1`).

---

## 3. Matriks Skenario Uji (Test Cases)

Metode Penilaian Status: `PASS`, `FAIL`, `BLOCKED`, atau `NOT RUN`.

| ID | Kategori | Nama Skenario | Langkah-Langkah Pengujian | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- | --- |
| M360-01 | Profil Baru | Create Member Valid | Pekerja A membuat profil anggota lengkap di Kota A via UI Member 360. | Profil berhasil dibuat; ID UUID v4 generated, phone E.164 (`+628...`), version 1, primary service point Kota A. | PASS |
| M360-02 | Validasi Field | Inline & Server Validation | Kosongkan field wajib (nama/phone/cityId/joinedDate). | UI menampilkan pesan kesalahan per field; manipulasi request API ditolak `400 Bad Request`. | PASS |
| M360-03 | Consent Rules | Persetujuan Komunikasi Mandatory | Pilih status consent `granted` tanpa menyertakan `source`, `purpose`, atau `communicationPreferences`. | Penyimpanan ditolak oleh server dengan pesan kesalahan validasi field consent. | PASS |
| M360-04 | Pagination | Server-Side Pagination | Buat lebih dari 12 profil anggota lalu gunakan tombol navigasi halaman. | Request Network membawa parameter `page` dan `pageSize`; server hanya mengembalikan item sesuai ukuran halaman. | PASS |
| M360-05 | Server Search | Pencarian Server-Side | Masukkan nama, nomor HP ter-normalisasi, atau email pada input pencarian. | Query `q` dikirim ke server; hasil yang dikembalikan tepat dan sesuai scope kota actor. | PASS |
| M360-06 | Isolasi Scope | Filter & Access Limit Scope | Pekerja Kota A mencoba memilih Kota B atau mengganti `cityId` pada query string API. | Data Kota B tidak tersedia / request API ditolak `403 Forbidden`; data tidak bocor. | PASS |
| M360-07 | Dedupe Phone | Deteksi Duplikat Nomor Telepon | Buat profil baru menggunakan nomor telepon yang sudah terdaftar. | Panel kandidat duplikat muncul sebelum create; phone & email kandidat disajikan dalam bentuk ter-masking. | PASS |
| M360-08 | Dedupe Email | Deteksi Duplikat Email Case-Insensitive | Buat/update profil menggunakan email normalized yang sama (misal `USER@Domain.com` vs `user@domain.com`). | Server merespons `409 Conflict` / menampilkan panel peninjauan duplikat. | PASS |
| M360-09 | Dedupe Nama | Deteksi Duplikat Nama + Kota | Masukkan nama anggota dengan variasi kapitalisasi/spasi pada kota yang sama. | Kandidat duplikat dengan skor kemiripan (misal 75%) muncul di UI. | PASS |
| M360-10 | Override Rule | Override Tanpa Alasan / Alasan Pendek | Lanjutkan pembuatan kandidat duplikat tanpa mengisi alasan atau alasan kurang dari 10 karakter. | Penyimpanan ditolak UI dan API dengan error *Reason must be at least 10 characters*. | PASS |
| M360-11 | Override Valid | Override Ber-Alasan Valid | Isi alasan override valid ("Data anggota terverifikasi beda orang meski nama mirip") lalu simpan. | Record berhasil dibuat; entri `member_duplicate_reviews` dibuat berstatus `pending` dan tercatat di audit. | PASS |
| M360-11A| Data Steward | Resolution Review Data Steward | Buka peninjauan duplikat pending sebagai Data Steward, lalu tetapkan keputusan `not_duplicate` dengan catatan. | Status review berubah menjadi `not_duplicate`, actor & timestamp tersimpan, dan event audit tercatat. | PASS |
| M360-12 | Concurrency | Optimistic Concurrency Control | Buka profil yang sama pada dua tab peramban. Simpan perubahan di Tab A, lalu simpan di Tab B tanpa reload. | Simpan pada Tab B ditolak karena `version` mismatch (`409 Conflict`); pengguna diminta memuat ulang data. | PASS |
| M360-13 | Histori Kota | Pencatatan Histori Perpindahan Kota | Pindahkan kota anggota dari Kota A ke Kota B oleh pengguna yang memiliki hak akses. | `member_histories` mencatat `old_city_id`, `new_city_id`, actor, dan timestamp. | PASS |
| M360-14 | Histori Mentor | Pencatatan Histori Mentor & Group | Ubah mentor pendamping atau kelompok anggota. | Entri histori append-only dibuat mencatat perubahan mentor/group beserta identitas actor. | PASS |
| M360-15 | Histori Consent | Log Persetujuan Append-Only | Ubah status consent dari `granted` menjadi `revoked`. | Entri `consent_records` baru dibuat append-only; entri lama tetap utuh untuk kebutuhan audit. | PASS |
| M360-16 | Masking Auditor | Tampilan Ter-Masking untuk Auditor | Login sebagai Auditor Kota A dan buka daftar/detail anggota. | Nomor HP dan email disajikan ter-masking (contoh: `+6281*****789`), detail sensitif disembunyikan. | PASS |
| M360-17 | Self Access | Akses Profil Sendiri oleh Jemaat | Login sebagai Jemaat A yang ditautkan dengan profil anggota A. | Jemaat hanya dapat melihat profil miliknya sendiri; profil orang lain tidak muncul/ditolak. | PASS |
| M360-18 | Audit Sensitivity| Log Read Data Non-Masked | Pekerja berwenang membuka detail anggota non-masked. | Event audit `member.sensitive.read` tercatat di log server. | PASS |
| M360-19 | Masked Export | Ekspor CSV/XLSX Ber-Alasan Valid | Pilih ekspor CSV, masukkan alasan valid (>10 karakter), lalu unduh. | Berkas CSV terunduh memuat data ter-masking sesuai scope aktif; audit log mencatat event ekspor & alasan. | PASS |
| M360-20 | Export Reject | Ekspor Tanpa Alasan Valid | Coba ekspor CSV dengan alasan kurang dari 10 karakter. | Request ditolak oleh server dengan HTTP `400 Bad Request`. | PASS |
| M360-21 | Archival Rule | Pengarsipan Anggota (Soft-Delete) | Arsipkan anggota dengan alasan pengarsipan yang valid (>10 karakter). | Anggota hilang dari list default; status menjadi `archived`, `retention_until` diatur +5 tahun. | PASS |
| M360-22 | Archive Reject | Pengarsipan Tanpa Alasan | Coba arsipkan anggota tanpa alasan. | Request ditolak; status anggota tetap aktif. | PASS |
| M360-23 | Retention Review| Peninjauan Data Terarsip | Lakukan pencarian data terarsip menggunakan filter khusus admin. | Data terarsip tetap tersedia untuk keperluan compliance/audit dan tidak terhapus permanen (*no hard delete*). | PASS |
| M360-24 | Offline Sync | Sinkronisasi Pembaruan Offline | Lakukan pembaruan profil saat offline, lalu trigger `POST /api/sync` dengan version valid. | Data berhasil disinkronkan ke server; deduplikasi, histori, dan version ter-update dengan benar. | PASS |
| M360-25 | Offline Archive| Sinkronisasi Pengarsipan Offline | Kirim request delete offline tanpa `archiveReason` lalu uji ulang dengan alasan valid. | Request tanpa alasan ditolak server sync; request dengan alasan berhasil diubah menjadi `archived`. | PASS |

---

## 4. Verifikasi Migrasi Database & Report Script

1. Eksekusi migrasi pada database staging:
   ```powershell
   # Verifikasi migrasi 000006
   docker compose --env-file backend/.env exec postgres psql -U sion_test -d sion_manual_test -c "SELECT version FROM schema_migrations;"
   ```
2. Jalankan script peninjauan duplikat:
   ```powershell
   ./scripts/member360-duplicate-report.ps1 -DatabaseUrl "postgres://sion_test:password@localhost:5432/sion_manual_test?sslmode=disable"
   ```
3. Pastikan output script mengonfirmasi `Kandidat kritis tanpa keputusan: 0` sebelum deployment dilanjutkan.

---

## 5. Lembar Persetujuan (Sign-Off Block)

| Peran | Nama Terang | Keputusan | Tanggal | Catatan / Bukti Pengujian |
| --- | --- | --- | --- | --- |
| **Product Owner** | Yosua | Setuju | 13/08/2026 | Approved |
| **Data Steward** | Yosua | Setuju | 13/08/2026 | Approved |
| **Pengurus Pusat** | Yosua | Setuju | 13/08/2026 | Approved |
| **Security / Engineering** | Yosua | Setuju | 13/08/2026 | Approved |

---
*Dokumen ini diterbitkan secara resmi untuk verifikasi kualitas dan tata kelola data Member 360 Sion Academy.*
