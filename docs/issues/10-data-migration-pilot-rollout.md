# P0/P1: Siapkan migrasi data dan pilot rollout multi-kota

**Labels:** `type:epic`, `type:feature`, `priority:P1`, `area:database`, `area:qa`, `area:infra`, `needs:stakeholder-decision`  
**Milestone:** `Fase 2 - Pilot & Communication`  
**Estimasi:** 3-4 minggu, paralel setelah Core MVP siap  
**Dependencies:** Issue 01 sampai 06.

## Mengapa

Data prototype/LocalStorage bukan source of truth. Pilot pada 2-3 kota dengan kondisi koneksi berbeda membuktikan keamanan, kualitas data, offline workflow, dan beban operasional sebelum rollout nasional.

## Ruang Lingkup

- Tetapkan kota pilot, Product Owner, data steward, security/data owner, dan escalation path.
- Inventory sumber data, mapping field, klasifikasi sensitivitas, normalisasi, dedupe review, serta import staging per batch.
- Tool import dengan validation report, batch ID, dry-run, rollback plan, dan sign-off per kota.
- Parallel operation untuk event: publish, registration, offline check-in, sync, report, dashboard.
- SOP satu halaman create member, publish event, check-in, resolve sync, report, dan incident support.
- Training per persona dan evaluasi mingguan adoption, failed sync, access issue, support ticket, serta data quality.

## Acceptance Criteria

- [ ] Semua data import memiliki validation report, keputusan duplicate, source/batch ID, dan sign-off steward.
- [ ] Setiap kota pilot menyelesaikan dry-run event tanpa kehilangan attendance saat offline/online transition.
- [ ] Security gate, restore test, monitoring, access test, dan rollback plan lulus sebelum go-live.
- [ ] Dashboard memperlihatkan event digitization, attendance capture, sync reliability, data quality, dan worker satisfaction.
- [ ] Go/no-go memakai bukti operasional, bukan hanya angka login.

## Definition of Done

- [ ] Kota pilot dan stakeholder penandatangan telah ditetapkan.
- [ ] Import staging, UAT data, dan production import memiliki rollback tervalidasi.
- [ ] Training admin, koordinator, mentor, volunteer, dan finance selesai.
- [ ] Satu dry-run dan satu event operasional terbatas per kota direkonsiliasi sukses.
- [ ] Go-live review menyetujui metrik, risiko terbuka, owner support, dan evaluasi 30/60/90 hari.
