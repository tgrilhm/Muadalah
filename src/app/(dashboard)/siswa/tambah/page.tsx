'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function AddStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    // Build student data
    const studentData = {
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
      parentContacts: [
        {
          name: formData.get('parentName'),
          relation: formData.get('parentRelation'),
          phone: formData.get('parentPhone'),
          email: formData.get('parentEmail') || null,
        },
      ],
    };

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create student');
      }

      router.push('/siswa');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Link 
            href="/dashboard/siswa" 
            className="p-2 hover:bg-[var(--muadalah-surface-container-low)] rounded-lg transition-colors text-[var(--muadalah-on-surface-variant)] hover:text-[var(--muadalah-primary)]"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--muadalah-on-surface)]">Tambah Siswa Baru</h1>
            <p className="text-sm text-[var(--muadalah-on-surface-variant)]">Isi formulir di bawah untuk menambah siswa baru</p>
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
        {/* Data Siswa */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
              <input
                type="text"
                name="nisn"
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
                placeholder="ID Kelas"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label>
              <input
                type="text"
                name="birthPlace"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                name="birthDate"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agama</label>
              <input
                type="text"
                name="religion"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
              <input
                type="tel"
                name="phone"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <textarea
                name="address"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Data Orang Tua */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--muadalah-on-surface)] mb-4">Data Orang Tua / Wali</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="parentName"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hubungan <span className="text-red-600">*</span>
              </label>
              <select
                name="parentRelation"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Pilih...</option>
                <option value="Ayah">Ayah</option>
                <option value="Ibu">Ibu</option>
                <option value="Wali">Wali</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telepon <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                name="parentPhone"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="parentEmail"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--muadalah-border-subtle)]">
          <Link
            href="/dashboard/siswa"
            className="px-6 py-3 border border-[var(--muadalah-border-subtle)] text-[var(--muadalah-on-surface)] rounded-lg hover:bg-[var(--muadalah-surface-container-low)] transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--muadalah-primary)] text-white rounded-lg hover:bg-[var(--muadalah-surface-tint)] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>}
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}
