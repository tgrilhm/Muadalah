'use client';

import { PaymentStatus } from '@prisma/client';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; bg: string; text: string; icon: string }
> = {
  LUNAS: {
    label: 'Lunas',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    icon: 'check_circle',
  },
  BELUM_BAYAR: {
    label: 'Belum Bayar',
    bg: 'bg-red-100',
    text: 'text-red-600',
    icon: 'cancel',
  },
  CICILAN: {
    label: 'Cicilan',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    icon: 'pending',
  },
  TERLAMBAT: {
    label: 'Terlambat',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    icon: 'warning',
  },
};

export function PaymentStatusBadge({ status, size = 'sm' }: PaymentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.BELUM_BAYAR;
  const iconSize = size === 'sm' ? 'text-[14px]' : 'text-[16px]';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 ${padding} rounded-full font-medium ${config.bg} ${config.text} ${textSize}`}
    >
      <span className={`material-symbols-outlined ${iconSize}`}>{config.icon}</span>
      {config.label}
    </span>
  );
}
