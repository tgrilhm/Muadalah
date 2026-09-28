'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/attendance/status-badge';
import { AttendanceStatus } from '@prisma/client';
import { useRekapAbsensi } from '@/hooks/use-absensi';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface RekapRow {
  student: { id: string; name: string; nis: string };
  attendances: Array<{ date: string; status: AttendanceStatus; notes?: string | null }>;
  summary: {
    total: number;
    hadir: number;
    alfa: number;
    sakit: number;
    izin: number;
    terlambat: number;
    percentage: number;
  };
}

function getDefaultStartDate() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
}

export default function AttendanceRekapPage() {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch kelas
  const { data: kelasData, isLoading: kelasLoading } = useQuery({
    queryKey: ['kelas', 'list'],
    queryFn: async () => {
      const res = await fetch('/api/kelas');
      if (!res.ok) throw new Error('Gagal memuat kelas');
      return res.json();
    },
  });

  // Fetch rekap (triggered manually via Cari button)
  const {
    data: rekapResponse,
    isLoading: rekapLoading,
    refetch,
  } = useRekapAbsensi(
    { classId: selectedClass, startDate, endDate },
    hasSearched && !!selectedClass
  );

  const classes = kelasData?.data ?? [];
  const rekapData: RekapRow[] = rekapResponse?.data ?? [];
  const overallSummary = rekapResponse?.summary ?? null;

  const allDates = Array.from(
    new Set(rekapData.flatMap((r) => r.attendances.map((a) => a.date)))
  ).sort();

  const handleSearch = () => {
    if (!selectedClass) {
      toast({ title: 'Peringatan', description: 'Pilih kelas terlebih dahulu', variant: 'destructive' });
      return;
    }
    setHasSearched(true);
    refetch();
  };

  const handleExport = async () => {
    toast({ title: 'Info', description: 'Fitur export Excel akan segera hadir' });
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <nav className="flex items-center gap-2 text-sm text-[var(--muadalah-on-surface-variant)] mb-2">
          <Link href="/dashboard" className="hover:text-[var(--muadalah-primary)] transition-colors">Dashboard</Link>
          <MaterialIcon name="chevron_right" size="xs" />
          <Link href="/dashboard/absensi" className="hover:text-[var(--muadalah-primary)] transition-colors">Absensi</Link>
          <MaterialIcon name="chevron_right" size="xs" />
          <span className="text-[var(--muadalah-on-surface)] font-medium">Rekap Absensi</span>
        </nav>
        <h1 className="text-[32px] font-bold text-[var(--muadalah-on-surface)]">Rekap Absensi 📊</h1>
        <p className="text-[var(--muadalah-on-surface-variant)] mt-1">Lihat ringkasan kehadiran siswa dalam periode tertentu</p>
      </motion.div>

      {/* Filter Card */}
      <motion.div
        className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] p-6 shadow-sm"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">Pilih Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setHasSearched(false); }}
              disabled={kelasLoading}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--muadalah-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] bg-white disabled:opacity-50"
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map((kelas: { id: string; name: string }) => (
                <option key={kelas.id} value={kelas.id}>Kelas {kelas.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--muadalah-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--muadalah-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-0.5">Aksi</label>
            <Button onClick={handleSearch} disabled={!selectedClass || rekapLoading} className="bg-[var(--muadalah-primary)] text-white">
              <MaterialIcon name="search" size="sm" className="mr-2" />
              {rekapLoading ? 'Memuat...' : 'Cari'}
            </Button>
            <Button onClick={handleExport} disabled={!hasSearched || rekapData.length === 0} variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
              <MaterialIcon name="download" size="sm" className="mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards — dari API */}
      {hasSearched && overallSummary && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <StatCard label="Total Siswa" value={String(overallSummary.totalStudents)} icon="groups" color="blue" />
          <StatCard label="Rata-rata Kehadiran" value={`${overallSummary.percentage}%`} icon="trending_up" color="emerald" />
          <StatCard label="Total Hari" value={String(overallSummary.totalDays)} icon="calendar_today" color="purple" />
          <StatCard label="Total Alfa" value={String(overallSummary.alfa)} icon="warning" color="red" />
        </motion.div>
      )}

      {/* Loading state */}
      {rekapLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <MaterialIcon name="sync" size="lg" className="text-[var(--muadalah-primary)] animate-spin" />
            <p className="text-[var(--muadalah-on-surface-variant)]">Memuat rekap absensi...</p>
          </div>
        </div>
      )}

      {/* Rekap Table */}
      {hasSearched && !rekapLoading && rekapData.length > 0 ? (
        <motion.div
          className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--muadalah-surface-container)]">
                <tr>
                  <th className="sticky left-0 bg-[var(--muadalah-surface-container)] px-6 py-4 text-left text-sm font-semibold text-[var(--muadalah-on-surface)] border-r border-[var(--muadalah-border-subtle)]">
                    Siswa
                  </th>
                  {allDates.map((date) => (
                    <th key={date} className="px-4 py-4 text-center text-xs font-semibold text-[var(--muadalah-on-surface)]">
                      {new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--muadalah-on-surface)] border-l border-[var(--muadalah-border-subtle)]">
                    Kehadiran
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--muadalah-border-subtle)]">
                {rekapData.map((row) => {
                  const byDate = Object.fromEntries(row.attendances.map((a) => [a.date, a.status]));
                  return (
                    <tr key={row.student.id} className="hover:bg-[var(--muadalah-surface-container-low)] transition-colors">
                      <td className="sticky left-0 bg-[var(--muadalah-surface-card)] hover:bg-[var(--muadalah-surface-container-low)] px-6 py-4 border-r border-[var(--muadalah-border-subtle)]">
                        <p className="font-semibold text-[var(--muadalah-on-surface)]">{row.student.name}</p>
                        <p className="text-xs text-[var(--muadalah-on-surface-variant)]">NIS: {row.student.nis}</p>
                      </td>
                      {allDates.map((date) => (
                        <td key={date} className="px-4 py-4 text-center">
                          {byDate[date] ? (
                            <div className="flex justify-center">
                              <StatusBadge status={byDate[date] as AttendanceStatus} showDot={false} />
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--muadalah-on-surface-variant)]">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-center border-l border-[var(--muadalah-border-subtle)]">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-lg font-bold ${row.summary.percentage < 75 ? 'text-red-600' : 'text-[var(--muadalah-on-surface)]'}`}>
                            {row.summary.percentage.toFixed(0)}%
                          </span>
                          <span className="text-xs text-[var(--muadalah-on-surface-variant)]">
                            {row.summary.hadir}/{row.summary.total} hari
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : hasSearched && !rekapLoading && rekapData.length === 0 ? (
        <motion.div
          className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] p-12 text-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <MaterialIcon name="event_busy" size="lg" className="text-[var(--muadalah-on-surface-variant)] mb-4" />
          <p className="text-[var(--muadalah-on-surface-variant)]">Tidak ada data absensi untuk periode yang dipilih</p>
        </motion.div>
      ) : !hasSearched ? (
        <motion.div
          className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] p-12 text-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <MaterialIcon name="assessment" size="lg" className="text-[var(--muadalah-on-surface-variant)] mb-4" />
          <p className="text-[var(--muadalah-on-surface-variant)]">Pilih kelas dan periode, lalu klik Cari untuk melihat rekap absensi</p>
        </motion.div>
      ) : null}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: 'blue' | 'emerald' | 'purple' | 'red';
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
    red: 'bg-red-500/10 text-red-700 border-red-500/20',
  };
  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <MaterialIcon name={icon} size="md" />
      </div>
    </div>
  );
}
