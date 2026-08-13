# P0: Audit trail dan dashboard operasional yang dapat dipercaya

**Labels:** `type:epic`, `type:feature`, `type:security`, `priority:P0`, `area:backend`, `area:database`, `area:frontend`, `area:qa`  
**Milestone:** `Fase 1 - Core MVP`  
**Estimasi:** 2 minggu  
**Dependencies:** Issue 02 sampai 05.

## Mengapa

Dashboard harus menampilkan agregasi yang benar dan sesuai scope. Audit trail diperlukan agar perubahan pelayanan, akses, dan transaksi dapat dipertanggungjawabkan.

## Ruang Lingkup

- Immutable audit untuk login failure, CRUD, approval, export, publish, perubahan event, attendance, donation verification, dan role.
- Dashboard agregasi server-side pusat/kota dengan date range, filter scope, dan permission-aware drill-down.
- Data quality dashboard: duplicate, contact invalid, consent missing, city orphan, role expired, attachment failed, dan failed/conflicted sync.
- Export CSV/XLSX dengan permission, masking, reason, audit, dan batas volume.
- Laporan event/attendance, member growth, follow-up, dan status sync.

## Acceptance Criteria

- [ ] Audit menyimpan actor, action, entity, waktu, request/device context, dan before/after summary yang aman.
- [ ] Detail dashboard hanya terbuka bila scope mengizinkan.
- [ ] Jurnal sensitif tidak muncul di dashboard/export umum.
- [ ] Temuan kualitas data dapat difilter kota/unit dan ditindaklanjuti.
- [ ] Semua list/report API dipaginasi.

## Definition of Done

- [ ] Policy audit, retention, dan auditor role disetujui.
- [ ] Audit append-only, indeks report, query scoped, dan masking export selesai.
- [ ] UI memiliki loading, empty, error, filter reset, dan access denied state.
- [ ] Integration test audit/drill-down/export lulus.
- [ ] Product Owner menerima dashboard berbasis data staging representatif.
