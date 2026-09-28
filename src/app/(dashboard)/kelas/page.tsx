'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

type Class = {
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
  } | null;
  _count?: {
    students: number;
  };
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

export default function ManajemenKelasPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [majorFilter, setMajorFilter] = useState('');

  useEffect(() => {
    fetchClasses();
  }, [searchQuery, gradeFilter, majorFilter]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (gradeFilter) params.append('grade', gradeFilter);
      if (majorFilter) params.append('major', majorFilter);

      const res = await fetch(`/api/classes?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch classes');

      setClasses(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: number) => {
    const colors = {
      10: 'from-blue-500 to-blue-600',
      11: 'from-green-500 to-green-600',
      12: 'from-purple-500 to-purple-600',
    };
    return colors[grade as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getCapacityPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-[var(--muadalah-danger-alfa)]';
    if (percentage >= 75) return 'text-[var(--muadalah-warning-izin)]';
    return 'text-[var(--muadalah-success-hadir)]';
  };

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <motion.div 
        className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <nav className="flex items-center gap-2 text-sm text-[var(--muadalah-on-surface-variant)] mb-2">
            <Link href="/dashboard" className="hover:text-[var(--muadalah-primary)] transition-colors">
              Dashboard
            </Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-[var(--muadalah-on-surface)] font-medium">Manajemen Kelas</span>
          </nav>
          <h1 className="text-3xl font-bold text-[var(--muadalah-on-surface)] mb-2">
            Manajemen Kelas
          </h1>
          <p className="text-[var(--muadalah-on-surface-variant)] max-w-2xl">
            Kelola daftar kelas, wali kelas, dan pantau jumlah siswa aktif dalam setiap tingkatan di lingkungan SMA Muadalah.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            className="h-10 px-4 bg-[var(--muadalah-surface-container-low)] text-[var(--muadalah-on-surface)] font-medium text-sm rounded-lg flex items-center gap-2 hover:bg-[var(--muadalah-surface-container)] transition-colors shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </motion.button>
          <motion.button
            onClick={() => router.push('/dashboard/kelas/tambah')}
            className="h-10 px-4 bg-[var(--muadalah-primary)] text-white font-medium text-sm rounded-lg flex items-center gap-2 hover:bg-[var(--muadalah-surface-tint)] transition-all shadow-md hover:shadow-lg shadow-[var(--muadalah-primary)]/20"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tambah Kelas Baru
          </motion.button>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div 
        className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm border border-[var(--muadalah-border-subtle)] p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muadalah-outline)] text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari kelas atau wali kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-sm text-[var(--muadalah-on-surface)] placeholder:text-[var(--muadalah-outline-variant)] focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] outline-none transition-all"
            />
          </div>

          {/* Grade Filter */}
          <div className="relative">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-sm text-[var(--muadalah-on-surface)] focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] outline-none transition-all cursor-pointer"
            >
              <option value="">Semua Tingkat</option>
              <option value="10">Kelas 10</option>
              <option value="11">Kelas 11</option>
              <option value="12">Kelas 12</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muadalah-outline)] text-[18px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Major Filter */}
          <div className="relative">
            <select
              value={majorFilter}
              onChange={(e) => setMajorFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-sm text-[var(--muadalah-on-surface)] focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] outline-none transition-all cursor-pointer"
            >
              <option value="">Semua Jurusan</option>
              <option value="IPA">IPA</option>
              <option value="IPS">IPS</option>
              <option value="BAHASA">Bahasa</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muadalah-outline)] text-[18px] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--muadalah-primary)]"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <motion.div 
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="material-symbols-outlined text-red-500">error</span>
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Class Cards Grid */}
      {!loading && !error && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {classes.map((classItem) => {
            const studentCount = classItem._count?.students || 0;
            const capacityPercentage = getCapacityPercentage(studentCount, classItem.capacity);
            
            return (
              <motion.div
                key={classItem.id}
                variants={cardVariants}
                className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col h-full"
                whileHover={{ y: -4 }}
              >
                {/* Top Gradient Bar */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getGradeColor(classItem.grade)}`}></div>

                <div className="p-6 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[var(--muadalah-primary-container)]/20 flex items-center justify-center">
                        <span className="text-2xl font-semibold text-[var(--muadalah-primary)]">
                          {classItem.grade}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-[var(--muadalah-on-surface)]">
                          {classItem.major} {classItem.classNumber}
                        </h3>
                        {classItem.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--muadalah-success-hadir)]/10 text-[var(--muadalah-success-hadir)] text-xs font-medium mt-1">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium mt-1">
                            Tidak Aktif
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="space-y-3 flex-1">
                    {/* Homeroom Teacher */}
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[var(--muadalah-outline)] text-[18px]">
                        person_check
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-[var(--muadalah-outline)]">Wali Kelas</span>
                        <span className="text-sm text-[var(--muadalah-on-surface)] truncate">
                          {classItem.homeRoomTeacher?.name || 'Belum ditentukan'}
                        </span>
                      </div>
                    </div>

                    {/* Student Count */}
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[var(--muadalah-outline)] text-[18px]">
                        groups
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs text-[var(--muadalah-outline)]">Jumlah Siswa</span>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-xl font-semibold ${getCapacityColor(capacityPercentage)}`}>
                            {studentCount}
                          </span>
                          <span className="text-sm text-[var(--muadalah-on-surface-variant)]">
                            / {classItem.capacity} Kapasitas
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 pt-4 flex items-center justify-between border-t border-[var(--muadalah-border-subtle)]">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-[var(--muadalah-primary)]"></div>
                      <span className="text-xs text-[var(--muadalah-on-surface-variant)]">
                        {capacityPercentage}% Terisi
                      </span>
                    </div>
                    <Link
                      href={`/dashboard/kelas/${classItem.id}`}
                      className="text-[var(--muadalah-primary)] hover:text-[var(--muadalah-surface-tint)] font-medium text-sm flex items-center gap-1 transition-colors"
                    >
                      Detail
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && !error && classes.length === 0 && (
        <motion.div 
          className="text-center py-16"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[var(--muadalah-surface-container-low)] flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-[var(--muadalah-outline)]">
              meeting_room
            </span>
          </div>
          <h3 className="text-xl font-semibold text-[var(--muadalah-on-surface)] mb-2">
            Belum Ada Kelas
          </h3>
          <p className="text-[var(--muadalah-on-surface-variant)] mb-6">
            Mulai tambahkan kelas baru untuk mengelola siswa Anda
          </p>
          <motion.button
            onClick={() => router.push('/dashboard/kelas/tambah')}
            className="px-6 py-3 bg-[var(--muadalah-primary)] text-white font-medium rounded-lg flex items-center gap-2 mx-auto hover:bg-[var(--muadalah-surface-tint)] transition-all shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tambah Kelas Pertama
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
