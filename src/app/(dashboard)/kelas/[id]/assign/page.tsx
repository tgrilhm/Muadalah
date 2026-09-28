'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

type Student = {
  id: string;
  nis: string;
  name: string;
  gender: 'LAKI_LAKI' | 'PEREMPUAN';
  classId: string | null;
  class?: {
    name: string;
  } | null;
};

export default function AssignStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [className, setClassName] = useState('');
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, [classId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch class info
      const classRes = await fetch(`/api/classes/${classId}`);
      const classData = await classRes.json();
      if (classRes.ok) {
        const cls = classData.data;
        setClassName(`${cls.grade} ${cls.major} ${cls.classNumber}`);
        setAssignedStudents(cls.students || []);
      }

      // Fetch available students (not in this class)
      const studentsRes = await fetch(`/api/students?notInClass=${classId}`);
      const studentsData = await studentsRes.json();
      if (studentsRes.ok) {
        setAvailableStudents(studentsData.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (studentId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleAssignSelected = async () => {
    if (selectedIds.size === 0) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/classes/${classId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: Array.from(selectedIds) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to assign students');
      }

      await fetchData();
      setSelectedIds(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign students');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Hapus siswa dari kelas ini?')) return;

    try {
      const res = await fetch(`/api/classes/${classId}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: [studentId] }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove student');
      }

      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove student');
    }
  };

  const filteredAvailable = availableStudents.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nis.includes(searchQuery)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <nav className="flex items-center gap-2 text-sm text-[var(--muadalah-on-surface-variant)] mb-4">
          <Link href="/dashboard" className="hover:text-[var(--muadalah-primary)] transition-colors">
            Dashboard
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <Link href="/dashboard/kelas" className="hover:text-[var(--muadalah-primary)] transition-colors">
            Manajemen Kelas
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <Link href={`/dashboard/kelas/${classId}`} className="hover:text-[var(--muadalah-primary)] transition-colors">
            Kelas {className}
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-[var(--muadalah-on-surface)] font-medium">Kelola Siswa</span>
        </nav>

        <h1 className="text-3xl font-bold text-[var(--muadalah-on-surface)] mb-2">
          Kelola Siswa - Kelas {className}
        </h1>
        <p className="text-[var(--muadalah-on-surface-variant)]">
          Tambah atau hapus siswa dari kelas ini
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Students */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm border border-[var(--muadalah-border-subtle)]"
        >
          <div className="p-6 border-b border-[var(--muadalah-border-subtle)]">
            <h2 className="text-xl font-semibold text-[var(--muadalah-on-surface)] flex items-center gap-2">
              <span className="material-symbols-outlined">groups</span>
              Siswa di Kelas ({assignedStudents.length})
            </h2>
          </div>
          <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--muadalah-primary)] mx-auto"></div>
              </div>
            ) : assignedStudents.length === 0 ? (
              <div className="text-center py-8 text-[var(--muadalah-on-surface-variant)]">
                Belum ada siswa di kelas ini
              </div>
            ) : (
              assignedStudents.map(student => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 bg-[var(--muadalah-surface-container-low)] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--muadalah-primary)] flex items-center justify-center text-white font-semibold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--muadalah-on-surface)]">{student.name}</p>
                      <p className="text-sm text-[var(--muadalah-on-surface-variant)]">NIS: {student.nis}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveStudent(student.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">remove_circle</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Available Students */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm border border-[var(--muadalah-border-subtle)]"
        >
          <div className="p-6 border-b border-[var(--muadalah-border-subtle)]">
            <h2 className="text-xl font-semibold text-[var(--muadalah-on-surface)] flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined">person_add</span>
              Siswa Tersedia
            </h2>
            <input
              type="text"
              placeholder="Cari siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-sm"
            />
          </div>
          <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--muadalah-primary)] mx-auto"></div>
              </div>
            ) : filteredAvailable.length === 0 ? (
              <div className="text-center py-8 text-[var(--muadalah-on-surface-variant)]">
                {searchQuery ? 'Tidak ada siswa ditemukan' : 'Semua siswa sudah masuk kelas'}
              </div>
            ) : (
              filteredAvailable.map(student => (
                <div
                  key={student.id}
                  onClick={() => handleToggleSelect(student.id)}
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                    selectedIds.has(student.id)
                      ? 'bg-[var(--muadalah-primary)]/10 border-2 border-[var(--muadalah-primary)]'
                      : 'bg-[var(--muadalah-surface-container-low)] hover:bg-[var(--muadalah-surface-container)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--muadalah-on-surface)]">{student.name}</p>
                      <p className="text-sm text-[var(--muadalah-on-surface-variant)]">NIS: {student.nis}</p>
                    </div>
                  </div>
                  {selectedIds.has(student.id) && (
                    <span className="material-symbols-outlined text-[var(--muadalah-primary)]">check_circle</span>
                  )}
                </div>
              ))
            )}
          </div>
          {selectedIds.size > 0 && (
            <div className="p-6 border-t border-[var(--muadalah-border-subtle)]">
              <motion.button
                onClick={handleAssignSelected}
                disabled={saving}
                className="w-full px-6 py-3 bg-[var(--muadalah-primary)] text-white font-medium rounded-lg hover:bg-[var(--muadalah-surface-tint)] transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: saving ? 1 : 0.98 }}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Tambahkan {selectedIds.size} Siswa
                  </>
                )}
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
