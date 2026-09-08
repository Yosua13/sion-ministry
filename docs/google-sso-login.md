# Google SSO dan persetujuan akun

Login aplikasi memakai Google OAuth. Saat pertama kali masuk, pengguna dibuat
dengan status `pending`, lalu dapat melengkapi Kota, HP, Kampus, Angkatan, dan
Jurusan. Admin mengaktifkan akun dari Manajemen User. Aktivasi mengirim email
pemberitahuan melalui SMTP dan memberi role awal `jemaat`.

Tambahkan redirect URI berikut pada OAuth client Google:

```text
http://localhost:3000/api/auth/google/callback
https://portal.sionministry.org/api/auth/google/callback
```

Environment deployment:

```env
GOOGLE_LOGIN_REDIRECT_URL=https://portal.sionministry.org/api/auth/google/callback
```

Google Sign-In memakai `GOOGLE_OAUTH_CLIENT_ID` dan `GOOGLE_OAUTH_CLIENT_SECRET`
yang sudah dipakai integrasi Google Sheets. Jangan pernah memasukkan client
secret ke repository. Google access token tidak disimpan; aplikasi menerbitkan
sesi HttpOnly sendiri dengan masa aktif satu jam.
