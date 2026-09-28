'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { GradeGrid, GradeGridRow, GradeGridStudent } from '@/components/grades/grade-grid';
import { GradeTypeBadge } from '@/components/grades/grade-type-badge';
import { calculateFinalScore, formatScore, getScoreColor } from '@/lib/grade.utils';
import { GradeType } from '@prisma/client';

// ==================== TYPES ====================

interface SelectOption {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface AcademicYear {
  id: string;
  name: string;
  semesters: Array<{ id: string; name: string; number: number; isActive: boolean }>;
}

interface ClassOption {
  id: string;
  name: string;
  grade: number;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

// ==================== CONSTANTS ====================

const GRADE_TYPES: Array<{ value: GradeType; label: string }> = [
  { value: 'ULANGAN_HARIAN', label: 'Ulangan Harian (UH)' },
  { value: 'UTS', label: 'Ujian Tengah Semester (UTS)' },
  { value: 'UAS', label: 'Ujian Akhir Semester (UAS)' },
  { value: 'TUGAS', label: 'Tugas' },
  { value: 'PRAKTIKUM', label: 'Praktikum' },
  { value: 'PROYEK', label: 'Proyek' },
];

// ==================== MAIN PAGE ====================

export default function InputNilaiPage() {
  const { toast } = useToast();

  // Filter state
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedType, setSelectedType] = useState<GradeType>('ULANGAN_HARIAN');
  const [gradeDate, setGradeDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Data state
  const [semesters, setSemesters] = useState<Array<{ id: string; name: string; number: number }>>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [students, setStudents] = useState<GradeGridStudent[]>([]);

  // Grid state
  const [rows, setRows] = useState<GradeGridRow[]>([]);
  const [finalScores, setFinalScores] = useState<Record<string, number | null>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Loading state
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // ==================== DATA FETCHING ====================

  useEffect(() => {
    setIsLoadingSemesters(true);
    fetch('/api/semester')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setSemesters(data.data);
          const active = data.data.find((s: SelectOption & { isActive?: boolean }) => s.isActive);
          if (active) setSelectedSemesterId(active.id);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingSemesters(false));
  }, []);

  useEffect(() => {
    setIsLoadingClasses(true);
    setSelectedClassId('');
    setStudents([]);
    setIsDataLoaded(false);
    fetch('/api/kelas')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) setClasses(data.data);
      })
      .catch(console.error)
      .finally(() => setIsLoadingClasses(false));
  }, [selectedSemesterId]);

  useEffect(() => {
    if (!selectedClassId) {
      setSubjects([]);
      return;
    }
    fetch(`/api/mata-pelajaran?classId=${selectedClassId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) setSubjects(data.data);
      })
      .catch(console.error);
  }, [selectedClassId]);

  // ==================== LOAD GRADE DATA ====================

  const loadGradeData = useCallback(async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedSemesterId) return;

    setIsLoadingStudents(true);
    try {
      // Load students in class
      const studentsRes = await fetch(`/api/kelas/${selectedClassId}`);
      const studentsData = await studentsRes.json();

      if (!studentsData.success) throw new Error('Gagal memuat data siswa');

      const classStudents: GradeGridStudent[] = studentsData.data?.students ?? [];
      setStudents(classStudents);

      // Load existing grades for this selection
      const gradesRes = await fetch(
        `/api/nilai?classId=${selectedClassId}&subjectId=${selectedSubjectId}&semesterId=${selectedSemesterId}&type=${selectedType}`
      );
      const gradesData = await gradesRes.json();

      const existingGrades = gradesData.success ? gradesData.data : [];

      // Build rows — group by student, get most recent score
      const latestByStudent = new Map<string, number>();
      for (const g of existingGrades) {
        // Keep last for UH (show count), but for grid we just show the latest
        latestByStudent.set(g.student.id, g.score);
      }

      const initialRows: GradeGridRow[] = classStudents.map((s) => ({
        studentId: s.id,
        score: latestByStudent.get(s.id) ?? null,
        isModified: false,
      }));

      setRows(initialRows);
      computeFinalScores(classStudents.map((s) => s.id), initialRows, selectedSubjectId, selectedSemesterId);
      setIsDataLoaded(true);
    } catch (err) {
      console.error(err);
      toast({ title: 'Gagal memuat data', description: 'Coba lagi beberapa saat', variant: 'destructive' });
    } finally {
      setIsLoadingStudents(false);
    }
  }, [selectedClassId, selectedSubjectId, selectedSemesterId, selectedType, toast]);

  // Compute final scores for display
  const computeFinalScores = async (
    studentIds: string[],
    currentRows: GradeGridRow[],
    subjectId: string,
    semesterId: string
  ) => {
    const scores: Record<string, number | null> = {};
    for (const studentId of studentIds) {
      const res = await fetch(`/api/nilai?studentId=${studentId}&subjectId=${subjectId}&semesterId=${semesterId}`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        const result = calculateFinalScore(data.data);
        scores[studentId] = result.finalScore;
      } else {
        scores[studentId] = null;
      }
    }
    setFinalScores(scores);
  };

  // ==================== SCORE CHANGES ====================

  const handleScoreChange = useCallback((studentId: string, score: number | null) => {
    setRows((prev) =>
      prev.map((r) =>
        r.studentId === studentId ? { ...r, score, isModified: true } : r
      )
    );
  }, []);

  // ==================== SAVE ====================

  const handleSave = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedSemesterId) return;

    const modifiedRows = rows.filter((r) => r.isModified && r.score !== null);
    if (modifiedRows.length === 0) {
      toast({ title: 'Tidak ada perubahan', description: 'Ubah nilai terlebih dahulu' });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/nilai/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          semesterId: selectedSemesterId,
          type: selectedType,
          date: gradeDate,
          grades: modifiedRows.map((r) => ({
            studentId: r.studentId,
            score: r.score,
          })),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Gagal menyimpan');

      setLastSavedAt(new Date());
      setRows((prev) => prev.map((r) => ({ ...r, isModified: false })));
      toast({
        title: '✅ Nilai tersimpan',
        description: `${modifiedRows.length} nilai berhasil disimpan`,
      });

      // Refresh final scores
      await computeFinalScores(
        students.map((s) => s.id),
        rows,
        selectedSubjectId,
        selectedSemesterId
      );
    } catch (err) {
      toast({
        title: 'Gagal menyimpan',
        description: err instanceof Error ? err.message : 'Coba lagi',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setRows((prev) => prev.map((r) => ({ ...r, score: null, isModified: false })));
  };

  const modifiedCount = rows.filter((r) => r.isModified).length;
  const filledCount = rows.filter((r) => r.score !== null).length;

  // ==================== RENDER ====================

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Input Nilai Siswa</h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Masukkan dan kelola nilai akademik siswa untuk berbagai jenis evaluasi pembelajaran.
          Sistem akan menghitung nilai akhir secara otomatis berdasarkan bobot yang ditentukan.
        </p>
      </motion.div>

      {/* Filter Panel */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Semester */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Semester
            </label>
            <div className="relative">
              <select
                value={selectedSemesterId}
                onChange={(e) => setSelectedSemesterId(e.target.value)}
                disabled={isLoadingSemesters}
                className="w-full appearance-none bg-slate-50 text-slate-800 text-sm py-2.5 px-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all cursor-pointer"
              >
                <option value="">-- Pilih Semester --</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Kelas */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Kelas
            </label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={isLoadingClasses || !selectedSemesterId}
                className="w-full appearance-none bg-slate-50 text-slate-800 text-sm py-2.5 px-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Mata Pelajaran */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Mata Pelajaran
            </label>
            <div className="relative">
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={!selectedClassId || subjects.length === 0}
                className="w-full appearance-none bg-slate-50 text-slate-800 text-sm py-2.5 px-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Pilih Mapel --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Jenis Nilai */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Jenis Nilai
            </label>
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as GradeType)}
                className="w-full appearance-none bg-slate-50 text-slate-800 text-sm py-2.5 px-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all cursor-pointer"
              >
                {GRADE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* Date + Load button */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Tanggal Nilai
            </label>
            <input
              type="date"
              value={gradeDate}
              onChange={(e) => setGradeDate(e.target.value)}
              className="bg-slate-50 text-slate-800 text-sm py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="flex-1" />
          <button
            onClick={loadGradeData}
            disabled={!selectedClassId || !selectedSubjectId || !selectedSemesterId || isLoadingStudents}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold py-2.5 px-5 rounded-xl hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-200 mt-auto"
          >
            {isLoadingStudents ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                Memuat...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">filter_list</span>
                Tampilkan Data
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Grade Grid Panel */}
      <AnimatePresence mode="wait">
        {isDataLoaded && (
          <motion.div
            key="grade-grid"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col"
          >
            {/* Grid Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-white text-xl">edit_note</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800">Lembar Penilaian</h2>
                    <GradeTypeBadge type={selectedType} />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {subjects.find((s) => s.id === selectedSubjectId)?.name} •{' '}
                    {classes.find((c) => c.id === selectedClassId)?.name} •{' '}
                    {semesters.find((s) => s.id === selectedSemesterId)?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Auto-save indicator */}
                {lastSavedAt && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Tersimpan {lastSavedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                {modifiedCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    {modifiedCount} perubahan belum disimpan
                  </div>
                )}
                {/* Stats */}
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
                  <span className="material-symbols-outlined text-sm">people</span>
                  {filledCount}/{students.length} siswa
                </div>
              </div>
            </div>

            {/* Grid Content */}
            <GradeGrid
              students={students}
              rows={rows}
              finalScores={finalScores}
              onScoreChange={handleScoreChange}
              isLoading={isLoadingStudents}
            />

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">info</span>
                </div>
                <span>
                  Rumus Nilai Akhir: (Rata-rata UH × 30%) + (UTS × 30%) + (UAS × 40%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || modifiedCount === 0}
                  className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold py-2 px-5 rounded-xl hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-200"
                >
                  {isSaving ? (
                    <>
                      <span className="material-symbols-outlined text-lg animate-spin">
                        progress_activity
                      </span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">save</span>
                      Simpan Nilai{modifiedCount > 0 ? ` (${modifiedCount})` : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state - not loaded */}
      {!isDataLoaded && !isLoadingStudents && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-blue-300">edit_note</span>
          </div>
          <p className="text-base font-medium text-slate-500">Pilih filter di atas</p>
          <p className="text-sm mt-1 text-slate-400">
            Pilih semester, kelas, mata pelajaran, dan klik Tampilkan Data
          </p>
        </motion.div>
      )}
    </div>
  );
}
