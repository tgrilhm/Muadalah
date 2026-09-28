'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Student = {
  id: string;
  nis: string;
  nisn: string | null;
  name: string;
  gender: 'LAKI_LAKI' | 'PEREMPUAN';
  birthPlace: string | null;
  birthDate: string | null;
  religion: string | null;
  address: string | null;
  phone: string | null;
  classId: string;
};

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudent();
  }, [params.id]);

  const fetchStudent = async () => {
    try {
      const res = await fetch(`/api/students/${params.id}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch student');

      setStudent(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const updateData = {
      nis: formData.get('nis'),
      nisn: formData.get('nisn') || null,
      name: formData.get('name'),
      gender: formData.get('gender'),
      classId: formData.get('classId'),
      birthPlace: formData.get('birthPlace') || null,
      birthDate: formData.get('birthDate') || null,
      religion: formData.get('religion') || null,
      address: formData.get('address') || null,
      phone: formData.get('phone') || null,
    };

    try {
      const res = await fetch(`/api/students/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update student');
      }

      router.push(`/siswa/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--muadalah-surface-container)] border-t-[var(--muadalah-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--muadalah-on-surface-variant)]">Memuat data siswa...</p>
        </div>
      </div>
    );
  }

  if (error && !student) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <span className="material-symbols-outlined text-[var(--muadalah-error)] text-[48px] mb-4">error</span>
          <p className="text-[var(--muadalah-error)] mb-4 font-medium">{error}</p>
          <Link href="/dashboard/siswa" className="text-[var(--muadalah-primary)] hover:underline font-medium">
            Kembali ke Daftar Siswa
          </Link>
        </div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/dashboard/siswa/${params.id}`} className="p-2 hover:bg-[var(--muadalah-surface-container-low)] rounded-lg transition-colors text-[var(--muadalah-on-surface-variant)] hover:text-[var(--muadalah-primary)]">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--muadalah-on-surface)]">Edit Data Siswa</h1>
            <p className="text-sm text-[var(--muadalah-on-surface-variant)]">{student.name}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-[var(--muadalah-error-container)]/10 border border-[var(--muadalah-error-container)] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[var(--muadalah-error)] text-[24px]">error</span>
            <p className="text-[var(--muadalah-error)] font-medium">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[var(--muadalah-border-subtle)] p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--muadalah-on-surface)] mb-4">Data Siswa</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIS <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="nis"
                required
                defaultValue={student.nis}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
              <input
                type="text"
                name="nisn"
                defaultValue={student.nisn || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={student.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jenis Kelamin <span className="text-red-600">*</span>
              </label>
              <select
                name="gender"
                required
                defaultValue={student.gender}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Pilih...</option>
                <option value="LAKI_LAKI">Laki-laki</option>
                <option value="PEREMPUAN">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kelas <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="classId"
                required
                defaultValue={student.classId}
                placeholder="ID Kelas"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label>
              <input
                type="text"
                name="birthPlace"
                defaultValue={student.birthPlace || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                name="birthDate"
                defaultValue={student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agama</label>
              <input
                type="text"
                name="religion"
                defaultValue={student.religion || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
              <input
                type="tel"
                name="phone"
                defaultValue={student.phone || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <textarea
                name="address"
                rows={3}
                defaultValue={student.address || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--muadalah-border-subtle)]">
          <Link
            href={`/dashboard/siswa/${params.id}`}
            className="px-6 py-3 border border-[var(--muadalah-border-subtle)] text-[var(--muadalah-on-surface)] rounded-lg hover:bg-[var(--muadalah-surface-container-low)] transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--muadalah-primary)] text-white rounded-lg hover:bg-[var(--muadalah-surface-tint)] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>}
            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
