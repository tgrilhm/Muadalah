'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AttendanceStatus } from '@prisma/client';

// ==================== TYPES ====================

export interface AbsensiQuery {
  schoolId?: string;
  classId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  semesterId?: string;
  page?: number;
  limit?: number;
}

export interface BulkAbsensiInput {
  classId: string;
  date: string;
  attendances: Array<{
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
  }>;
}

export interface RekapQuery {
  classId: string;
  startDate: string;
  endDate: string;
  studentId?: string;
}

export interface StatistikQuery {
  schoolId: string;
  classId?: string;
  startDate: string;
  endDate: string;
}

// ==================== QUERY KEYS ====================

export const absensiKeys = {
  all: ['absensi'] as const,
  lists: () => [...absensiKeys.all, 'list'] as const,
  list: (filters: AbsensiQuery) => [...absensiKeys.lists(), filters] as const,
  rekap: (params: RekapQuery) => [...absensiKeys.all, 'rekap', params] as const,
  statistik: (params: StatistikQuery) => [...absensiKeys.all, 'statistik', params] as const,
};

// ==================== FETCH FUNCTIONS ====================

async function fetchAbsensi(params: AbsensiQuery) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const response = await fetch(`/api/absensi?${searchParams}`);
  if (!response.ok) throw new Error('Gagal memuat data absensi');
  return response.json();
}

async function fetchRekapAbsensi(params: RekapQuery) {
  const searchParams = new URLSearchParams({
    classId: params.classId,
    startDate: params.startDate,
    endDate: params.endDate,
  });
  if (params.studentId) searchParams.append('studentId', params.studentId);
  const response = await fetch(`/api/absensi/rekap?${searchParams}`);
  if (!response.ok) throw new Error('Gagal memuat rekap absensi');
  return response.json();
}

async function fetchStatistikAbsensi(params: StatistikQuery) {
  const searchParams = new URLSearchParams({
    schoolId: params.schoolId,
    startDate: params.startDate,
    endDate: params.endDate,
  });
  if (params.classId) searchParams.append('classId', params.classId);
  const response = await fetch(`/api/absensi/statistik?${searchParams}`);
  if (!response.ok) throw new Error('Gagal memuat statistik absensi');
  return response.json();
}

async function saveBulkAbsensi(data: BulkAbsensiInput) {
  const response = await fetch('/api/absensi/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Gagal menyimpan absensi');
  }
  return response.json();
}

// ==================== HOOKS ====================

export function useAbsensi(params: AbsensiQuery, enabled = true) {
  return useQuery({
    queryKey: absensiKeys.list(params),
    queryFn: () => fetchAbsensi(params),
    enabled: enabled && !!params.schoolId,
  });
}

export function useRekapAbsensi(params: RekapQuery, enabled = true) {
  return useQuery({
    queryKey: absensiKeys.rekap(params),
    queryFn: () => fetchRekapAbsensi(params),
    enabled: enabled && !!params.classId && !!params.startDate && !!params.endDate,
  });
}

export function useStatistikAbsensi(params: StatistikQuery, enabled = true) {
  return useQuery({
    queryKey: absensiKeys.statistik(params),
    queryFn: () => fetchStatistikAbsensi(params),
    enabled: enabled && !!params.schoolId && !!params.startDate && !!params.endDate,
  });
}

export function useSaveBulkAbsensi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveBulkAbsensi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: absensiKeys.all });
    },
  });
}
