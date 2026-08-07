# P0: Hardening security dan fondasi delivery sebelum pilot

**Labels:** `type:epic`, `type:security`, `type:technical-debt`, `priority:P0`, `area:backend`, `area:frontend`, `area:infra`, `area:qa`  
**Milestone:** `Fase 0 - Discovery & Hardening`  
**Estimasi:** 2-3 minggu  
**Dependencies:** Keputusan mode sesi dan environment deployment.

## Mengapa

Sistem memproses data anggota, jurnal, donasi, dan lamaran. Fondasi keamanan, upload, CI, observability, serta backup harus siap sebelum pilot agar data tidak bocor dan insiden dapat ditangani.

## Ruang Lingkup

- Rotasi secret, hapus secret dari repository, secret scanning, dan `.env.example` tanpa nilai rahasia.
- Hapus fallback login/kredensial lokal dari production; sesi server mendukung expiry, logout, dan revokasi perangkat.
- CORS allowlist, secure headers, rate limit auth/AI/upload, serta model error API yang konsisten.
- Validasi MIME, ukuran, dimensi, checksum, dan pesan error upload; desain object storage S3-compatible dengan signed URL.
- Docker, CI lint/build/test/migration/scan, staging, structured log request ID, error monitoring, backup/restore runbook.
- Automated test minimum untuk auth, policy negatif, dan upload validation.

## Acceptance Criteria

- [x] Tidak ada password, token, API key, atau akun default yang dapat digunakan dari repository/frontend.
- [x] Alur login, register, approval, logout, expiry, dan revocation diuji untuk kondisi sukses maupun gagal.
- [x] Origin di luar allowlist dan upload invalid ditolak; berkas tidak disimpan sebelum lolos validasi.
- [ ] CI menjalankan lint, build, test, migrasi, dan security scan; pemblokiran merge masih perlu diaktifkan sebagai required status check di GitHub.
- [ ] Backup dan restore database berhasil dibuktikan di staging.

## Definition of Done

- [ ] Threat model, konfigurasi environment, dan daftar secret rotation disetujui.
- [x] Konfigurasi keamanan terdokumentasi dan hanya memakai environment variable.
- [x] Dockerfile dan Compose untuk membangun aplikasi dari clone bersih tersedia (perlu eksekusi pada runner/host dengan Docker daemon).
- [x] Automated negative test auth/upload tersedia; restore drill masih menunggu staging.
- [ ] Tidak ada temuan security kritis/tinggi terbuka tanpa mitigasi yang diterima Product Owner.
