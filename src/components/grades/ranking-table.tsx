'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatScore, getScoreColor, getScoreBgColor } from '@/lib/grade.utils';

interface SubjectScore {
  id: string;
  name: string;
  code: string;
}

export interface RankingEntry {
  rank: number;
  studentId: string;
  studentName: string;
  nis: string;
  photo?: string | null;
  averageScore: number;
  subjectScores: Record<string, number | null>;
  completedSubjects: number;
  totalSubjects: number;
}

interface RankingTableProps {
  ranking: RankingEntry[];
  subjects: SubjectScore[];
  isLoading?: boolean;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-sm">
        <span className="text-white text-sm">🥇</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-sm">
        <span className="text-white text-sm">🥈</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-sm">
        <span className="text-white text-sm">🥉</span>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
      <span className="text-slate-500 text-xs font-bold">{rank}</span>
    </div>
  );
}

export function RankingTable({ ranking, subjects, isLoading = false }: RankingTableProps) {
  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 w-16 text-center border-b border-slate-200">Rank</th>
              <th className="py-3 px-4 border-b border-slate-200">Siswa</th>
              <th className="py-3 px-4 w-28 text-center border-b border-slate-200">Rata-rata</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-4 px-4 text-center">
                  <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse mx-auto" />
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-36 bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="h-5 w-12 bg-slate-200 rounded animate-pulse mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (ranking.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl text-slate-300">military_tech</span>
        </div>
        <p className="text-base font-medium text-slate-500">Belum ada data ranking</p>
        <p className="text-sm mt-1">Input nilai terlebih dahulu untuk melihat ranking</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wider sticky top-0">
            <th className="py-3 px-4 w-16 text-center border-b border-slate-200">Rank</th>
            <th className="py-3 px-4 border-b border-slate-200">Siswa</th>
            {subjects.map((s) => (
              <th
                key={s.id}
                className="py-3 px-3 w-24 text-center border-b border-slate-200 whitespace-nowrap"
                title={s.name}
              >
                {s.code}
              </th>
            ))}
            <th className="py-3 px-4 w-32 text-center border-b border-slate-200 bg-blue-50/60 rounded-tr-lg font-bold text-blue-700">
              Rata-rata
            </th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {ranking.map((entry, index) => {
              const isTopThree = entry.rank <= 3;
              return (
                <motion.tr
                  key={entry.studentId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.25 }}
                  className={cn(
                    'border-b border-slate-100 hover:bg-blue-50/30 transition-colors',
                    isTopThree && 'bg-gradient-to-r from-amber-50/40 to-transparent'
                  )}
                >
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <RankBadge rank={entry.rank} />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                          isTopThree
                            ? 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm'
                            : 'bg-gradient-to-br from-slate-400 to-slate-500'
                        )}
                      >
                        {entry.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 leading-tight">
                          {entry.studentName}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">{entry.nis}</p>
                      </div>
                    </div>
                  </td>
                  {subjects.map((s) => {
                    const score = entry.subjectScores[s.id];
                    return (
                      <td key={s.id} className="py-3 px-3 text-center">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            score !== null ? getScoreColor(score) : 'text-slate-300'
                          )}
                        >
                          {score !== null ? formatScore(score) : '—'}
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-3 px-4 text-center bg-blue-50/30">
                    <span
                      className={cn(
                        'text-base font-bold',
                        getScoreColor(entry.averageScore)
                      )}
                    >
                      {formatScore(entry.averageScore)}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
