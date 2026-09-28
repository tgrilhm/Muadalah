import { z } from 'zod';

/**
 * Schema validasi untuk query laporan absensi
 * GET /api/laporan/absensi/export
 */
export const laporanAbsensiQuerySchema = z.object({
  semesterId: z.string().min(1, 'semesterId diperlukan'),
  classId: z.string().optional(),
});

export type LaporanAbsensiQuery = z.infer<typeof laporanAbsensiQuerySchema>;

/**
 * Schema validasi untuk query laporan nilai
 * GET /api/laporan/nilai/export
 */
export const laporanNilaiQuerySchema = z.object({
  semesterId: z.string().min(1, 'semesterId diperlukan'),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
});

export type LaporanNilaiQuery = z.infer<typeof laporanNilaiQuerySchema>;

/**
 * Schema validasi untuk query laporan pembayaran
 * GET /api/laporan/pembayaran/export
 */
export const laporanPembayaranQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2035),
  month: z.coerce.number().int().min(1).max(12).optional(),
  classId: z.string().optional(),
});

export type LaporanPembayaranQuery = z.infer<typeof laporanPembayaranQuerySchema>;

/**
 * Schema validasi untuk query laporan data siswa
 * GET /api/laporan/siswa/export
 */
export const laporanSiswaQuerySchema = z.object({
  classId: z.string().optional(),
  status: z.enum(['AKTIF', 'LULUS', 'PINDAH', 'KELUAR']).optional(),
});

export type LaporanSiswaQuery = z.infer<typeof laporanSiswaQuerySchema>;

/**
 * Schema validasi untuk generate rapor PDF
 * GET /api/laporan/rapor/pdf
 */
export const raporPdfQuerySchema = z.object({
  studentId: z.string().min(1, 'studentId diperlukan'),
  semesterId: z.string().min(1, 'semesterId diperlukan'),
});

export type RaporPdfQuery = z.infer<typeof raporPdfQuerySchema>;

/**
 * Schema validasi untuk query summary laporan
 * GET /api/laporan
 */
export const laporanSummaryQuerySchema = z.object({
  semesterId: z.string().optional(),
  classId: z.string().optional(),
});

export type LaporanSummaryQuery = z.infer<typeof laporanSummaryQuerySchema>;
