import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  SchoolLevel,
  UserRole,
  Gender,
  StudentStatus,
  AttendanceStatus,
  GradeType,
  PaymentType,
  PaymentStatus,
  DayOfWeek,
} from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const STUDENT_NAMES_LAKI = [
  "Ahmad Fauzi", "Budi Hartono", "Eko Prasetyo", "Gunawan Santoso",
  "Indra Kusuma", "Kemal Aditya", "Muhammad Rizki", "Omar Syahputra",
  "Qori Ramadhan", "Surya Wijaya", "Farhan Hakim", "Reza Pratama",
  "Dani Setiawan", "Hadi Nugroho", "Wahyu Ramadhan",
];

const STUDENT_NAMES_PEREMPUAN = [
  "Siti Nurhaliza", "Dewi Lestari", "Fitri Handayani", "Heni Wijayanti",
  "Jasmine Azzahra", "Luna Maharani", "Nadia Putri", "Putri Ayu",
  "Rina Sari", "Tania Putri", "Ayu Kurniawati", "Citra Dewi",
  "Elsa Maharani", "Gita Pratiwi", "Intan Permata",
];

const KOTA = ["Jakarta", "Bandung", "Surabaya", "Medan", "Semarang", "Yogyakarta", "Depok", "Bogor"];

// ─── MAIN SEED ───────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting comprehensive seed...\n");

  // ── 1. INSTITUTION ──────────────────────────────────────────────────────────
  console.log("📋 Creating institution...");
  const institution = await prisma.institution.upsert({
    where: { id: "institution-muadalah" },
    update: { name: "Yayasan Pendidikan Muadalah" },
    create: {
      id: "institution-muadalah",
      name: "Yayasan Pendidikan Muadalah",
      address: "Jl. Pendidikan No. 123, Jakarta Selatan",
      phone: "021-12345678",
      email: "info@muadalah.sch.id",
    },
  });

  // ── 2. SCHOOLS ──────────────────────────────────────────────────────────────
  console.log("🏫 Creating schools...");
  const smpSchool = await prisma.school.upsert({
    where: { npsn: "20100001" },
    update: {},
    create: {
      name: "SMP Muadalah",
      level: SchoolLevel.SMP,
      address: "Jl. Pendidikan No. 123, Jakarta Selatan",
      phone: "021-12345678",
      npsn: "20100001",
      institutionId: institution.id,
    },
  });

  const smaSchool = await prisma.school.upsert({
    where: { npsn: "20100002" },
    update: {},
    create: {
      name: "SMA Muadalah",
      level: SchoolLevel.SMA,
      address: "Jl. Pendidikan No. 124, Jakarta Selatan",
      phone: "021-12345679",
      npsn: "20100002",
      institutionId: institution.id,
    },
  });

  // ── 3. USERS ────────────────────────────────────────────────────────────────
  console.log("👤 Creating users...");
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@muadalah.sch.id" },
    update: {},
    create: {
      supabaseId: "super-admin-uuid",
      email: "admin@muadalah.sch.id",
      name: "Super Admin",
      phone: "081234567890",
      isActive: true,
    },
  });

  const smpAdmin = await prisma.user.upsert({
    where: { email: "admin.smp@muadalah.sch.id" },
    update: {},
    create: {
      supabaseId: "smp-admin-uuid",
      email: "admin.smp@muadalah.sch.id",
      name: "Admin SMP",
      phone: "081234567891",
      isActive: true,
    },
  });

  const teacher1 = await prisma.user.upsert({
    where: { email: "budi.santoso@muadalah.sch.id" },
    update: {},
    create: {
      supabaseId: "teacher-1-uuid",
      email: "budi.santoso@muadalah.sch.id",
      name: "Budi Santoso, S.Pd",
      phone: "081234567893",
      isActive: true,
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: "ani.wijaya@muadalah.sch.id" },
    update: {},
    create: {
      supabaseId: "teacher-2-uuid",
      email: "ani.wijaya@muadalah.sch.id",
      name: "Ani Wijaya, S.Pd",
      phone: "081234567894",
      isActive: true,
    },
  });

  const teacher3 = await prisma.user.upsert({
    where: { email: "eko.prasetyo@muadalah.sch.id" },
    update: {},
    create: {
      supabaseId: "teacher-3-uuid",
      email: "eko.prasetyo@muadalah.sch.id",
      name: "Eko Prasetyo, M.Pd",
      phone: "081234567895",
      isActive: true,
    },
  });

  // ── 4. SCHOOL USERS (ROLES) ─────────────────────────────────────────────────
  console.log("🔐 Assigning roles...");
  for (const data of [
    { userId: superAdmin.id, schoolId: smpSchool.id, role: UserRole.SUPER_ADMIN },
    { userId: superAdmin.id, schoolId: smaSchool.id, role: UserRole.SUPER_ADMIN },
    { userId: smpAdmin.id, schoolId: smpSchool.id, role: UserRole.ADMIN },
    { userId: teacher1.id, schoolId: smpSchool.id, role: UserRole.GURU },
    { userId: teacher2.id, schoolId: smpSchool.id, role: UserRole.GURU },
    { userId: teacher3.id, schoolId: smpSchool.id, role: UserRole.GURU },
  ]) {
    await prisma.schoolUser.upsert({
      where: { userId_schoolId: { userId: data.userId, schoolId: data.schoolId } },
      update: {},
      create: data,
    });
  }

  const t1SU = await prisma.schoolUser.findFirst({ where: { userId: teacher1.id, schoolId: smpSchool.id } });
  const t2SU = await prisma.schoolUser.findFirst({ where: { userId: teacher2.id, schoolId: smpSchool.id } });
  const t3SU = await prisma.schoolUser.findFirst({ where: { userId: teacher3.id, schoolId: smpSchool.id } });
  const adminSU = await prisma.schoolUser.findFirst({ where: { userId: smpAdmin.id, schoolId: smpSchool.id } });

  if (!t1SU || !t2SU || !t3SU || !adminSU) throw new Error("SchoolUser not found");

  // ── 5. ACADEMIC YEAR & SEMESTERS ────────────────────────────────────────────
  console.log("📅 Creating academic years & semesters...");
  const ay = await prisma.academicYear.upsert({
    where: { schoolId_name: { schoolId: smpSchool.id, name: "2025/2026" } },
    update: { isActive: true },
    create: {
      name: "2025/2026",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2026-06-30"),
      isActive: true,
      schoolId: smpSchool.id,
    },
  });

  // Cari atau buat semester
  let sem1 = await prisma.semester.findFirst({ where: { academicYearId: ay.id, number: 1 } });
  if (!sem1) {
    sem1 = await prisma.semester.create({
      data: {
        name: "Semester Ganjil 2025/2026",
        number: 1,
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-12-31"),
        isActive: true,
        academicYearId: ay.id,
      },
    });
  } else {
    sem1 = await prisma.semester.update({ where: { id: sem1.id }, data: { isActive: true } });
  }

  let sem2 = await prisma.semester.findFirst({ where: { academicYearId: ay.id, number: 2 } });
  if (!sem2) {
    sem2 = await prisma.semester.create({
      data: {
        name: "Semester Genap 2025/2026",
        number: 2,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-06-30"),
        isActive: false,
        academicYearId: ay.id,
      },
    });
  }

  // ── 6. SUBJECTS ─────────────────────────────────────────────────────────────
  console.log("📚 Creating subjects...");
  const subjectData = [
    { code: "MTK", name: "Matematika" },
    { code: "BIN", name: "Bahasa Indonesia" },
    { code: "BIG", name: "Bahasa Inggris" },
    { code: "IPA", name: "Ilmu Pengetahuan Alam" },
    { code: "IPS", name: "Ilmu Pengetahuan Sosial" },
    { code: "PKN", name: "Pendidikan Kewarganegaraan" },
  ];

  const subjects: Record<string, { id: string; name: string }> = {};
  for (const s of subjectData) {
    const subj = await prisma.subject.upsert({
      where: { schoolId_code: { schoolId: smpSchool.id, code: s.code } },
      update: {},
      create: { ...s, schoolId: smpSchool.id },
    });
    subjects[s.code] = subj;
  }

  // ── 7. CLASSES ──────────────────────────────────────────────────────────────
  console.log("🏛️ Creating classes...");
  const class7A = await prisma.class.upsert({
    where: { schoolId_name_grade: { schoolId: smpSchool.id, name: "7A", grade: 7 } },
    update: { homeroomTeacherId: t1SU.id },
    create: { name: "7A", grade: 7, schoolId: smpSchool.id, homeroomTeacherId: t1SU.id },
  });

  const class7B = await prisma.class.upsert({
    where: { schoolId_name_grade: { schoolId: smpSchool.id, name: "7B", grade: 7 } },
    update: { homeroomTeacherId: t2SU.id },
    create: { name: "7B", grade: 7, schoolId: smpSchool.id, homeroomTeacherId: t2SU.id },
  });

  const class8A = await prisma.class.upsert({
    where: { schoolId_name_grade: { schoolId: smpSchool.id, name: "8A", grade: 8 } },
    update: { homeroomTeacherId: t3SU.id },
    create: { name: "8A", grade: 8, schoolId: smpSchool.id, homeroomTeacherId: t3SU.id },
  });

  // ── 8. CLASS SUBJECTS ───────────────────────────────────────────────────────
  console.log("📖 Assigning subjects to classes...");
  const classSubjectMappings = [
    { classId: class7A.id, subjectId: subjects["MTK"].id, teacherId: t1SU.id },
    { classId: class7A.id, subjectId: subjects["BIN"].id, teacherId: t2SU.id },
    { classId: class7A.id, subjectId: subjects["BIG"].id, teacherId: t3SU.id },
    { classId: class7A.id, subjectId: subjects["IPA"].id, teacherId: t1SU.id },
    { classId: class7A.id, subjectId: subjects["IPS"].id, teacherId: t2SU.id },
    { classId: class7B.id, subjectId: subjects["MTK"].id, teacherId: t1SU.id },
    { classId: class7B.id, subjectId: subjects["BIN"].id, teacherId: t2SU.id },
    { classId: class7B.id, subjectId: subjects["BIG"].id, teacherId: t3SU.id },
    { classId: class8A.id, subjectId: subjects["MTK"].id, teacherId: t1SU.id },
    { classId: class8A.id, subjectId: subjects["BIN"].id, teacherId: t2SU.id },
    { classId: class8A.id, subjectId: subjects["IPA"].id, teacherId: t3SU.id },
    { classId: class8A.id, subjectId: subjects["PKN"].id, teacherId: t2SU.id },
  ];

  for (const m of classSubjectMappings) {
    await prisma.classSubject.upsert({
      where: { classId_subjectId: { classId: m.classId, subjectId: m.subjectId } },
      update: {},
      create: m,
    });
  }

  // ── 9. SCHEDULES ────────────────────────────────────────────────────────────
  console.log("🗓️ Creating schedules...");
  await prisma.schedule.deleteMany({ where: { class: { schoolId: smpSchool.id } } });

  const scheduleData = [
    // Kelas 7A
    { classId: class7A.id, subjectId: subjects["MTK"].id, dayOfWeek: DayOfWeek.SENIN, startTime: "07:00", endTime: "08:30", room: "R-101" },
    { classId: class7A.id, subjectId: subjects["BIN"].id, dayOfWeek: DayOfWeek.SENIN, startTime: "08:30", endTime: "10:00", room: "R-101" },
    { classId: class7A.id, subjectId: subjects["BIG"].id, dayOfWeek: DayOfWeek.SELASA, startTime: "07:00", endTime: "08:30", room: "R-101" },
    { classId: class7A.id, subjectId: subjects["IPA"].id, dayOfWeek: DayOfWeek.SELASA, startTime: "08:30", endTime: "10:00", room: "Lab-IPA" },
    { classId: class7A.id, subjectId: subjects["IPS"].id, dayOfWeek: DayOfWeek.RABU, startTime: "07:00", endTime: "08:30", room: "R-101" },
    { classId: class7A.id, subjectId: subjects["MTK"].id, dayOfWeek: DayOfWeek.KAMIS, startTime: "07:00", endTime: "08:30", room: "R-101" },
    { classId: class7A.id, subjectId: subjects["BIN"].id, dayOfWeek: DayOfWeek.JUMAT, startTime: "07:00", endTime: "08:30", room: "R-101" },
    // Kelas 7B
    { classId: class7B.id, subjectId: subjects["MTK"].id, dayOfWeek: DayOfWeek.SENIN, startTime: "10:00", endTime: "11:30", room: "R-102" },
    { classId: class7B.id, subjectId: subjects["BIN"].id, dayOfWeek: DayOfWeek.SELASA, startTime: "10:00", endTime: "11:30", room: "R-102" },
    { classId: class7B.id, subjectId: subjects["BIG"].id, dayOfWeek: DayOfWeek.RABU, startTime: "10:00", endTime: "11:30", room: "R-102" },
    // Kelas 8A
    { classId: class8A.id, subjectId: subjects["MTK"].id, dayOfWeek: DayOfWeek.SENIN, startTime: "07:00", endTime: "08:30", room: "R-201" },
    { classId: class8A.id, subjectId: subjects["IPA"].id, dayOfWeek: DayOfWeek.SELASA, startTime: "07:00", endTime: "08:30", room: "Lab-IPA" },
    { classId: class8A.id, subjectId: subjects["BIN"].id, dayOfWeek: DayOfWeek.RABU, startTime: "07:00", endTime: "08:30", room: "R-201" },
    { classId: class8A.id, subjectId: subjects["PKN"].id, dayOfWeek: DayOfWeek.KAMIS, startTime: "07:00", endTime: "08:30", room: "R-201" },
    { classId: class8A.id, subjectId: subjects["MTK"].id, dayOfWeek: DayOfWeek.JUMAT, startTime: "07:00", endTime: "08:30", room: "R-201" },
  ];

  await prisma.schedule.createMany({ data: scheduleData, skipDuplicates: true });

  // ── 10. PAYMENT SETTINGS ─────────────────────────────────────────────────────
  console.log("💰 Creating payment settings...");
  await prisma.paymentSetting.createMany({
    skipDuplicates: true,
    data: [
      { schoolId: smpSchool.id, type: PaymentType.SPP, amount: 500000 },
      { schoolId: smpSchool.id, type: PaymentType.PENDAFTARAN, amount: 2000000 },
      { schoolId: smaSchool.id, type: PaymentType.SPP, amount: 600000 },
      { schoolId: smaSchool.id, type: PaymentType.PENDAFTARAN, amount: 2500000 },
    ],
  });

  // ── 11. STUDENTS ─────────────────────────────────────────────────────────────
  console.log("🧑‍🎓 Creating students (30 total)...");

  // Buat 12 siswa di 7A, 8 siswa di 7B, 10 siswa di 8A
  const studentDefs: Array<{
    nis: string; name: string; gender: Gender; classId: string;
    birthYear: number; kota: string; status?: StudentStatus;
  }> = [
    // Kelas 7A (12 siswa)
    { nis: "2025001", name: "Ahmad Fauzi", gender: Gender.LAKI_LAKI, classId: class7A.id, birthYear: 2012, kota: "Jakarta" },
    { nis: "2025002", name: "Siti Nurhaliza", gender: Gender.PEREMPUAN, classId: class7A.id, birthYear: 2012, kota: "Jakarta" },
    { nis: "2025003", name: "Dewi Lestari", gender: Gender.PEREMPUAN, classId: class7A.id, birthYear: 2012, kota: "Bandung" },
    { nis: "2025004", name: "Eko Prasetyo", gender: Gender.LAKI_LAKI, classId: class7A.id, birthYear: 2012, kota: "Surabaya" },
    { nis: "2025005", name: "Fitri Handayani", gender: Gender.PEREMPUAN, classId: class7A.id, birthYear: 2012, kota: "Yogyakarta" },
    { nis: "2025006", name: "Jasmine Azzahra", gender: Gender.PEREMPUAN, classId: class7A.id, birthYear: 2012, kota: "Jakarta" },
    { nis: "2025007", name: "Kemal Aditya", gender: Gender.LAKI_LAKI, classId: class7A.id, birthYear: 2012, kota: "Bekasi" },
    { nis: "2025008", name: "Luna Maharani", gender: Gender.PEREMPUAN, classId: class7A.id, birthYear: 2012, kota: "Tangerang" },
    { nis: "2025009", name: "Nadia Putri", gender: Gender.PEREMPUAN, classId: class7A.id, birthYear: 2012, kota: "Bogor" },
    { nis: "2025010", name: "Putri Ayu", gender: Gender.PEREMPUAN, classId: class7A.id, birthYear: 2012, kota: "Solo" },
    { nis: "2025011", name: "Rina Sari", gender: Gender.PEREMPUAN, classId: class7A.id, birthYear: 2012, kota: "Malang" },
    { nis: "2025012", name: "Farhan Hakim", gender: Gender.LAKI_LAKI, classId: class7A.id, birthYear: 2012, kota: "Jakarta" },
    // Kelas 7B (8 siswa)
    { nis: "2025013", name: "Ayu Kurniawati", gender: Gender.PEREMPUAN, classId: class7B.id, birthYear: 2012, kota: "Bandung" },
    { nis: "2025014", name: "Citra Dewi", gender: Gender.PEREMPUAN, classId: class7B.id, birthYear: 2012, kota: "Jakarta" },
    { nis: "2025015", name: "Dani Setiawan", gender: Gender.LAKI_LAKI, classId: class7B.id, birthYear: 2012, kota: "Semarang" },
    { nis: "2025016", name: "Elsa Maharani", gender: Gender.PEREMPUAN, classId: class7B.id, birthYear: 2012, kota: "Depok" },
    { nis: "2025017", name: "Gita Pratiwi", gender: Gender.PEREMPUAN, classId: class7B.id, birthYear: 2012, kota: "Bogor" },
    { nis: "2025018", name: "Hadi Nugroho", gender: Gender.LAKI_LAKI, classId: class7B.id, birthYear: 2012, kota: "Medan" },
    { nis: "2025019", name: "Intan Permata", gender: Gender.PEREMPUAN, classId: class7B.id, birthYear: 2012, kota: "Jakarta" },
    { nis: "2025020", name: "Reza Pratama", gender: Gender.LAKI_LAKI, classId: class7B.id, birthYear: 2012, kota: "Surabaya" },
    // Kelas 8A (10 siswa)
    { nis: "2024001", name: "Budi Hartono", gender: Gender.LAKI_LAKI, classId: class8A.id, birthYear: 2011, kota: "Bogor" },
    { nis: "2024002", name: "Gunawan Santoso", gender: Gender.LAKI_LAKI, classId: class8A.id, birthYear: 2011, kota: "Semarang" },
    { nis: "2024003", name: "Heni Wijayanti", gender: Gender.PEREMPUAN, classId: class8A.id, birthYear: 2011, kota: "Jakarta" },
    { nis: "2024004", name: "Indra Kusuma", gender: Gender.LAKI_LAKI, classId: class8A.id, birthYear: 2011, kota: "Medan" },
    { nis: "2024005", name: "Muhammad Rizki", gender: Gender.LAKI_LAKI, classId: class8A.id, birthYear: 2011, kota: "Depok" },
    { nis: "2024006", name: "Omar Syahputra", gender: Gender.LAKI_LAKI, classId: class8A.id, birthYear: 2011, kota: "Palembang" },
    { nis: "2024007", name: "Qori Ramadhan", gender: Gender.LAKI_LAKI, classId: class8A.id, birthYear: 2011, kota: "Makassar" },
    { nis: "2024008", name: "Wahyu Ramadhan", gender: Gender.LAKI_LAKI, classId: class8A.id, birthYear: 2011, kota: "Jakarta" },
    { nis: "2024009", name: "Sari Puspita", gender: Gender.PEREMPUAN, classId: class8A.id, birthYear: 2011, kota: "Bandung" },
    { nis: "2024010", name: "Tika Rahayu", gender: Gender.PEREMPUAN, classId: class8A.id, birthYear: 2011, kota: "Yogyakarta" },
  ];

  const students: Record<string, string> = {}; // nis -> id
  for (const s of studentDefs) {
    const student = await prisma.student.upsert({
      where: { classId_nis: { classId: s.classId, nis: s.nis } },
      update: {},
      create: {
        nis: s.nis,
        nisn: `001${s.nis.slice(-7)}`,
        name: s.name,
        gender: s.gender,
        birthPlace: s.kota,
        birthDate: new Date(`${s.birthYear}-${String(randomBetween(1, 12)).padStart(2, "0")}-${String(randomBetween(1, 28)).padStart(2, "0")}`),
        religion: "Islam",
        address: `Jl. ${pickRandom(["Merdeka", "Sudirman", "Gatot Subroto", "Ahmad Yani"])} No. ${randomBetween(1, 100)}, ${s.kota}`,
        phone: `0812345${randomBetween(10000, 99999)}`,
        status: s.status ?? StudentStatus.AKTIF,
        classId: s.classId,
      },
    });
    students[s.nis] = student.id;
  }

  // ── 12. PARENT CONTACTS ──────────────────────────────────────────────────────
  console.log("👨‍👩‍👧 Creating parent contacts...");
  for (const s of studentDefs) {
    const parentName = s.gender === Gender.LAKI_LAKI
      ? `Bapak ${s.name.split(" ").pop()}`
      : `Ibu ${s.name.split(" ").pop()}`;
    await prisma.parentContact.upsert({
      where: { id: `parent-${s.nis}` },
      update: {},
      create: {
        id: `parent-${s.nis}`,
        name: parentName,
        relation: "Orang Tua",
        phone: `0812${randomBetween(10000000, 99999999)}`,
        email: `parent.${s.nis.toLowerCase()}@gmail.com`,
        studentId: students[s.nis],
      },
    });
  }

  // ── 13. ATTENDANCE ───────────────────────────────────────────────────────────
  console.log("📋 Creating attendance records (last 30 days)...");

  // Hapus absensi lama untuk menghindari konflik
  await prisma.attendance.deleteMany({
    where: { student: { class: { schoolId: smpSchool.id } } },
  });

  // Buat absensi 30 hari terakhir (weekdays only) untuk semua siswa
  const allStudentIds = Object.values(students);
  const attendanceRecords: Array<{
    studentId: string;
    date: Date;
    status: AttendanceStatus;
    semesterId: string;
    recordedById: string;
    notes?: string;
  }> = [];

  // Siswa bermasalah (kehadiran rendah): nis 2025004, 2025018
  const problematicStudents = new Set([students["2025004"], students["2025018"]]);

  for (let d = 30; d >= 0; d--) {
    const date = daysAgo(d);
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekend

    for (const studentId of allStudentIds) {
      const isProblematic = problematicStudents.has(studentId);
      const rand = Math.random();

      let status: AttendanceStatus;
      if (isProblematic) {
        // Siswa bermasalah: 50% hadir, 30% alfa, 20% lainnya
        if (rand < 0.50) status = AttendanceStatus.HADIR;
        else if (rand < 0.80) status = AttendanceStatus.ALFA;
        else if (rand < 0.90) status = AttendanceStatus.SAKIT;
        else status = AttendanceStatus.IZIN;
      } else {
        // Normal: 85% hadir
        if (rand < 0.85) status = AttendanceStatus.HADIR;
        else if (rand < 0.90) status = AttendanceStatus.TERLAMBAT;
        else if (rand < 0.95) status = AttendanceStatus.SAKIT;
        else if (rand < 0.98) status = AttendanceStatus.IZIN;
        else status = AttendanceStatus.ALFA;
      }

      attendanceRecords.push({
        studentId,
        date,
        status,
        semesterId: sem1.id,
        recordedById: t1SU.id,
        notes: status === AttendanceStatus.SAKIT ? "Sakit flu" : undefined,
      });
    }
  }

  // Insert in batches
  const BATCH = 200;
  for (let i = 0; i < attendanceRecords.length; i += BATCH) {
    await prisma.attendance.createMany({
      data: attendanceRecords.slice(i, i + BATCH),
      skipDuplicates: true,
    });
  }
  console.log(`   → ${attendanceRecords.length} attendance records inserted`);

  // ── 14. GRADES ───────────────────────────────────────────────────────────────
  console.log("📊 Creating grade records...");
  await prisma.grade.deleteMany({
    where: { student: { class: { schoolId: smpSchool.id } } },
  });

  const gradeTypes = [GradeType.ULANGAN_HARIAN, GradeType.TUGAS, GradeType.UTS, GradeType.UAS];
  const subjectList7A = [subjects["MTK"].id, subjects["BIN"].id, subjects["BIG"].id, subjects["IPA"].id, subjects["IPS"].id];
  const subjectList8A = [subjects["MTK"].id, subjects["BIN"].id, subjects["IPA"].id, subjects["PKN"].id];

  const gradeRecords: Array<{
    type: GradeType;
    score: number;
    maxScore: number;
    weight: number;
    studentId: string;
    subjectId: string;
    semesterId: string;
    date: Date;
  }> = [];

  // Top performers: siswa 2025002 dan 2025006 selalu nilai tinggi
  const topPerformers = new Set([students["2025002"], students["2025006"]]);

  for (const [nis, studentId] of Object.entries(students)) {
    const isClass8A = nis.startsWith("2024");
    const isClass7B = nis.startsWith("2025") && parseInt(nis.slice(-3)) >= 13 && parseInt(nis.slice(-3)) <= 20;
    const subjectIds = isClass8A ? subjectList8A : subjectList7A;
    const isTopPerformer = topPerformers.has(studentId);

    for (const subjectId of subjectIds) {
      for (const type of gradeTypes) {
        let baseScore: number;
        if (isTopPerformer) baseScore = randomBetween(88, 98);
        else if (problematicStudents.has(studentId)) baseScore = randomBetween(55, 72);
        else baseScore = randomBetween(72, 92);

        gradeRecords.push({
          type,
          score: baseScore,
          maxScore: 100,
          weight: type === GradeType.UAS ? 3 : type === GradeType.UTS ? 2 : 1,
          studentId,
          subjectId,
          semesterId: sem1.id,
          date: daysAgo(randomBetween(1, 25)),
        });
      }
    }
  }

  for (let i = 0; i < gradeRecords.length; i += BATCH) {
    await prisma.grade.createMany({
      data: gradeRecords.slice(i, i + BATCH),
      skipDuplicates: true,
    });
  }
  console.log(`   → ${gradeRecords.length} grade records inserted`);

  // ── 15. PAYMENTS ─────────────────────────────────────────────────────────────
  console.log("💳 Creating payments...");
  await prisma.payment.deleteMany({
    where: { student: { class: { schoolId: smpSchool.id } } },
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const paymentRecords: Array<{
    amount: number;
    month: number;
    year: number;
    type: PaymentType;
    status: PaymentStatus;
    paidAt?: Date;
    receiptNo?: string;
    studentId: string;
  }> = [];

  let receiptCounter = 1000;
  for (const [nis, studentId] of Object.entries(students)) {
    // SPP untuk 3 bulan terakhir
    for (let mOffset = 2; mOffset >= 0; mOffset--) {
      let m = currentMonth - mOffset;
      let y = currentYear;
      if (m <= 0) { m += 12; y -= 1; }

      const isProblematic = problematicStudents.has(studentId);
      // Siswa bermasalah: belum bayar bulan ini
      const isPaid = isProblematic && mOffset === 0 ? false : Math.random() > 0.15;
      receiptCounter++;

      paymentRecords.push({
        amount: 500000,
        month: m,
        year: y,
        type: PaymentType.SPP,
        status: isPaid ? PaymentStatus.LUNAS : PaymentStatus.BELUM_BAYAR,
        paidAt: isPaid ? daysAgo(mOffset * 30 + randomBetween(1, 5)) : undefined,
        receiptNo: isPaid ? `KWT-${y}-${String(m).padStart(2, "0")}-${receiptCounter}` : undefined,
        studentId,
      });
    }
  }

  for (let i = 0; i < paymentRecords.length; i += BATCH) {
    await prisma.payment.createMany({
      data: paymentRecords.slice(i, i + BATCH),
      skipDuplicates: true,
    });
  }
  console.log(`   → ${paymentRecords.length} payment records inserted`);

  // ── 16. SUMMARY ─────────────────────────────────────────────────────────────
  console.log("\n✅ Seed completed successfully!\n");
  console.log("📊 Summary:");
  console.log(`  🏫 1 Institution, 2 Schools`);
  console.log(`  👤 5 Users (1 Super Admin, 1 Admin, 3 Teachers)`);
  console.log(`  📅 1 Academic Year, 2 Semesters (Ganjil aktif)`);
  console.log(`  📚 6 Subjects (MTK, BIN, BIG, IPA, IPS, PKN)`);
  console.log(`  🏛️ 3 Classes (7A: 12 siswa, 7B: 8 siswa, 8A: 10 siswa)`);
  console.log(`  🧑‍🎓 ${studentDefs.length} Students total`);
  console.log(`  👨‍👩‍👧 ${studentDefs.length} Parent Contacts`);
  console.log(`  📋 ${attendanceRecords.length} Attendance records (30 hari)`);
  console.log(`  📊 ${gradeRecords.length} Grade records`);
  console.log(`  💳 ${paymentRecords.length} Payment records`);
  console.log(`  🗓️ ${scheduleData.length} Schedule slots`);
  console.log("\n🎯 Data highlights:");
  console.log("  • Siswa Siti Nurhaliza & Jasmine: top performers (nilai 88-98)");
  console.log("  • Siswa Eko Prasetyo & Hadi Nugroho: kehadiran < 75% (siswa bermasalah)");
  console.log("  • 85% rata-rata kehadiran keseluruhan");
  console.log("  • 15% siswa belum bayar SPP bulan ini\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
