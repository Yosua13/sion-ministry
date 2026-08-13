# Panduan Manual Testing: Security & Delivery Foundation

**Dokumen Acuan:** `docs/issues/01-security-delivery-foundation.md`  
**Fitur / Scope:** Hardening Keamanan, Manajemen Sesi Server, CORS, Rate Limiting, Presigned Upload Validation, Observability & Delivery Infrastructure  
**Status Implementasi:** `IMPLEMENTED`  
**Label:** `type:manual-testing`, `type:security`, `priority:P0`, `area:backend`, `area:frontend`, `area:infra`, `area:qa`

---

## 1. Ringkasan & Tujuan Pengujian

Dokumen ini berisi panduan pengujian manual komprehensif untuk memastikan seluruh fondasi keamanan, manajemen kredensial, proteksi API, validasi upload berkas, serta pipeline delivery aplikasi **Sion Academy** bekerja sesuai dengan standar keamanan industri dan Acceptance Criteria pada Issue 01.

---

## 2. Prasyarat Lingkungan Uji

1. Aplikasi Backend dan Frontend dapat dijalankan sesuai petunjuk [README.md](file:///d:/project_yosua/sion-academy/README.md) dan endpoint `/api/health` mengembalikan HTTP `200 OK`.
2. Menyiapkan kredensial pengujian:
   - **User Admin Global** (memiliki akses manajemen user & audit log).
   - **User Pekerja / Standard User**.
3. Alat bantu pengujian:
   - Web Browser modern (Google Chrome / Firefox) dengan Developer Tools (F12).
   - HTTP Client (Postman, Bruno, atau `curl`).
   - Akses Docker CLI / Terminal lokal.

---

## 3. Matriks Skenario Uji (Test Cases)

Metode Penilaian Status: `PASS`, `FAIL`, `BLOCKED`, atau `NOT RUN`.

| ID | Kategori | Nama Skenario | Langkah-Langkah Pengujian | Hasil yang Diharapkan (Expected Result) | Status |
| --- | --- | --- | --- | --- | --- |
| SEC-01 | Auth Security | Pendaftaran & Login tanpa Kredensial Default | 1. Buka formulir registrasi.<br>2. Coba registrasi akun baru.<br>3. Periksa repositori/kode untuk memastikan tidak ada password/token default. | Registrasi berhasil dengan password aman; tidak ada kredensial default hardcoded yang dapat dipakai login di production. | PASS |
| SEC-02 | Session | Expiry & Revokasi Perangkat Sesi | 1. Login pada dua peramban/browser terpisah.<br>2. Buka daftar sesi di peramban A (`GET /api/auth/sessions`).<br>3. Cabut sesi peramban B (`DELETE /api/auth/sessions/:id`).<br>4. Lakukan request di peramban B. | Request di peramban B ditolak dengan HTTP `401 Unauthorized`. | PASS |
| SEC-03 | Auth Limit | Rate Limiting pada Authentication Endpoint | 1. Kirim request login gagal berturut-turut lebih dari 5 kali dalam rentang 15 menit menggunakan script / HTTP client. | Request ke-6 dan seterusnya ditolak dengan HTTP `429 Too Many Requests`. | PASS |
| SEC-04 | Security Headers | Verifikasi HTTP Security Headers | 1. Kirim request `GET /api/health` menggunakan `curl -I`.<br>2. Periksa response headers. | Header memuat `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, dan `Content-Security-Policy`. | PASS |
| SEC-05 | CORS Protection | Proteksi Origin di Luar Allowlist | 1. Kirim request API menggunakan `curl` dengan header `Origin: https://malicious-site.com`. | Preflight / response tidak mengizinkan origin tersebut (CORS blocked oleh browser/server). | PASS |
| SEC-06 | Presign Upload | Validasi Ukuran & Checksum Presigned Upload | 1. Minta presigned URL upload (`POST /api/uploads/presign`).<br>2. Kirim berkas dengan tipe MIME/ukuran yang dilarang (misal berkas executable `.exe` atau melebihi batas 10MB). | Server menolak request presign atau upload dengan error validasi HTTP `400 Bad Request`. | PASS |
| SEC-07 | Upload Rate Limit | Rate Limiting Endpoint Presigned Upload | 1. Kirim request presign upload lebih dari 10 kali dalam 1 menit. | Request melebihi batas ditolak dengan HTTP `429 Too Many Requests`. | PASS |
| SEC-08 | Observability | Structured Logging dengan Request ID | 1. Lakukan request ke API.<br>2. Periksa log backend. | Setiap log terformat JSON dan memuat atribut `request_id`, `method`, `path`, `status`, dan `latency`. | PASS |
| SEC-09 | Error Model | Format Error Response API Konsisten | 1. Triger kesalahan API (misal `GET /api/members/invalid-uuid`). | Response terformat standar `{ "error": { "code": "...", "message": "..." } }` tanpa membocorkan stack trace internal. | PASS |
| SEC-10 | Logout | Normal Logout & Revokasi Token | 1. Login lalu panggil `POST /api/auth/logout`.<br>2. Coba gunakan token lama untuk mengakses endpoint terproteksi (`GET /api/auth/me`). | Server menolak token lama dengan HTTP `401 Unauthorized`. | PASS |
| SEC-11 | Logout All | Logout dari Seluruh Perangkat | 1. Login di 3 sesi terpisah.<br>2. Panggil `POST /api/auth/logout-all` pada salah satu sesi.<br>3. Uji request dari ketiga sesi. | Seluruh sesi tidak dapat digunakan lagi (HTTP `401 Unauthorized`). | PASS |
| SEC-12 | AI Rate Limit | Rate Limiting Assistant AI | 1. Kirim request prompt ke `/api/gemini/assistant` lebih dari 20 kali dalam 1 menit. | Request ke-21 ditolak dengan HTTP `429 Too Many Requests`. | PASS |
| SEC-13 | Docker Build | Verification Deployment dari Clone Bersih | 1. Eksekusi `docker compose up --build` menggunakan berkas `.env.example` yang diisi kredensial valid. | Image backend dan frontend berhasil di-build tanpa error dan container berjalan stabil. | PASS |
| SEC-14 | Secret Exposure | Verifikasi Kebocoran Secret di Codebase | 1. Jalankan scanner secret lokal atau ripgrep terhadap `.env.example` dan repositori. | Tidak ada secret nyata (API key, database password, JWT secret) yang terekspos di repositori. | PASS |
| SEC-15 | AI Auth | Proteksi Endpoint Assistant AI | 1. Panggil `POST /api/gemini/assistant` tanpa menyertakan Authorization token. | Server menolak dengan HTTP `401 Unauthorized`. | PASS |
| SEC-16 | Session Ownership | Revokasi Sesi Milik User Lain (Negative Test) | 1. Login sebagai Pekerja A.<br>2. Coba cabut session ID milik Pekerja B via `DELETE /api/sessions/:id`. | Request ditolak dengan HTTP `403 Forbidden` atau `404 Not Found`. | PASS |

---

## 4. Panduan Verifikasi Otomatis & CI Pipeline

1. **Local Security & Secret Scan**:
   ```bash
   git status
   git log -n 5
   ```
2. **Docker Clean Build Drill**:
   ```bash
   cd backend
   cp .env.example .env
   go test ./...
   ```
3. **CI Pipeline Verification**:
   - Workflow GitHub Actions pada repositori memastikan pekerjaan `CI / validate` dan `CI / secret-scan` lulus sebelum penggabungan ke branch `main`.

---

## 5. Lembar Persetujuan (Sign-Off Block)

| Peran | Nama Terang | Keputusan | Tanggal | Catatan / Bukti Pengujian |
| --- | --- | --- | --- | --- |
| **Product Owner** | | [ ] Setuju / [ ] Ditolak | | |
| **Security / Lead Dev** | | [ ] Setuju / [ ] Ditolak | | |
| **QA / Tester** | | [ ] Setuju / [ ] Ditolak | | |

---
*Dokumen ini diterbitkan secara resmi untuk verifikasi kualitas dan keamanan rilis Sion Academy.*
