'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

type Student = {
  id: string;
  nis: string;
  name: string;
  gender: 'LAKI_LAKI' | 'PEREMPUAN';
  photo: string | null;
};

type ClassDetail = {
  id: string;
  name: string;
  grade: number;
  major: string | null;
  classNumber: number;
  academicYear: string;
  capacity: number;
  isActive: boolean;
  homeRoomTeacher?: {
    id: string;
    name: string;
    nip: string;
    email: string;
  } | null;
  students: Student[];
};

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'siswa' | 'info'>('siswa');

  useEffect(() => {
    if (classId) {
      fetchClassDetail();
    }
  }, [classId]);

  const fetchClassDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/classes/${classId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch class detail');

      setClassData(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return;

    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete class');
      }

      router.push('/dashboard/kelas');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete class');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--muadalah-primary)]"></div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
          <div>
            <h3 className="text-lg font-semibold text-red-800 mb-1">Error</h3>
            <p className="text-red-700">{error || 'Class not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const studentCount = classData.students.length;
  const capacityPercentage = Math.round((studentCount / classData.capacity) * 100);

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb & Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
          <span className="text-[var(--muadalah-on-surface)] font-medium">
            {classData.grade} {classData.major} {classData.classNumber}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-[var(--muadalah-on-surface)]">
                Kelas {classData.grade} {classData.major} {classData.classNumber}
              </h1>
              {classData.isActive ? (
                <span className="px-3 py-1 rounded-full bg-[var(--muadalah-success-hadir)]/10 text-[var(--muadalah-success-hadir)] text-sm font-medium">
                  Aktif
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                  Tidak Aktif
                </span>
              )}
            </div>
            <p className="text-[var(--muadalah-on-surface-variant)]">
              Tahun Ajaran {classData.academicYear}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => router.push(`/dashboard/kelas/${classId}/assign`)}
              className="h-10 px-4 bg-[var(--muadalah-surface-container-low)] text-[var(--muadalah-on-surface)] font-medium text-sm rounded-lg flex items-center gap-2 hover:bg-[var(--muadalah-surface-container)] transition-colors shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Kelola Siswa
            </motion.button>
            <motion.button
              onClick={() => router.push(`/dashboard/kelas/${classId}/edit`)}
              className="h-10 px-4 bg-[var(--muadalah-primary)] text-white font-medium text-sm rounded-lg flex items-center gap-2 hover:bg-[var(--muadalah-surface-tint)] transition-all shadow-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Kelas
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm border border-[var(--muadalah-border-subtle)] p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500 text-[24px]">groups</span>
            </div>
            <div>
              <p className="text-sm text-[var(--muadalah-on-surface-variant)]">Jumlah Siswa</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-[var(--muadalah-on-surface)]">{studentCount}</p>
                <span className="text-sm text-[var(--muadalah-on-surface-variant)]">
                  / {classData.capacity}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${capacityPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-[var(--muadalah-on-surface-variant)] mt-1">
              {capacityPercentage}% Terisi
            </p>
          </div>
        </div>

        <div className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm border border-[var(--muadalah-border-subtle)] p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-500 text-[24px]">person_check</span>
            </div>
            <div>
              <p className="text-sm text-[var(--muadalah-on-surface-variant)]">Wali Kelas</p>
              <p className="text-lg font-semibold text-[var(--muadalah-on-surface)] truncate">
                {classData.homeRoomTeacher?.name || 'Belum ditentukan'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm border border-[var(--muadalah-border-subtle)] p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-500 text-[24px]">school</span>
            </div>
            <div>
              <p className="text-sm text-[var(--muadalah-on-surface-variant)]">Kapasitas Maksimal</p>
              <p className="text-2xl font-bold text-[var(--muadalah-on-surface)]">{classData.capacity}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm border border-[var(--muadalah-border-subtle)] overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="border-b border-[var(--muadalah-border-subtle)]">
          <div className="flex gap-8 px-6">
            <button
              onClick={() => setActiveTab('siswa')}
              className={`py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'siswa'
                  ? 'border-[var(--muadalah-primary)] text-[var(--muadalah-primary)]'
                  : 'border-transparent text-[var(--muadalah-on-surface-variant)] hover:text-[var(--muadalah-on-surface)]'
              }`}
            >
              Daftar Siswa ({studentCount})
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-[var(--muadalah-primary)] text-[var(--muadalah-primary)]'
                  : 'border-transparent text-[var(--muadalah-on-surface-variant)] hover:text-[var(--muadalah-on-surface)]'
              }`}
            >
              Informasi Kelas
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'siswa' && (
            <div className="space-y-4">
              {classData.students.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--muadalah-surface-container-low)] flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-[var(--muadalah-outline)]">
                      groups
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--muadalah-on-surface)] mb-2">
                    Belum Ada Siswa
                  </h3>
                  <p className="text-[var(--muadalah-on-surface-variant)] mb-4">
                    Tambahkan siswa ke kelas ini untuk memulai
                  </p>
                  <motion.button
                    onClick={() => router.push(`/dashboard/kelas/${classId}/assign`)}
                    className="px-6 py-3 bg-[var(--muadalah-primary)] text-white font-medium rounded-lg flex items-center gap-2 mx-auto hover:bg-[var(--muadalah-surface-tint)] transition-all shadow-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                    Tambah Siswa
                  </motion.button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {classData.students.map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 bg-[var(--muadalah-surface-container-low)] rounded-lg hover:bg-[var(--muadalah-surface-container)] transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-[var(--muadalah-primary)] flex items-center justify-center text-white font-semibold">
                        {student.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[var(--muadalah-on-surface)]">
                          {student.name}
                        </h4>
                        <p className="text-sm text-[var(--muadalah-on-surface-variant)]">
                          NIS: {student.nis}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/siswa/${student.id}`}
                        className="text-[var(--muadalah-primary)] hover:text-[var(--muadalah-surface-tint)] font-medium text-sm"
                      >
                        Lihat Detail
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && classData.homeRoomTeacher && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[var(--muadalah-on-surface)] mb-4">
                  Informasi Wali Kelas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[var(--muadalah-outline)]">person</span>
                    <div>
                      <p className="text-sm text-[var(--muadalah-on-surface-variant)]">Nama</p>
                      <p className="text-[var(--muadalah-on-surface)] font-medium">
                        {classData.homeRoomTeacher.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[var(--muadalah-outline)]">badge</span>
                    <div>
                      <p className="text-sm text-[var(--muadalah-on-surface-variant)]">NIP</p>
                      <p className="text-[var(--muadalah-on-surface)] font-medium">
                        {classData.homeRoomTeacher.nip}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[var(--muadalah-outline)]">email</span>
                    <div>
                      <p className="text-sm text-[var(--muadalah-on-surface-variant)]">Email</p>
                      <p className="text-[var(--muadalah-on-surface)] font-medium">
                        {classData.homeRoomTeacher.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
