import { DayOfWeek } from '@prisma/client';

// ==================== JADWAL (SCHEDULE) TYPES ====================

export interface ScheduleTeacher {
  id: string;
  user: {
    id: string;
    name: string;
  };
}

export interface ScheduleClass {
  id: string;
  name: string;
  grade: number;
  major?: string | null;
}

export interface ScheduleSubject {
  id: string;
  name: string;
  code: string;
}

export interface ScheduleWithRelations {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string | null;
  classId: string;
  subjectId: string;
  createdAt: Date | string;
  class: ScheduleClass;
  subject: ScheduleSubject;
  teacher: ScheduleTeacher | null;
}

// ==================== FORM TYPES ====================

export interface CreateScheduleForm {
  classId: string;
  subjectId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface UpdateScheduleForm extends Partial<CreateScheduleForm> {}

// ==================== SUBJECT OPTION FOR SCHEDULE FORM ====================

export interface SubjectOptionForSchedule {
  id: string;
  name: string;
  code: string;
  teacher: {
    id: string;
    user: { name: string };
  } | null;
}

// ==================== WEEKLY GRID TYPES ====================

export const DAY_ORDER: DayOfWeek[] = [
  'SENIN',
  'SELASA',
  'RABU',
  'KAMIS',
  'JUMAT',
  'SABTU',
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  SENIN: 'Senin',
  SELASA: 'Selasa',
  RABU: 'Rabu',
  KAMIS: 'Kamis',
  JUMAT: 'Jumat',
  SABTU: 'Sabtu',
};

// Color palette for subject cards (cycling by subject index)
export const SCHEDULE_COLORS = [
  {
    bg: 'bg-blue-50',
    border: 'border-l-blue-500',
    title: 'text-blue-900',
    sub: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    bg: 'bg-slate-50',
    border: 'border-l-slate-500',
    title: 'text-slate-900',
    sub: 'text-slate-600',
    badge: 'bg-slate-100 text-slate-700',
  },
  {
    bg: 'bg-red-50',
    border: 'border-l-red-500',
    title: 'text-red-900',
    sub: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
  },
  {
    bg: 'bg-emerald-50',
    border: 'border-l-emerald-500',
    title: 'text-emerald-900',
    sub: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    bg: 'bg-amber-50',
    border: 'border-l-amber-500',
    title: 'text-amber-900',
    sub: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  {
    bg: 'bg-violet-50',
    border: 'border-l-violet-500',
    title: 'text-violet-900',
    sub: 'text-violet-600',
    badge: 'bg-violet-100 text-violet-700',
  },
] as const;
