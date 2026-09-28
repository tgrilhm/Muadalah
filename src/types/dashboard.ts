// ==================== DASHBOARD TYPES ====================

export interface DashboardStats {
  totalSiswaAktif: number;
  totalKelas: number;
  kehadiranHariIni: {
    persentase: number;
    hadir: number;
    tidakHadir: number;
    total: number;
    tanggal: string;
  };
  rataRataNilai: {
    rataRata: number;
    semesterId: string | null;
    semesterName: string | null;
  };
  sppBulanIni: {
    terkumpul: number;
    target: number;
    persentase: number;
  };
  siswaBermasalah: {
    count: number;
    list: Array<{
      id: string;
      name: string;
      kelas: string;
      persentaseKehadiran: number;
    }>;
  };
}

export interface KehadiranBulanan {
  bulan: string;       // "Jan", "Feb", ...
  bulanIndex: number;
  hadir: number;
  total: number;
  persentase: number;
}

export interface DashboardKehadiran {
  data: KehadiranBulanan[];
  year: number;
}

export interface TopPerformer {
  id: string;
  name: string;
  photo: string | null;
  kelas: string;
  rataRata: number;
  ranking: number;
}

export interface NilaiDistribusi {
  range: string;
  count: number;
  persentase: number;
}

export interface DashboardNilai {
  distribusi: NilaiDistribusi[];
  topPerformers: TopPerformer[];
  semesterId: string | null;
}

export interface AktivitasItem {
  id: string;
  type: 'student' | 'attendance' | 'payment' | 'grade';
  action: string;
  detail: string;
  time: string;
  icon: string;
}

export interface DashboardAktivitas {
  data: AktivitasItem[];
}
