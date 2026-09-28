'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentStatus, PaymentType } from '@prisma/client';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  SPP: 'SPP',
  PENDAFTARAN: 'Pendaftaran',
  SERAGAM: 'Seragam',
  BUKU: 'Buku',
  KEGIATAN: 'Kegiatan',
  LAINNYA: 'Lainnya',
};

interface ReceiptData {
  id: string;
  receiptNo: string | null;
  type: PaymentType;
  month: number;
  year: number;
  amount: number;
  status: PaymentStatus;
  paidAt: string | Date | null;
  notes: string | null;
  student: {
    name: string;
    nis: string;
    nisn?: string | null;
    photo?: string | null;
    class: { name: string; grade: number };
  };
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: ReceiptData | null;
  schoolName?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string | Date | null): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(date));
}

export function ReceiptModal({ isOpen, onClose, payment, schoolName = 'Sekolah Muadalah' }: ReceiptModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => modalRef.current?.focus(), 50);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  const handlePrint = () => {
    window.print();
  };

  if (!payment) return null;

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
            aria-label="Kwitansi Pembayaran"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
              {/* Print area */}
              <div id="kwitansi-print" className="p-6">
                {/* Header */}
                <div className="text-center border-b-2 border-blue-600 pb-4 mb-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-blue-600 text-3xl">school</span>
                    <div className="text-left">
                      <h2 className="font-bold text-blue-800 text-lg leading-tight">{schoolName}</h2>
                      <p className="text-xs text-gray-500">KWITANSI PEMBAYARAN</p>
                    </div>
                  </div>
                </div>

                {/* Receipt No */}
                <div className="flex items-center justify-between mb-4 bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-xs text-gray-600 font-medium">No. Kwitansi</span>
                  <span className="text-sm font-bold text-blue-700">
                    {payment.receiptNo ?? '-'}
                  </span>
                </div>

                {/* Student Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 w-32 flex-shrink-0">Nama Siswa</span>
                    <span className="font-semibold text-gray-800 text-right">{payment.student.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 w-32 flex-shrink-0">NIS</span>
                    <span className="font-medium text-gray-700">{payment.student.nis}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 w-32 flex-shrink-0">Kelas</span>
                    <span className="font-medium text-gray-700">{payment.student.class.name}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-300 my-4" />

                {/* Payment Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 w-32 flex-shrink-0">Jenis Bayar</span>
                    <span className="font-medium text-gray-700">{PAYMENT_TYPE_LABELS[payment.type]}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 w-32 flex-shrink-0">Periode</span>
                    <span className="font-medium text-gray-700">
                      {MONTH_NAMES[payment.month - 1]} {payment.year}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 w-32 flex-shrink-0">Tanggal Bayar</span>
                    <span className="font-medium text-gray-700">{formatDate(payment.paidAt)}</span>
                  </div>
                  {payment.notes && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 w-32 flex-shrink-0">Catatan</span>
                      <span className="text-gray-600 text-right max-w-[180px]">{payment.notes}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="bg-blue-600 text-white rounded-xl px-4 py-3 flex items-center justify-between mt-4">
                  <span className="text-sm font-medium opacity-90">Total Pembayaran</span>
                  <span className="text-lg font-bold">{formatCurrency(payment.amount)}</span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                    {payment.status === 'LUNAS' ? 'verified' : 'pending'}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      payment.status === 'LUNAS' ? 'text-emerald-700' : 'text-amber-600'
                    }`}
                  >
                    {payment.status === 'LUNAS' ? 'LUNAS' : payment.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Signature area */}
                <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-8">Petugas Administrasi</p>
                    <p className="text-xs text-gray-600 border-t border-gray-400 pt-1 px-4">
                      (__________________________)
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons — hidden in print */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 print:hidden">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Tutup
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  Cetak Kwitansi
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
