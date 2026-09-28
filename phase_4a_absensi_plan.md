# Phase 4A: Absensi (Attendance System) - Implementation Plan

## Overview

Phase 4A focuses on building a comprehensive attendance tracking system for daily student attendance management, recap reports, statistics, and automated alerts for frequent absences.

## Requirements from PROGRESS.md

| Task | Priority | Description |
|------|----------|-------------|
| API: Input bulk | HIGH | Bulk attendance input for class |
| API: Rekap | HIGH | Attendance recap/summary |
| UI: Input harian | HIGH | Daily attendance input form |
| UI: Rekap | HIGH | Attendance recap view |
| UI: Statistik | MEDIUM | Attendance statistics dashboard |
| Alert siswa | MEDIUM | Automated alerts for frequent absences |

---

## Database Schema (Already in Prisma)

```prisma
model Attendance {
  id          String
  date        DateTime @db.Date
  status      AttendanceStatus  // HADIR, ALFA, SAKIT, IZIN, TERLAMBAT
  notes       String?
  
  studentId   String
  student     Student
  
  semesterId  String
  semester    Semester
  
  recordedById String
  recordedBy   SchoolUser  // Teacher who recorded
  
  @@unique([studentId, date])
}

enum AttendanceStatus {
  HADIR
  ALFA
  SAKIT
  IZIN
  TERLAMBAT
}
```

---

## Phase 1: UI Design & Implementation

### 1.1 Daily Attendance Input Page

**Route:** `/dashboard/absensi/harian`

**Features:**
- ✅ Select class from dropdown
- ✅ Select date (default: today)
- ✅ Show list of all students in class
- ✅ Quick status buttons for each student (Hadir/Alfa/Sakit/Izin/Terlambat)
- ✅ Bulk actions: Mark all as present, Copy from previous day
- ✅ Notes field for each student
- ✅ Save button with loading state
- ✅ Show existing attendance if already recorded

**Design:**
- Card-based layout with student avatars
- Color-coded status badges (Green/Red/Yellow/Blue/Orange)
- Quick toggle buttons for fast input
- Responsive grid layout

### 1.2 Attendance Recap Page

**Route:** `/dashboard/absensi/rekap`

**Features:**
- ✅ Filter by class, date range, student
- ✅ Table view with student rows and date columns
- ✅ Color-coded status cells
- ✅ Summary row showing totals
- ✅ Export to Excel/PDF
- ✅ Percentage calculations
- ✅ Search functionality

**Design:**
- Horizontal scrollable table for date columns
- Sticky first column (student names)
- Summary statistics cards at top
- Filter bar with dropdowns

### 1.3 Statistics Dashboard

**Route:** `/dashboard/absensi/statistik`

**Features:**
- ✅ Overall attendance rate (pie/donut chart)
- ✅ Daily attendance trend (line chart)
- ✅ Top absent students (list with avatars)
- ✅ Attendance by class comparison (bar chart)
- ✅ Monthly comparison
- ✅ Filter by date range, class, semester

**Design:**
- Dashboard with 4-6 stat cards
- Charts using Recharts
- Responsive grid layout

---

## Phase 2: API Implementation

### 2.1 Validation Schemas

**File:** `src/lib/validations/attendance.schema.ts`

```typescript
- AttendanceQuerySchema
- BulkAttendanceInputSchema
- SingleAttendanceSchema
- AttendanceRekapQuerySchema
- AttendanceStatsQuerySchema
```

### 2.2 Bulk Attendance Input API

**POST /api/absensi/bulk**

**Request Body:**
```json
{
  "classId": "cl123",
  "date": "2024-08-03",
  "attendances": [
    {
      "studentId": "st1",
      "status": "HADIR",
      "notes": ""
    },
    {
      "studentId": "st2",
      "status": "SAKIT",
      "notes": "Demam"
    }
  ]
}
```

**Features:**
- Validate all students belong to class
- Upsert operation (update if exists, create if not)
- Transaction for atomicity
- Prevent duplicate entries per student per date
- Record teacher who input the data

### 2.3 Attendance Recap API

**GET /api/absensi/rekap**

**Query Params:**
- `classId` (required)
- `startDate` (required)
- `endDate` (required)
- `studentId` (optional - for individual)

**Response:**
```json
{
  "data": [
    {
      "student": { "id": "st1", "name": "Ahmad", "nis": "001" },
      "attendances": [
        { "date": "2024-08-01", "status": "HADIR" },
        { "date": "2024-08-02", "status": "ALFA" }
      ],
      "summary": {
        "total": 20,
        "hadir": 18,
        "alfa": 1,
        "sakit": 1,
        "percentage": 90
      }
    }
  ]
}
```

### 2.4 Statistics API

**GET /api/absensi/statistik**

**Query Params:**
- `schoolId`
- `classId` (optional)
- `startDate`
- `endDate`

**Response:**
```json
{
  "overall": {
    "totalDays": 20,
    "totalStudents": 100,
    "totalPresent": 1800,
    "percentage": 90
  },
  "byStatus": {
    "HADIR": 1800,
    "ALFA": 50,
    "SAKIT": 100,
    "IZIN": 30,
    "TERLAMBAT": 20
  },
  "dailyTrend": [
    { "date": "2024-08-01", "percentage": 95 }
  ],
  "topAbsent": [
    { "student": {...}, "absentCount": 5 }
  ]
}
```

---

## Phase 3: Alert System

### 3.1 Automated Alerts

**Trigger Conditions:**
- Student absent (ALFA) for 3+ consecutive days
- Student absent (any status) for 5+ days in a month
- Student late (TERLAMBAT) for 5+ times in a month

**Implementation:**
- Background job runs daily
- Check attendance patterns
- Create alerts/notifications
- Send to parents via communication system
- Dashboard widget for teachers

---

## Security & Authorization

**Role-Based Access:**
- **GURU:** Can input attendance for their classes only
- **KEPALA_SEKOLAH:** Can view all classes, cannot input
- **ADMIN:** Full access (input + view all)

**Data Isolation:**
- All queries filter by schoolId
- Teachers can only access their assigned classes
- Attendance records tied to semester

---

## Implementation Order

### Week 1: UI Foundation
1. Create attendance validation schemas
2. Build daily input page UI
3. Implement class/student selection
4. Create status toggle components

### Week 2: Bulk Input & API
1. Implement bulk attendance API
2. Connect UI to API
3. Add loading states and error handling
4. Write API tests

### Week 3: Recap & Statistics
1. Build recap page UI
2. Implement recap API with aggregations
3. Build statistics dashboard
4. Implement charts with Recharts

### Week 4: Alerts & Polish
1. Implement alert detection logic
2. Create alert notifications
3. Add export functionality (Excel/PDF)
4. Integration testing
5. Performance optimization

---

## Technical Considerations

### Performance
- Attendance queries can be heavy (100+ students × 30 days = 3000 records)
- Use database indexes on: `studentId`, `date`, `semesterId`
- Implement pagination for large result sets
- Consider caching for statistics

### Data Integrity
- Use unique constraint: `[studentId, date]`
- Transaction for bulk inserts
- Validate date ranges (cannot record future attendance)
- Semester validation (date must be within semester)

### UX Enhancements
- Keyboard shortcuts for quick input (H, A, S, I, T keys)
- Auto-save draft
- Copy from previous day
- Quick filters and search
- Mobile-responsive design

---

## Testing Strategy

### Unit Tests
- Validation schemas
- Date calculations
- Percentage calculations
- Alert detection logic

### Integration Tests
- Bulk attendance API
- Recap API with filters
- Statistics aggregations
- Transaction rollback scenarios

### E2E Tests
- Complete attendance input flow
- Recap report generation
- Export functionality

---

## Success Metrics

- ✅ Teacher can record attendance for 30 students in under 2 minutes
- ✅ Recap loads in under 3 seconds for 100 students × 30 days
- ✅ Statistics dashboard loads in under 2 seconds
- ✅ 100% accuracy in percentage calculations
- ✅ Alerts trigger within 24 hours of condition met

---

## Files to Create

**Validation:**
- `src/lib/validations/attendance.schema.ts`

**API Routes:**
- `src/app/api/absensi/bulk/route.ts`
- `src/app/api/absensi/rekap/route.ts`
- `src/app/api/absensi/statistik/route.ts`
- `src/app/api/absensi/route.ts` (list/single CRUD)

**UI Pages:**
- `src/app/(dashboard)/dashboard/absensi/harian/page.tsx`
- `src/app/(dashboard)/dashboard/absensi/rekap/page.tsx`
- `src/app/(dashboard)/dashboard/absensi/statistik/page.tsx`

**Components:**
- `src/components/attendance/attendance-grid.tsx`
- `src/components/attendance/student-status-toggle.tsx`
- `src/components/attendance/recap-table.tsx`
- `src/components/attendance/stats-card.tsx`

**Tests:**
- `src/app/api/absensi/__tests__/`
- `src/lib/validations/__tests__/attendance.schema.test.ts`

---

## Next Steps After Approval

1. Create validation schemas
2. Implement daily input UI
3. Build bulk attendance API
4. Connect UI to API
5. Implement recap functionality
6. Build statistics dashboard
7. Add alert system
8. Comprehensive testing

**Estimated Time:** 3-4 weeks
