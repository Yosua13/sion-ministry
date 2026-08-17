# Kontrak Data dan API Member 360

Dokumen ini mendefinisikan kontrak teknis implementasi issue #10. Semua endpoint di bawah `/api/members` membutuhkan session aktif, permission backend, dan scope yang sesuai. UI bukan sumber keputusan authorization.

## Taxonomy dan mandatory field

Lifecycle status yang didukung:

- `guest`: tamu yang baru teridentifikasi;
- `prospect`: sedang ditindaklanjuti;
- `active`: aktif dalam pelayanan/pemuridan;
- `inactive`: sementara tidak aktif;
- `moved`: pindah primary service point;
- `deceased`: meninggal;
- `archived`: tidak tampil pada list default tetapi dipertahankan sesuai retention.

Field wajib untuk create/update adalah `name`, `phone`, `cityId`, `discipleshipStage`, `joinedDate`, dan `status`. Phone dinormalisasi ke E.164 Indonesia (`08...` menjadi `+628...`), email menjadi lowercase, dan nama dirapikan untuk pencarian duplicate. `version` wajib pada update untuk optimistic concurrency.

`cityId` tetap disediakan untuk kompatibilitas endpoint lama dan menjadi sumber `primaryServicePointId`. Record baru menggunakan UUID v4; ID lama tetap dipertahankan agar foreign key tidak rusak.

## Consent dan retention

Consent memiliki status `unknown`, `granted`, atau `revoked`. Ketika `granted`, `consentSource`, `consentPurpose`, dan minimal satu `communicationPreferences` wajib diisi. Preferensi yang didukung adalah `whatsapp`, `sms`, `email`, `phone`, dan `none`; `none` tidak boleh digabung pilihan lain.

Setiap perubahan consent membuat row append-only pada `member_consent_histories`. Archive membutuhkan alasan minimal 10 karakter, tidak menghapus record, menaikkan `version`, dan menetapkan `retentionUntil` lima tahun setelah archive. Purge setelah tanggal tersebut hanya boleh dilakukan melalui keputusan data steward terpisah.

## Dedupe

Kandidat duplicate dihitung dari:

- normalized phone sama: skor 100;
- normalized email sama: skor 100;
- normalized name dan primary service point sama: skor 75.

Create/update tanpa alasan mengembalikan HTTP `409` beserta kandidat yang phone/email-nya telah dimasking. Request boleh dilanjutkan dengan `duplicateOverrideReason` minimal 10 karakter. Override membuat `member_duplicate_reviews` berstatus `pending`; data steward tetap harus memutuskan `merged` atau `not_duplicate` melalui prosedur stewardship yang disetujui.

Data steward dapat mengambil antrean dan menyimpan keputusan melalui endpoint berscope:

```http
GET /api/members/duplicate-reviews?status=pending
PUT /api/members/duplicate-reviews/:id
Content-Type: application/json

{
  "decision": "not_duplicate",
  "note": "Identitas berbeda telah diverifikasi dengan kota pilot"
}
```

Keputusan `merged` hanya boleh diberikan setelah proses penggabungan record/foreign key selesai sesuai prosedur data steward. Kedua keputusan membutuhkan catatan minimal 10 karakter dan dicatat pada audit.

## Permission dan masking

| Permission | Fungsi |
| --- | --- |
| `member.read` | List/detail sesuai scope |
| `member.write` | Create/update sesuai scope |
| `member.sensitive.read` | Phone/email penuh dan metadata consent |
| `member.history.read` | Histori perubahan dan consent |
| `member.archive` | Archive dan review record archived |
| `member.export` | Export CSV berscope dan selalu ter-mask |

Admin dan pekerja mendapat permission operasional Member 360. Auditor mendapat read/history/export dengan field sensitif ter-mask. Jemaat hanya dapat membaca profil yang ditautkan ke `user_id` miliknya. Setiap pembacaan sensitif, history, export, create, update, dan archive dicatat di `audit_logs`.

## Endpoint

### List server-side

```http
GET /api/members?page=1&pageSize=20&q=maria&cityId=<CITY_ID>&status=active
```

`pageSize` default 20 dan maksimum 100. Search, status, scope, ordering, offset, serta limit diproses PostgreSQL; endpoint tidak mengambil seluruh tabel lalu memfilter di aplikasi.

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 0,
  "totalPages": 0
}
```

### Detail dan history

```http
GET /api/members/:id
GET /api/members/:id/history
```

History response memisahkan `changes` dan `consents`. Perubahan kota, mentor, group, status, consent, create, dan archive menyimpan actor serta timestamp.

### Kandidat duplicate

```http
POST /api/members/duplicates?excludeId=<MEMBER_ID_OPTIONAL>
Content-Type: application/json

{
  "name": "Maria Sion",
  "phone": "081234567890",
  "email": "maria@example.test",
  "cityId": "<CITY_ID>",
  "discipleshipStage": "Jemaat",
  "joinedDate": "2026-08-12",
  "status": "active",
  "consentStatus": "unknown"
}
```

### Create dan update

```http
POST /api/members
PUT /api/members/:id
```

Payload mengikuti model pada endpoint dedupe. Update wajib mengirim `version`. Jika kandidat sudah ditinjau dan memang orang berbeda, tambahkan:

```json
{
  "duplicateOverrideReason": "Orang berbeda dan sudah diverifikasi data steward"
}
```

Error validasi:

```json
{
  "error": {
    "code": "member_validation_failed",
    "message": "data anggota belum valid",
    "requestId": "..."
  },
  "fields": {
    "phone": "Nomor telepon wajib menggunakan format E.164 dengan 8-15 digit."
  }
}
```

Konflik duplicate memakai HTTP `409`, code `member_duplicate_candidates`, dan array `candidates`.

### Archive

```http
POST /api/members/:id/archive
Content-Type: application/json

{
  "reason": "Member berpindah sistem setelah verifikasi data steward"
}
```

### Masked export

```http
GET /api/members/export?reason=Rekonsiliasi%20laporan%20bulanan&cityId=<CITY_ID>&status=active
```

Response berupa CSV maksimal 10.000 record sesuai scope/filter. Phone dan email selalu dimasking, cell yang berisiko CSV formula injection dinetralkan, dan alasan serta jumlah record dicatat pada audit.

## Schema dan index

Migration `000006_add_member_360.up.sql` menambahkan ownership, version, normalized identity, lifecycle, primary service point, consent, preferences, archive/retention, `TIMESTAMPTZ`, `DATE`, history, consent history, serta duplicate review. Member lama tanpa kota ditempatkan pada service point `Perlu Review Data Steward` agar migration tidak gagal dan wajib direlokasi pada proses stewardship. Index tersedia pada normalized phone, normalized email, normalized name+kota, owner, serta scope+status+updated time. Rollback terdapat pada pasangan `.down.sql` dan wajib diuji hanya pada database disposable.

## Laporan migration/dedupe

Jalankan pada staging dengan akses terbatas:

```powershell
./scripts/member360-duplicate-report.ps1 -DatabaseUrl "<DATABASE_URL_STAGING>"
```

Script menghasilkan `reports/member360-duplicate-review.csv` dengan field sensitif dimasking dan gagal (exit non-zero) bila masih ada kandidat skor 100 berstatus `pending`. File laporan tidak boleh dimasukkan ke Git.
