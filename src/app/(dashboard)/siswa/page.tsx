'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Student = {
  id: string;
  nis: string;
  nisn: string | null;
  name: string;
  gender: 'LAKI_LAKI' | 'PEREMPUAN';
  photo: string | null;
  status: string;
  class: {
    id: string;
    name: string;
    grade: number;
    major: string | null;
  };
};

export default function ManajemenSiswaPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchStudents();
  }, [searchQuery, classFilter, statusFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (classFilter) params.append('classId', classFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/students?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch students');

      setStudents(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <nav className="flex items-center gap-2 text-sm text-[var(--muadalah-on-surface-variant)]">
            <Link href="/dashboard" className="hover:text-[var(--muadalah-primary)] transition-colors">
              Dashboard
            </Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-[var(--muadalah-on-surface)] font-medium">Manajemen Siswa</span>
          </nav>
          <h1 className="text-3xl font-bold text-[var(--muadalah-on-surface)]">Daftar Siswa</h1>
        </div>
        <Link
          href="/dashboard/siswa/tambah"
          className="flex items-center gap-2 px-4 py-3 bg-[var(--muadalah-primary)] text-white rounded-lg hover:bg-[var(--muadalah-surface-tint)] shadow-sm shadow-[var(--muadalah-primary)]/20 transition-all hover:-translate-y-0.5"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tambah Siswa
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[var(--muadalah-border-subtle)] overflow-hidden mb-6">
        <div className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[var(--muadalah-border-subtle)] bg-[var(--muadalah-surface-container-lowest)]">
          {/* Search */}
          <div className="flex-1 w-full max-w-md relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muadalah-outline)] text-[20px]">search</span>
            <input
              type="text"
              placeholder="Cari nama siswa atau NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-sm text-[var(--muadalah-on-surface)] placeholder:text-[var(--muadalah-outline-variant)] focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Class Filter */}
            <div className="relative group">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 bg-[var(--muadalah-surface-container-lowest)] border border-[var(--muadalah-border-subtle)] rounded-lg text-sm text-[var(--muadalah-on-surface)] focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] outline-none cursor-pointer min-w-[140px] transition-all"
              >
                <option value="">Semua Kelas</option>
                {/* TODO: Fetch from API */}
                <option value="10A">Kelas 10A</option>
                <option value="10B">Kelas 10B</option>
                <option value="11A">Kelas 11A</option>
                <option value="11B">Kelas 11B</option>
                <option value="12A">Kelas 12A</option>
                <option value="12B">Kelas 12B</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muadalah-outline)] pointer-events-none group-focus-within:text-[var(--muadalah-primary)] transition-colors">expand_more</span>
            </div>

            {/* Status Filter */}
            <div className="relative group">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 bg-[var(--muadalah-surface-container-lowest)] border border-[var(--muadalah-border-subtle)] rounded-lg text-sm text-[var(--muadalah-on-surface)] focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] outline-none cursor-pointer min-w-[140px] transition-all"
              >
                <option value="">Semua Status</option>
                <option value="AKTIF">Aktif</option>
                <option value="LULUS">Lulus</option>
                <option value="PINDAH">Pindah</option>
                <option value="KELUAR">Keluar</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muadalah-outline)] pointer-events-none group-focus-within:text-[var(--muadalah-primary)] transition-colors">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-[var(--muadalah-error-container)]/10 border border-[var(--muadalah-error-container)] rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[var(--muadalah-error)] text-[24px]">error</span>
            <div className="flex-1">
              <p className="text-[var(--muadalah-error)] font-medium mb-2">{error}</p>
              <button
                onClick={fetchStudents}
                className="text-[var(--muadalah-error)] hover:text-[var(--muadalah-on-error-container)] font-medium text-sm underline"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[var(--muadalah-border-subtle)] p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--muadalah-surface-container)] border-t-[var(--muadalah-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--muadalah-on-surface-variant)]">Memuat data siswa...</p>
        </div>
      )}

      {/* Students Table */}
      {!loading && (
        <div className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[var(--muadalah-border-subtle)] overflow-hidden">
          {students.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4">
                <span className="material-symbols-outlined text-[var(--muadalah-outline)] text-[48px]">group_off</span>
              </div>
              <p className="text-[var(--muadalah-on-surface-variant)] mb-6">Tidak ada data siswa</p>
              <Link
                href="/dashboard/siswa/tambah"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[var(--muadalah-primary)] text-white rounded-lg hover:bg-[var(--muadalah-surface-tint)] transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Tambah Siswa Pertama
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-[var(--muadalah-surface-container-low)] border-b border-[var(--muadalah-border-subtle)]">
                      <th className="py-3 px-6 text-xs font-semibold text-[var(--muadalah-on-surface-variant)] uppercase tracking-wider w-[60px] text-center">
                        No
                      </th>
                      <th className="py-3 px-6 text-xs font-semibold text-[var(--muadalah-on-surface-variant)] uppercase tracking-wider">
                        Siswa
                      </th>
                      <th className="py-3 px-6 text-xs font-semibold text-[var(--muadalah-on-surface-variant)] uppercase tracking-wider">
                        NISN
                      </th>
                      <th className="py-3 px-6 text-xs font-semibold text-[var(--muadalah-on-surface-variant)] uppercase tracking-wider">
                        Kelas
                      </th>
                      <th className="py-3 px-6 text-xs font-semibold text-[var(--muadalah-on-surface-variant)] uppercase tracking-wider">
                        L/P
                      </th>
                      <th className="py-3 px-6 text-xs font-semibold text-[var(--muadalah-on-surface-variant)] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-3 px-3 text-xs font-semibold text-[var(--muadalah-on-surface-variant)] uppercase tracking-wider text-center w-28">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--muadalah-border-subtle)] bg-[var(--muadalah-surface-container-lowest)]">
                    {students.map((student, index) => (
                      <tr key={student.id} className="hover:bg-[var(--muadalah-surface-container-lowest)]/50 transition-colors group">
                        <td className="py-3 px-6 text-sm text-[var(--muadalah-on-surface-variant)] text-center">
                          {index + 1}
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            {student.photo ? (
                              <img
                                src={student.photo}
                                alt={student.name}
                                className="w-10 h-10 rounded-full object-cover border border-[var(--muadalah-border-subtle)] shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[var(--muadalah-surface-container)] flex items-center justify-center border border-[var(--muadalah-border-subtle)] text-[var(--muadalah-primary)] font-semibold text-sm">
                                {student.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-sm text-[var(--muadalah-on-surface)]">{student.name}</p>
                              <p className="text-xs text-[var(--muadalah-on-surface-variant)]">NIS: {student.nis}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <span className="text-sm text-[var(--muadalah-on-surface)]">
                            {student.nisn || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-6">
                          <span className="text-sm font-medium text-[var(--muadalah-on-surface)]">
                            {student.class.name}
                          </span>
                        </td>
                        <td className="py-3 px-6">
                          <span className="text-sm text-[var(--muadalah-on-surface)]">
                            {student.gender === 'LAKI_LAKI' ? 'L' : 'P'}
                          </span>
                        </td>
                        <td className="py-3 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              student.status === 'AKTIF'
                                ? 'bg-[var(--muadalah-success)]/10 text-[var(--muadalah-success)]'
                                : student.status === 'LULUS'
                                ? 'bg-blue-100 text-blue-800'
                                : student.status === 'PINDAH'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-[var(--muadalah-surface-variant)] text-[var(--muadalah-on-surface-variant)]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                student.status === 'AKTIF'
                                  ? 'bg-[var(--muadalah-success)]'
                                  : student.status === 'LULUS'
                                  ? 'bg-blue-800'
                                  : student.status === 'PINDAH'
                                  ? 'bg-orange-800'
                                  : 'bg-[var(--muadalah-on-surface-variant)]'
                              }`}
                            ></span>
                            {student.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 w-28">
                          <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/dashboard/siswa/${student.id}`}
                              className="p-2 text-[var(--muadalah-on-surface-variant)] hover:text-[var(--muadalah-primary)] hover:bg-[var(--muadalah-primary-container)]/10 rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </Link>
                            <Link
                              href={`/dashboard/siswa/${student.id}/edit`}
                              className="p-2 text-[var(--muadalah-on-surface-variant)] hover:text-[var(--muadalah-primary)] hover:bg-[var(--muadalah-primary-container)]/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="p-4 flex items-center justify-between border-t border-[var(--muadalah-border-subtle)] bg-[var(--muadalah-surface-container-lowest)]">
                <p className="text-sm text-[var(--muadalah-on-surface-variant)]">
                  Menampilkan <span className="font-medium text-[var(--muadalah-on-surface)]">{students.length}</span> siswa
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
