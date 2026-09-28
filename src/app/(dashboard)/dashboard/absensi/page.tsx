'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';

const absensiMenuItems = [
  {
    title: 'Input Harian',
    description: 'Catat kehadiran siswa setiap hari',
    href: '/dashboard/absensi/harian',
    icon: 'edit_note',
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Rekap Absensi',
    description: 'Lihat ringkasan kehadiran siswa',
    href: '/dashboard/absensi/rekap',
    icon: 'assessment',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    title: 'Statistik',
    description: 'Analisis dan grafik kehadiran',
    href: '/dashboard/absensi/statistik',
    icon: 'bar_chart',
    color: 'from-purple-500 to-purple-600',
  },
];

export default function AbsensiIndexPage() {
  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-[32px] font-bold text-[var(--muadalah-on-surface)]">
          Absensi Siswa 📝
        </h1>
        <p className="text-[var(--muadalah-on-surface-variant)] mt-1">
          Kelola kehadiran siswa dengan mudah dan efisien
        </p>
      </motion.div>

      {/* Menu Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {absensiMenuItems.map((item, index) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              href={item.href}
              className="block bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] p-6 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-4`}>
                <MaterialIcon name={item.icon} size="lg" className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--muadalah-on-surface)] mb-2">
                {item.title}
              </h3>
              <p className="text-[var(--muadalah-on-surface-variant)]">
                {item.description}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
