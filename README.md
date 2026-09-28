# Muadalah — School Management System

Comprehensive school management platform for educational institutions, built for teachers, administrators, and principals. Supports multiple schools (Junior High & Senior High) under one organization.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9-teal)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ Features

### 📊 Dashboard & Analytics
- Real-time statistics and insights
- Attendance charts and trends
- Grade distribution visualizations
- Payment status overview

### 👨‍🎓 Student Management
- Complete CRUD operations
- Student profiles with photos
- Parent contact information
- Bulk import/export (Excel)
- Advanced filtering and search

### 📅 Attendance System
- Daily attendance tracking
- Multiple status types (present, absent, sick, permission)
- Attendance reports and exports
- Historical data analysis

### 📝 Grading System
- Input grades (assignments, midterm, final)
- Report cards (rapor) generation
- Class rankings
- Grade statistics and analysis

### 📚 Schedule Management
- Class schedules
- Subject assignments
- Teacher timetables
- Room allocation

### 🏫 Class Management
- Class creation and configuration
- Student-class assignments
- Homeroom teacher assignment
- Academic year management

### 💰 Payment Tracking
- SPP (tuition) management
- Payment history
- Outstanding balances
- Payment receipts (PDF)

### 💬 Communication
- Teacher-parent messaging
- Broadcast messages
- Message templates
- Unread notifications

### 📄 Reports & Export
- Excel exports (students, attendance, grades, payments)
- PDF report cards
- Statistical reports
- Customizable date ranges

### 🔐 Authentication & Authorization
- Supabase Auth integration
- Role-based access control (RBAC)
- Multi-school support with school-level isolation
- Roles: Super Admin, Admin, Teacher, Principal

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 (strict mode) |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **State Management** | TanStack Query + Zustand |
| **ORM** | Prisma 7 + PostgreSQL adapter |
| **Database** | Supabase PostgreSQL |
| **Authentication** | Supabase Auth |
| **Storage** | Supabase Storage |
| **Testing** | Vitest + React Testing Library |
| **Validation** | Zod |
| **Charts** | Recharts |
| **PDF Generation** | jsPDF |
| **Excel** | ExcelJS |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tgrilhm/Muadalah.git
   cd Muadalah
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   
   Copy `.env.local.example` to `.env`:
   ```bash
   cp .env.local.example .env
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=your_pooling_connection_string
   DIRECT_URL=your_direct_connection_string
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

6. **Seed demo data** (optional)
   ```bash
   npm run db:seed
   npm run db:sync-auth
   ```

7. **Run development server**
   ```bash
   npm run dev
   ```

8. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📋 Available Scripts

```bash
# Development
npm run dev                     # Start dev server
npm run build                   # Production build
npm run start                   # Start production server
npm run lint                    # Run ESLint

# Database
npm run db:generate             # Generate Prisma Client
npm run db:push                 # Push schema to DB
npm run db:seed                 # Seed demo data
npm run db:seed:comprehensive   # Comprehensive seed data
npm run db:sync-auth            # Sync Supabase Auth users
npm run db:studio               # Open Prisma Studio

# Testing
npm run test                    # Run tests
npm run test:ui                 # Run tests with UI
npm run test:coverage           # Generate coverage report
```

---

## 🏗️ Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Authentication pages
│   ├── (dashboard)/            # Protected dashboard pages
│   │   ├── dashboard/          # Main dashboard
│   │   ├── siswa/              # Students
│   │   ├── kelas/              # Classes
│   │   ├── absensi/            # Attendance
│   │   ├── nilai/              # Grades
│   │   ├── jadwal/             # Schedules
│   │   ├── pembayaran/         # Payments
│   │   ├── komunikasi/         # Communication
│   │   └── pengaturan/         # Settings
│   └── api/                    # API Route Handlers
│       ├── students/           # Student API
│       ├── kelas/              # Class API
│       ├── absensi/            # Attendance API
│       ├── nilai/              # Grades API
│       ├── jadwal/             # Schedule API
│       ├── pembayaran/         # Payment API
│       ├── pesan/              # Messages API
│       └── laporan/            # Reports API
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Layout components
│   ├── students/               # Student components
│   ├── attendance/             # Attendance components
│   ├── grades/                 # Grade components
│   ├── kelas/                  # Class components
│   ├── payments/               # Payment components
│   └── komunikasi/             # Communication components
├── hooks/                      # React hooks
│   ├── use-auth.ts
│   ├── use-school.ts
│   ├── use-students.ts
│   ├── use-absensi.ts
│   ├── use-dashboard.ts
│   └── ...
├── lib/
│   ├── supabase/               # Supabase clients
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── middleware.ts       # Middleware client
│   ├── validations/            # Zod schemas
│   ├── prisma.ts               # Prisma singleton
│   ├── rbac.ts                 # Access control
│   ├── constants.ts            # Constants
│   └── utils.ts                # Utilities
├── stores/                     # Zustand stores
│   └── app-store.ts
├── types/                      # TypeScript types
└── middleware.ts               # Next.js middleware

prisma/
├── schema.prisma               # Database schema
└── seed.ts                     # Seeding script

scripts/
├── db-push.mjs                 # Schema push script
└── sync-auth-users.mjs         # Auth sync script
```

---

## 🔒 Security

This application handles **Personally Identifiable Information (PII)**. Security measures:

- ✅ **Authentication**: Supabase Auth with JWT tokens
- ✅ **Authorization**: Role-based access control (RBAC)
- ✅ **Input Validation**: Zod schemas on all API routes
- ✅ **SQL Injection Protection**: Prisma ORM parameterized queries
- ✅ **XSS Protection**: React's built-in escaping + CSP headers
- ✅ **CSRF Protection**: SameSite cookies
- ✅ **Data Isolation**: School-level RLS policies
- ✅ **Secure Storage**: Supabase Storage with access policies

### Environment Variables

**Never commit `.env` files.** Sensitive keys:
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- `DIRECT_URL` (server-side only)
- Keep `NEXT_PUBLIC_*` vars safe (exposed to browser)

---

## 🧪 Testing

This project follows Test-Driven Development (TDD) with 80%+ coverage target.

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Generate coverage
npm run test:coverage
```

Test structure:
- **Unit Tests**: `lib/validations/__tests__/`
- **API Tests**: `app/api/*/__tests__/`
- **Component Tests**: (coming soon)
- **E2E Tests**: (coming soon)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new features
4. Ensure all tests pass (`npm test`)
5. Follow the coding standards (see `.agents/AGENTS.md`)
6. Commit using conventional commits
7. Push to your fork
8. Open a Pull Request

### Coding Standards

- **TypeScript**: Strict mode, no `any`
- **Components**: Functional with hooks, PascalCase names
- **APIs**: RESTful conventions, proper HTTP codes
- **Validation**: Zod for all inputs
- **Testing**: TDD, 80%+ coverage
- **Accessibility**: WCAG 2.2 AA compliance

See [.agents/AGENTS.md](.agents/AGENTS.md) for detailed guidelines.

---

## 📖 Documentation

- [Implementation Plan](implementation_plan.md) — Full feature roadmap
- [Progress Tracker](PROGRESS.md) — Current implementation status
- [Phase 0A Complete](PHASE_0A_COMPLETE.md) — Landing page completion
- [Phase 0B Complete](PHASE_0B_COMPLETE.md) — Authentication completion
- [Design System](phase_0_design_system_enhanced.md) — Design tokens & components

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

**Muadalah Development Team**

- Organization: [tgrilhm](https://github.com/tgrilhm)
- Repository: [Muadalah](https://github.com/tgrilhm/Muadalah)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

**Built with ❤️ for Indonesian schools**
