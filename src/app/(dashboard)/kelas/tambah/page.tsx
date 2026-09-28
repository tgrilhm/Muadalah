'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

type Teacher = {
  id: string;
  name: string;
  nip: string;
};

export default function TambahKelasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [formData, setFormData] = useState({
    grade: '10',
    major: 'IPA',
    classNumber: '1',
    capacity: '35',
    homeRoomTeacherId: '',
    isActive: true,
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers?role=TEACHER');
      const data = await res.json();
      if (res.ok) {
        setTeachers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: parseInt(formData.grade),
          major: formData.major,
          classNumber: parseInt(formData.classNumber),
          capacity: parseInt(formData.capacity),
          homeRoomTeacherId: formData.homeRoomTeacherId || null,
          isActive: formData.isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create class');
      }

      router.push('/dashboard/kelas');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
          <span className="text-[var(--muadalah-on-surface)] font-medium">Tambah Kelas</span>
        </nav>

        <h1 className="text-3xl font-bold text-[var(--muadalah-on-surface)] mb-2">
          Tambah Kelas Baru
        </h1>
        <p className="text-[var(--muadalah-on-surface-variant)]">
          Isi formulir di bawah untuk membuat kelas baru
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm border border-[var(--muadalah-border-subtle)] p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="space-y-6">
          {/* Tingkat Kelas */}
          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">
              Tingkat Kelas <span className="text-red-500">*</span>
            </label>
            <select
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-[var(--muadalah-on-surface)] focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] outline-none transition-all"
            >
              <option value="10">Kelas 10</option>
              <option value="11">Kelas 11</option>
              <option value="12">Kelas 12</option>
            </select>
          </div>

          {/* Jurusan */}
          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">
              Jurusan <span className="text-red-500">*</span>
            </label>
            <select
              name="major"
              value={formData.major}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-[var(--muadalah-on-surface)] focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] outline-none transition-all"
            >
              <option value="IPA">IPA</option>
              <option value="IPS">IPS</option>
              <option value="BAHASA">Bahasa</option>
            </select>
          </div>

          {/* Nomor Kelas */}
          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">
              Nomor Kelas <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="classNumber"
              value={formData.classNumber}
              onChange={handleChange}
              min="1"
              max="20"
              required
              className="w-full px-4 py-3 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-[var(--muadalah-on-surface)] focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] outline-none transition-all"
              placeholder="Contoh: 1, 2, 3..."
            />
            <p className="text-xs text-[var(--muadalah-on-surface-variant)] mt-1">
              Hasil: Kelas {formData.grade} {formData.major} {formData.classNumber}
            </p>
          </div>

          {/* Kapasitas */}
          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">
              Kapasitas Maksimal <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="1"
              max="50"
              required
              className="w-full px-4 py-3 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-[var(--muadalah-on-surface)] focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] outline-none transition-all"
              placeholder="Contoh: 35"
            />
          </div>

          {/* Wali Kelas */}
          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">
              Wali Kelas (Opsional)
            </label>
            <select
              name="homeRoomTeacherId"
              value={formData.homeRoomTeacherId}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[var(--muadalah-surface-container-low)] border border-[var(--muadalah-border-subtle)] rounded-lg text-[var(--muadalah-on-surface)] focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] outline-none transition-all"
            >
              <option value="">Pilih Wali Kelas</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} - NIP: {teacher.nip}
                </option>
              ))}
            </select>
          </div>

          {/* Status Aktif */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-5 h-5 text-[var(--muadalah-primary)] bg-[var(--muadalah-surface-container-low)] border-[var(--muadalah-border-subtle)] rounded focus:ring-2 focus:ring-[var(--muadalah-primary)]/20"
            />
            <label className="text-sm font-medium text-[var(--muadalah-on-surface)]">
              Kelas Aktif
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-[var(--muadalah-border-subtle)]">
          <motion.button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-[var(--muadalah-surface-container-low)] text-[var(--muadalah-on-surface)] font-medium rounded-lg hover:bg-[var(--muadalah-surface-container)] transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Batal
          </motion.button>
          <motion.button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[var(--muadalah-primary)] text-white font-medium rounded-lg hover:bg-[var(--muadalah-surface-tint)] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                Simpan Kelas
              </>
            )}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
