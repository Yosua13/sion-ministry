# Panduan Manual Testing Member 360

Gunakan staging atau database disposable. Jangan memakai data pribadi nyata dan jangan menjalankan rollback pada produksi.

## Persiapan

1. Jalankan aplikasi sesuai `README.md` dan pastikan `/api/health` sehat.
2. Siapkan Admin organization, Pekerja Kota A, Pekerja Kota B, Auditor Kota A, serta Jemaat A.
3. Pastikan assignment/scoped RBAC seluruh akun aktif.
4. Siapkan Kota A dan Kota B.
5. Catat browser, commit, tester, tanggal, dan tautan bukti.

Status: `PASS`, `FAIL`, `BLOCKED`, atau `NOT RUN`.

| ID | Skenario | Langkah | Expected result | Status |
| --- | --- | --- | --- | --- |
| M360-01 | Create valid | Pekerja A membuat member lengkap di Kota A. | Berhasil; ID UUID, phone E.164, version 1, primary service point Kota A. | NOT RUN |
| M360-02 | Inline/backend validation | Kosongkan nama/phone/kota/tanggal. | UI menampilkan error per field; manipulasi API juga ditolak `400`. | NOT RUN |
| M360-03 | Consent mandatory | Pilih consent granted tanpa source/purpose/preference. | Simpan ditolak dengan error field terkait. | NOT RUN |
| M360-04 | Pagination | Buat lebih dari 12 member lalu pindah halaman. | Network menunjukkan `page`/`pageSize`; hanya satu halaman dikirim server. | NOT RUN |
| M360-05 | Search server-side | Cari nama, normalized phone, dan email. | Request membawa `q`; total dan item sesuai scope. | NOT RUN |
| M360-06 | Filter scope | Pekerja A memilih Kota B atau mengganti query `cityId`. | Kota B tidak tersedia/ditolak `403`; record tidak bocor. | NOT RUN |
| M360-07 | Duplicate phone | Create member kedua dengan phone sama. | Kandidat muncul sebelum create, phone/email kandidat ter-mask. | NOT RUN |
| M360-08 | Duplicate email | Create/update memakai email normalized yang sama. | HTTP `409`/panel kandidat muncul. | NOT RUN |
| M360-09 | Duplicate name+kota | Gunakan nama dengan kapital/spasi berbeda pada kota sama. | Kandidat skor 75 muncul. | NOT RUN |
| M360-10 | Override tanpa alasan | Lanjutkan kandidat tanpa alasan atau alasan pendek. | Ditolak; alasan minimal 10 karakter. | NOT RUN |
| M360-11 | Override beralasan | Isi alasan valid dan simpan. | Record dibuat; duplicate review pending dan audit mencatat override. | NOT RUN |
| M360-11A | Keputusan data steward | Ambil pending review lalu simpan keputusan `not_duplicate` dengan catatan valid. | Status review berubah, actor/timestamp tersimpan, dan audit tercatat. | NOT RUN |
| M360-12 | Optimistic version | Buka profil di dua browser, simpan A lalu simpan B tanpa reload. | Simpan B ditolak dan diminta memuat ulang. | NOT RUN |
| M360-13 | Histori kota | Pindahkan member Kota A ke Kota B sebagai actor berwenang. | History memuat old/new city, actor, timestamp. | NOT RUN |
| M360-14 | Histori mentor/group/status | Ubah ketiga field. | Setiap perubahan memiliki history actor. | NOT RUN |
| M360-15 | Histori consent | Grant lalu revoke consent. | Entry consent append-only; entry lama tidak ditimpa. | NOT RUN |
| M360-16 | Masking auditor | Login Auditor Kota A dan buka list/detail. | Phone/email ter-mask; purpose/source consent tidak terlihat. | NOT RUN |
| M360-17 | Self access | Tautkan Jemaat A ke profil lalu login. | Hanya profil sendiri dapat dibaca; profil lain tidak muncul. | NOT RUN |
| M360-18 | Sensitive audit | Pekerja membuka list/detail tidak ter-mask. | `member.sensitive.read` tercatat pada audit. | NOT RUN |
| M360-19 | Masked export | Isi alasan export dan unduh CSV. | Hanya scope/filter aktif, phone/email ter-mask, event audit berisi alasan/count. | NOT RUN |
| M360-20 | Export tanpa alasan | Export dengan alasan kurang dari 10 karakter. | Ditolak `400`. | NOT RUN |
| M360-21 | Archive | Archive dengan alasan valid. | Hilang dari list default, status archived, retentionUntil +5 tahun, history/audit tersimpan. | NOT RUN |
| M360-22 | Archive tanpa alasan | Archive tanpa alasan/terlalu pendek. | Ditolak dan profil tetap aktif. | NOT RUN |
| M360-23 | Retention review | Query archived sebagai admin/pekerja berizin. | Profil tetap tersedia untuk review dan tidak hard-deleted. | NOT RUN |
| M360-24 | Offline update | Sync update dengan version valid. | Update, dedupe, history, dan actor tetap diproses. | NOT RUN |
| M360-25 | Offline archive | Sync delete tanpa `archiveReason`, lalu dengan alasan valid. | Tanpa alasan ditolak; dengan alasan berubah menjadi archive, bukan hard delete. | NOT RUN |
| M360-26 | Loading/empty/error | Throttle/offline API, filter tanpa hasil, lalu retry. | Loading skeleton, empty state, error banner, dan retry tampil benar. | NOT RUN |

## Verifikasi migration dan report

1. Jalankan migrasi pada clone database staging.
2. Pastikan version 6 terdaftar dan tabel `member_histories`, `member_consent_histories`, `member_duplicate_reviews` tersedia.
3. Jalankan script report:

```powershell
./scripts/member360-duplicate-report.ps1 -DatabaseUrl "<DATABASE_URL_STAGING>"
```

4. Data steward memutuskan semua kandidat skor 100 sebagai `merged` atau `not_duplicate` beserta catatan keputusan.
5. Jalankan script ulang; exit code harus 0 dan `Kandidat kritis tanpa keputusan: 0`.
6. Uji rollback `000006_add_member_360.down.sql` hanya pada database disposable, lalu restore backup.

## Persetujuan

| Peran | Nama | Keputusan | Tanggal | Bukti/catatan |
| --- | --- | --- | --- | --- |
| Product Owner | | Setuju / Ditolak | | |
| Data steward | | Setuju / Ditolak | | |
| Pengurus pusat | | Setuju / Ditolak | | |
| Perwakilan kota pilot | | Setuju / Ditolak | | |
| Security/Engineering | | Setuju / Ditolak | | |

Issue #10 baru layak ditutup ketika semua test prioritas lulus, migration report menunjukkan nol duplicate kritis tanpa keputusan, taxonomy/mandatory field/consent/retention disetujui, staging diverifikasi, dan Product Owner menerima demo.
