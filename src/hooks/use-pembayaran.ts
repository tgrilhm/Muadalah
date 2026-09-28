'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreatePaymentInput,
  UpdatePaymentInput,
  PaymentQuery,
  TunggakanQuery,
  RingkasanQuery,
} from '@/lib/validations/payment.schema';

// ==================== QUERY KEYS ====================

export const pembayaranKeys = {
  all: ['pembayaran'] as const,
  lists: () => [...pembayaranKeys.all, 'list'] as const,
  list: (filters: PaymentQuery) => [...pembayaranKeys.lists(), filters] as const,
  details: () => [...pembayaranKeys.all, 'detail'] as const,
  detail: (id: string) => [...pembayaranKeys.details(), id] as const,
  ringkasan: (params: RingkasanQuery) => [...pembayaranKeys.all, 'ringkasan', params] as const,
  tunggakan: (params: TunggakanQuery) => [...pembayaranKeys.all, 'tunggakan', params] as const,
};

// ==================== FETCH FUNCTIONS ====================

async function fetchPembayaran(params: PaymentQuery) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const response = await fetch(`/api/pembayaran?${searchParams}`);
  if (!response.ok) throw new Error('Gagal memuat daftar pembayaran');
  return response.json();
}

async function fetchPembayaranDetail(id: string) {
  const response = await fetch(`/api/pembayaran/${id}`);
  if (!response.ok) throw new Error('Gagal memuat detail pembayaran');
  return response.json();
}

async function fetchRingkasan(params: RingkasanQuery) {
  const searchParams = new URLSearchParams();
  if (params.month) searchParams.append('month', String(params.month));
  if (params.year) searchParams.append('year', String(params.year));
  const response = await fetch(`/api/pembayaran/ringkasan?${searchParams}`);
  if (!response.ok) throw new Error('Gagal memuat ringkasan pembayaran');
  return response.json();
}

async function fetchTunggakan(params: TunggakanQuery) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const response = await fetch(`/api/pembayaran/tunggakan?${searchParams}`);
  if (!response.ok) throw new Error('Gagal memuat data tunggakan');
  return response.json();
}

async function createPembayaran(data: CreatePaymentInput) {
  const response = await fetch('/api/pembayaran', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Gagal mencatat pembayaran');
  }
  return response.json();
}

async function updatePembayaran({ id, data }: { id: string; data: UpdatePaymentInput }) {
  const response = await fetch(`/api/pembayaran/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Gagal memperbarui pembayaran');
  }
  return response.json();
}

async function deletePembayaran(id: string) {
  const response = await fetch(`/api/pembayaran/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Gagal menghapus pembayaran');
  }
  return response.json();
}

// ==================== HOOKS ====================

async function fetchPembayaranWithSchool(schoolId: string | undefined, params: PaymentQuery) {
  const searchParams = new URLSearchParams();
  if (schoolId) searchParams.append('schoolId', schoolId);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const response = await fetch(`/api/pembayaran?${searchParams}`);
  if (!response.ok) throw new Error('Gagal memuat daftar pembayaran');
  return response.json();
}

export function usePembayaran(schoolId: string | undefined, params: PaymentQuery) {
  return useQuery({
    queryKey: pembayaranKeys.list(params),
    queryFn: () => fetchPembayaranWithSchool(schoolId, params),
    enabled: !!schoolId,
  });
}

export function usePembayaranDetail(id: string) {
  return useQuery({
    queryKey: pembayaranKeys.detail(id),
    queryFn: () => fetchPembayaranDetail(id),
    enabled: !!id,
  });
}

export function useRingkasanPembayaran(params: RingkasanQuery) {
  return useQuery({
    queryKey: pembayaranKeys.ringkasan(params),
    queryFn: () => fetchRingkasan(params),
  });
}

export function useTunggakan(params: TunggakanQuery) {
  return useQuery({
    queryKey: pembayaranKeys.tunggakan(params),
    queryFn: () => fetchTunggakan(params),
  });
}

export function useCreatePembayaran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPembayaran,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.all });
    },
  });
}

export function useUpdatePembayaran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePembayaran,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.all });
    },
  });
}

export function useDeletePembayaran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePembayaran,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pembayaranKeys.all });
    },
  });
}
