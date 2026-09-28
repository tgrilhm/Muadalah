'use client';

import { GradeType } from '@prisma/client';
import { cn } from '@/lib/utils';

interface GradeTypeBadgeProps {
  type: GradeType;
  size?: 'sm' | 'md' | 'lg';
  showFull?: boolean;
  className?: string;
}

const TYPE_CONFIG: Record<
  GradeType,
  { abbr: string; full: string; bg: string; text: string; border: string }
> = {
  ULANGAN_HARIAN: {
    abbr: 'UH',
    full: 'Ulangan Harian',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  UTS: {
    abbr: 'UTS',
    full: 'Ujian Tengah Semester',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  UAS: {
    abbr: 'UAS',
    full: 'Ujian Akhir Semester',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  TUGAS: {
    abbr: 'Tugas',
    full: 'Tugas',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  PRAKTIKUM: {
    abbr: 'Prak',
    full: 'Praktikum',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  PROYEK: {
    abbr: 'Proyek',
    full: 'Proyek',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
};

const SIZE_CLASSES = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export function GradeTypeBadge({
  type,
  size = 'md',
  showFull = false,
  className,
}: GradeTypeBadgeProps) {
  const config = TYPE_CONFIG[type];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        config.bg,
        config.text,
        config.border,
        SIZE_CLASSES[size],
        className
      )}
    >
      {showFull ? config.full : config.abbr}
    </span>
  );
}

export { TYPE_CONFIG };
