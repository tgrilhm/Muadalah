'use client';

import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  useLaporanSummary,
  useDownloadAbsensi,
  useDownloadNilai,
  useDownloadPembayaran,
  useDownloadSiswa,
  useDownloadRaporPdf,
} from '@/hooks/use-laporan';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

// ── Animation variants ─────────────────────────────────────────────────────
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' as const },
  }),
};


// ── Types ──────────────────────────────────────────────────────────────────
interface Semester {
  id: string;
  name: string;
  isActive: boolean;
  academicYear: { id: string; name: string };
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  trend,
  trendUp,
  color,
  delay,
  loading,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  trend?: string;
  trendUp?: boolean;
  color: string;
  delay: number;
  loading?: boolean;
}) {
  return (
    <motion.div
      custom={delay}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-2xl p-6 shadow-sm flex items-start gap-4 relative overflow-hidden group border border-gray-100 hover:shadow-md transition-shadow duration-300"
    >
      {/* Glow blob */}
      <div
        className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: color }}
      />

      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}1A` }}
      >
        <span className="material-symbols-outlined text-[24px]" style={{ color }}>
          {icon}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-500 mb-1 truncate">{label}</h3>
        {loading ? (
          <div className="h-10 w-24 bg-gray-100 rounded animate-pulse mb-1" />
        ) : (
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-bold" style={{ color }}>
              {value}
            </span>
            {trend && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5"
                style={{
                  color: trendUp ? '#10B981' : '#EF4444',
                  backgroundColor: trendUp ? '#10B98115' : '#EF444415',
                }}
              >
                <span className="material-symbols-outlined text-[13px]">
                  {trendUp ? 'trending_up' : 'trending_down'}
                </span>
                {trend}
              </span>
            )}
          </div>
        )}
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </motion.div>
  );
}

// ── Download Item ──────────────────────────────────────────────────────────
function DownloadItem({
  icon,
  title,
  meta,
  onDownloadPdf,
  onDownloadExcel,
  loadingPdf,
  loadingExcel,
  hidePdf,
}: {
  icon: string;
  title: string;
  meta: string;
  onDownloadPdf?: () => void;
  onDownloadExcel?: () => void;
  loadingPdf?: boolean;
  loadingExcel?: boolean;
  hidePdf?: boolean;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
          <span className="material-symbols-outlined text-gray-400 text-[20px]">{icon}</span>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
          <p className="text-xs text-gray-400 mt-0.5">{meta}</p>
        </div>
      </div>

      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {!hidePdf && onDownloadPdf && (
          <button
            onClick={onDownloadPdf}
            disabled={loadingPdf}
            title="Download PDF"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors shadow-sm disabled:opacity-50"
          >
            {loadingPdf ? (
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            )}
          </button>
        )}
        {onDownloadExcel && (
          <button
            onClick={onDownloadExcel}
            disabled={loadingExcel}
            title="Export Excel"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-green-50 text-gray-500 hover:text-green-600 transition-colors shadow-sm disabled:opacity-50"
          >
            {loadingExcel ? (
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">table_view</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Donut Chart ────────────────────────────────────────────────────────────
function DonutChart({
  hadir,
  sakit,
  izin,
  alfa,
}: {
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
}) {
  const total = hadir + sakit + izin + alfa || 1;
  const pHadir = Math.round((hadir / total) * 100);
  const pSakit = Math.round((sakit / total) * 100);
  const pIzin = Math.round((izin / total) * 100);
  const pAlfa = Math.round((alfa / total) * 100);

  const dashArray = (pct: number) => `${pct} ${100 - pct}`;
  const safePSakit = pHadir;
  const safePIzin = pHadir + pSakit;
  const safePAlfa = pHadir + pSakit + pIzin;

  return (
    <div className="flex items-center gap-4 mt-3">
      <div className="w-24 h-24 relative shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-gray-100"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeDasharray="100, 100"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#10B981"
            strokeDasharray={dashArray(pHadir)}
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#F59E0B"
            strokeDasharray={dashArray(pSakit + pIzin)}
            strokeDashoffset={-safePSakit}
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#EF4444"
            strokeDasharray={dashArray(pAlfa)}
            strokeDashoffset={-safePAlfa}
            strokeWidth="3"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-blue-700">{pHadir}%</span>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {[
          { label: `Hadir (${pHadir}%)`, count: hadir, color: '#10B981' },
          { label: `Izin/Sakit (${pIzin + pSakit}%)`, count: sakit + izin, color: '#F59E0B' },
          { label: `Alpa (${pAlfa}%)`, count: alfa, color: '#EF4444' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
            <span className="text-xs font-semibold text-gray-700">{item.count.toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mini Bar Chart ─────────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: Array<{ kelasName: string; rataRata: number }> }) {
  const max = Math.max(...data.map((d) => d.rataRata), 1);
  return (
    <div>
      <div className="h-24 w-full flex items-end gap-2">
        {data.map((item, i) => {
          const pct = max > 0 ? (item.rataRata / max) * 100 : 0;
          const isTop = item.rataRata === Math.max(...data.map((d) => d.rataRata));
          return (
            <div key={item.kelasName} className="flex-1 relative group h-full flex items-end">
              <div
                className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80 relative"
                style={{
                  height: `${Math.max(pct, 4)}%`,
                  backgroundColor: isTop ? '#003EC7' : `rgba(0,62,199,${0.2 + i * 0.15})`,
                  boxShadow: isTop ? '0 0 12px rgba(0,62,199,0.3)' : 'none',
                }}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-blue-700 whitespace-nowrap">
                  {item.rataRata > 0 ? item.rataRata : '-'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1 px-0.5">
        {data.map((item, i) => (
          <span
            key={item.kelasName}
            className="text-[10px] text-gray-400 font-medium flex-1 text-center"
            style={{ color: item.rataRata === Math.max(...data.map((d) => d.rataRata)) ? '#003EC7' : undefined }}
          >
            {item.kelasName}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton Loading ───────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
        <div className="h-5 w-32 bg-gray-200 rounded" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 bg-gray-100 rounded-xl mb-2" />
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function LaporanPage() {
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');

  // Fetch semesters
  const { data: semestersRes } = useQuery<{ success: boolean; data: Semester[] }>({
    queryKey: ['semesters-list'],
    queryFn: async () => {
      const res = await fetch('/api/semester');
      return res.json();
    },
  });
  const semesters: Semester[] = semestersRes?.data ?? [];
  const activeSemester = semesters.find((s) => s.isActive) ?? semesters[0];
  const currentSemesterId = selectedSemesterId || activeSemester?.id || '';

  // Fetch summary
  const { data: summary, isLoading: summaryLoading } = useLaporanSummary(currentSemesterId || undefined);

  // Mutations (download hooks)
  const dlAbsensi = useDownloadAbsensi();
  const dlNilai = useDownloadNilai();
  const dlPembayaran = useDownloadPembayaran();
  const dlSiswa = useDownloadSiswa();
  const dlRapor = useDownloadRaporPdf();

  const currentYear = new Date().getFullYear();

  function handleDownload(
    label: string,
    fn: () => Promise<void>
  ) {
    fn()
      .then(() => {
        toast({ title: `✅ ${label}`, description: 'File berhasil diunduh.' });
      })
      .catch((err: Error) => {
        toast({ title: '❌ Gagal mengunduh', description: err.message, variant: 'destructive' });
      });
  }

  const stats = summary?.stats;
  const kehadiran = summary?.kehadiranBreakdown;
  const nilaiDist = summary?.nilaiDistribusi ?? [];

  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto">

      {/* ── Page Header ── */}
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Laporan Sekolah
          </h1>
          <p className="text-gray-500 mt-1 max-w-xl text-sm">
            Pusat unduhan dan analitik laporan komprehensif untuk akademik, kehadiran, dan administrasi keuangan sekolah.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-9 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer hover:bg-gray-100"
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  Semester {s.name} — {s.academicYear.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[18px]">
              calendar_month
            </span>
          </div>

          <button
            onClick={() => handleDownload('Laporan Lengkap (Data Siswa)', () => dlSiswa.mutateAsync({}))}
            disabled={dlSiswa.isPending}
            className="flex items-center gap-2 bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-800 hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-70"
          >
            {dlSiswa.isPending ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
            )}
            Ekspor Data Siswa
          </button>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          icon="school"
          label="Rata-rata Nilai Sekolah"
          value={summaryLoading ? '—' : `${stats?.rataRataNilai ?? 0}`}
          sub={`Semester ${summary?.semester?.name ?? 'aktif'} • ${summary?.semester?.academicYear ?? ''}`}
          color="#003EC7"
          delay={0}
          loading={summaryLoading}
        />
        <StatCard
          icon="how_to_reg"
          label="Tingkat Kehadiran"
          value={summaryLoading ? '—' : `${stats?.tingkatKehadiran ?? 0}%`}
          sub={`${stats?.totalSiswa?.toLocaleString('id-ID') ?? 0} siswa aktif`}
          color="#10B981"
          delay={1}
          loading={summaryLoading}
        />
        <StatCard
          icon="payments"
          label="Penyelesaian SPP"
          value={summaryLoading ? '—' : `${stats?.penyelesaianSPP ?? 0}%`}
          sub={`Bulan berjalan — ${summary?.bulanIni?.lunas ?? 0} dari ${summary?.bulanIni?.totalPembayaran ?? 0} siswa`}
          color="#F59E0B"
          delay={2}
          loading={summaryLoading}
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Laporan Akademik Card ── */}
        <motion.div
          custom={3}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-blue-700 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              analytics
            </span>
            <h2 className="text-lg font-bold text-gray-900">Laporan Akademik</h2>
          </div>
          <p className="text-sm text-gray-400 mb-5">
            Laporan detail mengenai nilai siswa, statistik kelas, dan capaian kelulusan.
          </p>

          <div className="space-y-2">
            <DownloadItem
              icon="assignment"
              title="Rekapitulasi Nilai Akhir Semester"
              meta={`XLSX • Semester ${summary?.semester?.name ?? 'aktif'}`}
              hidePdf
              onDownloadExcel={() =>
                currentSemesterId &&
                handleDownload('Rekap Nilai', () =>
                  dlNilai.mutateAsync({ semesterId: currentSemesterId })
                )
              }
              loadingExcel={dlNilai.isPending}
            />
            <DownloadItem
              icon="leaderboard"
              title="Statistik Peringkat Kelas"
              meta="XLSX • Ranking per semester"
              hidePdf
              onDownloadExcel={() =>
                currentSemesterId &&
                handleDownload('Rekap Nilai & Ranking', () =>
                  dlNilai.mutateAsync({ semesterId: currentSemesterId })
                )
              }
              loadingExcel={dlNilai.isPending}
            />
            <DownloadItem
              icon="group"
              title="Data Lengkap Siswa"
              meta="XLSX • Profil & kontak semua siswa"
              hidePdf
              onDownloadExcel={() =>
                handleDownload('Data Siswa', () => dlSiswa.mutateAsync({}))
              }
              loadingExcel={dlSiswa.isPending}
            />
          </div>

          {/* Mini bar chart distribusi nilai */}
          {nilaiDist.length > 0 && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Distribusi Nilai Rata-rata per Kelas
              </h4>
              <MiniBarChart data={nilaiDist.slice(0, 8)} />
            </div>
          )}
        </motion.div>

        {/* ── Right column: 2 cards ── */}
        <div className="flex flex-col gap-6">

          {/* ── Laporan Kehadiran ── */}
          <motion.div
            custom={4}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-emerald-500 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                co_present
              </span>
              <h2 className="text-lg font-bold text-gray-900">Laporan Kehadiran</h2>
            </div>

            <div className="space-y-2 mb-4">
              <DownloadItem
                icon="calendar_month"
                title="Rekap Absensi Bulanan Siswa"
                meta="XLSX • Update otomatis per semester"
                hidePdf
                onDownloadExcel={() =>
                  currentSemesterId &&
                  handleDownload('Rekap Absensi', () =>
                    dlAbsensi.mutateAsync({ semesterId: currentSemesterId })
                  )
                }
                loadingExcel={dlAbsensi.isPending}
              />
            </div>

            {/* Donut chart */}
            {kehadiran && kehadiran.total > 0 ? (
              <DonutChart
                hadir={kehadiran.hadir}
                sakit={kehadiran.sakit}
                izin={kehadiran.izin}
                alfa={kehadiran.alfa}
              />
            ) : (
              <div className="h-24 flex items-center justify-center text-gray-300 text-sm">
                <span className="material-symbols-outlined mr-2 text-[20px]">info</span>
                Belum ada data kehadiran
              </div>
            )}
          </motion.div>

          {/* ── Laporan Keuangan ── */}
          <motion.div
            custom={5}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-amber-500 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance_wallet
              </span>
              <h2 className="text-lg font-bold text-gray-900">Laporan Keuangan</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Rekap penerimaan SPP dan status pembayaran seluruh siswa.
            </p>

            <div className="space-y-2">
              <DownloadItem
                icon="receipt_long"
                title={`Laporan Penerimaan SPP — ${currentYear}`}
                meta="XLSX • Realtime"
                hidePdf
                onDownloadExcel={() =>
                  handleDownload('Laporan Pembayaran SPP', () =>
                    dlPembayaran.mutateAsync({ year: currentYear })
                  )
                }
                loadingExcel={dlPembayaran.isPending}
              />
              <DownloadItem
                icon="money_off"
                title="Daftar Tunggakan SPP"
                meta="XLSX • Siswa dengan status belum bayar"
                hidePdf
                onDownloadExcel={() =>
                  handleDownload('Daftar Tunggakan', () =>
                    dlPembayaran.mutateAsync({ year: currentYear })
                  )
                }
                loadingExcel={dlPembayaran.isPending}
              />
            </div>

            {/* SPP Progress bar */}
            {stats && stats.penyelesaianSPP > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Penyelesaian SPP Bulan Ini</span>
                  <span className="font-semibold text-amber-500">{stats.penyelesaianSPP}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.penyelesaianSPP}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                  <span>{summary?.bulanIni?.lunas ?? 0} lunas</span>
                  <span>{(summary?.bulanIni?.totalPembayaran ?? 0) - (summary?.bulanIni?.lunas ?? 0)} belum bayar</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Rapor PDF Section ── */}
      <motion.div
        custom={6}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-6 text-white relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-12 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                article
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold">Generate Rapor Siswa (PDF)</h2>
              <p className="text-blue-200 text-sm mt-1 max-w-lg">
                Download rapor lengkap per siswa dalam format PDF — berisi tabel nilai, rekap kehadiran, dan area tanda tangan kepala sekolah &amp; wali kelas.
              </p>
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            <a
              href="/dashboard/siswa"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all border border-white/20"
            >
              <span className="material-symbols-outlined text-[18px]">person_search</span>
              Pilih Siswa
            </a>
          </div>
        </div>

        {/* Instructions */}
        <div className="relative z-10 mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { step: '1', text: 'Buka halaman Manajemen Siswa', icon: 'person' },
            { step: '2', text: 'Klik siswa yang ingin dicetak rapornya', icon: 'ads_click' },
            { step: '3', text: 'Klik tombol "Download Rapor PDF" di halaman detail', icon: 'download' },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-xs font-bold">{item.step}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-blue-200">{item.icon}</span>
                <span className="text-sm text-blue-100">{item.text}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
