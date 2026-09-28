import { z } from 'zod';
import { Gender, StudentStatus } from '@prisma/client';

/**
 * Schema for creating parent contact
 */
export const ParentContactSchema = z.object({
  name: z.string().min(1, 'Nama orang tua wajib diisi'),
  relation: z.string().min(1, 'Hubungan wajib diisi'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').max(15, 'Nomor telepon maksimal 15 digit'),
  email: z.string().email('Email tidak valid').optional().nullable(),
  address: z.string().optional().nullable(),
});

/**
 * Schema for creating a new student
 */
export const CreateStudentSchema = z.object({
  // Required fields
  nis: z.string().min(1, 'NIS wajib diisi'),
  name: z.string().min(1, 'Nama siswa wajib diisi').max(100, 'Nama terlalu panjang'),
  gender: z.nativeEnum(Gender, { required_error: 'Jenis kelamin wajib dipilih' }),
  classId: z.string().min(1, 'Kelas wajib dipilih'),

  // Optional fields
  nisn: z.string().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  birthDate: z.string().datetime().optional().nullable()
    .or(z.date().optional().nullable()),
  religion: z.string().optional().nullable(),
  address: z.string().max(500, 'Alamat terlalu panjang').optional().nullable(),
  phone: z.string().min(10).max(15).optional().nullable(),
  photo: z.string().url('URL foto tidak valid').optional().nullable(),
  enrollDate: z.string().datetime().optional().nullable()
    .or(z.date().optional().nullable()),
  status: z.nativeEnum(StudentStatus).optional().default(StudentStatus.AKTIF),

  // Parent contacts (at least 1 required)
  parentContacts: z.array(ParentContactSchema).min(1, 'Minimal 1 kontak orang tua wajib diisi'),
});

/**
 * Schema for updating a student (all fields optional except id)
 */
export const UpdateStudentSchema = z.object({
  nis: z.string().min(1).optional(),
  nisn: z.string().optional().nullable(),
  name: z.string().min(1).max(100).optional(),
  gender: z.nativeEnum(Gender).optional(),
  birthPlace: z.string().optional().nullable(),
  birthDate: z.string().datetime().optional().nullable()
    .or(z.date().optional().nullable()),
  religion: z.string().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().min(10).max(15).optional().nullable(),
  photo: z.string().url().optional().nullable(),
  status: z.nativeEnum(StudentStatus).optional(),
  classId: z.string().optional(),
});

/**
 * Schema for query parameters when listing students
 */
export const StudentQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  search: z.string().optional(),
  classId: z.string().optional(),
  status: z.nativeEnum(StudentStatus).optional(),
  sortBy: z.enum(['name', 'nis', 'createdAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Schema for photo upload validation
 */
export const PhotoUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File wajib diupload' })
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Ukuran file maksimal 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Format file harus JPEG, PNG, atau WebP'
    ),
});

// Type exports for TypeScript
export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;
export type UpdateStudentInput = z.infer<typeof UpdateStudentSchema>;
export type StudentQueryInput = z.infer<typeof StudentQuerySchema>;
export type ParentContactInput = z.infer<typeof ParentContactSchema>;
