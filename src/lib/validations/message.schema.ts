import { z } from 'zod';

// ==================== ENUMS ====================

export const MessageTypeEnum = z.enum(['UMUM', 'AKADEMIK', 'KEHADIRAN', 'PEMBAYARAN', 'DARURAT']);

// ==================== SEND MESSAGE ====================

export const sendMessageSchema = z.object({
  recipientId: z.string().min(1, 'Penerima wajib dipilih'),
  subject: z.string().min(1, 'Subjek wajib diisi').max(200, 'Subjek maksimal 200 karakter'),
  content: z.string().min(1, 'Isi pesan wajib diisi').max(5000, 'Pesan maksimal 5000 karakter'),
  type: MessageTypeEnum.default('UMUM'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ==================== BROADCAST MESSAGE ====================

export const broadcastMessageSchema = z
  .object({
    classId: z.string().optional(),
    schoolWide: z.boolean().default(false),
    subject: z.string().min(1, 'Subjek wajib diisi').max(200, 'Subjek maksimal 200 karakter'),
    content: z.string().min(1, 'Isi pesan wajib diisi').max(5000, 'Pesan maksimal 5000 karakter'),
    type: MessageTypeEnum.default('UMUM'),
  })
  .refine((data) => data.classId || data.schoolWide, {
    message: 'Pilih kelas atau centang "Seluruh Sekolah"',
    path: ['classId'],
  });

export type BroadcastInput = z.infer<typeof broadcastMessageSchema>;

// ==================== QUERY PARAMS ====================

export const messageQuerySchema = z.object({
  search: z.string().optional(),
  type: MessageTypeEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type MessageQuery = z.infer<typeof messageQuerySchema>;

// ==================== RESPONSE TYPES ====================

export interface ConversationItem {
  recipientId: string;
  recipientName: string;
  recipientRelation: string;
  recipientPhone: string;
  studentName: string;
  studentId: string;
  lastMessage: {
    id: string;
    subject: string;
    content: string;
    type: string;
    createdAt: string;
  };
  unreadCount: number;
  totalMessages: number;
}

export interface MessageItem {
  id: string;
  subject: string;
  content: string;
  type: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
  };
  recipient: {
    id: string;
    name: string;
    relation: string;
    phone: string;
    studentId: string;
    studentName: string;
  };
}

export interface MessageTypeLabel {
  value: string;
  label: string;
  color: string;
}

export const MESSAGE_TYPE_LABELS: MessageTypeLabel[] = [
  { value: 'UMUM', label: 'Umum', color: 'bg-blue-100 text-blue-700' },
  { value: 'AKADEMIK', label: 'Akademik', color: 'bg-purple-100 text-purple-700' },
  { value: 'KEHADIRAN', label: 'Kehadiran', color: 'bg-amber-100 text-amber-700' },
  { value: 'PEMBAYARAN', label: 'Pembayaran', color: 'bg-green-100 text-green-700' },
  { value: 'DARURAT', label: 'Darurat', color: 'bg-red-100 text-red-700' },
];
