import { z } from 'zod';

/**
 * Schema for querying/filtering classes (GET /api/kelas)
 */
export const ClassQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  grade: z.coerce.number().int().min(7).max(12).optional(), // 7-9 (SMP), 10-12 (SMA)
  major: z.enum(['IPA', 'IPS', 'BAHASA']).optional(), // Only for SMA
  schoolId: z.string().optional(), // For SUPER_ADMIN to filter by school
  sortBy: z.enum(['name', 'grade', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ClassQueryInput = z.infer<typeof ClassQuerySchema>;

/**
 * Schema for creating a new class (POST /api/kelas)
 */
export const CreateClassSchema = z.object({
  name: z.string().min(1, 'Nama kelas wajib diisi').max(50, 'Nama kelas terlalu panjang'),
  grade: z.number().int().min(7, 'Tingkat minimal 7').max(12, 'Tingkat maksimal 12'),
  major: z.enum(['IPA', 'IPS', 'BAHASA']).optional().nullable(),
  schoolId: z.string().cuid('ID sekolah tidak valid'),
  homeroomTeacherId: z.string().cuid('ID wali kelas tidak valid').optional().nullable(),
}).refine(
  (data) => {
    // SMP (7-9) should not have major
    if (data.grade >= 7 && data.grade <= 9) {
      return !data.major;
    }
    // SMA grade 10 doesn't require major
    if (data.grade === 10) {
      return true;
    }
    // SMA grade 11-12 should have major
    if (data.grade >= 11 && data.grade <= 12) {
      return !!data.major;
    }
    return true;
  },
  {
    message: 'Jurusan hanya untuk SMA kelas 11-12',
    path: ['major'],
  }
);

export type CreateClassInput = z.infer<typeof CreateClassSchema>;

/**
 * Schema for updating a class (PATCH /api/kelas/[id])
 */
export const UpdateClassSchema = z.object({
  name: z.string().min(1, 'Nama kelas wajib diisi').max(50, 'Nama kelas terlalu panjang').optional(),
  grade: z.number().int().min(7, 'Tingkat minimal 7').max(12, 'Tingkat maksimal 12').optional(),
  major: z.enum(['IPA', 'IPS', 'BAHASA']).optional().nullable(),
  homeroomTeacherId: z.string().cuid('ID wali kelas tidak valid').optional().nullable(),
}).refine(
  (data) => {
    // If grade is being updated, validate major requirement
    if (data.grade !== undefined) {
      // SMP (7-9) should not have major
      if (data.grade >= 7 && data.grade <= 9) {
        return !data.major;
      }
      // SMA grade 11-12 should have major if provided
      if (data.grade >= 11 && data.grade <= 12 && data.major !== undefined) {
        return !!data.major;
      }
    }
    return true;
  },
  {
    message: 'Jurusan hanya untuk SMA kelas 11-12',
    path: ['major'],
  }
);

export type UpdateClassInput = z.infer<typeof UpdateClassSchema>;

/**
 * Schema for bulk assigning students to a class (POST /api/kelas/[id]/assign-siswa)
 */
export const AssignStudentsSchema = z.object({
  studentIds: z.array(z.string().cuid('ID siswa tidak valid')).min(1, 'Minimal 1 siswa harus dipilih'),
  action: z.enum(['assign', 'unassign']), // assign = add to class, unassign = remove from class
});

export type AssignStudentsInput = z.infer<typeof AssignStudentsSchema>;

/**
 * Schema for setting homeroom teacher (PUT /api/kelas/[id]/wali-kelas)
 */
export const SetHomeroomTeacherSchema = z.object({
  homeroomTeacherId: z.string().cuid('ID wali kelas tidak valid').nullable(),
});

export type SetHomeroomTeacherInput = z.infer<typeof SetHomeroomTeacherSchema>;
