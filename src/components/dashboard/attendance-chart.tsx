'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useDashboardKehadiran } from '@/hooks/use-dashboard';
import { KehadiranBulanan } from '@/types/dashboard';

const YEARS = [
  new Date().getFullYear() - 1,
  new Date().getFullYear(),
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: KehadiranBulanan }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-[var(--muadalah-surface-card)] border border-[var(--muadalah-border-subtle)] rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-[var(--muadalah-on-surface)] mb-1">{label}</p>
      <p className="text-[var(--muadalah-success)]">Kehadiran: {data.persentase}%</p>
      <p className="text-[var(--muadalah-on-surface-variant)] text-xs">{data.hadir}/{data.total} siswa hadir</p>
    </div>
  );
}

export function AttendanceChart() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: response, isLoading } = useDashboardKehadiran(year);

  const chartData: KehadiranBulanan[] = response?.data?.data ?? [];

  if (isLoading) {
    return (
      <div className="bg-[var(--muadalah-surface-card)] rounded-2xl border border-[var(--muadalah-border-subtle)] p-6 shadow-sm animate-pulse">
        <div className="h-6 w-40 bg-[var(--muadalah-surface-container)] rounded mb-6" />
        <div className="h-[280px] bg-[var(--muadalah-surface-container)] rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      className="bg-[var(--muadalah-surface-card)] rounded-2xl border border-[var(--muadalah-border-subtle)] p-6 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-[var(--muadalah-on-surface)]">Kehadiran Bulanan</h3>
          <p className="text-xs text-[var(--muadalah-on-surface-variant)] mt-0.5">Persentase kehadiran per bulan</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="text-sm px-3 py-1.5 rounded-lg border border-[var(--muadalah-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 bg-[var(--muadalah-surface)] text-[var(--muadalah-on-surface)]"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {chartData.length === 0 || chartData.every((d) => d.total === 0) ? (
        <div className="h-[280px] flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-[48px] text-[var(--muadalah-on-surface-variant)] mb-2 block">event_busy</span>
            <p className="text-sm text-[var(--muadalah-on-surface-variant)]">Belum ada data kehadiran di tahun {year}</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis
              dataKey="bulan"
              tick={{ fontSize: 12, fill: 'var(--muadalah-on-surface-variant)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 11, fill: 'var(--muadalah-on-surface-variant)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37,99,235,0.04)' }} />
            <Bar dataKey="persentase" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.persentase >= 80 ? '#10B981' : entry.persentase >= 70 ? '#F59E0B' : '#EF4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
