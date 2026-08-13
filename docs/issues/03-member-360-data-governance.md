# P0: Bangun Member 360 dengan dedupe, consent, dan histori pelayanan

**Labels:** `type:epic`, `type:feature`, `priority:P0`, `area:backend`, `area:database`, `area:frontend`, `area:qa`  
**Milestone:** `Fase 1 - Core MVP`  
**Estimasi:** 2-3 minggu  
**Dependencies:** Issue 01 dan 02.

## Status implementasi

Migration `000006_add_member_360` menambahkan UUID untuk record baru, normalized identity, primary service point, ownership, optimistic version, lifecycle, consent, communication preferences, append-only history, archive, retention lima tahun, serta register duplicate review. List/search/filter/pagination berjalan di PostgreSQL sesuai scope; field sensitif mengikuti permission; export selalu ter-mask dan diaudit.

Halaman Member 360 menggunakan endpoint server-side dan menyediakan inline validation, loading/empty/error state, kandidat duplicate sebelum simpan, alasan override, history pelayanan/consent, archive beralasan, dan masked export.

Kontrak schema, validation, permission, masking, endpoint, dan migration report tersedia pada [Kontrak Data dan API Member 360](member-360-api.md). Checklist UAT tersedia pada [Panduan Manual Testing Member 360](testing-member-360.md).

## Mengapa

Member adalah dasar event, pemuridan, dan komunikasi. Data perlu terdeduplikasi, mempunyai consent dan histori, serta dapat dibaca sesuai kewenangan agar laporan dapat dipercaya.

## Ruang Lingkup

- UUID/ULID, `TIMESTAMPTZ`/`DATE`, ownership/version, primary service point, dan lifecycle `guest`, `prospect`, `active`, `inactive`, `moved`, `deceased`, `archived`.
- Normalisasi phone E.164/email dan pencarian kandidat duplicate berbasis phone/email/nama+kota.
- Consent history, communication preference, sumber, timestamp, dan tujuan pemrosesan.
- Histori relasi mentor, group, kota, serta status.
- Pencarian, pagination server-side, scoped filter, masked export, archive/retention, dan audit.
- Halaman Member 360 dengan data yang muncul sesuai permission.

## Acceptance Criteria

- [x] Kandidat duplicate muncul sebelum create/update; melanjutkan data baru membutuhkan alasan minimal 10 karakter dan duplicate review.
- [x] Perubahan kota, mentor, group, status, dan consent memiliki histori append-only serta actor.
- [x] Field sensitif ter-mask sesuai permission; export selalu ter-mask serta tercatat di audit.
- [x] List memakai pagination, search, filter scope, ordering, dan limit server-side serta tidak fetch-all.

## Definition of Done

- [ ] Taxonomy status, mandatory field, consent, dan retention disetujui.
- [x] Schema, index, validation, masking, dan API contract terdokumentasi.
- [x] UI mencakup validasi inline, duplicate, archive, loading, empty, dan error state.
- [x] Test dedupe, scope, history, consent, archive/retention, dan masking lulus pada PostgreSQL terisolasi.
- [ ] Migration report tidak menyisakan duplicate kritis tanpa keputusan data steward.
