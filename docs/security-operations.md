# Dasar keamanan dan operasional

## Model ancaman dan keputusan

Sistem memproses data anggota, jurnal, donasi, dan pelamar. Ancaman utama mencakup kebocoran kredensial, akun bawaan yang dapat diakses publik, origin browser yang disusupi, serangan brute-force pada autentikasi, unggahan tanpa pembatasan, serta data PostgreSQL yang tidak tersedia atau tidak dapat dipulihkan.

Autentikasi bersifat *server-authoritative*: browser hanya menyimpan sesi bearer yang diterbitkan server dan tidak dapat membuat akun lokal/offline. Penyimpanan server hanya berisi digest SHA-256 dari token sesi, bukan token bearer yang dapat digunakan. Sesi berakhir sesuai `SESSION_TTL` (bawaan `24h`); `POST /api/auth/logout` mencabut sesi pada perangkat aktif dan `POST /api/auth/logout-all` mencabut seluruh sesi untuk akun yang sedang terautentikasi. Sesi prototype serta administrator prototype yang dikenal dihapus oleh migrasi `000004`.

Administrator pertama hanya dibuat ketika `BOOTSTRAP_ADMIN_EMAIL` dan `BOOTSTRAP_ADMIN_PASSWORD` sama-sama diinjeksi oleh secret manager deployment. Password harus memiliki minimal 12 karakter. Hapus kedua variabel segera setelah akun dibuat; pendaftaran publik tidak pernah menerima role `admin`.

## Konfigurasi runtime yang wajib

Isi setiap nilai `DB_*`, `CORS_ALLOWED_ORIGINS`, dan secret produksi melalui secret manager deployment. `CORS_ALLOWED_ORIGINS` adalah allowlist origin eksplisit yang dipisahkan koma; nilai `*` ditolak. Jangan pernah menaruh kredensial, token, atau API key di variabel `VITE_*`, file repository, maupun artefak build.

Setiap request menerima `X-Request-ID`, log akses JSON terstruktur, secure header restriktif, serta objek error standar berisi `code`, `message`, dan `requestId` untuk kegagalan yang berasal dari middleware. Endpoint autentikasi, AI, dan laporan yang memuat gambar memiliki rate limit dalam memori. Deployment dengan lebih dari satu replika API harus mengganti limiter ini dengan penyimpanan bersama yang kompatibel dengan Redis.

## Unggahan dan object storage

Unggahan gambar saat ini hanya menerima PNG/JPEG base64, memvalidasi ukuran hasil decode (maksimum 5 MB), MIME/tipe sebenarnya, dan dimensi (maksimum 4096×4096) sebelum direktori atau berkas dibuat. Nama berkas berasal dari checksum SHA-256, dan media unggahan memerlukan autentikasi untuk diakses.

Untuk object storage produksi, gunakan bucket privat yang kompatibel dengan S3, enkripsi sisi server, object key dari checksum, serta signed URL unggah/unduh yang berumur pendek. Verifikasi checksum setelah unggah dan simpan hanya metadata/object key—bukan URL bucket publik. Pemindaian malware dan lifecycle policy wajib tersedia sebelum unggah langsung dari klien diaktifkan.

## Drill backup dan restore

1. Jalankan `pg_dump --format=custom` terenkripsi setiap hari dari database produksi ke bucket terpisah dengan kontrol akses; simpan backup sesuai kebijakan retensi yang disetujui.
2. Minimal setiap bulan, pulihkan backup terbaru ke database staging terisolasi menggunakan `pg_restore --clean --if-exists`.
3. Jalankan API dengan database hasil restore, periksa `/api/health`, lalu minta pemilik data memverifikasi sampel data anggota, jurnal, dan donasi.
4. Catat waktu backup, durasi restore, checksum, operator, hasil, serta tindakan korektif pada log insiden.

Jangan menandai kriteria penerimaan restore produksi selesai sebelum drill ini dilakukan dan disetujui di staging.

## Checklist rotasi secret

- Rotasi seluruh secret yang pernah digunakan pada environment prototype, termasuk password database, key Gemini, dan password bootstrap.
- Perbarui secret manager deployment, deploy ulang, lalu cabut nilai lama pada providernya.
- Hapus `BOOTSTRAP_ADMIN_*` setelah pemakaian awal; cabut sesi aktif jika kredensial administrator diduga bocor.
- Tinjau peringatan secret scanning repository dan hasil CI sebelum merge.
- Konfigurasikan job `CI / validate` dan `CI / secret-scan` sebagai required status checks pada branch `main` yang diproteksi; workflow saja tidak dapat memblokir merge.
