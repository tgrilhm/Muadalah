'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Button } from '@/components/ui/button';
import { StudentStatusToggle } from '@/components/attendance/student-status-toggle';
import { AttendanceStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSaveBulkAbsensi } from '@/hooks/use-absensi';
import { useQuery } from '@tanstack/react-query';

interface Kelas {
  id: string;
  name: string;
  grade: number;
}

interface StudentBasic {
  id: string;
  name: string;
  nis: string;
}

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
}

export default function AttendanceHarianPage() {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendances, setAttendances] = useState<Record<string, AttendanceRecord>>({});

  const saveBulk = useSaveBulkAbsensi();

  // Fetch kelas dari API
  const { data: kelasData, isLoading: kelasLoading } = useQuery({
    queryKey: ['kelas', 'list'],
    queryFn: async () => {
      const res = await fetch('/api/kelas');
      if (!res.ok) throw new Error('Gagal memuat kelas');
      return res.json();
    },
  });

  // Fetch siswa dari kelas yang dipilih
  const { data: siswaData, isLoading: siswaLoading } = useQuery({
    queryKey: ['kelas', selectedClass, 'siswa'],
    queryFn: async () => {
      const res = await fetch(`/api/kelas/${selectedClass}`);
      if (!res.ok) throw new Error('Gagal memuat siswa');
      return res.json();
    },
    enabled: !!selectedClass,
  });

  const classes: Kelas[] = kelasData?.data ?? [];
  const students: StudentBasic[] = siswaData?.data?.students ?? [];

  // Inisialisasi status HADIR saat kelas / daftar siswa berubah
  useEffect(() => {
    if (students.length > 0) {
      const initial: Record<string, AttendanceRecord> = {};
      students.forEach((s) => {
        initial[s.id] = { studentId: s.id, status: 'HADIR', notes: '' };
      });
      setAttendances(initial);
    }
  }, [siswaData]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendances((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendances((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes },
    }));
  };

  const handleMarkAllPresent = () => {
    const updated = { ...attendances };
    Object.keys(updated).forEach((id) => {
      updated[id] = { ...updated[id], status: 'HADIR' };
    });
    setAttendances(updated);
    toast({ title: 'Berhasil', description: 'Semua siswa ditandai hadir' });
  };

  const handleSave = async () => {
    if (!selectedClass) {
      toast({ title: 'Peringatan', description: 'Pilih kelas terlebih dahulu', variant: 'destructive' });
      return;
    }
    if (students.length === 0) {
      toast({ title: 'Peringatan', description: 'Tidak ada siswa di kelas ini', variant: 'destructive' });
      return;
    }

    try {
      await saveBulk.mutateAsync({
        classId: selectedClass,
        date: selectedDate,
        attendances: Object.values(attendances),
      });
      toast({ title: 'Berhasil', description: 'Data absensi berhasil disimpan' });
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Gagal menyimpan data absensi',
        variant: 'destructive',
      });
    }
  };

  const summary = Object.values(attendances).reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <nav className="flex items-center gap-2 text-sm text-[var(--muadalah-on-surface-variant)] mb-2">
          <Link href="/dashboard" className="hover:text-[var(--muadalah-primary)] transition-colors">Dashboard</Link>
          <MaterialIcon name="chevron_right" size="xs" />
          <Link href="/dashboard/absensi" className="hover:text-[var(--muadalah-primary)] transition-colors">Absensi</Link>
          <MaterialIcon name="chevron_right" size="xs" />
          <span className="text-[var(--muadalah-on-surface)] font-medium">Input Harian</span>
        </nav>
        <h1 className="text-[32px] font-bold text-[var(--muadalah-on-surface)]">Input Absensi Harian 📝</h1>
        <p className="text-[var(--muadalah-on-surface-variant)] mt-1">Input kehadiran siswa dengan cepat dan mudah</p>
      </motion.div>

      {/* Filter Card */}
      <motion.div
        className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] p-6 shadow-sm"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Class Selector */}
          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">Pilih Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={kelasLoading}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--muadalah-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)] bg-white disabled:opacity-50"
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map((kelas) => (
                <option key={kelas.id} value={kelas.id}>Kelas {kelas.name}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">Tanggal</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--muadalah-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)]"
            />
          </div>

          {/* Bulk Actions */}
          <div>
            <label className="block text-sm font-medium text-[var(--muadalah-on-surface)] mb-2">Aksi Cepat</label>
            <Button onClick={handleMarkAllPresent} disabled={!selectedClass || siswaLoading} variant="outline" className="w-full">
              <MaterialIcon name="done_all" size="sm" className="mr-2" />
              Tandai Semua Hadir
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Loading state saat fetch siswa */}
      {selectedClass && siswaLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <MaterialIcon name="sync" size="lg" className="text-[var(--muadalah-primary)] animate-spin" />
            <p className="text-[var(--muadalah-on-surface-variant)]">Memuat daftar siswa...</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {selectedClass && students.length > 0 && !siswaLoading && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <SummaryCard label="Hadir" value={summary['HADIR'] || 0} color="emerald" icon="check_circle" />
          <SummaryCard label="Alfa" value={summary['ALFA'] || 0} color="red" icon="cancel" />
          <SummaryCard label="Sakit" value={summary['SAKIT'] || 0} color="yellow" icon="local_hospital" />
          <SummaryCard label="Izin" value={summary['IZIN'] || 0} color="blue" icon="event_note" />
          <SummaryCard label="Terlambat" value={summary['TERLAMBAT'] || 0} color="orange" icon="schedule" />
        </motion.div>
      )}

      {/* Student List */}
      {selectedClass && students.length > 0 && !siswaLoading ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <StudentStatusToggle
                  studentId={student.id}
                  studentName={student.name}
                  studentNis={student.nis}
                  currentStatus={attendances[student.id]?.status || 'HADIR'}
                  notes={attendances[student.id]?.notes}
                  onStatusChange={handleStatusChange}
                  onNotesChange={handleNotesChange}
                  disabled={saveBulk.isPending}
                />
              </motion.div>
            ))}
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" disabled={saveBulk.isPending} onClick={() => setSelectedClass('')}>
              <MaterialIcon name="cancel" size="sm" className="mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveBulk.isPending}
              className="bg-[var(--muadalah-primary)] hover:bg-[var(--muadalah-surface-tint)] shadow-md hover:shadow-lg transition-all"
            >
              {saveBulk.isPending ? (
                <><MaterialIcon name="sync" size="sm" className="mr-2 animate-spin" />Menyimpan...</>
              ) : (
                <><MaterialIcon name="save" size="sm" className="mr-2" />Simpan Absensi</>
              )}
            </Button>
          </div>
        </motion.div>
      ) : !selectedClass ? (
        <motion.div
          className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] p-12 text-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <MaterialIcon name="school" size="lg" className="text-[var(--muadalah-on-surface-variant)] mb-4" />
          <p className="text-[var(--muadalah-on-surface-variant)]">Pilih kelas untuk mulai input absensi</p>
        </motion.div>
      ) : !siswaLoading && students.length === 0 ? (
        <motion.div
          className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] p-12 text-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <MaterialIcon name="person_off" size="lg" className="text-[var(--muadalah-on-surface-variant)] mb-4" />
          <p className="text-[var(--muadalah-on-surface-variant)]">Tidak ada siswa di kelas ini</p>
        </motion.div>
      ) : null}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  color: 'emerald' | 'red' | 'yellow' | 'blue' | 'orange';
  icon: string;
}

function SummaryCard({ label, value, color, icon }: SummaryCardProps) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-700 border-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    blue: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    orange: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  };
  return (
    <div className={cn('rounded-xl border p-4 transition-all hover:shadow-md', colorClasses[color])}>
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
