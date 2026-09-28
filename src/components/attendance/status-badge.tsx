import { AttendanceStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: AttendanceStatus;
  className?: string;
  showDot?: boolean;
}

const statusConfig = {
  HADIR: {
    label: 'Hadir',
    color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    dotColor: 'bg-emerald-500',
    icon: 'check_circle',
  },
  ALFA: {
    label: 'Alfa',
    color: 'bg-red-500/10 text-red-700 border-red-500/20',
    dotColor: 'bg-red-500',
    icon: 'cancel',
  },
  SAKIT: {
    label: 'Sakit',
    color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    dotColor: 'bg-yellow-500',
    icon: 'local_hospital',
  },
  IZIN: {
    label: 'Izin',
    color: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    dotColor: 'bg-blue-500',
    icon: 'event_note',
  },
  TERLAMBAT: {
    label: 'Terlambat',
    color: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    dotColor: 'bg-orange-500',
    icon: 'schedule',
  },
};

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border',
        config.color,
        className
      )}
    >
      {showDot && <div className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />}
      <span>{config.label}</span>
    </div>
  );
}

export { statusConfig };
