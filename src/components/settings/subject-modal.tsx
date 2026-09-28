'use client';

import { useState } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SubjectFormData) => void;
  editData?: SubjectFormData;
}

export interface SubjectFormData {
  code: string;
  name: string;
  description?: string;
}

export function SubjectModal({ isOpen, onClose, onSave, editData }: SubjectModalProps) {
  const [formData, setFormData] = useState<SubjectFormData>(
    editData || {
      code: '',
      name: '',
      description: '',
    }
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <h2 className="text-[20px] leading-[1.4] font-semibold text-[#191c1e]">
            {editData ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f2f4f6] rounded-full transition-colors"
          >
            <MaterialIcon icon="close" size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="block text-[14px] font-semibold tracking-[0.05em] text-[#434656]">
              Kode Mata Pelajaran <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Contoh: MAT, BIND, BING"
              required
              maxLength={10}
              className="w-full px-4 py-3 bg-[#f2f4f6] rounded-lg text-[16px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/30 focus:bg-white border border-transparent transition-all uppercase"
            />
            <p className="text-[12px] text-[#737688]">
              Maksimal 10 karakter, akan otomatis menjadi huruf kapital
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-[14px] font-semibold tracking-[0.05em] text-[#434656]">
              Nama Mata Pelajaran <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Matematika"
              required
              className="w-full px-4 py-3 bg-[#f2f4f6] rounded-lg text-[16px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/30 focus:bg-white border border-transparent transition-all"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[14px] font-semibold tracking-[0.05em] text-[#434656]">
              Deskripsi (Opsional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi singkat tentang mata pelajaran ini..."
              rows={3}
              className="w-full px-4 py-3 bg-[#f2f4f6] rounded-lg text-[16px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/30 focus:bg-white border border-transparent transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#191c1e] hover:bg-[#f2f4f6] rounded-lg text-[14px] font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#003ec7] text-white rounded-lg text-[14px] font-semibold shadow-sm hover:shadow-md transition-shadow flex items-center gap-2"
            >
              <MaterialIcon icon="save" size={18} />
              {editData ? 'Simpan Perubahan' : 'Tambah Mata Pelajaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
