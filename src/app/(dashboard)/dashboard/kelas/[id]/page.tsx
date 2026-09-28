'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';

interface Student {
  id: string;
  nis: string;
  name: string;
  gender: 'LAKI_LAKI' | 'PEREMPUAN';
  photo: string | null;
  status: string;
}

interface ClassDetail {
  id: string;
  name: string;
  grade: number;
  major: string | null;
  schoolId: string;
  homeroomTeacher?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      avatar: string | null;
    };
  } | null;
  school: {
    id: string;
    name: string;
    level: string;
  };
  students: Student[];
  _count: {
    students: number;
  };
}

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClassDetail();
  }, [unwrappedParams.id]);

  const fetchClassDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/kelas/${unwrappedParams.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch class detail');
      }

      const result = await response.json();
      setClassData(result.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching class:', err);
      setError('Gagal memuat detail kelas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-md">
        <span className="material-symbols-outlined text-[64px] text-error">error</span>
        <h2 className="font-headline-md text-on-surface">{error || 'Kelas tidak ditemukan'}</h2>
        <Link
          href="/dashboard/kelas"
          className="h-10 px-md bg-primary text-on-primary font-label-md rounded-lg flex items-center gap-xs hover:bg-surface-tint transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Daftar Kelas
        </Link>
      </div>
    );
  }

  const displayName = classData.major
    ? `${classData.grade} ${classData.major} ${classData.name}`
    : `${classData.grade} ${classData.name}`;

  const capacity = 35;
  const studentCount = classData._count.students;
  const percentageFull = Math.round((studentCount / capacity) * 100);

  return (
    <div className="flex flex-col w-full p-8 gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--muadalah-on-surface-variant)]">
        <Link href="/dashboard" className="hover:text-[var(--muadalah-primary)] transition-colors">
          Dashboard
        </Link>
        <MaterialIcon name="chevron_right" size="xs" />
        <Link href="/dashboard/kelas" className="hover:text-[var(--muadalah-primary)] transition-colors">
          Manajemen Kelas
        </Link>
        <MaterialIcon name="chevron_right" size="xs" />
        <span className="text-[var(--muadalah-on-surface)] font-medium">Kelas {displayName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[32px] font-bold leading-tight text-[var(--muadalah-on-surface)]">Kelas {displayName}</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              Aktif
            </span>
          </div>
          <p className="text-base text-[var(--muadalah-on-surface-variant)]">
            {classData.school.name} • {classData.school.level}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert('Edit kelas feature coming soon!')}
            className="h-10 px-4 bg-[var(--muadalah-surface-container-low)] text-[var(--muadalah-on-surface)] text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-[var(--muadalah-surface-container)] transition-colors shadow-sm"
          >
            <MaterialIcon name="edit" size="sm" />
            Edit Kelas
          </button>
          <button 
            onClick={() => alert('Kelola siswa feature coming soon!')}
            className="h-10 px-4 bg-[var(--muadalah-primary)] text-white text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-[var(--muadalah-surface-tint)] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <MaterialIcon name="person_add" size="sm" />
            Kelola Siswa
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Homeroom Teacher Card */}
        <div className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm border border-[var(--muadalah-border-subtle)] p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <MaterialIcon name="person_check" className="text-[var(--muadalah-primary)]" size="lg" />
            <h3 className="text-lg font-semibold text-[var(--muadalah-on-surface)]">Wali Kelas</h3>
          </div>
          {classData.homeroomTeacher ? (
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--muadalah-primary-container)]/10 flex items-center justify-center overflow-hidden border-2 border-[var(--muadalah-border-subtle)]">
                {classData.homeroomTeacher.user.avatar ? (
                  <img src={classData.homeroomTeacher.user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold text-[var(--muadalah-primary)]">
                    {classData.homeroomTeacher.user.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--muadalah-on-surface)] truncate">{classData.homeroomTeacher.user.name}</p>
                <p className="text-xs text-[var(--muadalah-on-surface-variant)] truncate">{classData.homeroomTeacher.user.email}</p>
                {classData.homeroomTeacher.user.phone && (
                  <p className="text-xs text-[var(--muadalah-on-surface-variant)]">{classData.homeroomTeacher.user.phone}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-[var(--muadalah-on-surface-variant)] mb-3">Belum ada wali kelas</p>
              <button 
                onClick={() => alert('Tetapkan wali kelas feature coming soon!')}
                className="text-[var(--muadalah-primary)] text-sm font-semibold hover:text-[var(--muadalah-surface-tint)] transition-colors"
              >
                Tetapkan Wali Kelas
              </button>
            </div>
          )}
        </div>

        {/* Student Count Card */}
        <div className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm border border-[var(--muadalah-border-subtle)] p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <MaterialIcon name="groups" className="text-[var(--muadalah-primary)]" size="lg" />
            <h3 className="text-lg font-semibold text-[var(--muadalah-on-surface)]">Jumlah Siswa</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[var(--muadalah-on-surface)]">{studentCount}</span>
              <span className="text-base text-[var(--muadalah-on-surface-variant)]">/ {capacity} siswa</span>
            </div>
            <div className="w-full bg-[var(--muadalah-surface-container-low)] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-[var(--muadalah-primary)] transition-all duration-300"
                style={{ width: `${Math.min(percentageFull, 100)}%` }}
              />
            </div>
            <p className="text-xs text-[var(--muadalah-on-surface-variant)]">
              {capacity - studentCount} tempat tersisa ({percentageFull}% terisi)
            </p>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm border border-[var(--muadalah-border-subtle)] p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <MaterialIcon name="bar_chart" className="text-[var(--muadalah-primary)]" size="lg" />
            <h3 className="text-lg font-semibold text-[var(--muadalah-on-surface)]">Statistik</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muadalah-on-surface-variant)]">Laki-laki</span>
              <span className="text-base font-semibold text-[var(--muadalah-on-surface)]">
                {classData.students.filter((s) => s.gender === 'LAKI_LAKI').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muadalah-on-surface-variant)]">Perempuan</span>
              <span className="text-base font-semibold text-[var(--muadalah-on-surface)]">
                {classData.students.filter((s) => s.gender === 'PEREMPUAN').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm border border-[var(--muadalah-border-subtle)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--muadalah-border-subtle)] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--muadalah-on-surface)]">Daftar Siswa</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <MaterialIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muadalah-outline)]" size="sm" />
              <input
                type="text"
                placeholder="Cari siswa..."
                className="w-64 pl-10 pr-4 py-2 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {classData.students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <MaterialIcon name="person_off" className="text-[var(--muadalah-outline)] mb-4" size="xl" />
            <h3 className="text-lg font-semibold text-[var(--muadalah-on-surface)] mb-2">Belum ada siswa</h3>
            <p className="text-sm text-[var(--muadalah-on-surface-variant)] mb-6">
              Kelas ini belum memiliki siswa
            </p>
            <button className="h-10 px-4 bg-[var(--muadalah-primary)] text-white text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-[var(--muadalah-surface-tint)] transition-all shadow-sm hover:shadow-md">
              <MaterialIcon name="person_add" size="sm" />
              Tambah Siswa
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--muadalah-surface-container-low)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muadalah-on-surface)] uppercase tracking-wider">NIS</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muadalah-on-surface)] uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muadalah-on-surface)] uppercase tracking-wider">Jenis Kelamin</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muadalah-on-surface)] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muadalah-on-surface)] uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--muadalah-border-subtle)]">
                {classData.students.map((student, index) => (
                  <tr
                    key={student.id}
                    className="hover:bg-[var(--muadalah-surface-container-low)]/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-[var(--muadalah-on-surface)]">{student.nis}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--muadalah-surface-variant)] overflow-hidden flex items-center justify-center border-2 border-[var(--muadalah-border-subtle)]">
                          {student.photo ? (
                            <img src={student.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-semibold text-[var(--muadalah-on-surface)]">
                              {student.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-[var(--muadalah-on-surface)]">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muadalah-on-surface-variant)]">
                      {student.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/dashboard/siswa/${student.id}`}
                          className="text-[var(--muadalah-primary)] hover:text-[var(--muadalah-surface-tint)] text-sm font-semibold transition-colors"
                        >
                          Lihat Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
