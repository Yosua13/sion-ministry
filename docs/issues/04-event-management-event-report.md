# P0: Bangun alur event dari perencanaan hingga berita acara

**Labels:** `type:epic`, `type:feature`, `priority:P0`, `area:backend`, `area:database`, `area:frontend`, `area:qa`  
**Milestone:** `Fase 1 - Core MVP`  
**Estimasi:** 2-3 minggu  
**Dependencies:** Issue 02 dan 03.

## Mengapa

Berita acara saat ini belum terhubung dengan kegiatan yang direncanakan. Domain event menyatukan perencanaan, publikasi, pendaftaran, kehadiran, dan laporan tanpa input dasar berulang.

## Ruang Lingkup

- Event dengan unit, kota/service point, jenis, title, venue/map, waktu, timezone, organizer, banner, visibility, capacity, registration window, audience, dan link online.
- Workflow draft, publish, reschedule, cancel, archive, validasi waktu, dan alasan perubahan.
- Feed event publik/member dengan filter kota, unit, tanggal, jenis, dan status.
- Berita acara menjadi event report yang mewarisi data event, attendance, foto, outcome, follow-up, dan submitter.
- Detail responsive dan pengelolaan foto dengan loading/empty/error state.

## Acceptance Criteria

- [ ] Koordinator hanya mengelola event dalam city/unit scope.
- [ ] Publish menolak field wajib kosong, end time invalid, atau registration window invalid.
- [ ] Event hanya tampil pada audience yang sesuai visibility.
- [ ] Reschedule/cancel menyimpan alasan dan histori; event notifikasi dapat dipicu.
- [ ] Event report dibuat dari event tanpa input ulang data dasar.

## Definition of Done

- [ ] Workflow, taxonomy, visibility, dan format laporan disetujui kota pilot.
- [ ] Model data, API, audit, attachment, dan UI responsif selesai.
- [ ] Validasi client/server serta permission/lifecycle test lulus.
- [ ] UAT simulasi event selesai dari draft hingga report.
