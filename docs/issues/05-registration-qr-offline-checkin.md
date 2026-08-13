# P0: Implementasi registrasi event, QR check-in, dan sinkronisasi offline

**Labels:** `type:epic`, `type:feature`, `priority:P0`, `area:frontend`, `area:backend`, `area:database`, `area:qa`  
**Milestone:** `Fase 1 - Core MVP`  
**Estimasi:** 3-4 minggu  
**Dependencies:** Issue 01, 02, dan 04.

## Mengapa

Pelayanan lapangan tetap perlu mencatat kehadiran saat koneksi buruk. Antrean LocalStorage saat ini belum idempotent dan belum mempunyai resolusi konflik yang aman.

## Ruang Lingkup

- Registrasi member/guest dan QR unik tanpa PII plain text.
- Layar volunteer: scan QR, cari nama, walk-in, dan status attendance.
- IndexedDB versioned untuk app shell dan roster event minimum; tanpa profil penuh pada perangkat volunteer.
- `sync_operations` dengan operation ID, entity/action, base version, device, waktu, idempotency key, retry, dan hasil per item.
- Conflict center untuk membandingkan local/server dan memilih tindakan sesuai policy.
- Upload media terpisah dari operation log serta status sync yang jelas.

## Acceptance Criteria

- [ ] QR dapat divalidasi tanpa membuka data pribadi.
- [ ] Roster yang diunduh bekerja offline; feedback scan target kurang dari satu detik.
- [ ] QR tidak dapat check-in ganda pada perangkat yang sama; konflik lintas perangkat direkonsiliasi server.
- [ ] Retry tidak membuat duplicate attendance/record lain.
- [ ] Hasil sync per item tampil; `forbidden` dan `invalid` tidak diulang otomatis.

## Definition of Done

- [ ] SOP volunteer dan kebijakan data offline disetujui.
- [ ] PWA, IndexedDB migration, sync API idempotent, dan conflict UI selesai.
- [ ] Test offline replay, duplicate, conflict, revoke cleanup, dan media failure lulus.
- [ ] Dry-run event offline lalu online reconciliation berhasil di staging.
