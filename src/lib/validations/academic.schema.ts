import { z } from 'zod';

/**
 * Academic Year (Tahun Ajaran) Validation Schemas
 */

export const AcademicYearQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  schoolId: z.string().optional(), // For SUPER_ADMIN
  sortBy: z.enum(['name', 'startDate', 'createdAt']).default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AcademicYearQueryInput = z.infer<typeof AcademicYearQuerySchema>;

export const CreateAcademicYearSchema = z.object({
  name: z.string().min(1, 'Nama tahun ajaran wajib diisi').max(20, 'Nama terlalu panjang'),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  isActive: z.boolean().default(false),
  schoolId: z.string().cuid('ID sekolah tidak valid'),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start < end;
  },
  {
    message: 'Tanggal mulai harus lebih awal dari tanggal akhir',
    path: ['endDate'],
  }
);

export type CreateAcademicYearInput = z.infer<typeof CreateAcademicYearSchema>;

export const UpdateAcademicYearSchema = z.object({
  name: z.string().min(1).max(20).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start < end;
    }
    return true;
  },
  {
    message: 'Tanggal mulai harus lebih awal dari tanggal akhir',
    path: ['endDate'],
  }
);

export type UpdateAcademicYearInput = z.infer<typeof UpdateAcademicYearSchema>;

/**
 * Semester Validation Schemas
 */

export const SemesterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  academicYearId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['number', 'startDate', 'createdAt']).default('number'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type SemesterQueryInput = z.infer<typeof SemesterQuerySchema>;

export const CreateSemesterSchema = z.object({
  name: z.enum(['Ganjil', 'Genap']),
  number: z.number().int().min(1).max(2),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  isActive: z.boolean().default(false),
  academicYearId: z.string().cuid('ID tahun ajaran tidak valid'),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start < end;
  },
  {
    message: 'Tanggal mulai harus lebih awal dari tanggal akhir',
    path: ['endDate'],
  }
).refine(
  (data) => {
    // Ensure name matches number
    if (data.number === 1 && data.name !== 'Ganjil') return false;
    if (data.number === 2 && data.name !== 'Genap') return false;
    return true;
  },
  {
    message: 'Nama semester harus sesuai dengan nomor (1=Ganjil, 2=Genap)',
    path: ['name'],
  }
);

export type CreateSemesterInput = z.infer<typeof CreateSemesterSchema>;

export const UpdateSemesterSchema = z.object({
  name: z.enum(['Ganjil', 'Genap']).optional(),
  number: z.number().int().min(1).max(2).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start < end;
    }
    return true;
  },
  {
    message: 'Tanggal mulai harus lebih awal dari tanggal akhir',
    path: ['endDate'],
  }
);

export type UpdateSemesterInput = z.infer<typeof UpdateSemesterSchema>;

/**
 * Subject (Mata Pelajaran) Validation Schemas
 */

export const SubjectQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  schoolId: z.string().optional(), // For SUPER_ADMIN
  sortBy: z.enum(['name', 'code', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type SubjectQueryInput = z.infer<typeof SubjectQuerySchema>;

export const CreateSubjectSchema = z.object({
  code: z
    .string()
    .min(2, 'Kode minimal 2 karakter')
    .max(10, 'Kode maksimal 10 karakter')
    .regex(/^[A-Z0-9]+$/, 'Kode hanya boleh huruf kapital dan angka'),
  name: z.string().min(1, 'Nama mata pelajaran wajib diisi').max(100, 'Nama terlalu panjang'),
  description: z.string().max(500, 'Deskripsi terlalu panjang').optional(),
  schoolId: z.string().cuid('ID sekolah tidak valid'),
});

export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;

export const UpdateSubjectSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[A-Z0-9]+$/, 'Kode hanya boleh huruf kapital dan angka')
    .optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
});

export type UpdateSubjectInput = z.infer<typeof UpdateSubjectSchema>;
