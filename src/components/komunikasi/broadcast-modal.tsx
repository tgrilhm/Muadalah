'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Radio, AlertTriangle, Users, School } from 'lucide-react';
import { broadcastMessageSchema, BroadcastInput, MESSAGE_TYPE_LABELS } from '@/lib/validations/message.schema';
import { MESSAGE_TEMPLATES } from '@/lib/message-templates';

interface ClassOption {
  id: string;
  name: string;
  grade: number;
  studentCount?: number;
}

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcast: (data: BroadcastInput) => Promise<void>;
  isSending?: boolean;
}

export default function BroadcastModal({
  isOpen,
  onClose,
  onBroadcast,
  isSending = false,
}: BroadcastModalProps) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [recipientPreview, setRecipientPreview] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BroadcastInput>({
    resolver: zodResolver(broadcastMessageSchema),
    defaultValues: {
      schoolWide: false,
      type: 'UMUM',
      subject: '',
      content: '',
    },
  });

  const schoolWide = watch('schoolWide');
  const classId = watch('classId');

  // Load classes
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/kelas?limit=100')
      .then((r) => r.json())
      .then((data) => {
        if (data.data?.classes || data.data) {
          const cls = data.data?.classes ?? data.data ?? [];
          setClasses(cls);
        }
      })
      .catch(console.error);
  }, [isOpen]);

  // Preview jumlah penerima
  useEffect(() => {
    if (schoolWide) {
      setLoadingPreview(true);
      fetch('/api/students?limit=1&status=AKTIF')
        .then((r) => r.json())
        .then((d) => {
          // Total siswa * rata-rata 1.5 ortu — estimasi kasar
          setRecipientPreview(d.data?.total ?? null);
        })
        .catch(console.error)
        .finally(() => setLoadingPreview(false));
    } else if (classId) {
      setLoadingPreview(true);
      fetch(`/api/students?classId=${classId}&limit=1&status=AKTIF`)
        .then((r) => r.json())
        .then((d) => {
          setRecipientPreview(d.data?.total ?? null);
        })
        .catch(console.error)
        .finally(() => setLoadingPreview(false));
    } else {
      setRecipientPreview(null);
    }
  }, [schoolWide, classId]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedTemplate('');
      setRecipientPreview(null);
    }
  }, [isOpen, reset]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = MESSAGE_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      setValue('subject', tpl.subject);
      setValue('content', tpl.content);
      setValue('type', tpl.type);
    }
  };

  const onSubmit = async (data: BroadcastInput) => {
    await onBroadcast(data);
    reset();
  };

  if (!isOpen) return null;

  const currentType = watch('type');

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-base">Broadcast Pesan</h2>
                  <p className="text-xs text-gray-500">Kirim ke banyak orang tua sekaligus</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-orange-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Target Broadcast */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Target Penerima <span className="text-red-500">*</span>
                </label>

                {/* Toggle: Per Kelas vs Seluruh Sekolah */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setValue('schoolWide', false);
                      setValue('classId', undefined);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      !schoolWide
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Per Kelas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('schoolWide', true);
                      setValue('classId', undefined);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      schoolWide
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <School className="w-4 h-4" />
                    Seluruh Sekolah
                  </button>
                </div>

                {/* Dropdown pilih kelas */}
                {!schoolWide && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <select
                      {...register('classId')}
                      className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer ${
                        errors.classId ? 'border-red-400' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Pilih kelas...</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          Kelas {cls.name} (Grade {cls.grade})
                        </option>
                      ))}
                    </select>
                    {errors.classId && (
                      <p className="text-red-500 text-xs mt-1">{errors.classId.message}</p>
                    )}
                  </motion.div>
                )}

                {/* Preview penerima */}
                {(schoolWide || classId) && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-xl flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-blue-700">
                      {loadingPreview ? (
                        'Menghitung penerima...'
                      ) : recipientPreview !== null ? (
                        <>
                          Estimasi <strong>{recipientPreview}</strong> siswa
                          {schoolWide ? ' di seluruh sekolah' : ' di kelas ini'}
                        </>
                      ) : (
                        'Tidak ada data penerima'
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Pesan broadcast akan dikirim ke{' '}
                  <strong>semua kontak orang tua</strong> dari target yang dipilih. Pastikan isi
                  pesan sudah benar sebelum mengirim.
                </p>
              </div>

              {/* Template */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Template Cepat
                </label>
                <select
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  <option value="">Pilih template (opsional)...</option>
                  {MESSAGE_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipe pesan */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Tipe Pesan
                </label>
                <div className="flex gap-2 flex-wrap">
                  {MESSAGE_TYPE_LABELS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setValue('type', t.value as BroadcastInput['type'])}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        currentType === t.value
                          ? `${t.color} ring-2 ring-offset-1 ring-current`
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subjek */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Subjek <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('subject')}
                  type="text"
                  placeholder="Subjek pesan broadcast..."
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                    errors.subject ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
              </div>

              {/* Konten */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Isi Pesan <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('content')}
                  rows={5}
                  placeholder="Tulis pesan broadcast..."
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none ${
                    errors.content ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4" />
                      Broadcast Sekarang
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
