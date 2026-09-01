# Registrasi publik ke Google Sheet

Halaman publik tersedia di `/register`. Setiap pendaftaran yang valid akan
menambahkan satu baris pada tab Google Sheet yang dikonfigurasi, dengan urutan:

`No | Nama | Kampus | Angkatan | Jurusan`

Kolom `No` dibuat otomatis dari nomor baris agar pengiriman bersamaan tidak
menghasilkan nomor yang sama.

## Konfigurasi Google Cloud

Kredensial yang dipakai adalah **OAuth client untuk Web application**. Jangan
memasukkan atau mengunggah berkas `client_secret_*.json` ke repository.

1. Di Google Cloud Console, buka OAuth Client yang sudah dibuat.
2. Tambahkan *Authorized redirect URI* yang persis sama dengan:

   ```text
   https://DOMAIN-APLIKASI-ANDA/api/integrations/google/callback
   ```

3. Jika OAuth consent screen masih berstatus *Testing*, tambahkan akun Google
   pengurus yang akan menghubungkan Sheet sebagai **Test user**.
4. Pastikan Google Sheets API aktif di project tersebut.

## Secret deployment

Masukkan nilai berikut melalui secret manager platform deployment, bukan ke
berkas yang di-commit. Nilai `client_id` dan `client_secret` diambil dari
berkas OAuth JSON milik Anda.

```env
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URL=https://DOMAIN-APLIKASI-ANDA/api/integrations/google/callback
GOOGLE_SHEETS_SPREADSHEET_ID=11C2mTXC6gb_SgUtid2T20-AUiYvkVpyjcFlN3co_TDg
GOOGLE_SHEETS_TAB=Registrasi OH 2026
GOOGLE_TOKEN_ENCRYPTION_KEY=...
```

`GOOGLE_TOKEN_ENCRYPTION_KEY` harus merupakan satu nilai Base64 dari 32 byte
acak. Buat sekali, simpan di secret manager, dan jangan diubah sesudah Google
Sheet terhubung karena token yang tersimpan tidak lagi dapat dibuka. Contoh
PowerShell untuk membuatnya:

```powershell
$keyBytes = [byte[]]::new(32)
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($keyBytes)
[Convert]::ToBase64String($keyBytes)
```

## Menghubungkan setelah deploy

1. Deploy aplikasi dengan secret di atas.
2. Masuk sebagai admin.
3. Buka **Manajemen User** lalu pilih **Hubungkan Google Sheet**.
4. Login dengan akun Google yang memiliki akses Editor ke spreadsheet dan setujui izin.
5. Setelah halaman konfirmasi berhasil muncul, kirim satu pendaftaran percobaan melalui `/register`.

Refresh token hasil otorisasi disimpan terenkripsi di PostgreSQL. Data
pendaftar hanya dikirim ke Google Sheet setelah Google merespons sukses; form
tidak menampilkan konfirmasi palsu ketika pengiriman gagal.
