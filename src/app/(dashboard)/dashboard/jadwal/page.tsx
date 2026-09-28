'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useSchool } from '@/hooks/use-school';
import {
  ScheduleWithRelations,
  DAY_ORDER,
  DAY_LABELS,
  SCHEDULE_COLORS,
  SubjectOptionForSchedule,
  CreateScheduleForm,
} from '@/types/jadwal';
import { DayOfWeek } from '@prisma/client';

// ==================== TYPES ====================

interface ClassOption {
  id: string;
  name: string;
  grade: number;
}

interface AcademicYear {
  id: string;
  name: string;
  semesters: Array<{ id: string; name: string; isActive: boolean }>;
}

// ==================== HELPERS ====================

/** Convert HH:MM to total minutes for height calculation */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Get unique, sorted time slots from schedules */
function buildTimeSlots(
  schedules: ScheduleWithRelations[]
): Array<{ start: string; end: string }> {
  if (schedules.length === 0) {
    // Default slots
    return [
      { start: '07:00', end: '07:45' },
      { start: '07:45', end: '08:30' },
      { start: '08:30', end: '09:15' },
      { start: '09:15', end: '09:45' },
      { start: '09:45', end: '10:30' },
      { start: '10:30', end: '11:15' },
      { start: '11:15', end: '12:00' },
      { start: '12:00', end: '13:00' },
    ];
  }

  const slots = new Map<string, string>();
  schedules.forEach((s) => {
    slots.set(s.startTime, s.endTime);
  });

  return Array.from(slots.entries())
    .map(([start, end]) => ({ start, end }))
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Get color for a subject (cycling by subject id) */
function getSubjectColor(
  subjectId: string,
  subjectColorMap: Map<string, number>
) {
  if (!subjectColorMap.has(subjectId)) {
    subjectColorMap.set(subjectId, subjectColorMap.size % SCHEDULE_COLORS.length);
  }
  return SCHEDULE_COLORS[subjectColorMap.get(subjectId)!];
}

// ==================== MODAL COMPONENT ====================

interface ScheduleModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  schedule?: ScheduleWithRelations;
  classId: string;
  subjects: SubjectOptionForSchedule[];
  onClose: () => void;
  onSave: (data: CreateScheduleForm, id?: string) => Promise<void>;
  isSaving: boolean;
  error: string | null;
}

const DAYS: Array<{ value: DayOfWeek; label: string }> = [
  { value: 'SENIN', label: 'Senin' },
  { value: 'SELASA', label: 'Selasa' },
  { value: 'RABU', label: 'Rabu' },
  { value: 'KAMIS', label: 'Kamis' },
  { value: 'JUMAT', label: 'Jumat' },
  { value: 'SABTU', label: 'Sabtu' },
];

function ScheduleModal({
  isOpen,
  mode,
  schedule,
  classId,
  subjects,
  onClose,
  onSave,
  isSaving,
  error,
}: ScheduleModalProps) {
  const [form, setForm] = useState<CreateScheduleForm>({
    classId,
    subjectId: schedule?.subjectId ?? '',
    dayOfWeek: schedule?.dayOfWeek ?? 'SENIN',
    startTime: schedule?.startTime ?? '07:00',
    endTime: schedule?.endTime ?? '08:00',
    room: schedule?.room ?? '',
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        classId,
        subjectId: schedule?.subjectId ?? '',
        dayOfWeek: schedule?.dayOfWeek ?? 'SENIN',
        startTime: schedule?.startTime ?? '07:00',
        endTime: schedule?.endTime ?? '08:00',
        room: schedule?.room ?? '',
      });
    }
  }, [isOpen, schedule, classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form, schedule?.id);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label={mode === 'create' ? 'Tambah Jadwal' : 'Edit Jadwal'}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">
                      {mode === 'create' ? 'add_circle' : 'edit'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {mode === 'create' ? 'Tambah Jadwal' : 'Edit Jadwal'}
                    </h2>
                    <p className="text-blue-100 text-sm">Isi detail jadwal pelajaran</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  aria-label="Tutup modal"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4"
                  role="alert"
                >
                  <span className="material-symbols-outlined text-red-500 text-xl flex-shrink-0">
                    error
                  </span>
                  <p className="text-red-700 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Mata Pelajaran */}
              <div>
                <label
                  htmlFor="modal-subject"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  id="modal-subject"
                  value={form.subjectId}
                  onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50 hover:bg-white"
                >
                  <option value="">Pilih mata pelajaran...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.teacher ? `— ${s.teacher.user.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hari */}
              <div>
                <label
                  htmlFor="modal-day"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Hari <span className="text-red-500">*</span>
                </label>
                <select
                  id="modal-day"
                  value={form.dayOfWeek}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dayOfWeek: e.target.value as DayOfWeek }))
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50 hover:bg-white"
                >
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="modal-start"
                    className="block text-sm font-semibold text-gray-700 mb-1.5"
                  >
                    Jam Mulai <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="modal-start"
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50 hover:bg-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="modal-end"
                    className="block text-sm font-semibold text-gray-700 mb-1.5"
                  >
                    Jam Selesai <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="modal-end"
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50 hover:bg-white"
                  />
                </div>
              </div>

              {/* Ruangan */}
              <div>
                <label
                  htmlFor="modal-room"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Ruangan <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  id="modal-room"
                  type="text"
                  value={form.room}
                  onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                  placeholder="cth: Ruang 12, Lab Fisika, Lapangan..."
                  maxLength={50}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50 hover:bg-white placeholder-gray-400"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">
                        {mode === 'create' ? 'add' : 'save'}
                      </span>
                      {mode === 'create' ? 'Tambah' : 'Simpan'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ==================== DELETE CONFIRM MODAL ====================

interface DeleteModalProps {
  isOpen: boolean;
  schedule: ScheduleWithRelations | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

function DeleteModal({ isOpen, schedule, onClose, onConfirm, isDeleting }: DeleteModalProps) {
  if (!isOpen || !schedule) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-3xl">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Hapus Jadwal?</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Jadwal{' '}
                  <span className="font-semibold text-gray-700">{schedule.subject.name}</span>{' '}
                  ({DAY_LABELS[schedule.dayOfWeek]}, {schedule.startTime}–{schedule.endTime}) akan
                  dihapus permanen.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Hapus'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ==================== SCHEDULE CARD ====================

interface ScheduleCardProps {
  schedule: ScheduleWithRelations;
  colorIndex: number;
  onEdit: (s: ScheduleWithRelations) => void;
  onDelete: (s: ScheduleWithRelations) => void;
}

function ScheduleCard({ schedule, colorIndex, onEdit, onDelete }: ScheduleCardProps) {
  const color = SCHEDULE_COLORS[colorIndex % SCHEDULE_COLORS.length];
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative w-full h-full rounded-lg border-l-4 p-2 cursor-pointer overflow-hidden group
        ${color.bg} ${color.border}
        hover:shadow-md transition-all duration-200`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onEdit(schedule)}
      role="button"
      aria-label={`Edit jadwal ${schedule.subject.name}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onEdit(schedule);
      }}
    >
      {/* Subject name */}
      <p className={`text-xs font-bold truncate leading-tight ${color.title}`}>
        {schedule.subject.name}
      </p>

      {/* Teacher */}
      {schedule.teacher && (
        <p className={`text-xs truncate mt-0.5 ${color.sub} opacity-80`}>
          {schedule.teacher.user.name}
        </p>
      )}

      {/* Room badge */}
      {schedule.room && (
        <div className={`flex items-center gap-1 mt-1 ${color.sub}`}>
          <span className="material-symbols-outlined text-[11px]">room</span>
          <span className={`text-[10px] font-medium ${color.sub}`}>{schedule.room}</span>
        </div>
      )}

      {/* Hover action buttons */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1 right-1 flex gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onEdit(schedule)}
              className="w-6 h-6 bg-white/80 hover:bg-white rounded flex items-center justify-center shadow-sm transition-all"
              aria-label="Edit jadwal"
              title="Edit"
            >
              <span className="material-symbols-outlined text-blue-600 text-[13px]">edit</span>
            </button>
            <button
              onClick={() => onDelete(schedule)}
              className="w-6 h-6 bg-white/80 hover:bg-white rounded flex items-center justify-center shadow-sm transition-all"
              aria-label="Hapus jadwal"
              title="Hapus"
            >
              <span className="material-symbols-outlined text-red-500 text-[13px]">delete</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==================== WEEKLY GRID ====================

interface WeeklyGridProps {
  schedules: ScheduleWithRelations[];
  isLoading: boolean;
  onEdit: (s: ScheduleWithRelations) => void;
  onDelete: (s: ScheduleWithRelations) => void;
}

function WeeklyGrid({ schedules, isLoading, onEdit, onDelete }: WeeklyGridProps) {
  const timeSlots = useMemo(() => buildTimeSlots(schedules), [schedules]);

  // Build a color map: subjectId → colorIndex
  const subjectColorMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    schedules.forEach((s) => {
      if (!map.has(s.subjectId)) {
        map.set(s.subjectId, idx % SCHEDULE_COLORS.length);
        idx++;
      }
    });
    return map;
  }, [schedules]);

  // Build lookup: dayOfWeek+startTime → schedule
  const scheduleMap = useMemo(() => {
    const map = new Map<string, ScheduleWithRelations>();
    schedules.forEach((s) => {
      map.set(`${s.dayOfWeek}__${s.startTime}`, s);
    });
    return map;
  }, [schedules]);

  // Break time detection: gap > 15 min between consecutive slots
  const isBreakSlot = (slotIdx: number): boolean => {
    if (slotIdx === 0) return false;
    const prev = timeSlots[slotIdx - 1];
    const curr = timeSlots[slotIdx];
    const prevEnd = toMinutes(prev.end);
    const currStart = toMinutes(curr.start);
    return currStart - prevEnd > 0;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {['Waktu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((h) => (
            <div
              key={h}
              className="p-3 flex items-center justify-center text-xs font-semibold text-gray-500 border-r border-gray-100 last:border-r-0"
            >
              {h}
            </div>
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
            {Array.from({ length: 7 }).map((_, j) => (
              <div key={j} className="h-16 border-r border-gray-100 last:border-r-0 p-2">
                <div className="w-full h-full bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Header row */}
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
        <div className="p-3 flex items-center justify-center text-xs font-semibold text-gray-400 uppercase tracking-wider border-r border-gray-100">
          Waktu
        </div>
        {DAY_ORDER.map((day) => (
          <div
            key={day}
            className="p-3 flex items-center justify-center text-xs font-bold text-gray-700 border-r border-gray-100 last:border-r-0"
          >
            {DAY_LABELS[day]}
          </div>
        ))}
      </div>

      {/* Time slot rows */}
      {timeSlots.map((slot, slotIdx) => {
        const isBreak = isBreakSlot(slotIdx);

        return (
          <div key={`${slot.start}-${slot.end}`}>
            {/* Break indicator row */}
            {isBreak && (
              <div className="grid grid-cols-7 bg-gray-50/60 border-b border-gray-100">
                <div className="p-1 border-r border-gray-100 flex items-center justify-center">
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-medium">
                    Istirahat
                  </span>
                </div>
                <div className="col-span-6 p-1 flex items-center justify-center">
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-medium">
                    — Istirahat —
                  </span>
                </div>
              </div>
            )}

            {/* Main time row */}
            <div className="grid grid-cols-7 border-b border-gray-100 last:border-b-0 min-h-[72px]">
              {/* Time column */}
              <div className="border-r border-gray-100 flex flex-col items-center justify-center gap-0.5 px-2 py-2 bg-gray-50/40">
                <span className="text-xs font-bold text-gray-700">{slot.start}</span>
                <span className="text-[10px] text-gray-400">{slot.end}</span>
              </div>

              {/* Day columns */}
              {DAY_ORDER.map((day) => {
                const sch = scheduleMap.get(`${day}__${slot.start}`);
                return (
                  <div
                    key={day}
                    className="border-r border-gray-100 last:border-r-0 p-1.5 min-h-[72px]"
                  >
                    <AnimatePresence mode="wait">
                      {sch ? (
                        <ScheduleCard
                          key={sch.id}
                          schedule={sch}
                          colorIndex={subjectColorMap.get(sch.subjectId) ?? 0}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {schedules.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-20 flex flex-col items-center gap-4 text-center"
        >
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-400 text-4xl">
              calendar_today
            </span>
          </div>
          <div>
            <p className="text-gray-700 font-semibold">Belum ada jadwal</p>
            <p className="text-gray-400 text-sm mt-1">
              Klik &quot;Tambah Jadwal&quot; untuk mulai membuat jadwal pelajaran
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ==================== MAIN PAGE ====================

export default function JadwalPelajaranPage() {
  const { toast } = useToast();
  const { selectedSchool } = useSchool();

  // Data state
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [schedules, setSchedules] = useState<ScheduleWithRelations[]>([]);
  const [subjects, setSubjects] = useState<SubjectOptionForSchedule[]>([]);
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);

  // Loading state
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingSchedule, setEditingSchedule] = useState<ScheduleWithRelations | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<ScheduleWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ==================== FETCH FUNCTIONS ====================

  const fetchClasses = useCallback(async () => {
    setIsLoadingClasses(true);
    try {
      const res = await fetch('/api/kelas?limit=100');
      const json = await res.json();
      if (json.success) {
        setClasses(json.data ?? []);
        if (json.data?.length > 0 && !selectedClassId) {
          setSelectedClassId(json.data[0].id);
        }
      }
    } catch {
      toast({ title: 'Gagal memuat daftar kelas', variant: 'destructive' });
    } finally {
      setIsLoadingClasses(false);
    }
  }, [toast, selectedClassId]);

  const fetchAcademicYear = useCallback(async () => {
    try {
      const res = await fetch('/api/tahun-ajaran?isActive=true&limit=1');
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        setAcademicYear(json.data[0]);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const fetchSchedules = useCallback(async (classId: string, schoolId?: string) => {
    if (!classId) {
      setSchedules([]);
      return;
    }
    setIsLoadingSchedules(true);
    try {
      const params = new URLSearchParams({ classId, limit: '200' });
      if (schoolId) params.append('schoolId', schoolId);
      
      const res = await fetch(`/api/jadwal?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSchedules(json.data ?? []);
      } else {
        toast({ title: 'Gagal memuat jadwal', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Gagal memuat jadwal', variant: 'destructive' });
    } finally {
      setIsLoadingSchedules(false);
    }
  }, [toast]);

  const fetchSubjectsForClass = useCallback(async (classId: string) => {
    if (!classId) return;
    setIsLoadingSubjects(true);
    try {
      const res = await fetch(`/api/kelas/${classId}/subjects`);
      const json = await res.json();
      if (json.success) {
        setSubjects(json.data ?? []);
      }
    } catch {
      // Fallback: fetch all subjects
      try {
        const res2 = await fetch('/api/mata-pelajaran?limit=100');
        const json2 = await res2.json();
        if (json2.success) {
          setSubjects(
            (json2.data ?? []).map((s: { id: string; name: string; code: string }) => ({
              id: s.id,
              name: s.name,
              code: s.code,
              teacher: null,
            }))
          );
        }
      } catch {
        // Silent fail
      }
    } finally {
      setIsLoadingSubjects(false);
    }
  }, []);

  // ==================== EFFECTS ====================

  useEffect(() => {
    fetchClasses();
    fetchAcademicYear();
  }, [fetchClasses, fetchAcademicYear]);

  useEffect(() => {
    if (selectedClassId) {
      fetchSchedules(selectedClassId, selectedSchool?.id);
      fetchSubjectsForClass(selectedClassId);
    }
  }, [selectedClassId, selectedSchool?.id, fetchSchedules, fetchSubjectsForClass]);

  // ==================== HANDLERS ====================

  const handleAddClick = () => {
    if (!selectedClassId) {
      toast({ title: 'Pilih kelas terlebih dahulu', variant: 'destructive' });
      return;
    }
    setModalMode('create');
    setEditingSchedule(undefined);
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (schedule: ScheduleWithRelations) => {
    setModalMode('edit');
    setEditingSchedule(schedule);
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (schedule: ScheduleWithRelations) => {
    setDeletingSchedule(schedule);
    setIsDeleteOpen(true);
  };

  const handleSave = async (data: CreateScheduleForm, id?: string) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const url = id ? `/api/jadwal/${id}` : '/api/jadwal';
      const method = id ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setSaveError(json.error ?? 'Gagal menyimpan jadwal');
        return;
      }

      toast({
        title: id ? 'Jadwal berhasil diperbarui' : 'Jadwal berhasil ditambahkan',
        variant: 'default',
      });
      setIsModalOpen(false);
      await fetchSchedules(selectedClassId);
    } catch {
      setSaveError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSchedule) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/jadwal/${deletingSchedule.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast({ title: json.error ?? 'Gagal menghapus jadwal', variant: 'destructive' });
        return;
      }
      toast({ title: 'Jadwal berhasil dihapus' });
      setIsDeleteOpen(false);
      setDeletingSchedule(null);
      await fetchSchedules(selectedClassId);
    } catch {
      toast({ title: 'Gagal menghapus jadwal', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // ==================== RENDER ====================

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #jadwal-grid, #jadwal-grid * { visibility: visible; }
          #jadwal-grid { position: absolute; left: 0; top: 0; width: 100%; }
          button, .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex flex-col gap-6 p-6 md:p-8">
        {/* ==================== PAGE HEADER ==================== */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Jadwal Pelajaran
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {academicYear
                ? `Tahun Ajaran ${academicYear.name}`
                : 'Atur jadwal pelajaran per kelas'}
            </p>
          </div>

          <div className="flex items-center gap-3 no-print flex-wrap">
            {/* Class selector */}
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-gray-400 text-[18px]">
                meeting_room
              </span>
              <select
                id="class-selector"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={isLoadingClasses}
                className="pl-9 pr-8 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-gray-300 appearance-none cursor-pointer min-w-[160px]"
                aria-label="Pilih kelas"
              >
                <option value="">Pilih Kelas...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 text-gray-400 text-[16px] pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Print button */}
            <button
              onClick={handlePrint}
              disabled={!selectedClassId || schedules.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Cetak jadwal"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span className="hidden sm:inline">Cetak</span>
            </button>

            {/* Add button */}
            <button
              onClick={handleAddClick}
              disabled={!selectedClassId || isLoadingSubjects}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Tambah jadwal baru"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tambah Jadwal
            </button>
          </div>
        </motion.div>

        {/* ==================== STATS STRIP ==================== */}
        {selectedClassId && !isLoadingSchedules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print"
          >
            {[
              {
                label: 'Total Jadwal',
                value: schedules.length,
                icon: 'calendar_today',
                color: 'text-blue-600',
                bg: 'bg-blue-50',
              },
              {
                label: 'Hari Aktif',
                value: new Set(schedules.map((s) => s.dayOfWeek)).size,
                icon: 'event',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
              },
              {
                label: 'Mata Pelajaran',
                value: new Set(schedules.map((s) => s.subjectId)).size,
                icon: 'book',
                color: 'text-violet-600',
                bg: 'bg-violet-50',
              },
              {
                label: 'Kelas',
                value: selectedClass ? `Kelas ${selectedClass.name}` : '—',
                icon: 'meeting_room',
                color: 'text-amber-600',
                bg: 'bg-amber-50',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 shadow-sm"
              >
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <span className={`material-symbols-outlined ${stat.color} text-[20px]`}>
                    {stat.icon}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ==================== NO CLASS SELECTED ==================== */}
        {!selectedClassId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-4 text-center"
          >
            <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-400 text-5xl">
                meeting_room
              </span>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">Pilih Kelas</p>
              <p className="text-gray-500 text-sm mt-1 max-w-xs">
                Pilih kelas dari dropdown di atas untuk melihat dan mengelola jadwal pelajaran
              </p>
            </div>
          </motion.div>
        )}

        {/* ==================== WEEKLY GRID ==================== */}
        {selectedClassId && (
          <div id="jadwal-grid">
            {/* Print header (only visible on print) */}
            <div className="hidden print:block mb-6">
              <h2 className="text-2xl font-bold">
                Jadwal Pelajaran — Kelas {selectedClass?.name}
              </h2>
              {academicYear && (
                <p className="text-gray-600 mt-1">Tahun Ajaran {academicYear.name}</p>
              )}
            </div>

            <WeeklyGrid
              schedules={schedules}
              isLoading={isLoadingSchedules}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          </div>
        )}
      </div>

      {/* ==================== MODALS ==================== */}
      <ScheduleModal
        isOpen={isModalOpen}
        mode={modalMode}
        schedule={editingSchedule}
        classId={selectedClassId}
        subjects={subjects}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        isSaving={isSaving}
        error={saveError}
      />

      <DeleteModal
        isOpen={isDeleteOpen}
        schedule={deletingSchedule}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingSchedule(null);
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
