# 🎯 School-Based Filtering Implementation Plan

**Objective:** Filter all student data by selected school (SMP/SMA) across all pages except dashboard

---

## 📊 Current State

- ✅ School switcher working in header
- ✅ selectedSchool stored in Zustand store
- ❌ APIs not filtering by schoolId
- ❌ Frontend components not passing schoolId to APIs

---

## 🔧 What Needs to Change

### Phase 1: API Endpoints (Filter by schoolId)
All these endpoints need to accept optional `schoolId` query param and filter data:

| Endpoint | File | Filter Strategy | Priority |
|----------|------|-----------------|----------|
| GET /api/siswa | `src/app/api/siswa/route.ts` | Match student.class.school.id | 🔴 CRITICAL |
| GET /api/kelas | `src/app/api/kelas/route.ts` | Filter by schoolId directly | 🔴 CRITICAL |
| GET /api/jadwal | `src/app/api/jadwal/route.ts` | Match schedule.class.school.id | 🟡 IMPORTANT |
| GET /api/absensi | `src/app/api/absensi/route.ts` | Match attendance.student.class.school.id | 🟡 IMPORTANT |
| GET /api/nilai | `src/app/api/nilai/route.ts` | Match grade.student.class.school.id | 🟡 IMPORTANT |
| GET /api/pembayaran | `src/app/api/pembayaran/route.ts` | Match payment.student.class.school.id | 🟡 IMPORTANT |
| GET /api/pesan | `src/app/api/pesan/route.ts` | Match message.sender.schoolUsers.schoolId | 🟡 IMPORTANT |

### Phase 2: Frontend Components
Update components to:
1. Get `selectedSchool` from useSchool hook
2. Pass `schoolId` as query param to all API calls
3. Handle empty states when no school selected

**Components to Update:**
- `src/app/(dashboard)/dashboard/siswa/page.tsx`
- `src/app/(dashboard)/dashboard/kelas/page.tsx`
- `src/app/(dashboard)/dashboard/jadwal/page.tsx`
- `src/app/(dashboard)/dashboard/absensi/page.tsx`
- `src/app/(dashboard)/dashboard/nilai/page.tsx`
- `src/app/(dashboard)/dashboard/pembayaran/page.tsx`
- `src/app/(dashboard)/dashboard/komunikasi/page.tsx`

### Phase 3: Custom Hooks
Update TanStack Query hooks to include schoolId:
- `src/hooks/use-siswa.ts`
- `src/hooks/use-kelas.ts`
- `src/hooks/use-jadwal.ts`
- `src/hooks/use-absensi.ts`
- `src/hooks/use-nilai.ts`
- `src/hooks/use-pembayaran.ts`
- `src/hooks/use-pesan.ts`

---

## 🏗️ Implementation Strategy

### Step 1: Update Hooks (5 mins)
Modify hooks to accept `schoolId` parameter and pass to API calls:
```typescript
export function useSiswa(schoolId?: string, params = {}) {
  return useQuery({
    queryKey: ['siswa', schoolId, params],
    queryFn: () => fetch(`/api/siswa?schoolId=${schoolId}&...`).then(r => r.json()),
    enabled: !!schoolId,
  });
}
```

### Step 2: Update API Endpoints (20 mins)
Add schoolId filtering to each endpoint:
```typescript
const schoolId = searchParams.get('schoolId');
const where = {
  student: {
    class: { schoolId }
  }
};
```

### Step 3: Update Components (20 mins)
Pass selectedSchool.id to hooks:
```typescript
const { selectedSchool } = useSchool();
const { data } = useSiswa(selectedSchool?.id);
```

### Step 4: Test Each Page (15 mins)
- Select SMP → verify only SMP data appears
- Select SMA → verify only SMA data appears
- Switch schools → data updates correctly

---

## ⚠️ Important Notes

### Dashboard Exception
Dashboard should NOT filter by schoolId (show aggregate stats for all schools):
- Leave dashboard API calls unchanged
- Dashboard uses `/api/dashboard` which should remain global

### Loading States
- Show loading skeleton when switching schools
- Show empty state if no school selected
- Show "No data" if school has no data

### Query Parameter Pattern
All APIs should accept: `?schoolId=<schoolId>`

### Validation
- Check schoolId is valid UUID/CUID format
- Verify user has access to the selected school (in production)

---

## 📝 Implementation Order

1. **Hooks** - Start here (simplest change)
2. **API Endpoints** - One endpoint at a time
3. **Components** - Update pages to use hooks with schoolId
4. **Testing** - Manual test each page

---

## ✅ Success Criteria

- [ ] Select SMP → only SMP students/classes/data visible
- [ ] Select SMA → only SMA students/classes/data visible
- [ ] Switching schools updates all pages automatically
- [ ] Dashboard still shows all schools' aggregate data
- [ ] No API calls when no school selected (enabled: !!schoolId)
- [ ] No console errors

---

## 🚀 Ready to Start?

Recommend implementing in this order:
1. **use-siswa.ts** hook
2. **/api/siswa/route.ts** endpoint
3. **siswa/page.tsx** component
4. Repeat for other features

Each step should be tested before moving to next.

**Proceed with this plan?** Reply with feature name (e.g., "start with siswa") to begin implementation.
