# Panduan Manual Testing: Identitas Tunggal, Undangan Akun, dan Scope Kota

Dokumen ini menguji migrasi `000007_simplify_identity_city_scope` dan alur anggota baru. Lakukan di database staging/disposable, bukan produksi, sampai backup/restore tervalidasi.

## Persiapan

1. Backup database dan buktikan restore-nya berhasil.
2. Pastikan semua row `members` lama memiliki `email`, kota, dan telepon yang valid, serta tidak ada email duplikat setelah normalisasi lowercase. Setiap akun legacy dengan role `jemaat` harus sudah terhubung ke member; assignment non-admin legacy juga harus dapat dipetakan ke tepat satu kota.
3. Isi `APP_PUBLIC_URL`, `INVITATION_TTL`, dan konfigurasi SMTP. Untuk development tanpa SMTP, URL aktivasi hanya muncul pada log API.
4. Jalankan backend dan periksa `schema_migrations`; versi `8` harus muncul hanya setelah migrasi selesai tanpa error.

## Migrasi dan integritas data

1. Sebelum menjalankan migrasi, buat satu member tanpa email di database disposable lalu jalankan aplikasi. Harapan: migrasi berhenti dengan error data steward; tidak ada skema setengah jadi karena migrasi berjalan dalam transaksi.
2. Perbaiki data, jalankan ulang aplikasi, lalu verifikasi bahwa tabel `members`, `member_histories`, `member_consent_histories`, `member_duplicate_reviews`, `organizations`, `ministry_units`, `regions`, `permissions`, `role_permissions`, dan `role_assignments` sudah tidak ada.
3. Verifikasi tabel target tersedia: `users`, `user_roles`, `account_invitations`, `consent_records`, `auth_sessions`, dan `event_attendances`.
4. Pilih member lama, pastikan ia menjadi tepat satu row `users` dengan `is_member=true`, `phone_e164`, `city_id`, dan `member_status` terisi. Pastikan tidak ada profil identitas kedua.
5. Pastikan user lama yang merupakan admin mempunyai `user_roles.role='admin'` dengan `city_id IS NULL`; pekerja/mentor mempunyai `city_id` yang sesuai.

## Undangan dan aktivasi

1. Login sebagai admin global atau pekerja yang memiliki permission `member.write` pada Kota A.
2. Buka **Daftar Jemaat**, pilih **Tambah**, isi nama, email unik, telepon, Kota A, serta data pemuridan, kemudian simpan.
3. Harapan: record baru muncul sebagai akun `invited`; email aktivasi terkirim. Password tidak pernah diisi oleh admin dan tidak muncul pada response/log.
4. Buka tautan aktivasi dalam mode private browser. Buat password minimal 12 karakter dan konfirmasi.
5. Harapan: user menjadi `active`, login otomatis memakai cookie, dan satu row `auth_sessions` dibuat dengan `token_hash` (bukan token mentah).
6. Kirim ulang undangan untuk akun lain lalu coba tautan lama. Harapan: tautan lama ditolak; tautan terbaru hanya dapat dipakai sekali.
7. Coba aktivasi paralel dari dua tab dengan token yang sama. Harapan: tepat satu request berhasil.

## Sesi, browser, dan proteksi CSRF

1. Setelah login, buka DevTools > Application > Local Storage. Harapan: tidak ada `sion_auth_session` atau token autentikasi.
2. Periksa cookie. Harapan: pada production cookie bernama `__Host-sion_session` dan memiliki `HttpOnly`, `Secure`, `Path=/`, `SameSite=Strict`. Pada development HTTP, namanya `sion_session` (tetap `HttpOnly` dan `SameSite=Strict`) karena browser menolak prefiks `__Host-` tanpa `Secure`. Cookie `sion_csrf` bukan HttpOnly dan dipakai hanya sebagai token anti-CSRF.
3. Lakukan perubahan profil atau logout melalui UI. Harapan: request membawa `X-CSRF-Token` dan berhasil.
4. Dengan cookie sesi yang sama, kirim `POST` dari origin yang tidak ada dalam `CORS_ALLOWED_ORIGINS` atau tanpa header CSRF. Harapan: `403 csrf_forbidden`.
5. Cabut salah satu sesi dari **Perangkat & Sesi Aktif**. Harapan: row tidak dihapus; `revoked_at`, `revoked_by`, dan `revoke_reason` terisi. Token sesi tersebut menerima `401`, sesi lain tetap berlaku.
6. Setelah migrasi, gunakan sesi login lama bila ada. Harapan: sesi tersebut tidak berlaku lagi karena token legacy di-hash saat cutover; login kembali untuk mendapat cookie sesi baru.

## Scope kota dan kehadiran

1. Berikan role pekerja Kota A kepada user uji melalui **Role Kota Baru**. Harapan: tidak ada pilihan organization, ministry unit, atau region.
2. Login sebagai pekerja Kota A. Pastikan list anggota hanya memuat Kota A dan tidak dapat membuat anggota pada Kota B melalui UI maupun request yang dimodifikasi.
3. Buat kegiatan lalu panggil check-in dengan payload `{"eventId":"...","userId":"..."}` untuk user anggota aktif Kota A. Harapan: satu row `event_attendances` berisi `event_id`, `user_id`, `checked_in_by_user_id`, dan waktu check-in.
4. Ulangi pasangan kegiatan-user yang sama. Harapan: ditolak karena kombinasi unik.
5. Coba check-in user Kota B untuk kegiatan Kota A. Harapan: ditolak; tidak ada row tambahan.

## Perintah verifikasi contoh

```powershell
Set-Location D:\project_yosua\sion-academy\backend
go test ./...

Set-Location ..\frontend
npm run build
```

Gunakan `docker compose --env-file backend/.env up --build` hanya bila Docker Desktop sudah berjalan. Untuk produksi, gunakan SMTP dan HTTPS sebelum mengaktifkan login.
