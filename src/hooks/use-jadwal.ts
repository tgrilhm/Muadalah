import { useState, useCallback } from 'react';
import { ScheduleWithRelations, CreateScheduleForm, UpdateScheduleForm } from '@/types/jadwal';

// ==================== TYPES ====================

interface UseJadwalState {
  schedules: ScheduleWithRelations[];
  isLoading: boolean;
  error: string | null;
  total: number;
}

interface UseJadwalReturn extends UseJadwalState {
  fetchSchedules: (classId?: string, schoolId?: string) => Promise<void>;
  refetch: () => Promise<void>;
}

interface UseMutationReturn {
  isLoading: boolean;
  error: string | null;
  create: (data: CreateScheduleForm) => Promise<ScheduleWithRelations | null>;
  update: (id: string, data: UpdateScheduleForm) => Promise<ScheduleWithRelations | null>;
  remove: (id: string) => Promise<boolean>;
  clearError: () => void;
}

// ==================== useJadwal — fetch list ==================== 

export function useJadwal(initialClassId?: string): UseJadwalReturn {
  const [state, setState] = useState<UseJadwalState>({
    schedules: [],
    isLoading: false,
    error: null,
    total: 0,
  });
  const [lastClassId, setLastClassId] = useState<string | undefined>(initialClassId);

  const fetchSchedules = useCallback(async (classId?: string, schoolId?: string) => {
    const targetClassId = classId ?? lastClassId;
    if (!targetClassId && !schoolId) {
      setState((s) => ({ ...s, schedules: [], total: 0 }));
      return;
    }

    if (classId) setLastClassId(classId);

    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (targetClassId) params.append('classId', targetClassId);
      if (schoolId) params.append('schoolId', schoolId);
      
      const res = await fetch(`/api/jadwal?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setState((s) => ({
          ...s,
          isLoading: false,
          error: json.error ?? 'Gagal memuat jadwal',
        }));
        return;
      }

      setState({
        schedules: json.data ?? [],
        total: json.meta?.total ?? 0,
        isLoading: false,
        error: null,
      });
    } catch {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: 'Terjadi kesalahan saat memuat jadwal',
      }));
    }
  }, [lastClassId]);

  const refetch = useCallback(() => fetchSchedules(lastClassId), [fetchSchedules, lastClassId]);

  return { ...state, fetchSchedules, refetch };
}

// ==================== useJadwalMutations — create/update/delete ====================

export function useJadwalMutations(): UseMutationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const create = useCallback(
    async (data: CreateScheduleForm): Promise<ScheduleWithRelations | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/jadwal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error ?? 'Gagal membuat jadwal');
          return null;
        }
        return json.data as ScheduleWithRelations;
      } catch {
        setError('Terjadi kesalahan jaringan');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const update = useCallback(
    async (id: string, data: UpdateScheduleForm): Promise<ScheduleWithRelations | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/jadwal/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error ?? 'Gagal memperbarui jadwal');
          return null;
        }
        return json.data as ScheduleWithRelations;
      } catch {
        setError('Terjadi kesalahan jaringan');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jadwal/${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menghapus jadwal');
        return false;
      }
      return true;
    } catch {
      setError('Terjadi kesalahan jaringan');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, create, update, remove, clearError };
}
