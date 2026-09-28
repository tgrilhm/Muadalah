'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Search,
  PenSquare,
  Radio,
  Send,
  Paperclip,
  Info,
  MoreVertical,
  MessageCircle,
  CheckCheck,
  Check,
  Users,
  Megaphone,
} from 'lucide-react';
import { usePesanList, usePesanThread, useSendPesan, useBroadcastPesan } from '@/hooks/use-pesan';
import { useToast } from '@/hooks/use-toast';
import { useSchool } from '@/hooks/use-school';
import MessageBubble, { MessageDateDivider } from '@/components/komunikasi/message-bubble';
import ComposeModal from '@/components/komunikasi/compose-modal';
import BroadcastModal from '@/components/komunikasi/broadcast-modal';
import { SendMessageInput, BroadcastInput, MESSAGE_TYPE_LABELS } from '@/lib/validations/message.schema';

// ==================== HELPERS ====================

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getAvatarBg(name: string): string {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
    'from-cyan-500 to-cyan-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Kemarin';
  return format(date, 'EEE', { locale: localeId });
}

function shouldShowDateDivider(messages: ConversationMessage[], index: number): boolean {
  if (index === 0) return true;
  const curr = new Date(messages[index].createdAt);
  const prev = new Date(messages[index - 1].createdAt);
  return curr.toDateString() !== prev.toDateString();
}

// ==================== TYPES ====================

interface ConversationItem {
  recipientId: string;
  recipientName: string;
  recipientRelation: string;
  recipientPhone: string;
  studentId: string;
  studentName: string;
  className: string;
  lastMessage: {
    id: string;
    subject: string;
    content: string;
    type: string;
    isRead: boolean;
    createdAt: string;
  };
  unreadCount: number;
}

interface ConversationMessage {
  id: string;
  subject: string;
  content: string;
  type: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender: { id: string; name: string; avatar: string | null };
}

// ==================== EMPTY STATE ====================

function EmptyConversation() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-gradient-to-br from-slate-50 to-blue-50/30">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center"
      >
        <MessageCircle className="w-12 h-12 text-blue-400" />
      </motion.div>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Pilih Percakapan</h3>
        <p className="text-sm text-gray-400 max-w-xs">
          Pilih percakapan dari daftar di kiri, atau mulai percakapan baru dengan klik tombol compose.
        </p>
      </motion.div>
    </div>
  );
}

// ==================== SKELETON LOADERS ====================

function ConversationSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-2/3" />
            <div className="h-3 bg-gray-100 rounded-full animate-pulse w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex-1 p-6 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? '' : 'justify-end'} gap-3`}>
          {i % 2 === 0 && <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />}
          <div className={`h-12 bg-gray-100 rounded-2xl animate-pulse ${i % 2 === 0 ? 'w-56' : 'w-44'}`} />
        </div>
      ))}
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default function KomunikasiPage() {
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'semua' | 'ortu'>('semua');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { toast } = useToast();
  const { selectedSchool } = useSchool();

  // Data fetching
  const { data: conversationsData, isLoading: convLoading } = usePesanList(selectedSchool?.id, {
    search: searchQuery || undefined,
    page: 1,
    limit: 50,
  });

  const { data: threadData, isLoading: threadLoading } = usePesanThread(selectedRecipientId);

  const sendMutation = useSendPesan();
  const broadcastMutation = useBroadcastPesan();

  const conversations: ConversationItem[] = conversationsData?.data ?? [];
  const threadMessages: ConversationMessage[] = threadData?.data?.messages ?? [];
  const selectedRecipient = threadData?.data?.recipient ?? null;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  // Auto-resize textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    e.target.style.height = '';
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
  };

  // Kirim pesan quick (dari textarea di chat window)
  const handleQuickSend = async () => {
    if (!messageInput.trim() || !selectedRecipientId) return;
    try {
      await sendMutation.mutateAsync({
        recipientId: selectedRecipientId,
        subject: 'Pesan',
        content: messageInput.trim(),
        type: 'UMUM',
      });
      setMessageInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '';
      }
    } catch {
      toast({ title: 'Gagal mengirim pesan', variant: 'destructive' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickSend();
    }
  };

  // Kirim dari compose modal
  const handleComposeSend = async (data: SendMessageInput) => {
    try {
      await sendMutation.mutateAsync(data);
      setComposeOpen(false);
      setSelectedRecipientId(data.recipientId);
      toast({ title: '✅ Pesan berhasil dikirim!' });
    } catch (err) {
      toast({
        title: 'Gagal mengirim pesan',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  // Broadcast
  const handleBroadcast = async (data: BroadcastInput) => {
    try {
      const result = await broadcastMutation.mutateAsync(data);
      setBroadcastOpen(false);
      toast({ title: `📢 Broadcast berhasil! ${result.data?.sent ?? 0} pesan terkirim.` });
    } catch (err) {
      toast({
        title: 'Gagal broadcast',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex w-full h-[calc(100vh-80px)] overflow-hidden bg-slate-50">
      {/* ==================== SIDEBAR: CONVERSATION LIST ==================== */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-80 flex-shrink-0 flex flex-col bg-white border-r border-gray-100 overflow-hidden shadow-sm"
      >
        {/* Sidebar Header */}
        <div className="px-4 pt-5 pb-3 sticky top-0 bg-white z-10 border-b border-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Pesan</h2>
            <button
              onClick={() => setComposeOpen(true)}
              className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 hover:shadow-md"
              title="Tulis pesan baru"
            >
              <PenSquare className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mt-3">
            {(['semua', 'ortu'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === f
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f === 'semua' ? 'Semua' : 'Orang Tua'}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto py-2">
          {convLoading ? (
            <ConversationSkeleton />
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <MessageCircle className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400 font-medium">Belum ada percakapan</p>
              <p className="text-xs text-gray-300 mt-1">Mulai percakapan baru dengan klik +</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {conversations.map((conv, i) => {
                const isActive = conv.recipientId === selectedRecipientId;
                const initials = getInitials(conv.recipientName);
                const avatarBg = getAvatarBg(conv.recipientName);

                return (
                  <motion.button
                    key={conv.recipientId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    onClick={() => setSelectedRecipientId(conv.recipientId)}
                    className={`w-full flex items-start gap-3 px-4 py-3 mx-2 rounded-xl transition-all text-left group ${
                      isActive
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                    style={{ width: 'calc(100% - 16px)' }}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarBg} flex items-center justify-center text-white text-sm font-bold shadow-sm`}
                      >
                        {initials}
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <h3
                          className={`text-sm truncate font-semibold ${
                            isActive ? 'text-blue-700' : 'text-gray-900'
                          } ${conv.unreadCount > 0 ? 'font-bold' : ''}`}
                        >
                          {conv.recipientName}
                          <span className="ml-1 text-xs font-normal text-gray-400">
                            ({conv.recipientRelation})
                          </span>
                        </h3>
                        <span className={`text-[11px] flex-shrink-0 ml-2 ${conv.unreadCount > 0 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                          {formatRelativeTime(conv.lastMessage.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-blue-600 font-medium mb-0.5 truncate">
                        {conv.studentName} · Kelas {conv.className}
                      </p>

                      <div className="flex items-center gap-1">
                        {!conv.lastMessage.isRead ? (
                          <Check className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        ) : (
                          <CheckCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />
                        )}
                        <p
                          className={`text-xs truncate ${
                            conv.unreadCount > 0 ? 'text-gray-800 font-semibold' : 'text-gray-500'
                          }`}
                        >
                          {conv.lastMessage.content}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Broadcast Button */}
        <div className="p-3 border-t border-gray-100 bg-white">
          <button
            onClick={() => setBroadcastOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-orange-200 hover:shadow-md"
          >
            <Megaphone className="w-4 h-4" />
            Broadcast Pesan
          </button>
        </div>
      </motion.aside>

      {/* ==================== MAIN: CHAT WINDOW ==================== */}
      <main className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/20 relative overflow-hidden">
        {!selectedRecipientId ? (
          <EmptyConversation />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedRecipientId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              {/* Chat Header */}
              <header className="h-16 flex-shrink-0 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm z-10">
                {selectedRecipient ? (
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarBg(selectedRecipient.name)} flex items-center justify-center text-white text-sm font-bold shadow-sm`}
                    >
                      {getInitials(selectedRecipient.name)}
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                        {selectedRecipient.name}
                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide bg-blue-100 text-blue-700">
                          {selectedRecipient.relation}
                        </span>
                      </h2>
                      <p className="text-xs text-gray-500">
                        Orang tua {selectedRecipient.student?.name} · Kelas{' '}
                        {selectedRecipient.student?.class?.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-10 w-48 bg-gray-100 rounded-xl animate-pulse" />
                )}

                <div className="flex items-center gap-1">
                  <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors" title="Info kontak">
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (selectedRecipientId) {
                        setComposeOpen(true);
                      }
                    }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                    title="Opsi lain"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </header>

              {/* Messages Area */}
              <div
                className="flex-1 overflow-y-auto p-6 flex flex-col gap-3"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='%23E2E8F0' fill-opacity='0.5'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'repeat',
                }}
              >
                {threadLoading ? (
                  <ChatSkeleton />
                ) : threadMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                    <MessageCircle className="w-12 h-12 text-gray-200 mb-3" />
                    <p className="text-sm text-gray-400">Belum ada pesan dalam percakapan ini</p>
                    <p className="text-xs text-gray-300 mt-1">Mulai percakapan di bawah</p>
                  </div>
                ) : (
                  <>
                    {threadMessages.map((msg, idx) => (
                      <div key={msg.id}>
                        {shouldShowDateDivider(threadMessages, idx) && (
                          <MessageDateDivider dateStr={msg.createdAt} />
                        )}
                        <MessageBubble
                          message={msg}
                          isSent={true}
                          showAvatar={idx === 0 || shouldShowDateDivider(threadMessages, idx)}
                          senderName={msg.sender?.name ?? 'Anda'}
                          senderAvatar={msg.sender?.avatar}
                        />
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>

              {/* Input Footer */}
              <footer className="flex-shrink-0 px-6 py-4 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-end gap-3 bg-gray-50 rounded-2xl border border-gray-200 px-3 py-2 focus-within:bg-white focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
                  <button
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"
                    title="Lampirkan file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <textarea
                    ref={textareaRef}
                    value={messageInput}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Tulis pesan... (Enter untuk kirim)"
                    rows={1}
                    className="flex-1 bg-transparent border-none resize-none outline-none text-sm text-gray-800 placeholder:text-gray-400 py-1 max-h-32 scrollbar-hide"
                    style={{ scrollbarWidth: 'none' }}
                  />

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleQuickSend}
                    disabled={!messageInput.trim() || sendMutation.isPending}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    title="Kirim pesan"
                  >
                    {sendMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 text-center">
                  Tekan <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 text-[10px]">Enter</kbd> untuk kirim ·{' '}
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 text-[10px]">Shift+Enter</kbd> untuk baris baru
                </p>
              </footer>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* ==================== MODALS ==================== */}
      <ComposeModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSend={handleComposeSend}
        isSending={sendMutation.isPending}
        defaultRecipientId={selectedRecipientId ?? undefined}
      />

      <BroadcastModal
        isOpen={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        onBroadcast={handleBroadcast}
        isSending={broadcastMutation.isPending}
      />
    </div>
  );
}
