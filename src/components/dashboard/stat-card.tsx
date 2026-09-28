'use client';

import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  iconColor: string;
  iconBg: string;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  icon,
  iconColor,
  iconBg,
  trend,
  trendUp = true,
  loading = false,
  onClick,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-[var(--muadalah-surface-card)] rounded-2xl p-6 border border-[var(--muadalah-border-subtle)] animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="h-4 w-28 bg-[var(--muadalah-surface-container)] rounded" />
          <div className="w-5 h-5 bg-[var(--muadalah-surface-container)] rounded" />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--muadalah-surface-container)]" />
          <div className="space-y-2">
            <div className="h-10 w-20 bg-[var(--muadalah-surface-container)] rounded" />
            <div className="h-3 w-24 bg-[var(--muadalah-surface-container)] rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-[var(--muadalah-surface-card)] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[var(--muadalah-border-subtle)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 group relative overflow-hidden cursor-pointer"
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
    >
      {/* Ambient glow */}
      <div
        className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity"
        style={{ background: iconColor }}
      />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm text-[var(--muadalah-on-surface-variant)]">{label}</p>
          <button className="text-[var(--muadalah-outline)] hover:text-[var(--muadalah-primary)] transition-colors">
            <span className="material-symbols-outlined text-[20px]">open_in_full</span>
          </button>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform"
            style={{ background: iconBg, borderColor: `${iconColor}33` }}
          >
            <span className="material-symbols-outlined text-[24px]" style={{ color: iconColor, fontVariationSettings: '"FILL" 1' }}>
              {icon}
            </span>
          </div>
          <div>
            <p className="text-[40px] font-bold text-[var(--muadalah-on-surface)] leading-none tabular-nums">
              {value}
            </p>
            {trend && (
              <p className={`text-xs mt-1 flex items-center gap-0.5 ${trendUp ? 'text-[var(--muadalah-success)]' : 'text-[var(--muadalah-error)]'}`}>
                <span className="material-symbols-outlined text-[14px]">{trendUp ? 'trending_up' : 'trending_down'}</span>
                {trend}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
