'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTunggakan } from '@/hooks/use-pembayaran';
import { PaymentFormModal } from '@/components/payments/payment-form-modal';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function StudentAvatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  const colors = ['bg-red-200 text-red-800', 'bg-orange-200 text-orange-800', 'bg-pink-200 text-pink-800'];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${colors[idx]}`}>
      {initials}
    </div>
  );
}

function ArrearsMonthBadge({ months }: { months: number[] }) {
  if (months.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {months.slice(0, 4).map((m) => (
        <span key={m} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700">
          {MONTH_NAMES[m - 1].slice(0, 3)}
        </span>
      ))}
      {months.length > 4 && (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-500">
          +{months.length - 4}
        </span>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full" /><div className="space-y-2"><div className="h-3.5 bg-gray-200 rounded w-32" /><div className="h-3 bg-gray-100 rounded w-20" /></div></div></td>
      <td className="px-6 py-4"><div className="h-3.5 bg-gray-200 rounded w-16" /></td>
      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-24" /></td>
      <td className="px-6 py-4"><div className="flex gap-1"><div className="h-5 bg-gray-200 rounded w-12" /><div className="h-5 bg-gray-200 rounded w-12" /></div></td>
      <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded-lg w-24 ml-auto" /></td>
    </tr>
  );
}

export default function TunggakanPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear] = useState(now.getFullYear());
  const [selectedClass, setSelectedClass] = useState('');
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string; name: string; nis: string; class: { name: string };
  } | null>(null);

  const queryParams = {
    classId: selectedClass || undefined,
    month: selectedMonth,
    year: selectedYear,
    page,
    limit: 20,
  };

  const { data: tunggakanData, isLoading } = useTunggakan(queryParams);
  const students = tunggakanData?.data ?? [];
  const meta = tunggakanData?.meta ?? { total: 0, totalPages: 1 };

  const handleCatatBayar = useCallback(
    (student: { id: string; name: string; nis: string; class: { name: string } }) => {
      setSelectedStudent(student);
      setIsFormOpen(true);
    },
    []
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a
              href="/dashboard/pembayaran"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Kembali ke Pembayaran"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </a>
            <h1 className="text-3xl font-bold text-gray-900">Tunggakan SPP</h1>
          </div>
          <p className="text-gray-500 mt-0.5">
            Siswa yang belum membayar SPP bulan{' '}
            <strong>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/pembayaran"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            Daftar Pembayaran
          </a>
        </div>
      </motion.div>

      {/* Alert banner */}
      {!isLoading && meta.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-5 py-3.5 bg-red-50 border border-red-200 rounded-xl"
        >
          <span className="material-symbols-outlined text-red-500 text-[22px]">warning</span>
          <p className="text-sm text-red-700">
            <strong>{meta.total} siswa</strong> belum membayar SPP bulan{' '}
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}. Segera proses pembayaran.
          </p>
        </motion.div>
      )}

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Controls */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
          {!isLoading && meta.total > 0 && (
            <span className="text-sm text-gray-400 ml-auto">{meta.total} siswa menunggak</span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/70">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Siswa</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Jml Bulan Tunggak</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bulan Yang Belum Dibayar</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-300 text-5xl">check_circle</span>
                      <p className="text-gray-500 font-semibold">Tidak Ada Tunggakan!</p>
                      <p className="text-gray-400 text-sm">
                        Semua siswa sudah membayar SPP bulan {MONTH_NAMES[selectedMonth - 1]}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {students.map((student: Record<string, unknown>, idx: number) => {
                    const studentClass = student.class as Record<string, unknown>;
                    const bulanTunggak = (student.bulanTunggak as number[]) ?? [];
                    const jumlahBulan = student.jumlahBulanTunggak as number;
                    const isCritical = jumlahBulan >= 3;

                    return (
                      <motion.tr
                        key={student.id as string}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`hover:bg-gray-50/80 transition-colors group ${
                          isCritical ? 'bg-red-50/30 hover:bg-red-50/50' : ''
                        }`}
                      >
                        {/* Student */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <StudentAvatar name={student.name as string} />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-800">{student.name as string}</p>
                                {isCritical && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500 text-white">
                                    KRITIS
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">NIS: {student.nis as string}</p>
                            </div>
                          </div>
                        </td>
                        {/* Class */}
                        <td className="px-6 py-4 text-sm text-gray-700">{studentClass.name as string}</td>
                        {/* Months count */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${
                              isCritical
                                ? 'bg-red-100 text-red-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {jumlahBulan} Bulan
                          </span>
                        </td>
                        {/* Month badges */}
                        <td className="px-6 py-4">
                          <ArrearsMonthBadge months={bulanTunggak} />
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              handleCatatBayar({
                                id: student.id as string,
                                name: student.name as string,
                                nis: student.nis as string,
                                class: { name: studentClass.name as string },
                              })
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all ml-auto"
                          >
                            <span className="material-symbols-outlined text-[14px]">payments</span>
                            Catat Bayar
                          </button>
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
              {meta.total} siswa menunggak
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-40 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    page === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
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

      {/* Modal */}
      <PaymentFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedStudent(null); }}
        student={selectedStudent}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
        onSuccess={() => {}}
      />
    </div>
  );
}
