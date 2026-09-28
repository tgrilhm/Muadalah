'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Button } from '@/components/ui/button';
import {
  PieChart, Pie, Cell,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useStatistikAbsensi } from '@/hooks/use-absensi';
import { useQuery } from '@tanstack/react-query';

const STATUS_COLORS: Record<string, string> = {
  HADIR: '#10B981',
  ALFA: '#EF4444',
  SAKIT: '#F59E0B',
  IZIN: '#3B82F6',
  TERLAMBAT: '#F97316',
};

const STATUS_LABELS: Record<string, string> = {
  HADIR: 'Hadir',
  ALFA: 'Alfa',
  SAKIT: 'Sakit',
  IZIN: 'Izin',
  TERLAMBAT: 'Terlambat',
};

function getDefaultStartDate() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
}

export default function AttendanceStatistikPage() {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [schoolId, setSchoolId] = useState<string>('');

  // Fetch schoolId dari API kelas (ambil schoolId dari kelas pertama)
  const { data: kelasData } = useQuery({
    queryKey: ['kelas', 'list'],
    queryFn: async () => {
      const res = await fetch('/api/kelas');
      if (!res.ok) throw new Error('Gagal memuat kelas');
      return res.json();
    },
  });

  useEffect(() => {
    if (kelasData?.data?.length > 0) {
      setSchoolId(kelasData.data[0].schoolId ?? '');
    }
  }, [kelasData]);

  const classes = kelasData?.data ?? [];

  const { data: statsResponse, isLoading, refetch } = useStatistikAbsensi(
    {
      schoolId,
      classId: selectedClass === 'all' ? undefined : selectedClass,
      startDate,
      endDate,
    },
    !!schoolId && !!startDate && !!endDate
  );

  const stats = statsResponse?.data;

  // Transform for Recharts
  const statusDistribution = stats
    ? Object.entries(stats.byStatus).map(([key, val]) => ({
        name: STATUS_LABELS[key] ?? key,
        value: val as number,
        color: STATUS_COLORS[key] ?? '#888',
      })).filter((d) => d.value > 0)
    : [];

  const dailyTrend = stats?.dailyTrend ?? [];

  const overallPercentage = stats?.overall?.percentage ?? 0;
  const totalStudents = stats?.overall?.totalStudents ?? 0;
  const totalAlfa = stats?.byStatus?.ALFA ?? 0;
  const totalDays = stats?.overall?.totalDays ?? 0;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <nav className="flex items-center gap-2 text-sm text-[var(--muadalah-on-surface-variant)] mb-2">
          <Link href="/dashboard" className="hover:text-[var(--muadalah-primary)] transition-colors">Dashboard</Link>
          <MaterialIcon name="chevron_right" size="xs" />
          <Link href="/dashboard/absensi" className="hover:text-[var(--muadalah-primary)] transition-colors">Absensi</Link>
          <MaterialIcon name="chevron_right" size="xs" />
          <span className="text-[var(--muadalah-on-surface)] font-medium">Statistik</span>
        </nav>
        <h1 className="text-[32px] font-bold text-[var(--muadalah-on-surface)]">Statistik Absensi 📈</h1>
        <p className="text-[var(--muadalah-on-surface-variant)] mt-1">Analisis mendalam tentang kehadiran siswa</p>
      </motion.div>

      {/* Filter Card */}
      <motion.div
        className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] p-6 shadow-sm"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--muadalah-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] bg-white"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((kelas: { id: string; name: string }) => (
                <option key={kelas.id} value={kelas.id}>Kelas {kelas.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--muadalah-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--muadalah-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">Aksi</label>
            <Button onClick={() => refetch()} disabled={isLoading || !schoolId} className="w-full bg-[var(--muadalah-primary)] text-white">
              <MaterialIcon name={isLoading ? 'sync' : 'bar_chart'} size="sm" className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Memuat...' : 'Tampilkan'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <MaterialIcon name="sync" size="lg" className="text-[var(--muadalah-primary)] animate-spin" />
            <p className="text-[var(--muadalah-on-surface-variant)]">Menganalisis data absensi...</p>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      {!isLoading && stats && (
        <>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <OverviewCard label="Tingkat Kehadiran" value={`${overallPercentage}%`} icon="trending_up" color="emerald" />
            <OverviewCard label="Total Siswa" value={String(totalStudents)} icon="groups" color="blue" />
            <OverviewCard label="Total Alfa" value={String(totalAlfa)} icon="warning" color="red" />
            <OverviewCard label="Hari Efektif" value={String(totalDays)} icon="calendar_today" color="purple" />
          </motion.div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution Pie Chart */}
            <motion.div
              className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] p-6 shadow-sm"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-[var(--muadalah-on-surface)] mb-4">Distribusi Status Kehadiran</h3>
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(0)}`, 'Jumlah']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-[var(--muadalah-on-surface-variant)]">Tidak ada data</p>
                </div>
              )}
            </motion.div>

            {/* Daily Trend Line Chart */}
            <motion.div
              className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] p-6 shadow-sm"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-[var(--muadalah-on-surface)] mb-4">Tren Kehadiran Harian</h3>
              {dailyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val: string) =>
                        new Date(val + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
                      }
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => [`${Number(value)}%`, 'Kehadiran']}
                      labelFormatter={(label) => {
                        const str = String(label);
                        return new Date(str + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long' });
                      }}
                    />
                    <Line type="monotone" dataKey="percentage" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-[var(--muadalah-on-surface-variant)]">Tidak ada data tren</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Top Absent Students */}
          {stats.topAbsent && stats.topAbsent.length > 0 && (
            <motion.div
              className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] p-6 shadow-sm"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            >
              <h3 className="text-lg font-semibold text-[var(--muadalah-on-surface)] mb-4">
                Siswa dengan Ketidakhadiran Tertinggi
              </h3>
              <div className="space-y-3">
                {stats.topAbsent.map((student: { studentId: string; name: string; classId: string; count: number }, index: number) => (
                  <div
                    key={student.studentId}
                    className="flex items-center justify-between p-4 bg-[var(--muadalah-surface-container-low)] rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--muadalah-on-surface)]">{student.name}</p>
                        <p className="text-sm text-[var(--muadalah-on-surface-variant)]">Kelas {student.classId.slice(-4)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">{student.count}</p>
                      <p className="text-xs text-[var(--muadalah-on-surface-variant)]">ketidakhadiran</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Empty — no data yet */}
      {!isLoading && !stats && (
        <motion.div
          className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] p-12 text-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <MaterialIcon name="bar_chart" size="lg" className="text-[var(--muadalah-on-surface-variant)] mb-4" />
          <p className="text-[var(--muadalah-on-surface-variant)]">Atur filter dan klik Tampilkan untuk melihat statistik</p>
        </motion.div>
      )}
    </div>
  );
}

interface OverviewCardProps {
  label: string;
  value: string;
  icon: string;
  color: 'emerald' | 'blue' | 'red' | 'purple';
  trend?: string;
}

function OverviewCard({ label, value, icon, color, trend }: OverviewCardProps) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    red: 'bg-red-500/10 text-red-700 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  };
  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <MaterialIcon name={icon} size="md" />
        {trend && <span className="text-xs font-semibold text-emerald-600">{trend}</span>}
      </div>
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
