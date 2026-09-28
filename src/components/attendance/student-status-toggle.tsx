'use client';

import { AttendanceStatus } from '@prisma/client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MaterialIcon } from '@/components/ui/material-icon';
import { statusConfig } from './status-badge';

interface StudentStatusToggleProps {
  studentId: string;
  studentName: string;
  studentNis: string;
  currentStatus: AttendanceStatus;
  notes?: string;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onNotesChange?: (studentId: string, notes: string) => void;
  disabled?: boolean;
}

const statusButtons: { status: AttendanceStatus; shortLabel: string }[] = [
  { status: 'HADIR', shortLabel: 'H' },
  { status: 'ALFA', shortLabel: 'A' },
  { status: 'SAKIT', shortLabel: 'S' },
  { status: 'IZIN', shortLabel: 'I' },
  { status: 'TERLAMBAT', shortLabel: 'T' },
];

export function StudentStatusToggle({
  studentId,
  studentName,
  studentNis,
  currentStatus,
  notes,
  onStatusChange,
  onNotesChange,
  disabled = false,
}: StudentStatusToggleProps) {
  return (
    <motion.div
      className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] p-4 hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Student Info */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--muadalah-primary)] to-[var(--muadalah-surface-tint)] flex items-center justify-center text-white font-semibold text-sm">
          {studentName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--muadalah-on-surface)] truncate">
            {studentName}
          </p>
          <p className="text-xs text-[var(--muadalah-on-surface-variant)]">NIS: {studentNis}</p>
        </div>
      </div>

      {/* Status Toggle Buttons */}
      <div className="flex gap-2 mb-3">
        {statusButtons.map(({ status, shortLabel }) => {
          const config = statusConfig[status];
          const isActive = currentStatus === status;

          return (
            <motion.button
              key={status}
              type="button"
              onClick={() => !disabled && onStatusChange(studentId, status)}
              disabled={disabled}
              className={cn(
                'flex-1 py-2.5 rounded-lg font-medium text-sm transition-all relative overflow-hidden',
                isActive
                  ? 'text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={
                isActive
                  ? {
                      background:
                        status === 'HADIR'
                          ? 'var(--muadalah-success-hadir)'
                          : status === 'ALFA'
                          ? 'var(--muadalah-danger-alfa)'
                          : status === 'SAKIT'
                          ? '#EAB308'
                          : status === 'IZIN'
                          ? '#3B82F6'
                          : '#F97316',
                    }
                  : undefined
              }
              whileHover={{ scale: disabled ? 1 : 1.05 }}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
            >
              <span className="relative z-10">{shortLabel}</span>
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-white"
                  initial={{ scale: 0, opacity: 0.3 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Notes Input */}
      {onNotesChange && (
        <input
          type="text"
          placeholder="Catatan (opsional)"
          value={notes || ''}
          onChange={(e) => onNotesChange(studentId, e.target.value)}
          disabled={disabled}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-lg border border-[var(--muadalah-border-subtle)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)]',
            'placeholder:text-[var(--muadalah-on-surface-variant)]',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />
      )}
    </motion.div>
  );
}
