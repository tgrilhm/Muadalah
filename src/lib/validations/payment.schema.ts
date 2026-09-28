import { z } from 'zod';
import { PaymentType, PaymentStatus } from '@prisma/client';

// ==================== ENUMS ====================

export const paymentTypeSchema = z.nativeEnum(PaymentType);
export const paymentStatusSchema = z.nativeEnum(PaymentStatus);

// ==================== CREATE PAYMENT ====================

export const createPaymentSchema = z.object({
  studentId: z.string().min(1, 'Student ID wajib diisi'),
  type: paymentTypeSchema,
  month: z.number().int().min(1, 'Bulan minimum 1').max(12, 'Bulan maksimum 12'),
  year: z.number().int().min(2000, 'Tahun tidak valid').max(2100, 'Tahun tidak valid'),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  status: paymentStatusSchema.optional().default('LUNAS'),
  notes: z.string().max(500, 'Catatan maksimum 500 karakter').optional(),
  receiptNo: z.string().max(50).optional(), // auto-generated if not provided
});

// ==================== UPDATE PAYMENT ====================

export const updatePaymentSchema = z.object({
  status: paymentStatusSchema.optional(),
  amount: z.number().positive('Jumlah harus lebih dari 0').optional(),
  notes: z.string().max(500).optional().nullable(),
  paidAt: z.string().datetime().optional().nullable(),
});

// ==================== QUERY PARAMS ====================

export const paymentQuerySchema = z.object({
  studentId: z.string().optional(),
  classId: z.string().optional(),
  status: paymentStatusSchema.optional(),
  type: paymentTypeSchema.optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  search: z.string().optional(), // search by student name or NIS
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const tunggakanQuerySchema = z.object({
  classId: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const ringkasanQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

// ==================== TYPE EXPORTS ====================

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type PaymentQuery = z.infer<typeof paymentQuerySchema>;
export type TunggakanQuery = z.infer<typeof tunggakanQuerySchema>;
export type RingkasanQuery = z.infer<typeof ringkasanQuerySchema>;
