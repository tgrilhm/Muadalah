'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatScore, getScoreBgColor, GradeBreakdown } from '@/lib/grade.utils';
import { GradeTypeBadge } from './grade-type-badge';
import { GradeType } from '@prisma/client';

interface SubjectGrade {
  type: GradeType;
  score: number;
  description?: string | null;
}

interface RaporCardProps {
  subject: { id: string; name: string; code: string };
  grades: SubjectGrade[];
  finalScore: number;
  avgUH: number | null;
  utsScore: number | null;
  uasScore: number | null;
  isComplete: boolean;
  index?: number;
}

export function RaporCard({
  subject,
  grades,
  finalScore,
  avgUH,
  utsScore,
  uasScore,
  isComplete,
  index = 0,
}: RaporCardProps) {
  const gradeLabel =
    finalScore >= 90 ? 'A' : finalScore >= 80 ? 'B' : finalScore >= 70 ? 'C' : 'D';

  // Get UH grades
  const uhGrades = grades.filter((g) => g.type === 'ULANGAN_HARIAN');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {subject.code.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm leading-tight">{subject.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{subject.code}</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <span className={cn('text-2xl font-bold', isComplete ? 'text-blue-600' : 'text-slate-400')}>
            {isComplete ? formatScore(finalScore) : '—'}
          </span>
          {isComplete && (
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                getScoreBgColor(finalScore)
              )}
            >
              {gradeLabel}
            </span>
          )}
          {!isComplete && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Belum lengkap
            </span>
          )}
        </div>
      </div>

      {/* Grade Breakdown */}
      <div className="px-5 py-4 space-y-3">
        {/* UH Scores */}
        {uhGrades.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <GradeTypeBadge type="ULANGAN_HARIAN" size="sm" />
                <span className="text-xs text-slate-500">Rata-rata: {avgUH !== null ? formatScore(avgUH) : '—'}</span>
              </div>
              <span className="text-xs text-slate-400">Bobot 30%</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {uhGrades.map((g, i) => (
                <div key={i} className={cn('px-2 py-1 rounded-lg text-xs font-medium', getScoreBgColor(g.score))}>
                  UH{i + 1}: {formatScore(g.score)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UTS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GradeTypeBadge type="UTS" size="sm" />
            <span className="text-xs text-slate-500">Bobot 30%</span>
          </div>
          <span
            className={cn(
              'text-sm font-semibold px-3 py-1 rounded-lg',
              utsScore !== null ? getScoreBgColor(utsScore) : 'text-slate-300 bg-slate-50'
            )}
          >
            {utsScore !== null ? formatScore(utsScore) : '—'}
          </span>
        </div>

        {/* UAS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GradeTypeBadge type="UAS" size="sm" />
            <span className="text-xs text-slate-500">Bobot 40%</span>
          </div>
          <span
            className={cn(
              'text-sm font-semibold px-3 py-1 rounded-lg',
              uasScore !== null ? getScoreBgColor(uasScore) : 'text-slate-300 bg-slate-50'
            )}
          >
            {uasScore !== null ? formatScore(uasScore) : '—'}
          </span>
        </div>

        {/* Formula info */}
        {isComplete && (
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>
              ({avgUH !== null ? formatScore(avgUH) : '—'} × 30%) + ({utsScore !== null ? formatScore(utsScore) : '—'} × 30%) + ({uasScore !== null ? formatScore(uasScore) : '—'} × 40%) ={' '}
              <strong className="text-blue-600">{formatScore(finalScore)}</strong>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
