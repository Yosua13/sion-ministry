# Backlog Epic Sion Ministry Digital Hub

Folder ini memecah rencana implementasi menjadi issue GitHub mandiri. Buat satu file sebagai satu issue, lalu gunakan label, milestone, dependency, acceptance criteria, dan Definition of Done yang tercantum di dalamnya.

| Urutan | Issue | Prioritas | Milestone | Dependency utama |
| --- | --- | --- | --- | --- |
| 1 | [Hardening keamanan dan delivery foundation](issues/01-security-delivery-foundation.md) | P0 | Fase 0 | Keputusan environment dan session |
| 2 | [Scoped RBAC multi-unit dan multi-kota](issues/02-scoped-rbac-multi-kota.md) | P0 | Fase 0 | Workshop permission dan scope |
| 3 | [Member 360 dan data governance](issues/03-member-360-data-governance.md) | P0 | Fase 1 | Issue 1, 2 |
| 4 | [Event management dan event report](issues/04-event-management-event-report.md) | P0 | Fase 1 | Issue 2, 3 |
| 5 | [Registrasi, QR, dan offline check-in](issues/05-registration-qr-offline-checkin.md) | P0 | Fase 1 | Issue 1, 2, 4 |
| 6 | [Audit, dashboard, dan data quality](issues/06-audit-dashboard-data-quality.md) | P0 | Fase 1 | Issue 2-5 |
| 7 | [Announcement dan notification](issues/07-announcement-notification.md) | P1 | Fase 2 | Issue 2, 4, 6 |
| 8 | [Journey pemuridan dan restricted journal](issues/08-discipleship-restricted-journal.md) | P1 | Fase 3 | Issue 2, 3, 6 |
| 9 | [Verifikasi donasi dan rekonsiliasi](issues/09-donation-verification-reconciliation.md) | P1 | Fase 4 | Issue 1, 2, 6 |
| 10 | [Migrasi data dan pilot rollout](issues/10-data-migration-pilot-rollout.md) | P1 | Fase 2 | Issue 1-6 |
| 11 | [Rancangan Database Sederhana dan Aman](issues/11-rancangan-database-sederhana-dan-aman.md) | P0 | Target DB | Core Identitas & Scope Kota |

## Panduan Testing

- [Manual testing Security & Delivery Foundation](manual_testing/01-testing-security-delivery-foundation.md) — checklist UAT Security & Delivery Foundation (Issue 01).
- [Manual testing Scoped RBAC dan Multi-Kota](manual_testing/02-testing-scoped-rbac-multi-kota.md) — checklist UAT Scoped RBAC dan Multi-Kota (Issue 02).
- [Manual testing Member 360](manual_testing/03-testing-member-360.md) — checklist UAT Member 360 & Data Governance (Issue 03).
- [Kontrak Data dan API Member 360](member-360-api.md) — taxonomy, schema, validation, dedupe, masking, retention, dan API spec.

## Aturan Penutupan Issue

Issue hanya ditutup setelah seluruh checklist DoD selesai, test terkait lulus di CI, perubahan diverifikasi pada staging, dan Product Owner menerima demo. Perubahan yang menyentuh data pribadi wajib melalui review policy akses dan tidak boleh mengandalkan penyembunyian menu frontend sebagai pengaman.
