'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { RankingTable, RankingEntry } from '@/components/grades/ranking-table';
import { formatScore, getScoreBgColor, getScoreColor } from '@/lib/grade.utils';
import { cn } from '@/lib/utils';

interface SubjectScore {
  id: string;
  name: string;
  code: string;
}

interface RankingData {
  class: { id: string; name: string; grade: number };
  semester: { id: string; name: string; number: number; academicYear: string };
  subjects: SubjectScore[];
  ranking: RankingEntry[];
  totalStudents: number;
}

export default function RankingPage() {
  const { toast } = useToast();

  const [semesters, setSemesters] = useState<Array<{ id: string; name: string }>>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/semester')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSemesters(data.data ?? []);
          const active = data.data?.find((s: { isActive?: boolean }) => s.isActive);
          if (active) setSelectedSemesterId(active.id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch('/api/kelas')
      .then((r) => r.json())
      .then((data) => { if (data.success) setClasses(data.data ?? []); })
      .catch(console.error);
  }, []);

  const loadRanking = async () => {
    if (!selectedClassId || !selectedSemesterId) return;
    setIsLoading(true);
    setRankingData(null);
    try {
      const res = await fetch(
        `/api/nilai/ranking?classId=${selectedClassId}&semesterId=${selectedSemesterId}`
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Gagal memuat ranking');
      setRankingData(data.data);
    } catch (err) {
      toast({
        title: 'Gagal memuat ranking',
        description: err instanceof Error ? err.message : 'Coba lagi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Stats from ranking data
  const stats = rankingData
    ? {
        highest: rankingData.ranking[0]?.averageScore ?? 0,
        lowest: rankingData.ranking[rankingData.ranking.length - 1]?.averageScore ?? 0,
        average:
          rankingData.ranking.length > 0
            ? Math.round(
                (rankingData.ranking.reduce((s, r) => s + r.averageScore, 0) /
                  rankingData.ranking.length) *
                  10
              ) / 10
            : 0,
        belowKKM: rankingData.ranking.filter((r) => r.averageScore < 70).length,
      }
    : null;

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Ranking Kelas</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Peringkat siswa berdasarkan rata-rata nilai akhir dari semua mata pelajaran dalam satu semester.
          </p>
        </div>
      </motion.div>

      {/* Filter Panel */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Semester</label>
            <div className="relative">
              <select
                value={selectedSemesterId}
                onChange={(e) => setSelectedSemesterId(e.target.value)}
                className="w-full appearance-none bg-slate-50 text-slate-800 text-sm py-2.5 px-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all cursor-pointer"
              >
                <option value="">-- Pilih Semester --</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Kelas</label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full appearance-none bg-slate-50 text-slate-800 text-sm py-2.5 px-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all cursor-pointer"
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={loadRanking}
            disabled={!selectedClassId || !selectedSemesterId || isLoading}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold py-2.5 px-5 rounded-xl hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all shadow-sm shadow-blue-200"
          >
            {isLoading ? (
              <><span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>Memuat...</>
            ) : (
              <><span className="material-symbols-outlined text-lg">military_tech</span>Tampilkan Ranking</>
            )}
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <AnimatePresence>
        {stats && rankingData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              {
                label: 'Total Siswa',
                value: rankingData.totalStudents,
                icon: 'group',
                color: 'from-blue-500 to-blue-700',
              },
              {
                label: 'Nilai Tertinggi',
                value: formatScore(stats.highest),
                icon: 'trending_up',
                color: 'from-emerald-500 to-emerald-700',
              },
              {
                label: 'Rata-rata Kelas',
                value: formatScore(stats.average),
                icon: 'calculate',
                color: 'from-indigo-500 to-indigo-700',
              },
              {
                label: 'Di Bawah KKM',
                value: stats.belowKKM,
                icon: 'warning',
                color: 'from-amber-500 to-red-500',
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm',
                      stat.color
                    )}
                  >
                    <span className="material-symbols-outlined text-white text-xl">{stat.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                    <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ranking Table */}
      <AnimatePresence mode="wait">
        {(rankingData || isLoading) && (
          <motion.div
            key="ranking-table"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Table Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/40 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-white text-xl">military_tech</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    Ranking {rankingData ? `— ${rankingData.class.name}` : ''}
                  </h2>
                  {rankingData && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {rankingData.semester.academicYear} • {rankingData.semester.name}
                    </p>
                  )}
                </div>
              </div>
              {rankingData && (
                <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  {rankingData.subjects.length} mata pelajaran
                </div>
              )}
            </div>

            <RankingTable
              ranking={rankingData?.ranking ?? []}
              subjects={rankingData?.subjects ?? []}
              isLoading={isLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!rankingData && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-indigo-300">military_tech</span>
          </div>
          <p className="text-base font-medium text-slate-500">Pilih kelas untuk melihat ranking</p>
          <p className="text-sm mt-1 text-slate-400">Pilih semester dan kelas di atas</p>
        </motion.div>
      )}
    </div>
  );
}
