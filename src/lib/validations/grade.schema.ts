import { z } from 'zod';
import { GradeType } from '@prisma/client';

// ==================== ENUMS ====================

export const gradeTypeSchema = z.nativeEnum(GradeType);

// ==================== SINGLE GRADE ====================

export const createGradeSchema = z.object({
  studentId: z.string().min(1, 'Student ID wajib diisi'),
  subjectId: z.string().min(1, 'Subject ID wajib diisi'),
  semesterId: z.string().min(1, 'Semester ID wajib diisi'),
  type: gradeTypeSchema,
  score: z.number().min(0, 'Nilai minimum 0').max(100, 'Nilai maksimum 100'),
  maxScore: z.number().min(1).max(100).optional().default(100),
  weight: z.number().min(0.1).max(10).optional().default(1),
  description: z.string().max(255).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD').optional(),
});

export const updateGradeSchema = createGradeSchema.partial().omit({
  studentId: true,
  subjectId: true,
  semesterId: true,
});

// ==================== BULK INPUT ====================

export const bulkGradeItemSchema = z.object({
  studentId: z.string().min(1, 'Student ID wajib diisi'),
  score: z.number().min(0, 'Nilai minimum 0').max(100, 'Nilai maksimum 100'),
  description: z.string().max(255).optional(),
});

export const bulkGradeInputSchema = z.object({
  classId: z.string().min(1, 'Class ID wajib diisi'),
  subjectId: z.string().min(1, 'Subject ID wajib diisi'),
  semesterId: z.string().min(1, 'Semester ID wajib diisi'),
  type: gradeTypeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD').optional(),
  grades: z
    .array(bulkGradeItemSchema)
    .min(1, 'Minimal 1 data nilai harus diisi')
    .max(100, 'Maksimum 100 siswa per bulk input'),
});

// ==================== QUERY PARAMS ====================

export const gradeQuerySchema = z.object({
  studentId: z.string().optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  semesterId: z.string().optional(),
  type: gradeTypeSchema.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export const raporQuerySchema = z.object({
  studentId: z.string().min(1, 'Student ID wajib diisi'),
  semesterId: z.string().min(1, 'Semester ID wajib diisi'),
});

export const rankingQuerySchema = z.object({
  classId: z.string().min(1, 'Class ID wajib diisi'),
  semesterId: z.string().min(1, 'Semester ID wajib diisi'),
});

export const statistikQuerySchema = z.object({
  classId: z.string().min(1, 'Class ID wajib diisi'),
  subjectId: z.string().optional(),
  semesterId: z.string().min(1, 'Semester ID wajib diisi'),
});

// ==================== TYPE EXPORTS ====================

export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
export type BulkGradeInput = z.infer<typeof bulkGradeInputSchema>;
export type GradeQuery = z.infer<typeof gradeQuerySchema>;
export type RaporQuery = z.infer<typeof raporQuerySchema>;
export type RankingQuery = z.infer<typeof rankingQuerySchema>;
export type StatistikQuery = z.infer<typeof statistikQuerySchema>;
