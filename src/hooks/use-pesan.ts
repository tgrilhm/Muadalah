'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SendMessageInput, BroadcastInput, MessageQuery } from '@/lib/validations/message.schema';

// ==================== QUERY KEYS ====================

export const pesanKeys = {
  all: ['pesan'] as const,
  conversations: () => [...pesanKeys.all, 'conversations'] as const,
  conversation: (params: MessageQuery) => [...pesanKeys.conversations(), params] as const,
  thread: (recipientId: string) => [...pesanKeys.all, 'thread', recipientId] as const,
  unread: () => [...pesanKeys.all, 'unread'] as const,
};

// ==================== FETCH FUNCTIONS ====================

async function fetchConversations(params: MessageQuery) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const response = await fetch(`/api/pesan?${searchParams}`);
  if (!response.ok) throw new Error('Gagal memuat daftar percakapan');
  return response.json();
}

async function fetchThread(recipientId: string) {
  const response = await fetch(`/api/pesan/${recipientId}`);
  if (!response.ok) throw new Error('Gagal memuat thread pesan');
  return response.json();
}

async function fetchUnreadCount() {
  const response = await fetch('/api/pesan/unread');
  if (!response.ok) throw new Error('Gagal memuat unread count');
  return response.json();
}

async function sendMessage(data: SendMessageInput) {
  const response = await fetch('/api/pesan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Gagal mengirim pesan');
  }
  return response.json();
}

async function broadcastMessage(data: BroadcastInput) {
  const response = await fetch('/api/pesan/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Gagal broadcast pesan');
  }
  return response.json();
}

async function deleteMessage(messageId: string) {
  const response = await fetch(`/api/pesan/${messageId}`, { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Gagal menghapus pesan');
  }
  return response.json();
}

// ==================== HOOKS ====================

/**
 * Daftar percakapan (grouped by recipient)
 */
export function usePesanList(params: Partial<MessageQuery> = {}) {
  const fullParams: MessageQuery = { page: 1, limit: 20, ...params };
  return useQuery({
    queryKey: pesanKeys.conversation(fullParams),
    queryFn: () => fetchConversations(fullParams),
    staleTime: 30 * 1000, // 30 detik
  });
}

export function usePesan(schoolId: string | undefined, params: MessageQuery) {
  return useQuery({
    queryKey: pesanKeys.conversation(params),
    queryFn: () => fetchConversationsWithSchool(schoolId, params),
    enabled: !!schoolId,
  });
}

/**
 * Thread pesan dengan satu kontak
 */
export function usePesanThread(recipientId: string | null) {
  return useQuery({
    queryKey: pesanKeys.thread(recipientId ?? ''),
    queryFn: () => fetchThread(recipientId!),
    enabled: !!recipientId,
    staleTime: 15 * 1000, // 15 detik
  });
}

/**
 * Count pesan belum dibaca (untuk badge sidebar)
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: pesanKeys.unread(),
    queryFn: fetchUnreadCount,
    staleTime: 60 * 1000, // 1 menit
    refetchInterval: 60 * 1000, // Auto-refetch tiap 1 menit
  });
}

/**
 * Mutation: kirim pesan individual
 */
export function useSendPesan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (_, variables) => {
      // Invalidate conversation list dan thread
      queryClient.invalidateQueries({ queryKey: pesanKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: pesanKeys.thread(variables.recipientId) });
      queryClient.invalidateQueries({ queryKey: pesanKeys.unread() });
    },
  });
}

/**
 * Mutation: broadcast pesan
 */
export function useBroadcastPesan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: broadcastMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pesanKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: pesanKeys.unread() });
    },
  });
}

/**
 * Mutation: hapus pesan
 */
export function useDeletePesan(recipientId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pesanKeys.conversations() });
      if (recipientId) {
        queryClient.invalidateQueries({ queryKey: pesanKeys.thread(recipientId) });
      }
      queryClient.invalidateQueries({ queryKey: pesanKeys.unread() });
    },
  });
}
