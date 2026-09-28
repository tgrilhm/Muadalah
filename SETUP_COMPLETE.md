# ✅ Setup Selesai — Muadalah

Dokumen ini mencatat semua yang sudah dilakukan untuk menyelesaikan setup Supabase dan infrastruktur project sebelum Phase 3.

**Tanggal:** 2026-08-02  
**Status:** Setup 100% Complete — Siap Phase 3

---

## Apa yang Sudah Dilakukan

### 1. Diagnosa Masalah Koneksi

**Masalah yang ditemukan:**
- Koneksi database sebenarnya sudah benar, tapi schema belum pernah di-push ke Supabase
- `npm run db:push` timeout karena menggunakan transaction pooler (port 6543) yang tidak support DDL operations
- `npm run db:seed` gagal karena `.env` tidak ter-load otomatis oleh `tsx`

**Root cause:**
- DDL operations (CREATE TABLE, ALTER TABLE) harus menggunakan session pooler (port 5432), bukan transaction pooler (port 6543)
- `prisma.config.ts` mendefinisikan `directUrl` tapi `db push` command tidak otomatis menggunakannya

---

### 2. Fix Script `db:push`

Dibuat helper script `scripts/db-push.mjs` yang load `.env` dan otomatis menggunakan `DIRECT_URL` (port 5432) untuk push schema:

```js
// scripts/db-push.mjs
import "dotenv/config";
import { execSync } from "child_process";
execSync(`npx prisma db push --url "${process.env.DIRECT_URL}"`, { stdio: "inherit" });
```

`package.json` script diupdate:
```json
"db:push": "tsx --env-file=.env scripts/db-push.mjs"
```

**Hasil:** Schema berhasil di-push, 17 tabel terbuat di Supabase.

---

### 3. Fix Script `db:seed`

**Masalah:** Seed gagal karena dua hal:
1. `tsx` tidak load `.env` secara otomatis — fixed dengan `--env-file=.env` flag
2. Seed menggunakan `create` yang error jika data sudah ada — fixed dengan `upsert` dan `skipDuplicates`

**Perubahan di `prisma/seed.ts`:**
- Tambah `import "dotenv/config"` di baris pertama
- Semua `prisma.xxx.create()` diganti `prisma.xxx.upsert()` dengan where clause unik
- `createMany()` untuk Student dan PaymentSetting ditambah `skipDuplicates: true`
- Institution diberi fixed ID agar upsert bisa bekerja

```json
"db:seed": "tsx --env-file=.env prisma/seed.ts"
```

**Hasil:** Seed idempoten — bisa dijalankan berulang kali tanpa error.

---

### 4. Push Schema & Seed Data

Dijalankan:
```bash
npm run db:push   # ✅ 17 tabel terbuat di Supabase
npm run db:seed   # ✅ Demo data berhasil masuk
```

**Data yang ter-seed:**
| Data | Jumlah |
|------|--------|
| Institution | 1 (Yayasan Pendidikan Muadalah) |
| School | 2 (SMP Muadalah, SMA Muadalah) |
| User | 5 (Super Admin, Admin SMP, Admin SMA, 2 Guru) |
| AcademicYear | 1 (2025/2026 dengan 2 Semester) |
| Subject | 3 (MTK, BIN, BIG) |
| Class | 2 (7A, 8A) |
| Student | 20 (demo students) |
| PaymentSetting | 4 |

---

### 5. Setup Supabase Storage Buckets

Dibuat 4 bucket di Supabase Dashboard → Storage:

| Bucket | Public | Max Size | MIME Types |
|--------|--------|----------|------------|
| `avatars` | ✅ Ya | 2 MB | image/jpeg, image/png, image/webp |
| `students` | ✅ Ya | 5 MB | image/jpeg, image/png, image/webp |
| `documents` | ❌ Tidak | 10 MB | application/pdf, .docx |
| `logos` | ✅ Ya | 2 MB | image/jpeg, image/png, image/webp, image/svg+xml |

`documents` bucket private — akses via signed URL dari server menggunakan `service_role` key.

---

### 6. Buat Users di Supabase Auth

Dibuat 5 user di **Supabase Dashboard → Authentication → Users → Add user** dengan opsi "Auto Confirm User":

| Nama | Email | Role di DB |
|------|-------|-----------|
| Super Admin | admin@muadalah.sch.id | SUPER_ADMIN |
| Admin SMP | admin.smp@muadalah.sch.id | ADMIN |
| Admin SMA | admin.sma@muadalah.sch.id | ADMIN |
| Budi Santoso | guru1@muadalah.sch.id | GURU |
| Ani Wijaya | guru2@muadalah.sch.id | GURU |

> Role tidak ada di Supabase Auth — role disimpan di tabel `SchoolUser` di database.

---

### 7. Sync Auth UUIDs ke Database

Dibuat script `scripts/sync-auth-users.mjs` yang:
1. Fetch semua user dari Supabase Auth menggunakan `service_role` key
2. Match berdasarkan email ke record di tabel `User`
3. Update `supabaseId` dari placeholder (`"super-admin-uuid"`) ke UUID asli

```json
"db:sync-auth": "node --env-file=.env scripts/sync-auth-users.mjs"
```

Dijalankan `npm run db:sync-auth`:

```
✅ Synced: admin@muadalah.sch.id       → dc78ef16-ff98-450e-8942-ea27d3b2b092
✅ Synced: admin.smp@muadalah.sch.id   → 1c8fa362-50ce-47c3-9779-5c2cb921876f
✅ Synced: admin.sma@muadalah.sch.id   → b1367422-8132-44ce-8e1c-a582f908c2ed
✅ Synced: guru1@muadalah.sch.id       → d5fe4b94-a5f4-46e4-beee-76e016271073
✅ Synced: guru2@muadalah.sch.id       → 247761be-13d5-4e0c-95d5-374c4706f1ea
Synced: 5 | Not found: 0
```

---

### 8. Cleanup File Tidak Diperlukan

File dihapus karena sudah tidak relevan:
- `SUPABASE_SETUP.md` — panduan setup manual, sudah tidak diperlukan
- `test-db-connection.js` — script test koneksi ad-hoc, sudah tidak diperlukan

File diupdate:
- `README.md` — ditulis ulang dengan info project yang relevan
- `PROGRESS.md` — diupdate status Supabase setup

---

## Struktur Scripts Saat Ini

```
scripts/
├── db-push.mjs           # Push schema via DIRECT_URL (port 5432)
└── sync-auth-users.mjs   # Sync Supabase Auth UUIDs ke tabel User
```

---

## Status Akhir

| Komponen | Status |
|----------|--------|
| Koneksi database | ✅ Verified (PostgreSQL 17.6) |
| Schema (17 tabel) | ✅ Di Supabase |
| Demo data (seed) | ✅ 20 siswa, 5 users, dll |
| Storage buckets (4) | ✅ Dibuat di dashboard |
| Supabase Auth users (5) | ✅ Dibuat & confirmed |
| Auth UUID sync | ✅ Semua supabaseId sudah real UUID |
| Scripts | ✅ Semua berjalan dengan `npm run` |

**Project siap untuk Phase 3 — implementasi fitur.**
