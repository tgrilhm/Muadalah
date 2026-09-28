'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { ClassCard } from '@/components/kelas/ClassCard';
import { useRouter } from 'next/navigation';

interface ClassData {
  id: string;
  name: string;
  grade: number;
  major: string | null;
  homeroomTeacherId: string | null;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
  homeroomTeacher?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
  _count: {
    students: number;
  };
  students?: Array<{
    id: string;
    name: string;
    photo?: string | null;
  }>;
}

export default function ManajemenKelasPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<number | ''>('');
  const [majorFilter, setMajorFilter] = useState<string>('');

  // Dialog states
  const [showFilters, setShowFilters] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, [gradeFilter, majorFilter]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (gradeFilter) params.append('grade', gradeFilter.toString());
      if (majorFilter) params.append('major', majorFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/kelas?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }

      const result = await response.json();
      const classesWithDates = (result.data || []).map((cls: any) => ({
        ...cls,
        createdAt: new Date(cls.createdAt),
        updatedAt: new Date(cls.updatedAt),
      }));
      setClasses(classesWithDates);
      setError(null);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClasses();
  };

  return (
    <div className="flex flex-col w-full p-8 gap-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <nav className="flex items-center gap-2 text-sm text-[var(--muadalah-on-surface-variant)]">
          <Link href="/dashboard" className="hover:text-[var(--muadalah-primary)] transition-colors">
            Dashboard
          </Link>
          <MaterialIcon name="chevron_right" size="xs" />
          <span className="text-[var(--muadalah-on-surface)] font-medium">Manajemen Kelas</span>
        </nav>
        
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[32px] font-bold leading-tight text-[var(--muadalah-on-surface)] mb-2">
              Manajemen Kelas
            </h1>
            <p className="text-base text-[var(--muadalah-on-surface-variant)] max-w-2xl">
              Kelola daftar kelas, wali kelas, dan pantau jumlah siswa aktif dalam setiap tingkatan di lingkungan SMA Muadalah.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 px-4 bg-[var(--muadalah-surface-container-low)] text-[var(--muadalah-on-surface)] text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-[var(--muadalah-surface-container)] transition-colors shadow-sm"
            >
              <MaterialIcon name="filter_list" size="sm" />
              Filter
            </button>
            <button
              onClick={() => setShowAddDialog(true)}
              className="h-10 px-4 bg-[var(--muadalah-primary)] text-white text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-[var(--muadalah-surface-tint)] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <MaterialIcon name="add" size="sm" />
              Tambah Kelas Baru
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section (Collapsible) */}
      {showFilters && (
        <div className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm border border-[var(--muadalah-border-subtle)] p-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-semibold text-[var(--muadalah-on-surface)] mb-2">
                Cari Kelas
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nama kelas..."
                className="w-full px-4 py-2 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] outline-none transition-all"
              />
            </div>

            {/* Grade Filter */}
            <div>
              <label htmlFor="grade" className="block text-sm font-semibold text-[var(--muadalah-on-surface)] mb-2">
                Tingkat
              </label>
              <select
                id="grade"
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] outline-none transition-all"
              >
                <option value="">Semua Tingkat</option>
                <option value="7">Kelas 7</option>
                <option value="8">Kelas 8</option>
                <option value="9">Kelas 9</option>
                <option value="10">Kelas 10</option>
                <option value="11">Kelas 11</option>
                <option value="12">Kelas 12</option>
              </select>
            </div>

            {/* Major Filter */}
            <div>
              <label htmlFor="major" className="block text-sm font-semibold text-[var(--muadalah-on-surface)] mb-2">
                Jurusan
              </label>
              <select
                id="major"
                value={majorFilter}
                onChange={(e) => setMajorFilter(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] outline-none transition-all"
              >
                <option value="">Semua Jurusan</option>
                <option value="IPA">IPA</option>
                <option value="IPS">IPS</option>
                <option value="BAHASA">Bahasa</option>
              </select>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-error-container/10 border border-error/20 rounded-lg p-md">
          <p className="font-body-sm text-error">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && classes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-xl">
          <span className="material-symbols-outlined text-[64px] text-outline mb-md">
            meeting_room
          </span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
            Belum ada kelas
          </h3>
          <p className="font-body-sm text-on-surface-variant mb-lg">
            Mulai dengan menambahkan kelas baru
          </p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="h-10 px-md bg-primary text-on-primary font-label-md text-label-md rounded-lg flex items-center gap-xs hover:bg-surface-tint transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tambah Kelas Baru
          </button>
        </div>
      )}

      {/* Classes Grid */}
      {!loading && !error && classes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
          {classes.map((classData) => (
            <ClassCard key={classData.id} classData={classData} />
          ))}
        </div>
      )}
    </div>
  );
}
