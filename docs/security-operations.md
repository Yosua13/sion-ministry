# Dasar keamanan dan operasional

## Model ancaman dan keputusan

Sistem memproses data anggota, jurnal, donasi, dan pelamar. Ancaman utama mencakup kebocoran kredensial, akun bawaan yang dapat diakses publik, origin browser yang disusupi, serangan brute-force pada autentikasi, unggahan tanpa pembatasan, serta data PostgreSQL yang tidak tersedia atau tidak dapat dipulihkan.

Autentikasi bersifat *server-authoritative*: browser hanya menyimpan sesi bearer yang diterbitkan server dan tidak dapat membuat akun lokal/offline. Penyimpanan server hanya berisi digest SHA-256 dari token sesi, bukan token bearer yang dapat digunakan. Sesi berakhir sesuai `SESSION_TTL` (bawaan `24h`); `POST /api/auth/logout` mencabut sesi pada perangkat aktif dan `POST /api/auth/logout-all` mencabut seluruh sesi untuk akun yang sedang terautentikasi. Sesi prototype serta administrator prototype yang dikenal dihapus oleh migrasi `000004`.

Administrator pertama hanya dibuat ketika `BOOTSTRAP_ADMIN_EMAIL` dan `BOOTSTRAP_ADMIN_PASSWORD` sama-sama diinjeksi oleh secret manager deployment. Password harus memiliki minimal 12 karakter. Hapus kedua variabel segera setelah akun dibuat; pendaftaran publik tidak pernah menerima role `admin`.

## Konfigurasi runtime yang wajib

Isi setiap nilai `DB_*`, `CORS_ALLOWED_ORIGINS`, dan secret produksi melalui secret manager deployment. `CORS_ALLOWED_ORIGINS` adalah allowlist origin eksplisit yang dipisahkan koma; nilai `*` ditolak. Jangan pernah menaruh kredensial, token, atau API key di variabel `VITE_*`, file repository, maupun artefak build.

Setiap request menerima `X-Request-ID`, log akses JSON terstruktur, secure header restriktif, serta objek error standar berisi `code`, `message`, dan `requestId` untuk kegagalan yang berasal dari middleware. Endpoint autentikasi, AI, dan laporan yang memuat gambar memiliki rate limit dalam memori. Deployment dengan lebih dari satu replika API harus mengganti limiter ini dengan penyimpanan bersama yang kompatibel dengan Redis.

Jika `SENTRY_DSN` diatur, error server yang telah disanitasi juga dikirim ke Sentry dengan tag request ID dan path. Jangan mengirimkan body request, token, atau data anggota ke error-monitoring provider. Tanpa DSN, aplikasi hanya menggunakan structured log lokal.

## Unggahan dan object storage

Unggahan gambar saat ini hanya menerima PNG/JPEG base64, memvalidasi ukuran hasil decode (maksimum 5 MB), MIME/tipe sebenarnya, dan dimensi (maksimum 4096×4096) sebelum direktori atau berkas dibuat. Nama berkas berasal dari checksum SHA-256, dan media unggahan memerlukan autentikasi untuk diakses.

Untuk object storage produksi, gunakan bucket privat yang kompatibel dengan S3, enkripsi sisi server, object key dari checksum, serta signed URL unggah/unduh yang berumur pendek. Verifikasi checksum setelah unggah dan simpan hanya metadata/object key—bukan URL bucket publik. Pemindaian malware dan lifecycle policy wajib tersedia sebelum unggah langsung dari klien diaktifkan.

Atur `S3_BUCKET`, `S3_REGION`, dan kredensial AWS/workload identity untuk mengaktifkan storage. Untuk MinIO atau provider kompatibel lainnya, atur juga `S3_ENDPOINT` dan biasanya `S3_USE_PATH_STYLE=true`. Endpoint terautentikasi `POST /api/uploads/presign` menerima `contentType`, `size`, dan checksum `sha256` untuk membuat signed upload URL; `GET /api/uploads/signed?key=<objectKey>` membuat signed download URL. URL hanya berlaku selama `S3_SIGNED_URL_TTL` (maksimum satu jam), wajib menggunakan header yang dikembalikan, dan bucket tidak boleh publik.

## Drill backup dan restore

1. Jalankan `pg_dump --format=custom` terenkripsi setiap hari dari database produksi ke bucket terpisah dengan kontrol akses; simpan backup sesuai kebijakan retensi yang disetujui.
2. Minimal setiap bulan, pulihkan backup terbaru ke database staging terisolasi menggunakan `pg_restore --clean --if-exists`.
3. Jalankan API dengan database hasil restore, periksa `/api/health`, lalu minta pemilik data memverifikasi sampel data anggota, jurnal, dan donasi.
4. Catat waktu backup, durasi restore, checksum, operator, hasil, serta tindakan korektif pada log insiden.

Jangan menandai kriteria penerimaan restore produksi selesai sebelum drill ini dilakukan dan disetujui di staging.

Script PowerShell tersedia di `scripts/backup-postgres.ps1` dan `scripts/restore-postgres.ps1`. Restore selalu mensyaratkan flag `-AllowDestructiveRestore` agar tidak dilakukan tanpa konfirmasi eksplisit.

## Menjalankan dengan Docker

Salin `backend/.env.example` menjadi `backend/.env`, lalu isi paling tidak `DB_USER`, `DB_PASSWORD`, `DB_NAME`, dan `CORS_ALLOWED_ORIGINS`. Tidak ada nilai kredensial bawaan di Compose. Setelah Docker Desktop aktif, jalankan `docker compose --env-file backend/.env up --build`. API tersedia di `http://localhost:3000/api/health`; hentikan layanan dengan `docker compose --env-file backend/.env down`. Tambahkan `-v` hanya jika volume database lokal memang ingin dihapus.

## Checklist rotasi secret

- Rotasi seluruh secret yang pernah digunakan pada environment prototype, termasuk password database, key Gemini, dan password bootstrap.
- Perbarui secret manager deployment, deploy ulang, lalu cabut nilai lama pada providernya.
- Hapus `BOOTSTRAP_ADMIN_*` setelah pemakaian awal; cabut sesi aktif jika kredensial administrator diduga bocor.
- Tinjau peringatan secret scanning repository dan hasil CI sebelum merge.
- Konfigurasikan job `CI / validate` dan `CI / secret-scan` sebagai required status checks pada branch `main` yang diproteksi; workflow saja tidak dapat memblokir merge.
