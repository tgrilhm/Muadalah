'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreatePembayaran } from '@/hooks/use-pembayaran';
import { PaymentType } from '@prisma/client';

const MONTH_OPTIONS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
  { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
];

const PAYMENT_TYPE_OPTIONS: { value: PaymentType; label: string }[] = [
  { value: 'SPP', label: 'SPP Bulanan' },
  { value: 'PENDAFTARAN', label: 'Pendaftaran' },
  { value: 'SERAGAM', label: 'Seragam' },
  { value: 'BUKU', label: 'Buku' },
  { value: 'KEGIATAN', label: 'Kegiatan' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

interface StudentOption {
  id: string;
  name: string;
  nis: string;
  class: { name: string };
}

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: StudentOption | null; // pre-selected student
  defaultMonth?: number;
  defaultYear?: number;
  defaultAmount?: number;
  onSuccess?: () => void;
}

export function PaymentFormModal({
  isOpen,
  onClose,
  student: preSelectedStudent,
  defaultMonth,
  defaultYear,
  defaultAmount = 550000,
  onSuccess,
}: PaymentFormModalProps) {
  const now = new Date();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [formData, setFormData] = useState({
    studentId: preSelectedStudent?.id ?? '',
    type: 'SPP' as PaymentType,
    month: defaultMonth ?? now.getMonth() + 1,
    year: defaultYear ?? now.getFullYear(),
    amount: defaultAmount,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const createMutation = useCreatePembayaran();

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => modalRef.current?.focus(), 50);
      // Reset form with defaults
      setFormData({
        studentId: preSelectedStudent?.id ?? '',
        type: 'SPP',
        month: defaultMonth ?? now.getMonth() + 1,
        year: defaultYear ?? now.getFullYear(),
        amount: defaultAmount,
        notes: '',
      });
      setErrors({});
    } else {
      previousFocusRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.studentId) newErrors.studentId = 'Siswa wajib dipilih';
    if (!formData.type) newErrors.type = 'Jenis pembayaran wajib dipilih';
    if (!formData.month) newErrors.month = 'Bulan wajib diisi';
    if (!formData.year || formData.year < 2000) newErrors.year = 'Tahun tidak valid';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Jumlah harus lebih dari 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        studentId: formData.studentId,
        type: formData.type,
        month: formData.month,
        year: formData.year,
        amount: formData.amount,
        status: 'LUNAS',
        notes: formData.notes || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Gagal mencatat pembayaran';
      setErrors({ submit: msg });
    }
  };

  const formatAmount = (value: number) =>
    new Intl.NumberFormat('id-ID').format(value);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-form-title"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #1d4ed8)' }}
                  >
                    <span className="material-symbols-outlined text-white text-[18px]">payments</span>
                  </div>
                  <h2 id="payment-form-title" className="text-lg font-bold text-gray-800">
                    Catat Pembayaran
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Tutup modal"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="p-6 space-y-4">
                  {/* Student Info (read-only when pre-selected) */}
                  {preSelectedStudent ? (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                        Siswa
                      </label>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-bold text-sm flex-shrink-0">
                          {preSelectedStudent.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{preSelectedStudent.name}</p>
                          <p className="text-xs text-gray-500">
                            NIS: {preSelectedStudent.nis} · {preSelectedStudent.class.name}
                          </p>
                        </div>
                      </div>
                      <input type="hidden" value={formData.studentId} />
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="studentId" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                        ID Siswa <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="studentId"
                        type="text"
                        value={formData.studentId}
                        onChange={(e) => setFormData((p) => ({ ...p, studentId: e.target.value }))}
                        placeholder="Masukkan Student ID"
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                          errors.studentId ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
                        }`}
                        aria-invalid={!!errors.studentId}
                        aria-describedby={errors.studentId ? 'studentId-error' : undefined}
                      />
                      {errors.studentId && (
                        <p id="studentId-error" className="text-xs text-red-500 mt-1">{errors.studentId}</p>
                      )}
                    </div>
                  )}

                  {/* Payment Type */}
                  <div>
                    <label htmlFor="paymentType" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Jenis Pembayaran <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="paymentType"
                      value={formData.type}
                      onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value as PaymentType }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                    >
                      {PAYMENT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Month & Year */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="month" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                        Bulan <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="month"
                        value={formData.month}
                        onChange={(e) => setFormData((p) => ({ ...p, month: Number(e.target.value) }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                      >
                        {MONTH_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="year" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                        Tahun <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData((p) => ({ ...p, year: Number(e.target.value) }))}
                        min={2000}
                        max={2100}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                          errors.year ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
                        }`}
                        aria-invalid={!!errors.year}
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label htmlFor="amount" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Jumlah (Rp) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">Rp</span>
                      <input
                        id="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData((p) => ({ ...p, amount: Number(e.target.value) }))}
                        min={0}
                        step={1000}
                        className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                          errors.amount ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
                        }`}
                        aria-invalid={!!errors.amount}
                        aria-describedby={errors.amount ? 'amount-error' : 'amount-hint'}
                      />
                    </div>
                    <p id="amount-hint" className="text-xs text-gray-400 mt-1">
                      {formatAmount(formData.amount)} rupiah
                    </p>
                    {errors.amount && (
                      <p id="amount-error" className="text-xs text-red-500 mt-1">{errors.amount}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Catatan (opsional)
                    </label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Tambahkan catatan jika ada..."
                      rows={2}
                      maxLength={500}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
                    />
                  </div>

                  {/* Error */}
                  {errors.submit && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                      <span className="material-symbols-outlined text-[18px]">error</span>
                      {errors.submit}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={createMutation.isPending}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #1d4ed8)' }}
                  >
                    {createMutation.isPending ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        Simpan Pembayaran
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
