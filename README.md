# Muadalah — Sistem Manajemen Siswa

Platform manajemen siswa untuk satu lembaga pendidikan yang mengelola beberapa sekolah (SMP & SMA). Dibangun dengan Next.js, Supabase, dan Prisma.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query + Zustand |
| ORM | Prisma 7 |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment variables
Salin `.env.local.example` ke `.env` dan isi dengan credentials Supabase:
```bash
cp .env.local.example .env
```

### 3. Push schema & seed data
```bash
npm run db:push        # Push schema ke Supabase
npm run db:seed        # Seed demo data
npm run db:sync-auth   # Sync Supabase Auth UUIDs ke database
```

### 4. Generate Prisma client
```bash
npm run db:generate
```

### 5. Jalankan dev server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@muadalah.sch.id | *(set saat buat user di Supabase Auth)* |
| Admin SMP | admin.smp@muadalah.sch.id | *(set saat buat user di Supabase Auth)* |
| Admin SMA | admin.sma@muadalah.sch.id | *(set saat buat user di Supabase Auth)* |
| Guru 1 | guru1@muadalah.sch.id | *(set saat buat user di Supabase Auth)* |
| Guru 2 | guru2@muadalah.sch.id | *(set saat buat user di Supabase Auth)* |

---

## Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Run ESLint

npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema ke DB via DIRECT_URL
npm run db:seed          # Seed demo data (idempoten)
npm run db:sync-auth     # Sync Supabase Auth UUIDs ke database
npm run db:studio        # Buka Prisma Studio (GUI database)
```

---

## Struktur Project

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Login page
│   ├── (dashboard)/      # Protected pages
│   └── api/              # API Route Handlers
├── components/
│   ├── ui/               # shadcn/ui base components
│   ├── layout/           # Sidebar, Header
│   └── students/         # Student feature components
├── hooks/                # useAuth, useSchool, useAcademicYear
├── lib/
│   ├── supabase/         # Browser + Server Supabase clients
│   ├── prisma.ts         # Prisma singleton
│   ├── rbac.ts           # Role-based access control
│   └── supabase-storage.ts  # Storage helpers
├── stores/               # Zustand stores
└── types/                # TypeScript types

prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Demo data seeder

scripts/
├── db-push.mjs           # Push schema via DIRECT_URL
└── sync-auth-users.mjs   # Sync Auth UUIDs ke DB
```

---

## Progress

Lihat [PROGRESS.md](./PROGRESS.md) untuk status implementasi tiap phase.
Lihat [implementation_plan.md](./implementation_plan.md) untuk rencana lengkap.
