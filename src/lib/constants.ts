/** Nama aplikasi */
export const APP_NAME = "Muadalah";

/** Deskripsi aplikasi */
export const APP_DESCRIPTION = "Website Manajemen Siswa Sekolah";

/** Jumlah item per halaman default */
export const DEFAULT_PAGE_SIZE = 20;

/** Tingkat kelas yang didukung */
export const GRADE_LEVELS = {
  SMP: [7, 8, 9],
  SMA: [10, 11, 12],
} as const;

/** Jurusan SMA (untuk kelas 11-12) */
export const SMA_MAJORS = ["IPA", "IPS", "Bahasa"] as const;

/** Label Bahasa Indonesia untuk enum */
export const LABELS = {
  role: {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    KEPALA_SEKOLAH: "Kepala Sekolah",
    GURU: "Guru",
  },
  gender: {
    LAKI_LAKI: "Laki-laki",
    PEREMPUAN: "Perempuan",
  },
  studentStatus: {
    AKTIF: "Aktif",
    LULUS: "Lulus",
    PINDAH: "Pindah",
    KELUAR: "Keluar",
  },
  attendanceStatus: {
    HADIR: "Hadir",
    ALFA: "Alfa",
    SAKIT: "Sakit",
    IZIN: "Izin",
    TERLAMBAT: "Terlambat",
  },
  gradeType: {
    ULANGAN_HARIAN: "Ulangan Harian",
    UTS: "UTS",
    UAS: "UAS",
    TUGAS: "Tugas",
    PRAKTIKUM: "Praktikum",
    PROYEK: "Proyek",
  },
  dayOfWeek: {
    SENIN: "Senin",
    SELASA: "Selasa",
    RABU: "Rabu",
    KAMIS: "Kamis",
    JUMAT: "Jumat",
    SABTU: "Sabtu",
  },
  paymentType: {
    SPP: "SPP",
    PENDAFTARAN: "Pendaftaran",
    SERAGAM: "Seragam",
    BUKU: "Buku",
    KEGIATAN: "Kegiatan",
    LAINNYA: "Lainnya",
  },
  paymentStatus: {
    BELUM_BAYAR: "Belum Bayar",
    LUNAS: "Lunas",
    CICILAN: "Cicilan",
    TERLAMBAT: "Terlambat",
  },
  messageType: {
    UMUM: "Umum",
    AKADEMIK: "Akademik",
    KEHADIRAN: "Kehadiran",
    PEMBAYARAN: "Pembayaran",
    DARURAT: "Darurat",
  },
  schoolLevel: {
    SMP: "SMP",
    SMA: "SMA",
  },
} as const;

/** Sidebar navigation items */
export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Siswa", href: "/dashboard/siswa", icon: "Users" },
  { label: "Absensi", href: "/dashboard/absensi", icon: "ClipboardCheck" },
  { label: "Nilai", href: "/dashboard/nilai", icon: "BarChart3" },
  { label: "Jadwal", href: "/dashboard/jadwal", icon: "Calendar" },
  { label: "Kelas", href: "/dashboard/kelas", icon: "School" },
  { label: "Pembayaran", href: "/dashboard/pembayaran", icon: "Wallet" },
  { label: "Komunikasi", href: "/dashboard/komunikasi", icon: "MessageSquare" },
  { label: "Laporan", href: "/dashboard/laporan", icon: "FileText" },
  { label: "Pengaturan", href: "/dashboard/pengaturan", icon: "Settings" },
] as const;
