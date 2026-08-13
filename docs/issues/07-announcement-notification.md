# P1: Pengumuman dan notifikasi tersegmentasi per kota, unit, grup, dan event

**Labels:** `type:epic`, `type:feature`, `priority:P1`, `area:backend`, `area:frontend`, `area:infra`, `area:qa`  
**Milestone:** `Fase 2 - Pilot & Communication`  
**Estimasi:** 2-3 minggu  
**Dependencies:** Issue 02, 04, 06; pemilihan provider push/email/WhatsApp.

## Mengapa

Informasi event dan pelayanan harus menjangkau penerima yang tepat tanpa membanjiri semua anggota. Delivery log dan preference membuat komunikasi terukur serta dapat ditindaklanjuti.

## Ruang Lingkup

- Composer pengumuman untuk segment seluruh anggota, unit, kota, group, event registrant, atau role; tampilkan estimasi penerima.
- In-app notification dan adapter push; rancangan adapter email/WhatsApp yang dapat diganti provider.
- Template dengan variable tervalidasi, preview, scheduled send, quiet hours, preference, dan aturan transactional/emergency.
- Queue/retry dengan status queued/sent/delivered/failed/read serta alasan gagal.
- Trigger notification untuk publish/reschedule/cancel event.

## Acceptance Criteria

- [ ] Pengirim hanya memilih segment dalam scope dan estimasi penerima benar.
- [ ] Opt-out dihormati untuk pesan non-transactional.
- [ ] Delivery dapat ditelusuri tanpa menampilkan data sensitif pada push lock screen.
- [ ] Pesan nasional mengikuti permission dan approval kedua jika policy mengharuskan.

## Definition of Done

- [ ] Kanal, provider, SLA, template policy, dan approval flow disetujui.
- [ ] Queue/retry, provider adapter, preference, delivery log, dan composer selesai.
- [ ] Test segment scope, opt-out, variable invalid, retry, serta failed delivery lulus.
- [ ] UAT mengirim pengumuman dan perubahan event ke kota pilot dengan delivery report.
