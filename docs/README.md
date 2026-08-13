# Backlog Epic Sion Ministry Digital Hub

Folder ini memecah rencana implementasi menjadi issue GitHub mandiri. Buat satu file sebagai satu issue, lalu gunakan label, milestone, dependency, acceptance criteria, dan Definition of Done yang tercantum di dalamnya.

| Urutan | Issue | Prioritas | Milestone | Dependency utama |
| --- | --- | --- | --- | --- |
| 1 | [Hardening keamanan dan delivery foundation](01-security-delivery-foundation.md) | P0 | Fase 0 | Keputusan environment dan session |
| 2 | [Scoped RBAC multi-unit dan multi-kota](02-scoped-rbac-multi-kota.md) | P0 | Fase 0 | Workshop permission dan scope |
| 3 | [Member 360 dan data governance](03-member-360-data-governance.md) | P0 | Fase 1 | Issue 1, 2 |
| 4 | [Event management dan event report](04-event-management-event-report.md) | P0 | Fase 1 | Issue 2, 3 |
| 5 | [Registrasi, QR, dan offline check-in](05-registration-qr-offline-checkin.md) | P0 | Fase 1 | Issue 1, 2, 4 |
| 6 | [Audit, dashboard, dan data quality](06-audit-dashboard-data-quality.md) | P0 | Fase 1 | Issue 2-5 |
| 7 | [Announcement dan notification](07-announcement-notification.md) | P1 | Fase 2 | Issue 2, 4, 6 |
| 8 | [Journey pemuridan dan restricted journal](08-discipleship-restricted-journal.md) | P1 | Fase 3 | Issue 2, 3, 6 |
| 9 | [Verifikasi donasi dan rekonsiliasi](09-donation-verification-reconciliation.md) | P1 | Fase 4 | Issue 1, 2, 6 |
| 10 | [Migrasi data dan pilot rollout](10-data-migration-pilot-rollout.md) | P1 | Fase 2 | Issue 1-6 |

## Panduan Testing

- [Manual testing scoped RBAC dan multi-kota](testing-scoped-rbac-multi-kota.md) — checklist UAT issue #9, termasuk isolasi lintas kota, jurnal mentor/mentee, sesi, audit, storage, serta rollback migrasi.
- [Kontrak Data dan API Member 360](member-360-api.md) — taxonomy, schema, validation, dedupe, masking, retention, dan API issue #10.
- [Manual testing Member 360](testing-member-360.md) — checklist UAT dedupe, scope, history, consent, archive, export, dan migration report issue #10.

## Aturan Penutupan Issue

Issue hanya ditutup setelah seluruh checklist DoD selesai, test terkait lulus di CI, perubahan diverifikasi pada staging, dan Product Owner menerima demo. Perubahan yang menyentuh data pribadi wajib melalui review policy akses dan tidak boleh mengandalkan penyembunyian menu frontend sebagai pengaman.
