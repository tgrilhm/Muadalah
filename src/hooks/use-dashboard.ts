'use client';

import { useQuery } from '@tanstack/react-query';

// ==================== QUERY KEYS ====================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  kehadiran: (year: number) => [...dashboardKeys.all, 'kehadiran', year] as const,
  nilai: (semesterId?: string) => [...dashboardKeys.all, 'nilai', semesterId] as const,
  aktivitas: () => [...dashboardKeys.all, 'aktivitas'] as const,
};

// ==================== FETCH FUNCTIONS ====================

async function fetchDashboardStats() {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error('Gagal memuat statistik dashboard');
  return res.json();
}

async function fetchDashboardKehadiran(year: number) {
  const res = await fetch(`/api/dashboard/kehadiran?year=${year}`);
  if (!res.ok) throw new Error('Gagal memuat data kehadiran');
  return res.json();
}

async function fetchDashboardNilai(semesterId?: string) {
  const url = semesterId
    ? `/api/dashboard/nilai?semesterId=${semesterId}`
    : '/api/dashboard/nilai';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal memuat data nilai');
  return res.json();
}

async function fetchDashboardAktivitas() {
  const res = await fetch('/api/dashboard/aktivitas');
  if (!res.ok) throw new Error('Gagal memuat aktivitas');
  return res.json();
}

// ==================== HOOKS ====================

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 menit
    refetchOnWindowFocus: false,
  });
}

export function useDashboardKehadiran(year: number = new Date().getFullYear()) {
  return useQuery({
    queryKey: dashboardKeys.kehadiran(year),
    queryFn: () => fetchDashboardKehadiran(year),
    staleTime: 10 * 60 * 1000, // 10 menit
    refetchOnWindowFocus: false,
  });
}

export function useDashboardNilai(semesterId?: string) {
  return useQuery({
    queryKey: dashboardKeys.nilai(semesterId),
    queryFn: () => fetchDashboardNilai(semesterId),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useDashboardAktivitas() {
  return useQuery({
    queryKey: dashboardKeys.aktivitas(),
    queryFn: fetchDashboardAktivitas,
    staleTime: 2 * 60 * 1000, // 2 menit
    refetchOnWindowFocus: true,
  });
}
