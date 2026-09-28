import { z } from 'zod';
import { DayOfWeek } from '@prisma/client';

// ==================== ENUMS ====================

export const dayOfWeekSchema = z.nativeEnum(DayOfWeek);

// ==================== TIME FORMAT ====================

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const timeSchema = z
  .string()
  .regex(timeRegex, 'Format waktu harus HH:MM (contoh: 07:00)');

// ==================== CREATE SCHEDULE ====================

export const createScheduleSchema = z
  .object({
    classId: z.string().min(1, 'ID kelas wajib diisi'),
    subjectId: z.string().min(1, 'ID mata pelajaran wajib diisi'),
    dayOfWeek: dayOfWeekSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    room: z.string().max(50, 'Nama ruangan maksimal 50 karakter').optional(),
  })
  .refine(
    (data) => {
      // endTime must be after startTime (string comparison is valid for HH:MM zero-padded)
      return data.endTime > data.startTime;
    },
    {
      message: 'Jam selesai harus lebih dari jam mulai',
      path: ['endTime'],
    }
  );

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

// ==================== UPDATE SCHEDULE ====================

export const updateScheduleSchema = z
  .object({
    classId: z.string().min(1).optional(),
    subjectId: z.string().min(1).optional(),
    dayOfWeek: dayOfWeekSchema.optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    room: z.string().max(50).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: 'Jam selesai harus lebih dari jam mulai',
      path: ['endTime'],
    }
  );

export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

// ==================== QUERY PARAMS ====================

export const scheduleQuerySchema = z.object({
  classId: z.string().optional(),
  dayOfWeek: dayOfWeekSchema.optional(),
  subjectId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(100),
});

export type ScheduleQuery = z.infer<typeof scheduleQuerySchema>;
