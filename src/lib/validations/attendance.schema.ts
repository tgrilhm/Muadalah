import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

// Attendance status enum validation
export const attendanceStatusSchema = z.nativeEnum(AttendanceStatus);

// Single attendance record schema
export const singleAttendanceSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  status: attendanceStatusSchema,
  notes: z.string().optional(),
});

// Bulk attendance input schema
export const bulkAttendanceInputSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  attendances: z.array(singleAttendanceSchema).min(1, 'At least one attendance record is required'),
});

// Attendance query schema
export const attendanceQuerySchema = z.object({
  studentId: z.string().optional(),
  classId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  status: attendanceStatusSchema.optional(),
  semesterId: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

// Attendance recap query schema
export const attendanceRekapQuerySchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  studentId: z.string().optional(),
});

// Attendance statistics query schema
export const attendanceStatsQuerySchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  classId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
});

// Type exports for TypeScript
export type SingleAttendanceInput = z.infer<typeof singleAttendanceSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceInputSchema>;
export type AttendanceQuery = z.infer<typeof attendanceQuerySchema>;
export type AttendanceRekapQuery = z.infer<typeof attendanceRekapQuerySchema>;
export type AttendanceStatsQuery = z.infer<typeof attendanceStatsQuerySchema>;
