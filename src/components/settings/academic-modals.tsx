'use client';

import { useState } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';

interface TahunAjaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TahunAjaranFormData) => void;
  editData?: TahunAjaranFormData;
}

export interface TahunAjaranFormData {
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export function TahunAjaranModal({ isOpen, onClose, onSave, editData }: TahunAjaranModalProps) {
  const [formData, setFormData] = useState<TahunAjaranFormData>(
    editData || {
      name: '',
      startDate: '',
      endDate: '',
      isActive: false,
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
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <h2 className="text-[20px] leading-[1.4] font-semibold text-[#191c1e]">
            {editData ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran Baru'}
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
              Nama Tahun Ajaran <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: 2024/2025"
              required
              className="w-full px-4 py-3 bg-[#f2f4f6] rounded-lg text-[16px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/30 focus:bg-white border border-transparent transition-all"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[14px] font-semibold tracking-[0.05em] text-[#434656]">
              Tanggal Mulai <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              className="w-full px-4 py-3 bg-[#f2f4f6] rounded-lg text-[16px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/30 focus:bg-white border border-transparent transition-all"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[14px] font-semibold tracking-[0.05em] text-[#434656]">
              Tanggal Akhir <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
              className="w-full px-4 py-3 bg-[#f2f4f6] rounded-lg text-[16px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/30 focus:bg-white border border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-[#f7f9fb] rounded-lg">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 rounded border-[#c3c5d9] text-[#003ec7] focus:ring-2 focus:ring-[#003ec7]/30"
            />
            <label htmlFor="isActive" className="text-[14px] text-[#191c1e] cursor-pointer">
              Aktifkan tahun ajaran ini sebagai tahun aktif
            </label>
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
              className="px-4 py-2 bg-[#003ec7] text-white rounded-lg text-[14px] font-semibold shadow-sm hover:shadow-md transition-shadow"
            >
              {editData ? 'Simpan Perubahan' : 'Tambah Tahun Ajaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SemesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SemesterFormData) => void;
  editData?: SemesterFormData;
}

export interface SemesterFormData {
  name: string;
  number: number;
  startDate: string;
  endDate: string;
  academicYearId: string;
  isActive: boolean;
}

export function SemesterModal({ isOpen, onClose, onSave, editData }: SemesterModalProps) {
  const [formData, setFormData] = useState<SemesterFormData>(
    editData || {
      name: '',
      number: 1,
      startDate: '',
      endDate: '',
      academicYearId: '',
      isActive: false,
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
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <h2 className="text-[20px] leading-[1.4] font-semibold text-[#191c1e]">
            {editData ? 'Edit Semester' : 'Tambah Semester Baru'}
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
              Nama Semester <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={formData.number}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  number: Number(e.target.value),
                  name: Number(e.target.value) === 1 ? 'Ganjil' : 'Genap',
                })
              }
              required
              className="w-full px-4 py-3 bg-[#f2f4f6] rounded-lg text-[16px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/30 focus:bg-white border border-transparent transition-all"
            >
              <option value={1}>Semester Ganjil</option>
              <option value={2}>Semester Genap</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-[14px] font-semibold tracking-[0.05em] text-[#434656]">
              Tanggal Mulai <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              className="w-full px-4 py-3 bg-[#f2f4f6] rounded-lg text-[16px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/30 focus:bg-white border border-transparent transition-all"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[14px] font-semibold tracking-[0.05em] text-[#434656]">
              Tanggal Akhir <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
              className="w-full px-4 py-3 bg-[#f2f4f6] rounded-lg text-[16px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/30 focus:bg-white border border-transparent transition-all"
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
              className="px-4 py-2 bg-[#003ec7] text-white rounded-lg text-[14px] font-semibold shadow-sm hover:shadow-md transition-shadow"
            >
              {editData ? 'Simpan Perubahan' : 'Tambah Semester'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
