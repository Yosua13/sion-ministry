# P1: Verifikasi donasi, bukti transfer, receipt, dan rekonsiliasi Sion Care

**Labels:** `type:epic`, `type:feature`, `priority:P1`, `area:backend`, `area:database`, `area:frontend`, `area:qa`, `needs:stakeholder-decision`  
**Milestone:** `Fase 4 - Care, Careers & AI`  
**Estimasi:** 2-3 minggu  
**Dependencies:** Issue 01, 02, 06; policy finance dan rekening resmi.

## Mengapa

Campaign dan informasi rekening sudah tersedia. Verifikasi, rekonsiliasi, serta audit finance diperlukan supaya nominal yang tampil dapat dipercaya dan keputusan keuangan dapat dilacak.

## Ruang Lingkup

- Nominal `NUMERIC`, payment status, reference, dan immutable ledger.
- Bukti transfer dengan validation upload; review finance disertai alasan approve/reject.
- Rekening tujuan bank, nomor rekening, dan nama rekening dikelola finance, disajikan mudah disalin pada campaign.
- Receipt, riwayat donatur sesuai consent, laporan campaign, dan rekonsiliasi manual terhadap mutasi.
- Finance scope, masking, audit log, secure export, dan provider payment adapter opsional.

## Acceptance Criteria

- [ ] Dana campaign tidak bertambah sebagai terverifikasi sebelum review finance atau callback provider valid.
- [ ] Finance hanya membaca scope-nya; donor/jemaat hanya melihat data milik sendiri dan ringkasan publik yang diizinkan.
- [ ] Verifikasi, perubahan nominal/status, serta receipt mempunyai audit trail.
- [ ] Rekonsiliasi menandai mismatch dan tidak menghapus transaksi asli.

## Definition of Done

- [ ] SOP payment, bukti, receipt, refund, dan disclosure publik disetujui finance.
- [ ] Migrasi nominal/status, UI transfer/unggah/review, audit, dan report selesai.
- [ ] Test authorization, precision nominal, bukti invalid, approve/reject, dan mismatch lulus.
- [ ] Finance pilot menyetujui hasil rekonsiliasi data staging.
