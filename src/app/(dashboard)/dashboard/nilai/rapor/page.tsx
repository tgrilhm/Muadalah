'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { RaporCard } from '@/components/grades/rapor-card';
import { formatScore, getScoreBgColor } from '@/lib/grade.utils';
import { GradeType } from '@prisma/client';

// ==================== TYPES ====================

interface SubjectRapor {
  subject: { id: string; name: string; code: string };
  grades: Array<{ type: GradeType; score: number; id: string; description: string | null }>;
  finalScore: number;
  avgUH: number | null;
  utsScore: number | null;
  uasScore: number | null;
  isComplete: boolean;
  gradeLabel: string;
}

interface RaporData {
  student: { id: string; name: string; nis: string; photo: string | null; class: { id: string; name: string; grade: number } };
  semester: { id: string; name: string; number: number; academicYear: string };
  subjects: SubjectRapor[];
  overallAverage: number;
  totalSubjects: number;
  completedSubjects: number;
}

// ==================== MAIN PAGE ====================

export default function RaporPage() {
  const { toast } = useToast();

  const [semesters, setSemesters] = useState<Array<{ id: string; name: string; isActive?: boolean }>>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string; nis: string }>>([]);

  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [raporData, setRaporData] = useState<RaporData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load semesters
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

  // Load classes
  useEffect(() => {
    fetch('/api/kelas')
      .then((r) => r.json())
      .then((data) => { if (data.success) setClasses(data.data ?? []); })
      .catch(console.error);
  }, []);

  // Load students when class is selected
  useEffect(() => {
    if (!selectedClassId) { setStudents([]); return; }
    fetch(`/api/kelas/${selectedClassId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStudents(data.data?.students ?? []);
      })
      .catch(console.error);
  }, [selectedClassId]);

  const loadRapor = async () => {
    if (!selectedStudentId || !selectedSemesterId) return;
    setIsLoading(true);
    setRaporData(null);
    try {
      const res = await fetch(`/api/nilai/rapor?studentId=${selectedStudentId}&semesterId=${selectedSemesterId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Gagal memuat rapor');
      setRaporData(data.data);
    } catch (err) {
      toast({
        title: 'Gagal memuat rapor',
        description: err instanceof Error ? err.message : 'Coba lagi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Rapor Siswa</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Lihat nilai akhir berbobot per mata pelajaran untuk setiap siswa dalam satu semester.
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Semester */}
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

          {/* Kelas */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Kelas</label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => { setSelectedClassId(e.target.value); setSelectedStudentId(''); }}
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

          {/* Siswa */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Siswa</label>
            <div className="relative">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={!selectedClassId || students.length === 0}
                className="w-full appearance-none bg-slate-50 text-slate-800 text-sm py-2.5 px-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Pilih Siswa --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.nis})</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={loadRapor}
            disabled={!selectedStudentId || !selectedSemesterId || isLoading}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold py-2.5 px-5 rounded-xl hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-200"
          >
            {isLoading ? (
              <><span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>Memuat...</>
            ) : (
              <><span className="material-symbols-outlined text-lg">article</span>Tampilkan Rapor</>
            )}
          </button>
        </div>
      </motion.div>

      {/* Rapor Content */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-3 w-16 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-3/4 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {raporData && !isLoading && (
          <motion.div
            key="rapor-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-5"
          >
            {/* Student Summary Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg shadow-blue-200/40">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold border border-white/30">
                    {raporData.student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{raporData.student.name}</h2>
                    <p className="text-blue-200 text-sm mt-0.5">
                      NIS: {raporData.student.nis} • {raporData.student.class.name}
                    </p>
                    <p className="text-blue-300 text-xs mt-0.5">
                      {raporData.semester.academicYear} — {raporData.semester.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold mb-1">Rata-rata Akhir</p>
                  <p className="text-4xl font-black">
                    {raporData.completedSubjects > 0 ? formatScore(raporData.overallAverage) : '—'}
                  </p>
                  <p className="text-blue-200 text-sm mt-1">
                    {raporData.completedSubjects}/{raporData.totalSubjects} mapel selesai
                  </p>
                </div>
              </div>
            </div>

            {/* Subject Cards Grid */}
            {raporData.subjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
                <span className="material-symbols-outlined text-4xl mb-3 text-slate-300">article</span>
                <p className="font-medium text-slate-500">Belum ada nilai</p>
                <p className="text-sm mt-1">Input nilai terlebih dahulu di halaman Input Nilai</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {raporData.subjects.map((subject, index) => (
                  <RaporCard
                    key={subject.subject.id}
                    subject={subject.subject}
                    grades={subject.grades}
                    finalScore={subject.finalScore}
                    avgUH={subject.avgUH}
                    utsScore={subject.utsScore}
                    uasScore={subject.uasScore}
                    isComplete={subject.isComplete}
                    index={index}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {!raporData && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-blue-300">article</span>
            </div>
            <p className="text-base font-medium text-slate-500">Pilih siswa untuk melihat rapor</p>
            <p className="text-sm mt-1 text-slate-400">Pilih semester, kelas, dan nama siswa di atas</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
