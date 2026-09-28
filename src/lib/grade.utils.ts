import { GradeType } from '@prisma/client';

// ==================== TYPES ====================

export interface GradeRecord {
  type: GradeType;
  score: number;
  maxScore?: number;
}

export interface GradeBreakdown {
  ULANGAN_HARIAN: number[];
  UTS: number | null;
  UAS: number | null;
  TUGAS: number[];
  PRAKTIKUM: number[];
  PROYEK: number[];
}

export interface FinalScoreResult {
  finalScore: number;
  avgUH: number | null;
  utsScore: number | null;
  uasScore: number | null;
  breakdown: GradeBreakdown;
  isComplete: boolean; // true jika UTS dan UAS sudah ada
}

// ==================== CONSTANTS ====================

/**
 * Bobot penilaian standar.
 * UH: 30%, UTS: 30%, UAS: 40%
 */
export const GRADE_WEIGHTS = {
  UH: 0.3,
  UTS: 0.3,
  UAS: 0.4,
} as const;

/** KKM (Kriteria Ketuntasan Minimal) default */
export const KKM = 70;

export const GRADE_TYPE_LABELS: Record<GradeType, string> = {
  ULANGAN_HARIAN: 'Ulangan Harian',
  UTS: 'Ujian Tengah Semester',
  UAS: 'Ujian Akhir Semester',
  TUGAS: 'Tugas',
  PRAKTIKUM: 'Praktikum',
  PROYEK: 'Proyek',
};

export const GRADE_TYPE_ABBR: Record<GradeType, string> = {
  ULANGAN_HARIAN: 'UH',
  UTS: 'UTS',
  UAS: 'UAS',
  TUGAS: 'Tugas',
  PRAKTIKUM: 'Prak',
  PROYEK: 'Proyek',
};

// ==================== CALCULATIONS ====================

/**
 * Kelompokkan array nilai berdasarkan tipe
 */
export function groupGradesByType(grades: GradeRecord[]): GradeBreakdown {
  return grades.reduce<GradeBreakdown>(
    (acc, grade) => {
      switch (grade.type) {
        case 'ULANGAN_HARIAN':
          acc.ULANGAN_HARIAN.push(grade.score);
          break;
        case 'UTS':
          // Ambil nilai UTS terakhir jika ada lebih dari satu
          acc.UTS = grade.score;
          break;
        case 'UAS':
          acc.UAS = grade.score;
          break;
        case 'TUGAS':
          acc.TUGAS.push(grade.score);
          break;
        case 'PRAKTIKUM':
          acc.PRAKTIKUM.push(grade.score);
          break;
        case 'PROYEK':
          acc.PROYEK.push(grade.score);
          break;
      }
      return acc;
    },
    {
      ULANGAN_HARIAN: [],
      UTS: null,
      UAS: null,
      TUGAS: [],
      PRAKTIKUM: [],
      PROYEK: [],
    }
  );
}

/**
 * Hitung rata-rata dari array angka
 */
export function average(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

/**
 * Hitung nilai akhir berbobot:
 * (Avg UH × 30%) + (UTS × 30%) + (UAS × 40%)
 *
 * Jika UTS atau UAS belum ada:
 * - Nilai akhir dihitung dari komponen yang tersedia saja (partial)
 * - isComplete = false
 */
export function calculateFinalScore(grades: GradeRecord[]): FinalScoreResult {
  const breakdown = groupGradesByType(grades);
  const avgUH = average(breakdown.ULANGAN_HARIAN);
  const utsScore = breakdown.UTS;
  const uasScore = breakdown.UAS;

  let weightedSum = 0;
  let totalWeight = 0;

  if (avgUH !== null) {
    weightedSum += avgUH * GRADE_WEIGHTS.UH;
    totalWeight += GRADE_WEIGHTS.UH;
  }
  if (utsScore !== null) {
    weightedSum += utsScore * GRADE_WEIGHTS.UTS;
    totalWeight += GRADE_WEIGHTS.UTS;
  }
  if (uasScore !== null) {
    weightedSum += uasScore * GRADE_WEIGHTS.UAS;
    totalWeight += GRADE_WEIGHTS.UAS;
  }

  const isComplete = utsScore !== null && uasScore !== null;

  return {
    finalScore: totalWeight === 0 ? 0 : Math.round(weightedSum * 10) / 10,
    avgUH,
    utsScore,
    uasScore,
    breakdown,
    isComplete,
  };
}

// ==================== DISPLAY HELPERS ====================

/**
 * Warna untuk nilai (untuk className Tailwind)
 */
export function getScoreColor(score: number | null): string {
  if (score === null) return 'text-gray-400';
  if (score < KKM) return 'text-red-600';
  if (score < 85) return 'text-amber-600';
  return 'text-emerald-600';
}

/**
 * Background color untuk badge nilai
 */
export function getScoreBgColor(score: number | null): string {
  if (score === null) return 'bg-gray-100 text-gray-500';
  if (score < KKM) return 'bg-red-50 text-red-700 border border-red-200';
  if (score < 85) return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
}

/**
 * Predikat nilai huruf (A/B/C/D)
 */
export function getGradeLabel(score: number | null): string {
  if (score === null) return '-';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
}

/**
 * Format score untuk display (1 desimal)
 */
export function formatScore(score: number | null): string {
  if (score === null) return '-';
  return score.toFixed(1);
}

// ==================== RANKING HELPERS ====================

export interface StudentRankData {
  studentId: string;
  studentName: string;
  nis: string;
  averageScore: number;
  subjectScores: Record<string, number | null>;
  rank: number;
}

/**
 * Hitung ranking dari array data siswa
 * (sudah termasuk rata-rata nilai akhir)
 */
export function calculateRanking(
  students: Omit<StudentRankData, 'rank'>[]
): StudentRankData[] {
  const sorted = [...students].sort((a, b) => b.averageScore - a.averageScore);
  return sorted.map((student, index) => ({
    ...student,
    rank: index + 1,
  }));
}

// ==================== STATISTIK ====================

export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

/**
 * Hitung distribusi nilai per rentang (0-59, 60-69, 70-79, 80-89, 90-100)
 */
export function calculateDistribution(scores: number[]): ScoreDistribution[] {
  if (scores.length === 0) return [];

  const ranges = [
    { range: '90-100', min: 90, max: 100 },
    { range: '80-89', min: 80, max: 89 },
    { range: '70-79', min: 70, max: 79 },
    { range: '60-69', min: 60, max: 69 },
    { range: '0-59', min: 0, max: 59 },
  ];

  return ranges.map(({ range, min, max }) => {
    const count = scores.filter((s) => s >= min && s <= max).length;
    return {
      range,
      count,
      percentage: Math.round((count / scores.length) * 100),
    };
  });
}
