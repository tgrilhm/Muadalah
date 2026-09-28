'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useDashboardStats, useDashboardAktivitas } from '@/hooks/use-dashboard';
import { StatCard } from '@/components/dashboard/stat-card';
import { AttendanceChart } from '@/components/dashboard/attendance-chart'
import GradeChart from '@/components/dashboard/GradeChart'
import PaymentChart from '@/components/dashboard/PaymentChart'
import UpcomingEvents from '@/components/dashboard/UpcomingEvents'
import ClassOverview from '@/components/dashboard/ClassOverview'
import { TopPerformers } from '@/components/dashboard/top-performers'
import { AktivitasItem } from '@/types/dashboard';

// Quick actions (static - navigation links)
const quickActions = [
  { icon: 'person_add', label: 'Tambah Siswa', color: '#2563EB', href: '/dashboard/siswa/tambah' },
  { icon: 'assignment', label: 'Input Absensi', color: '#10B981', href: '/dashboard/absensi/harian' },
  { icon: 'edit_note', label: 'Input Nilai', color: '#0EA5E9', href: '/dashboard/nilai' },
  { icon: 'description', label: 'Buat Laporan', color: '#F59E0B', href: '/dashboard/laporan' },
];

const ACTIVITY_ICON_BG: Record<string, string> = {
  student: 'bg-blue-500/10 text-blue-600',
  attendance: 'bg-emerald-500/10 text-emerald-600',
  payment: 'bg-amber-500/10 text-amber-600',
  grade: 'bg-purple-500/10 text-purple-600',
};

function formatCurrency(val: number): string {
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`;
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}Jt`;
  return `Rp ${val.toLocaleString('id-ID')}`;
}

export default function DashboardPage() {
  const { data: statsResponse, isLoading: statsLoading } = useDashboardStats();
  const { data: aktivitasResponse, isLoading: aktivitasLoading } = useDashboardAktivitas();

  const stats = statsResponse?.data;
  const aktivitas: AktivitasItem[] = aktivitasResponse?.data?.data ?? [];
  const siswaBermasalah = stats?.siswaBermasalah;

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto">

      {/* ── Welcome Header ── */}
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[var(--muadalah-on-surface)]">
            Selamat Datang! 👋
          </h1>
          <p className="text-base text-[var(--muadalah-on-surface-variant)] mt-1">
            Berikut ringkasan hari ini — {today}
          </p>
        </div>

        {/* Warning Alert — siswa bermasalah */}
        {siswaBermasalah && siswaBermasalah.count > 0 && (
          <motion.div
            className="bg-[var(--muadalah-warning)]/10 border border-[var(--muadalah-warning)]/20 rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm w-full md:w-auto hover:shadow-md transition-shadow"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-10 h-10 rounded-full bg-[var(--muadalah-warning)]/20 flex items-center justify-center shrink-0">
              <motion.span
                className="material-symbols-outlined text-[var(--muadalah-warning)]"
                style={{ fontVariationSettings: '"FILL" 1' }}
                animate={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                warning
              </motion.span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--muadalah-on-surface)]">Peringatan Kehadiran</p>
              <p className="text-xs text-[var(--muadalah-on-surface-variant)]">
                {siswaBermasalah.count} siswa memiliki kehadiran di bawah 75% semester ini.
              </p>
            </div>
            <Link
              href="/dashboard/absensi/rekap"
              className="bg-[var(--muadalah-surface)] px-4 py-2 rounded-lg text-sm font-medium text-[var(--muadalah-primary)] shadow-sm hover:shadow-md transition-all whitespace-nowrap border border-[var(--muadalah-border-subtle)] hover:-translate-y-0.5"
            >
              Lihat Detail
            </Link>
          </motion.div>
        )}
      </motion.div>

      {/* ── Stats Grid 4 Cards ── */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
        }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard
            label="Total Siswa Aktif"
            value={statsLoading ? '...' : (stats?.totalSiswaAktif ?? '—')}
            icon="group"
            iconColor="#2563EB"
            iconBg="#EFF6FF"
            loading={statsLoading}
          />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard
            label="Kehadiran Hari Ini"
            value={statsLoading ? '...' : (stats ? `${stats.kehadiranHariIni.persentase}%` : '—')}
            icon="how_to_reg"
            iconColor="#10B981"
            iconBg="#ECFDF5"
            trend={stats ? `${stats.kehadiranHariIni.hadir}/${stats.kehadiranHariIni.total} siswa` : undefined}
            trendUp={(stats?.kehadiranHariIni.persentase ?? 0) >= 75}
            loading={statsLoading}
          />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard
            label="Rata-rata Nilai"
            value={statsLoading ? '...' : (stats ? (stats.rataRataNilai.rataRata > 0 ? stats.rataRataNilai.rataRata.toFixed(1) : '—') : '—')}
            icon="grade"
            iconColor="#0EA5E9"
            iconBg="#F0F9FF"
            trend={stats?.rataRataNilai.semesterName ?? undefined}
            loading={statsLoading}
          />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard
            label="SPP Bulan Ini"
            value={statsLoading ? '...' : (stats ? `${stats.sppBulanIni.persentase}%` : '—')}
            icon="payments"
            iconColor="#F59E0B"
            iconBg="#FFFBEB"
            trend={stats ? formatCurrency(stats.sppBulanIni.terkumpul) : undefined}
            loading={statsLoading}
          />
        </motion.div>
      </motion.div>

      {/* ── Main Content 2-column ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Left Column */}
        <div className="xl:col-span-4 flex flex-col gap-6">

          {/* Tugas / Quick Actions */}
          <motion.div
            className="bg-[var(--muadalah-surface-card)] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[var(--muadalah-border-subtle)]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-base font-semibold text-[var(--muadalah-on-surface)] mb-4">⚡ Aksi Cepat</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, idx) => (
                <Link key={idx} href={action.href}>
                  <motion.div
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[var(--muadalah-border-subtle)] hover:shadow-md transition-all group cursor-pointer bg-[var(--muadalah-surface)]"
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: `${action.color}15` }}>
                      <span className="material-symbols-outlined text-[22px]" style={{ color: action.color }}>{action.icon}</span>
                    </div>
                    <p className="text-xs font-medium text-[var(--muadalah-on-surface)] text-center leading-tight">{action.label}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Aktivitas Terkini */}
          <motion.div
            className="bg-[var(--muadalah-surface-card)] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[var(--muadalah-border-subtle)] flex-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--muadalah-on-surface)]">🕐 Aktivitas Terkini</h2>
              {aktivitasLoading && (
                <span className="material-symbols-outlined text-[18px] text-[var(--muadalah-on-surface-variant)] animate-spin">sync</span>
              )}
            </div>

            {aktivitasLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-[var(--muadalah-surface-container)]" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-40 bg-[var(--muadalah-surface-container)] rounded" />
                      <div className="h-3 w-32 bg-[var(--muadalah-surface-container)] rounded" />
                      <div className="h-2.5 w-24 bg-[var(--muadalah-surface-container)] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : aktivitas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="material-symbols-outlined text-[40px] text-[var(--muadalah-on-surface-variant)] mb-2">inbox</span>
                <p className="text-sm text-[var(--muadalah-on-surface-variant)]">Belum ada aktivitas terbaru</p>
              </div>
            ) : (
              <div className="space-y-4">
                {aktivitas.map((activity, idx) => (
                  <motion.div
                    key={activity.id}
                    className="flex items-start gap-3 group cursor-pointer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ACTIVITY_ICON_BG[activity.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                        {activity.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--muadalah-on-surface)] truncate">{activity.action}</p>
                      <p className="text-xs text-[var(--muadalah-on-surface-variant)] truncate mt-0.5">{activity.detail}</p>
                      <p className="text-xs text-[var(--muadalah-outline)] mt-1">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* Attendance Bar Chart */}
          <AttendanceChart />

          {/* Grade and Payment Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              className="bg-[var(--muadalah-surface-card)] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[var(--muadalah-border-subtle)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-base font-semibold text-[var(--muadalah-on-surface)] mb-4">
                📊 Rata-rata Nilai
              </h3>
              <GradeChart />
            </motion.div>

            <motion.div
              className="bg-[var(--muadalah-surface-card)] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[var(--muadalah-border-subtle)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h3 className="text-base font-semibold text-[var(--muadalah-on-surface)] mb-4">
                💰 Status Pembayaran SPP
              </h3>
              <PaymentChart />
            </motion.div>
          </div>

          {/* Top Performers */}
          <TopPerformers />

          {/* Siswa Bermasalah detail card */}
          {siswaBermasalah && siswaBermasalah.count > 0 && (
            <motion.div
              className="bg-red-50 border border-red-200 rounded-2xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500" style={{ fontVariationSettings: '"FILL" 1' }}>report</span>
                  <h3 className="text-base font-semibold text-red-800">Siswa Perlu Perhatian</h3>
                </div>
                <Link href="/dashboard/absensi/rekap" className="text-xs text-red-600 hover:underline">Lihat semua →</Link>
              </div>
              <div className="space-y-2">
                {siswaBermasalah.list.map((siswa: { id: string; name: string; kelas: string; persentaseKehadiran: number }) => (
                  <div key={siswa.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-red-100">
                    <div>
                      <p className="text-sm font-medium text-[var(--muadalah-on-surface)]">{siswa.name}</p>
                      <p className="text-xs text-[var(--muadalah-on-surface-variant)]">Kelas {siswa.kelas}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-red-600">{siswa.persentaseKehadiran}%</span>
                      <p className="text-xs text-red-400">kehadiran</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Upcoming Events and Class Overview */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="lg:col-span-1">
          <UpcomingEvents />
        </div>
        <div className="lg:col-span-2">
          <ClassOverview />
        </div>
      </motion.div>
    </div>
  );
}
