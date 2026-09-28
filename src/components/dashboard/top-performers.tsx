'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useDashboardNilai } from '@/hooks/use-dashboard';
import { TopPerformer } from '@/types/dashboard';

const RANK_STYLES = [
  { bg: 'from-yellow-400 to-amber-500', label: '🥇', ring: 'ring-yellow-300' },
  { bg: 'from-slate-400 to-slate-500', label: '🥈', ring: 'ring-slate-300' },
  { bg: 'from-amber-600 to-amber-700', label: '🥉', ring: 'ring-amber-400' },
  { bg: 'from-blue-500 to-blue-600', label: '4', ring: 'ring-blue-300' },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
}

interface PerformerCardProps {
  performer: TopPerformer;
  index: number;
}

function PerformerCard({ performer, index }: PerformerCardProps) {
  const style = RANK_STYLES[index] ?? RANK_STYLES[3];

  return (
    <motion.div
      className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] p-4 hover:shadow-md transition-all group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
      whileHover={{ y: -3 }}
    >
      <div className="flex flex-col items-center text-center gap-3">
        {/* Avatar */}
        <div className="relative">
          {performer.photo ? (
            <img
              src={performer.photo}
              alt={performer.name}
              className={`w-14 h-14 rounded-full object-cover ring-2 ${style.ring}`}
            />
          ) : (
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${style.bg} flex items-center justify-center text-white font-bold text-lg ring-2 ${style.ring}`}>
              {getInitials(performer.name)}
            </div>
          )}
          {/* Rank badge */}
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${style.bg} flex items-center justify-center text-white text-xs font-bold shadow-md`}>
            {index < 3 ? style.label : style.label}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="font-semibold text-[var(--muadalah-on-surface)] text-sm leading-tight">{performer.name}</p>
          <p className="text-xs text-[var(--muadalah-on-surface-variant)] mt-0.5">Kelas {performer.kelas}</p>
        </div>

        {/* Score */}
        <div className={`text-2xl font-bold tabular-nums ${getScoreColor(performer.rataRata)}`}>
          {performer.rataRata.toFixed(1)}
          <span className="text-xs font-normal text-[var(--muadalah-on-surface-variant)] ml-0.5">/ 100</span>
        </div>
      </div>
    </motion.div>
  );
}

export function TopPerformers() {
  const { data: response, isLoading } = useDashboardNilai();
  const performers: TopPerformer[] = response?.data?.topPerformers ?? [];

  if (isLoading) {
    return (
      <div className="bg-[var(--muadalah-surface-card)] rounded-2xl border border-[var(--muadalah-border-subtle)] p-6 shadow-sm animate-pulse">
        <div className="h-5 w-36 bg-[var(--muadalah-surface-container)] rounded mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-[var(--muadalah-surface-container)] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (performers.length === 0) {
    return (
      <div className="bg-[var(--muadalah-surface-card)] rounded-2xl border border-[var(--muadalah-border-subtle)] p-6 shadow-sm">
        <h3 className="text-base font-semibold text-[var(--muadalah-on-surface)] mb-4">🏆 Performa Terbaik</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="material-symbols-outlined text-[40px] text-[var(--muadalah-on-surface-variant)] mb-2">emoji_events</span>
          <p className="text-sm text-[var(--muadalah-on-surface-variant)]">Belum ada data nilai semester ini</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-[var(--muadalah-surface-card)] rounded-2xl border border-[var(--muadalah-border-subtle)] p-6 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--muadalah-on-surface)]">🏆 Performa Terbaik</h3>
          <p className="text-xs text-[var(--muadalah-on-surface-variant)] mt-0.5">Siswa dengan rata-rata nilai tertinggi</p>
        </div>
        <Link
          href="/dashboard/nilai"
          className="text-xs text-[var(--muadalah-primary)] hover:underline flex items-center gap-0.5"
        >
          Lihat semua
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {performers.map((p, i) => (
          <PerformerCard key={p.id} performer={p} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
