# P0: Bangun Member 360 dengan dedupe, consent, dan histori pelayanan

**Labels:** `type:epic`, `type:feature`, `priority:P0`, `area:backend`, `area:database`, `area:frontend`, `area:qa`  
**Milestone:** `Fase 1 - Core MVP`  
**Estimasi:** 2-3 minggu  
**Dependencies:** Issue 01 dan 02.

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

- [ ] Kandidat duplicate muncul sebelum create/update; melanjutkan data baru membutuhkan alasan.
- [ ] Perubahan kota, mentor, status, dan consent memiliki histori serta actor.
- [ ] Field sensitif dan export ter-mask sesuai policy serta tercatat di audit.
- [ ] List memakai pagination, search, filter scope, dan tidak fetch-all.

## Definition of Done

- [ ] Taxonomy status, mandatory field, consent, dan retention disetujui.
- [ ] Schema, index, validation, dan API contract terdokumentasi.
- [ ] UI mencakup validasi inline, duplicate, archive, loading, empty, dan error state.
- [ ] Test dedupe, scope, history, archive, dan masked export lulus.
- [ ] Migration report tidak menyisakan duplicate kritis tanpa keputusan data steward.
