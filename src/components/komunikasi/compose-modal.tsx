'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ChevronDown, FileText } from 'lucide-react';
import { sendMessageSchema, SendMessageInput, MESSAGE_TYPE_LABELS } from '@/lib/validations/message.schema';
import { MESSAGE_TEMPLATES } from '@/lib/message-templates';

interface ParentContactOption {
  id: string;
  name: string;
  relation: string;
  studentName: string;
  className: string;
}

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: SendMessageInput) => Promise<void>;
  isSending?: boolean;
  defaultRecipientId?: string;
}

export default function ComposeModal({
  isOpen,
  onClose,
  onSend,
  isSending = false,
  defaultRecipientId,
}: ComposeModalProps) {
  const [contacts, setContacts] = useState<ParentContactOption[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SendMessageInput>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: {
      recipientId: defaultRecipientId ?? '',
      type: 'UMUM',
      subject: '',
      content: '',
    },
  });

  // Load parent contacts dari API students
  useEffect(() => {
    if (!isOpen) return;
    setLoadingContacts(true);
    fetch('/api/students?limit=200&status=AKTIF')
      .then((r) => r.json())
      .then((data) => {
        const opts: ParentContactOption[] = [];
        if (data.data?.students) {
          for (const student of data.data.students) {
            if (student.parentContacts) {
              for (const pc of student.parentContacts) {
                opts.push({
                  id: pc.id,
                  name: pc.name,
                  relation: pc.relation,
                  studentName: student.name,
                  className: student.class?.name ?? '',
                });
              }
            }
          }
        }
        setContacts(opts);
      })
      .catch(console.error)
      .finally(() => setLoadingContacts(false));
  }, [isOpen]);

  // Reset form saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedTemplate('');
    }
  }, [isOpen, reset]);

  // Isi form dari template
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = MESSAGE_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      setValue('subject', tpl.subject);
      setValue('content', tpl.content);
      setValue('type', tpl.type);
    }
  };

  const onSubmit = async (data: SendMessageInput) => {
    await onSend(data);
    reset();
    setSelectedTemplate('');
  };

  const selectedRecipientId = watch('recipientId');
  const selectedContact = contacts.find((c) => c.id === selectedRecipientId);

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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-base">Kirim Pesan</h2>
                  <p className="text-xs text-gray-500">Pesan ke orang tua siswa</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Template picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Template Cepat
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
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
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Penerima */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Penerima <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('recipientId')}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer ${
                    errors.recipientId ? 'border-red-400' : 'border-gray-200'
                  }`}
                  disabled={loadingContacts}
                >
                  <option value="">{loadingContacts ? 'Memuat kontak...' : 'Pilih orang tua/wali...'}</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.relation}) — {c.studentName} {c.className}
                    </option>
                  ))}
                </select>
                {errors.recipientId && (
                  <p className="text-red-500 text-xs mt-1">{errors.recipientId.message}</p>
                )}
                {selectedContact && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    Siswa: {selectedContact.studentName} · Kelas {selectedContact.className}
                  </p>
                )}
              </div>

              {/* Tipe pesan */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Tipe Pesan
                </label>
                <div className="flex gap-2 flex-wrap">
                  {MESSAGE_TYPE_LABELS.map((t) => {
                    const current = watch('type');
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setValue('type', t.value as SendMessageInput['type'])}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          current === t.value
                            ? `${t.color} ring-2 ring-offset-1 ring-current`
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
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
                  placeholder="Subjek pesan..."
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
                  placeholder="Tulis pesan Anda..."
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
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Kirim Pesan
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
