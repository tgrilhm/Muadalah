import { useQuery, useMutation } from '@tanstack/react-query';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface LaporanSummary {
  semester: {
    id: string;
    name: string;
    academicYear: string;
  } | null;
  stats: {
    totalSiswa: number;
    rataRataNilai: number;
    tingkatKehadiran: number;
    penyelesaianSPP: number;
  };
  kehadiranBreakdown: {
    hadir: number;
    sakit: number;
    izin: number;
    alfa: number;
    terlambat: number;
    total: number;
    percentage: {
      hadir: number;
      sakit: number;
      izin: number;
      alfa: number;
    };
  };
  nilaiDistribusi: Array<{
    kelasId: string;
    kelasName: string;
    grade: number;
    rataRata: number;
  }>;
  bulanIni: {
    month: number;
    year: number;
    totalPembayaran: number;
    lunas: number;
  };
}

export interface LaporanAbsensiParams {
  semesterId: string;
  classId?: string;
}

export interface LaporanNilaiParams {
  semesterId: string;
  classId?: string;
  subjectId?: string;
}

export interface LaporanPembayaranParams {
  year: number;
  month?: number;
  classId?: string;
}

export interface LaporanSiswaParams {
  classId?: string;
  status?: 'AKTIF' | 'LULUS' | 'PINDAH' | 'KELUAR';
}

export interface RaporPdfParams {
  studentId: string;
  semesterId: string;
}

// ─── Helper: trigger browser file download ──────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// ─── Helper: build query string ─────────────────────────────────────────────

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      q.set(key, String(value));
    }
  }
  return q.toString() ? `?${q.toString()}` : '';
}

// ─── Hook: Summary ──────────────────────────────────────────────────────────

/**
 * Fetch data ringkasan untuk halaman laporan
 */
export function useLaporanSummary(semesterId?: string) {
  return useQuery<LaporanSummary>({
    queryKey: ['laporan', 'summary', semesterId],
    queryFn: async () => {
      const qs = buildQuery({ semesterId });
      const res = await fetch(`/api/laporan${qs}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Gagal memuat data laporan');
      }
      const json = await res.json();
      return json.data;
    },
    staleTime: 5 * 60 * 1000, // 5 menit
    retry: 2,
  });
}

// ─── Hook: Download Absensi Excel ───────────────────────────────────────────

/**
 * Download rekap absensi dalam format Excel
 */
export function useDownloadAbsensi() {
  return useMutation({
    mutationFn: async (params: LaporanAbsensiParams) => {
      const qs = buildQuery({ semesterId: params.semesterId, classId: params.classId });
      const res = await fetch(`/api/laporan/absensi/export${qs}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Gagal mengunduh laporan absensi');
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') ?? '';
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : 'rekap-absensi.xlsx';
      downloadBlob(blob, filename);
    },
  });
}

// ─── Hook: Download Nilai Excel ─────────────────────────────────────────────

/**
 * Download rekap nilai dalam format Excel (2 sheet: Rekap + Ranking)
 */
export function useDownloadNilai() {
  return useMutation({
    mutationFn: async (params: LaporanNilaiParams) => {
      const qs = buildQuery({
        semesterId: params.semesterId,
        classId: params.classId,
        subjectId: params.subjectId,
      });
      const res = await fetch(`/api/laporan/nilai/export${qs}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Gagal mengunduh laporan nilai');
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') ?? '';
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : 'rekap-nilai.xlsx';
      downloadBlob(blob, filename);
    },
  });
}

// ─── Hook: Download Pembayaran Excel ────────────────────────────────────────

/**
 * Download laporan pembayaran SPP dalam format Excel
 */
export function useDownloadPembayaran() {
  return useMutation({
    mutationFn: async (params: LaporanPembayaranParams) => {
      const qs = buildQuery({
        year: params.year,
        month: params.month,
        classId: params.classId,
      });
      const res = await fetch(`/api/laporan/pembayaran/export${qs}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Gagal mengunduh laporan pembayaran');
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') ?? '';
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : 'laporan-pembayaran.xlsx';
      downloadBlob(blob, filename);
    },
  });
}

// ─── Hook: Download Siswa Excel ─────────────────────────────────────────────

/**
 * Download data siswa dalam format Excel
 */
export function useDownloadSiswa() {
  return useMutation({
    mutationFn: async (params: LaporanSiswaParams = {}) => {
      const qs = buildQuery({ classId: params.classId, status: params.status });
      const res = await fetch(`/api/laporan/siswa/export${qs}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Gagal mengunduh data siswa');
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') ?? '';
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : 'data-siswa.xlsx';
      downloadBlob(blob, filename);
    },
  });
}

// ─── Hook: Download Rapor PDF ───────────────────────────────────────────────

/**
 * Download rapor siswa dalam format PDF
 */
export function useDownloadRaporPdf() {
  return useMutation({
    mutationFn: async (params: RaporPdfParams) => {
      const qs = buildQuery({ studentId: params.studentId, semesterId: params.semesterId });
      const res = await fetch(`/api/laporan/rapor/pdf${qs}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Gagal mengunduh rapor PDF');
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') ?? '';
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : 'rapor.pdf';
      downloadBlob(blob, filename);
    },
  });
}
