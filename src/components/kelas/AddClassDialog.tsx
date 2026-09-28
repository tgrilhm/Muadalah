'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  schoolId: string;
}

export function AddClassDialog({
  isOpen,
  onClose,
  onSuccess,
  schoolId,
}: AddClassDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    grade: 10,
    major: null as 'IPA' | 'IPS' | 'BAHASA' | null,
    schoolId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/kelas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create class');
      }

      // Success - reset form and close
      setFormData({
        name: '',
        grade: 10,
        major: null,
        schoolId,
      });
      onClose();
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err: any) {
      console.error('Error creating class:', err);
      setError(err.message || 'Terjadi kesalahan saat membuat kelas');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (newGrade: number) => {
    setFormData((prev) => ({
      ...prev,
      grade: newGrade,
      // Reset major if moving to SMP or grade 10
      major: newGrade >= 11 && newGrade <= 12 ? prev.major : null,
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-surface-card rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-xl py-lg border-b border-border-subtle flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Tambah Kelas Baru
            </h2>
            <button
              onClick={onClose}
              className="p-xs text-outline hover:text-on-surface-variant transition-colors rounded-full hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-xl py-lg space-y-lg">
            {/* Error Message */}
            {error && (
              <div className="bg-error-container/10 border border-error/20 rounded-lg p-md">
                <p className="font-body-sm text-error">{error}</p>
              </div>
            )}

            {/* Grade */}
            <div>
              <label
                htmlFor="grade"
                className="block font-label-md text-label-md text-on-surface mb-xs"
              >
                Tingkat Kelas <span className="text-error">*</span>
              </label>
              <select
                id="grade"
                value={formData.grade}
                onChange={(e) => handleGradeChange(Number(e.target.value))}
                required
                className="w-full px-md py-sm bg-surface-container-low border-none rounded-lg font-body-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                <optgroup label="SMP">
                  <option value="7">Kelas 7</option>
                  <option value="8">Kelas 8</option>
                  <option value="9">Kelas 9</option>
                </optgroup>
                <optgroup label="SMA">
                  <option value="10">Kelas 10</option>
                  <option value="11">Kelas 11</option>
                  <option value="12">Kelas 12</option>
                </optgroup>
              </select>
              <p className="font-caption text-caption text-on-surface-variant mt-xs">
                Pilih tingkat kelas (7-9 untuk SMP, 10-12 untuk SMA)
              </p>
            </div>

            {/* Major (conditional for grade 11-12) */}
            {formData.grade >= 11 && formData.grade <= 12 && (
              <div>
                <label
                  htmlFor="major"
                  className="block font-label-md text-label-md text-on-surface mb-xs"
                >
                  Jurusan <span className="text-error">*</span>
                </label>
                <select
                  id="major"
                  value={formData.major || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      major: e.target.value as 'IPA' | 'IPS' | 'BAHASA',
                    }))
                  }
                  required
                  className="w-full px-md py-sm bg-surface-container-low border-none rounded-lg font-body-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="">Pilih Jurusan</option>
                  <option value="IPA">IPA</option>
                  <option value="IPS">IPS</option>
                  <option value="BAHASA">Bahasa</option>
                </select>
                <p className="font-caption text-caption text-on-surface-variant mt-xs">
                  Jurusan wajib untuk kelas 11 dan 12
                </p>
              </div>
            )}

            {/* Class Name */}
            <div>
              <label
                htmlFor="name"
                className="block font-label-md text-label-md text-on-surface mb-xs"
              >
                Nama Kelas <span className="text-error">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Contoh: A, B, 1, 2"
                required
                maxLength={50}
                className="w-full px-md py-sm bg-surface-container-low border-none rounded-lg font-body-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <p className="font-caption text-caption text-on-surface-variant mt-xs">
                Nama kelas akan ditampilkan sebagai: {formData.grade}{' '}
                {formData.major && `${formData.major} `}
                {formData.name || '...'}
              </p>
            </div>

            {/* Preview */}
            <div className="bg-surface-container-low/50 rounded-lg p-md border border-border-subtle">
              <p className="font-caption text-caption text-outline mb-xs">
                Preview Nama Kelas:
              </p>
              <p className="font-headline-sm text-headline-sm text-on-surface">
                {formData.grade} {formData.major && `${formData.major} `}
                {formData.name || '(belum diisi)'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-sm pt-md">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-10 px-md bg-surface-container-low text-on-surface font-label-md text-label-md rounded-lg hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="h-10 px-md bg-primary text-on-primary font-label-md text-label-md rounded-lg flex items-center gap-xs hover:bg-surface-tint transition-all shadow-md hover:shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-[18px]">
                      progress_activity
                    </span>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Simpan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
