# Muadalah — Website Manajemen Siswa Sekolah

## Project Overview

Website manajemen siswa sekolah yang komprehensif untuk guru, admin, dan kepala sekolah.

**Tech Stack:**
- Frontend: React 18/19
- Backend: Node.js + Express
- Database: PostgreSQL
- ORM: Prisma

## Core Principles

1. **Security-First** — Data siswa adalah PII (Personally Identifiable Information), selalu lindungi
2. **Test-Driven** — Tulis test sebelum implementasi, target coverage 80%+
3. **Accessible** — UI harus aksesibel untuk semua pengguna (WCAG 2.2 AA)
4. **Performance** — Optimasi untuk data besar (ratusan/ribuan siswa)
5. **Clean Code** — Ikuti coding standards, gunakan TypeScript

## Features

- Dashboard & Statistik
- Manajemen Data Siswa (CRUD, profil, foto)
- Absensi/Kehadiran
- Penilaian/Nilai (input nilai, rapor, ranking)
- Jadwal Pelajaran
- Manajemen Kelas (pembagian kelas, wali kelas)
- Pembayaran/SPP
- Komunikasi Guru-Orang Tua
- Laporan & Export (PDF/Excel)
- Autentikasi & Roles (guru, admin, kepala sekolah)

## Coding Guidelines

### TypeScript/JavaScript
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use `const` over `let`, never use `var`
- Name components with PascalCase, utilities with camelCase

### API Design
- RESTful conventions: `GET /api/students`, `POST /api/students`, etc.
- Use proper HTTP status codes
- Validate all inputs with Zod or Joi
- Always return consistent error responses

### Database
- Use Prisma for all database operations
- Write migrations for schema changes
- Index frequently queried columns
- Use transactions for multi-table operations

### Security
- Hash passwords with bcrypt
- Use JWT for authentication
- Implement role-based access control (RBAC)
- Sanitize all user inputs
- Never expose internal errors to clients

## Rules

See `rules/` directory for detailed guidelines:
- `rules/common/` — Universal coding standards
- `rules/typescript/` — TypeScript-specific patterns
- `rules/react/` — React-specific patterns
