# P1: Refactor pemuridan menjadi journey mentor-mentee yang aman

**Labels:** `type:epic`, `type:feature`, `priority:P1`, `area:backend`, `area:database`, `area:frontend`, `area:qa`, `needs:stakeholder-decision`  
**Milestone:** `Fase 3 - Discipleship & Content`  
**Estimasi:** 3-4 minggu  
**Dependencies:** Issue 02, 03, dan 06.

## Mengapa

Jurnal PA dan modul adalah inti pemuridan, tetapi catatan pendampingan tidak boleh terbuka secara global dan progress modul harus menjadi data per user, bukan bagian dari master content.

## Ruang Lingkup

- `mentorships` dengan mentor/mentee, start/end, status, approver, scope, capacity, dan histori.
- Restricted journal dengan visibility `private`, `supervisor-only`, atau `member-shared`; catatan sensitif terenkripsi dan tidak offline secara default.
- Kelompok/komsel: roster, leader, jadwal, attendance, curriculum, dan transfer.
- Pisahkan `modules` dari `module_progress` per user, termasuk started/completed/score/evidence.
- Journey/milestone, reminder follow-up, self-service jemaat, dan workflow review/redaction.

## Acceptance Criteria

- [ ] Jemaat tidak dapat membuka jurnal global atau jurnal orang lain melalui UI/API.
- [ ] Mentor hanya membuat/membaca jurnal mentorship aktif dalam scope-nya.
- [ ] Assignment dan visibility memiliki histori audit.
- [ ] Completion modul satu user tidak mengubah master module atau progress user lain.
- [ ] Reminder membantu follow-up tanpa penilaian kondisi rohani otomatis.

## Definition of Done

- [ ] Policy jurnal, retensi, escalation pastoral, dan aturan member-shared disetujui.
- [ ] Schema, encryption, progress model, dan migration data selesai.
- [ ] UI mentor/jemaat/supervisor memiliki state akses dan error yang tepat.
- [ ] Access test membuktikan notes sensitif tidak bocor lintas mentor/kota/user.
- [ ] Mentor pilot menyelesaikan assignment, jurnal, follow-up, dan module progress dalam UAT.
