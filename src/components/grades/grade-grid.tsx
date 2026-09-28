'use client';

import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatScore, getScoreColor, KKM } from '@/lib/grade.utils';

export interface GradeGridStudent {
  id: string;
  name: string;
  nis: string;
  photo?: string | null;
}

export interface GradeGridRow {
  studentId: string;
  score: number | null;
  isModified?: boolean;
}

interface GradeGridProps {
  students: GradeGridStudent[];
  rows: GradeGridRow[];
  finalScores?: Record<string, number | null>;
  onScoreChange: (studentId: string, score: number | null) => void;
  isLoading?: boolean;
  isReadOnly?: boolean;
}

function ScoreInput({
  value,
  onChange,
  onKeyDown,
  inputRef,
  isReadOnly,
}: {
  value: number | null;
  onChange: (val: number | null) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  isReadOnly?: boolean;
}) {
  const isLow = value !== null && value < KKM;

  return (
    <input
      ref={inputRef}
      type="number"
      min={0}
      max={100}
      placeholder="-"
      value={value ?? ''}
      readOnly={isReadOnly}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') {
          onChange(null);
          return;
        }
        const num = parseFloat(raw);
        if (!isNaN(num) && num >= 0 && num <= 100) {
          onChange(num);
        }
      }}
      onKeyDown={onKeyDown}
      className={cn(
        'w-full text-center py-1.5 px-1 rounded-lg text-sm font-medium',
        'outline-none transition-all duration-150',
        'focus:ring-2 focus:ring-blue-400/50 focus:bg-white',
        isReadOnly
          ? 'bg-transparent cursor-default'
          : 'bg-slate-50 border border-slate-200 hover:border-blue-300',
        isLow ? 'text-red-600 border-red-200 bg-red-50/50 focus:bg-red-50' : 'text-slate-800'
      )}
    />
  );
}

export function GradeGrid({
  students,
  rows,
  finalScores,
  onScoreChange,
  isLoading = false,
  isReadOnly = false,
}: GradeGridProps) {
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const rowMap = new Map(rows.map((r) => [r.studentId, r]));

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
      const nextIndex =
        e.key === 'Enter' || e.key === 'ArrowDown'
          ? currentIndex + 1
          : e.key === 'ArrowUp'
          ? currentIndex - 1
          : null;

      if (nextIndex !== null && nextIndex >= 0 && nextIndex < students.length) {
        e.preventDefault();
        const nextStudent = students[nextIndex];
        inputRefs.current.get(nextStudent.id)?.focus();
      }
    },
    [students]
  );

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center border-b border-slate-200">No</th>
              <th className="py-3 px-4 w-28 border-b border-slate-200">NIS</th>
              <th className="py-3 px-4 border-b border-slate-200">Nama Siswa</th>
              <th className="py-3 px-4 w-28 text-center border-b border-slate-200">Nilai</th>
              <th className="py-3 px-4 w-28 text-center border-b border-slate-200">Nilai Akhir</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-3 px-4">
                  <div className="h-4 w-6 mx-auto bg-slate-200 rounded animate-pulse" />
                </td>
                <td className="py-3 px-4">
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                </td>
                <td className="py-3 px-4">
                  <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
                </td>
                <td className="py-3 px-4">
                  <div className="h-8 bg-slate-200 rounded animate-pulse" />
                </td>
                <td className="py-3 px-4">
                  <div className="h-4 w-12 mx-auto bg-slate-200 rounded animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl text-slate-300">group</span>
        </div>
        <p className="text-base font-medium text-slate-500">Tidak ada siswa</p>
        <p className="text-sm mt-1">Pilih kelas terlebih dahulu untuk melihat daftar siswa</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[700px] text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <th className="py-3 px-4 w-12 text-center border-b border-slate-200">No</th>
            <th className="py-3 px-4 w-28 border-b border-slate-200">NIS</th>
            <th className="py-3 px-4 border-b border-slate-200">Nama Siswa</th>
            <th
              className="py-3 px-4 w-32 text-center border-b border-slate-200 bg-blue-50/50"
              title="Nilai yang diinput"
            >
              Nilai
            </th>
            {finalScores && (
              <th className="py-3 px-4 w-32 text-center border-b border-slate-200 bg-slate-100/60 rounded-tr-lg">
                Nilai Akhir
              </th>
            )}
          </tr>
        </thead>
        <tbody className="text-slate-800">
          {students.map((student, index) => {
            const row = rowMap.get(student.id);
            const score = row?.score ?? null;
            const finalScore = finalScores?.[student.id] ?? null;
            const isModified = row?.isModified;
            const isLow = score !== null && score < KKM;

            return (
              <motion.tr
                key={student.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                className={cn(
                  'border-b border-slate-100 hover:bg-blue-50/30 transition-colors group',
                  isLow && 'bg-red-50/20',
                  isModified && 'bg-amber-50/30'
                )}
              >
                <td className="py-2.5 px-4 text-center text-slate-400 text-sm font-mono">
                  {index + 1}
                </td>
                <td className="py-2.5 px-4 text-slate-500 font-mono text-xs tracking-wider">
                  {student.nis}
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm text-slate-700">{student.name}</span>
                    {isLow && score !== null && (
                      <span className="hidden group-hover:inline-flex items-center gap-1 text-red-500 text-xs">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        Di bawah KKM
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-3 bg-blue-50/20">
                  <ScoreInput
                    value={score}
                    onChange={(val) => onScoreChange(student.id, val)}
                    isReadOnly={isReadOnly}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    inputRef={{
                      current: inputRefs.current.get(student.id) ?? null,
                    } as React.RefObject<HTMLInputElement | null>}
                  />
                </td>
                {finalScores && (
                  <td className="py-2.5 px-4 text-center bg-slate-50/60">
                    <span
                      className={cn(
                        'text-base font-bold',
                        finalScore !== null ? getScoreColor(finalScore) : 'text-slate-300'
                      )}
                    >
                      {finalScore !== null ? formatScore(finalScore) : '—'}
                    </span>
                  </td>
                )}
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
