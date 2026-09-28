'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchool } from '@/hooks/use-school';
import { usePembayaran, useRingkasanPembayaran, useDeletePembayaran } from '@/hooks/use-pembayaran';
import { PaymentFormModal } from '@/components/payments/payment-form-modal';
import { ReceiptModal } from '@/components/payments/receipt-modal';
import { PaymentStatusBadge } from '@/components/payments/payment-status-badge';
import { PaymentStatus, PaymentType } from '@prisma/client';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}Jt`;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
}

function StudentAvatar({ name, photo }: { name: string; photo?: string | null }) {
  if (photo) {
    return <img src={photo} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />;
  }
  const initials = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  const colors = ['bg-blue-200 text-blue-800', 'bg-emerald-200 text-emerald-800', 'bg-purple-200 text-purple-800', 'bg-amber-200 text-amber-800'];
  const colorIdx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${colors[colorIdx]}`}>
      {initials}
    </div>
  );
}

// Skeleton loader
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full" /><div className="space-y-2"><div className="h-3.5 bg-gray-200 rounded w-32" /><div className="h-3 bg-gray-100 rounded w-20" /></div></div></td>
      <td className="px-6 py-4"><div className="h-3.5 bg-gray-200 rounded w-20" /></td>
      <td className="px-6 py-4"><div className="h-3.5 bg-gray-200 rounded w-24" /></td>
      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20" /></td>
      <td className="px-6 py-4"><div className="h-3.5 bg-gray-200 rounded w-24" /></td>
      <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded-lg w-28 ml-auto" /></td>
    </tr>
  );
}

export default function PembayaranPage() {
  const { selectedSchool } = useSchool();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear] = useState(now.getFullYear());
  const [selectedClass, setSelectedClass] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPaymentForForm, setSelectedPaymentForForm] = useState<{
    id: string; name: string; nis: string; class: { name: string };
  } | null>(null);

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Record<string, unknown> | null>(null);

  const queryParams = { month: selectedMonth, year: selectedYear, classId: selectedClass || undefined, search: search || undefined, page, limit: 20 };

  const { data: paymentData, isLoading: isListLoading } = usePembayaran(selectedSchool?.id, queryParams);
  const { data: ringkasanData, isLoading: isRingkasanLoading } = useRingkasanPembayaran({ month: selectedMonth, year: selectedYear });
  const deleteMutation = useDeletePembayaran();

  const payments = paymentData?.data ?? [];
  const meta = paymentData?.meta ?? { total: 0, totalPages: 1 };
  const ringkasan = ringkasanData?.data;

  const handleOpenForm = useCallback((student?: { id: string; name: string; nis: string; class: { name: string } }) => {
    setSelectedPaymentForForm(student ?? null);
    setIsFormOpen(true);
  }, []);

  const handleOpenReceipt = useCallback((payment: Record<string, unknown>) => {
    setReceiptPayment(payment);
    setIsReceiptOpen(true);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data pembayaran ini?')) return;
    await deleteMutation.mutateAsync(id);
  };

  const summaryCards = [
    {
      label: 'Total Target SPP',
      value: ringkasan ? formatCurrency(ringkasan.totalTarget) : '—',
      icon: 'account_balance_wallet',
      accent: 'from-blue-500 to-blue-700',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      sub: `${ringkasan?.totalSiswaAktif ?? 0} siswa aktif`,
    },
    {
      label: 'Terkumpul',
      value: ringkasan ? formatCurrency(ringkasan.totalTerkumpul) : '—',
      icon: 'check_circle',
      accent: 'from-emerald-500 to-emerald-700',
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      progress: ringkasan?.persentase ?? 0,
      sub: `${ringkasan?.persentase ?? 0}% dari target`,
    },
    {
      label: 'Tunggakan',
      value: ringkasan ? formatCurrency(ringkasan.totalTunggakan) : '—',
      icon: 'warning',
      accent: 'from-red-500 to-red-700',
      bg: 'bg-red-50',
      iconColor: 'text-red-500',
      sub: `${ringkasan?.siswaBelumBayar ?? 0} siswa belum bayar`,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pembayaran SPP</h1>
          <p className="text-gray-500 mt-1">Kelola dan pantau status pembayaran SPP siswa.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/pembayaran/tunggakan"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">money_off</span>
            Tunggakan
          </a>
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #2563EB, #1d4ed8)' }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Catat Pembayaran
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow"
          >
            {/* Accent blob */}
            <div
              className={`absolute -right-4 -top-4 w-28 h-28 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity bg-gradient-to-br ${card.accent}`}
            />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {isRingkasanLoading ? <span className="h-7 w-28 bg-gray-200 rounded animate-pulse inline-block" /> : card.value}
                  </p>
                </div>
                <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                  <span className={`material-symbols-outlined ${card.iconColor} text-[22px]`}>{card.icon}</span>
                </div>
              </div>
              {card.progress !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                    <motion.div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(card.progress, 100)}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">{isRingkasanLoading ? '...' : card.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Controls */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama siswa atau NIS..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
          </div>
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(Number(e.target.value)); setPage(1); }}
              className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">Semua Kelas</option>
            </select>
          </div>
          <div className="text-sm text-gray-400 ml-auto hidden sm:block">
            {meta.total > 0 && `${meta.total} data`}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/70">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Siswa</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Jumlah</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Bayar</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isListLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-gray-300 text-5xl">payments</span>
                      <p className="text-gray-500 font-medium">Tidak ada data pembayaran</p>
                      <p className="text-gray-400 text-sm">Coba ubah filter atau tambah pembayaran baru</p>
                      <button
                        onClick={() => handleOpenForm()}
                        className="mt-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        + Catat Pembayaran Pertama
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {payments.map((payment: Record<string, unknown>, idx: number) => {
                    const student = payment.student as Record<string, unknown>;
                    const studentClass = student.class as Record<string, unknown>;
                    return (
                      <motion.tr
                        key={payment.id as string}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        {/* Student */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <StudentAvatar
                              name={student.name as string}
                              photo={(student.photo as string) ?? null}
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{student.name as string}</p>
                              <p className="text-xs text-gray-400">NIS: {student.nis as string}</p>
                            </div>
                          </div>
                        </td>
                        {/* Class */}
                        <td className="px-6 py-4 text-sm text-gray-700">{studentClass.name as string}</td>
                        {/* Amount */}
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(payment.amount as number)}
                        </td>
                        {/* Status */}
                        <td className="px-6 py-4">
                          <PaymentStatusBadge status={payment.status as PaymentStatus} />
                        </td>
                        {/* Paid at */}
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(payment.paidAt as string | null)}</td>
                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {payment.status === 'LUNAS' ? (
                              <button
                                onClick={() => handleOpenReceipt(payment)}
                                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Lihat Kwitansi"
                              >
                                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleOpenForm({
                                    id: student.id as string,
                                    name: student.name as string,
                                    nis: student.nis as string,
                                    class: { name: studentClass.name as string },
                                  })
                                }
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[14px]">payments</span>
                                Catat Bayar
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(payment.id as string)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Menampilkan {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} dari {meta.total} data
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-40 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                      page === p
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-40 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <PaymentFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedPaymentForForm(null); }}
        student={selectedPaymentForForm}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
        onSuccess={() => {}}
      />
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => { setIsReceiptOpen(false); setReceiptPayment(null); }}
        payment={receiptPayment as Parameters<typeof ReceiptModal>[0]['payment']}
      />
    </div>
  );
}
