'use client';

import { motion } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { CheckCheck, Check } from 'lucide-react';
import { MESSAGE_TYPE_LABELS } from '@/lib/validations/message.schema';

interface MessageBubbleProps {
  message: {
    id: string;
    subject: string;
    content: string;
    type: string;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
  };
  isSent: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderAvatar?: string | null;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return format(date, 'HH:mm');
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export function MessageDateDivider({ dateStr }: { dateStr: string }) {
  const date = new Date(dateStr);
  let label: string;
  if (isToday(date)) {
    label = 'Hari Ini';
  } else if (isYesterday(date)) {
    label = 'Kemarin';
  } else {
    label = format(date, 'EEEE, d MMMM yyyy', { locale: localeId });
  }

  return (
    <div className="flex justify-center my-4">
      <span className="px-4 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-widest shadow-sm">
        {label}
      </span>
    </div>
  );
}

export function MessageTypeBadge({ type }: { type: string }) {
  const typeInfo = MESSAGE_TYPE_LABELS.find((t) => t.value === type);
  if (!typeInfo) return null;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${typeInfo.color}`}>
      {typeInfo.label}
    </span>
  );
}

export default function MessageBubble({
  message,
  isSent,
  showAvatar = true,
  senderName = 'Anda',
  senderAvatar,
}: MessageBubbleProps) {
  const initials = getInitials(senderName);
  const avatarBg = getAvatarColor(senderName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-end gap-2 max-w-[80%] group ${isSent ? 'self-end flex-row-reverse' : 'self-start'}`}
    >
      {/* Avatar — only for received */}
      {!isSent && showAvatar && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1 shadow-sm ${avatarBg}`}
        >
          {senderAvatar ? (
            <img
              src={senderAvatar}
              alt={senderName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
      )}

      {/* Spacer for alignment when no avatar */}
      {!isSent && !showAvatar && <div className="w-8 flex-shrink-0 opacity-0" />}

      <div className={`flex flex-col gap-1 ${isSent ? 'items-end' : 'items-start'}`}>
        {/* Type badge + subject for first message */}
        <div className="flex items-center gap-2 flex-wrap">
          <MessageTypeBadge type={message.type} />
          {message.subject && (
            <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
              {message.subject}
            </span>
          )}
        </div>

        {/* Message bubble */}
        <div
          className={`px-4 py-3 shadow-sm transition-shadow group-hover:shadow-md relative ${
            isSent
              ? 'bg-blue-600 text-white rounded-2xl rounded-br-none shadow-blue-200'
              : 'bg-white text-gray-800 rounded-2xl rounded-bl-none border border-gray-100'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Timestamp + read status */}
        <div className={`flex items-center gap-1 ${isSent ? 'flex-row-reverse' : ''}`}>
          <span className="text-[11px] text-gray-400">{formatTime(message.createdAt)}</span>
          {isSent && (
            message.isRead ? (
              <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
            ) : (
              <Check className="w-3.5 h-3.5 text-gray-400" />
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
