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
  MessageType,
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
  "Dani Setiawan", "Hadi Nugroho", "Wahyu Ramadhan", "Yudha Permana",
  "Zain Abdullah", "Ahmad Wijaya", "Bambang Sutrisno", "Cecep Hermawan",
  "Dimas Prasetyo", "Eko Wijaya", "Fajar Nugraha", "Galih Pratama",
];

const STUDENT_NAMES_PEREMPUAN = [
  "Siti Nurhaliza", "Dewi Lestari", "Fitri Handayani", "Heni Wijayanti",
  "Jasmine Azzahra", "Luna Maharani", "Nadia Putri", "Putri Ayu",
  "Rina Sari", "Tania Putri", "Ayu Kurniawati", "Citra Dewi",
  "Elsa Maharani", "Gita Pratiwi", "Intan Permata", "Jera Kirana",
  "Karina Salsabila", "Lina Marlina", "Mila Septiana", "Nita Wijaya",
  "Olivia Kusuma", "Putri Salsabila", "Qonita Azzahra", "Rina Marlina",
];

const KOTA = ["Jakarta", "Bandung", "Surabaya", "Medan", "Semarang", "Yogyakarta", "Depok", "Bogor"];

const SUBJECTS = [
  { code: "MTK", name: "Matematika" },
  { code: "BIN", name: "Bahasa Indonesia" },
  { code: "BIG", name: "Bahasa Inggris" },
  { code: "IPA", name: "Ilmu Pengetahuan Alam" },
  { code: "IPS", name: "Ilmu Pengetahuan Sosial" },
  { code: "PKN", name: "Pendidikan Kewarganegaraan" },
  { code: "OLH", name: "Pendidikan Jasmani" },
  { code: "SEN", name: "Seni Rupa" },
];

// ─── MAIN SEED ───────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting comprehensive seed with 2 schools (grades 7-12)...\n");

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

  // ── 2. SCHOOLS (SMP & SMA) ──────────────────────────────────────────────────
  console.log("🏫 Creating 2 schools (SMP & SMA)...");
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

  // ── 3. USERS (SUPER ADMIN, ADMINS, TEACHERS) ────────────────────────────────
  console.log("👤 Creating users (admin, teachers)...");
  
  // Super Admin
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

  // SMP Admin
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

  // SMA Admin
  const smaAdmin = await prisma.user.upsert({
    where: { email: "admin.sma@muadalah.sch.id" },
    update: {},
    create: {
      supabaseId: "sma-admin-uuid",
      email: "admin.sma@muadalah.sch.id",
      name: "Admin SMA",
      phone: "081234567892",
      isActive: true,
    },
  });

  // Create 12 teachers for SMP
  const smpTeachers = [];
  for (let i = 1; i <= 12; i++) {
    const teacher = await prisma.user.upsert({
      where: { email: `guru${i}.smp@muadalah.sch.id` },
      update: {},
      create: {
        supabaseId: `smp-teacher-${i}-uuid`,
        email: `guru${i}.smp@muadalah.sch.id`,
        name: `Guru SMP ${i}, S.Pd`,
        phone: `081234567${900 + i}`,
        isActive: true,
      },
    });
    smpTeachers.push(teacher);
  }

  // Create 12 teachers for SMA
  const smaTeachers = [];
  for (let i = 1; i <= 12; i++) {
    const teacher = await prisma.user.upsert({
      where: { email: `guru${i}.sma@muadalah.sch.id` },
      update: {},
      create: {
        supabaseId: `sma-teacher-${i}-uuid`,
        email: `guru${i}.sma@muadalah.sch.id`,
        name: `Guru SMA ${i}, S.Pd`,
        phone: `081298567${900 + i}`,
        isActive: true,
      },
    });
    smaTeachers.push(teacher);
  }

  // ── 4. SCHOOL USERS (Roles) ────────────────────────────────────────────────
  console.log("🔐 Setting up school roles...");

  // Get SchoolUser records for SMP
  const smpSchoolUsers = [];
  
  await prisma.schoolUser.upsert({
    where: { userId_schoolId: { userId: superAdmin.id, schoolId: smpSchool.id } },
    update: {},
    create: { userId: superAdmin.id, schoolId: smpSchool.id, role: UserRole.SUPER_ADMIN },
  });

  await prisma.schoolUser.upsert({
    where: { userId_schoolId: { userId: smpAdmin.id, schoolId: smpSchool.id } },
    update: {},
    create: { userId: smpAdmin.id, schoolId: smpSchool.id, role: UserRole.ADMIN },
  });

  for (const teacher of smpTeachers) {
    const su = await prisma.schoolUser.upsert({
      where: { userId_schoolId: { userId: teacher.id, schoolId: smpSchool.id } },
      update: {},
      create: { userId: teacher.id, schoolId: smpSchool.id, role: UserRole.GURU },
    });
    smpSchoolUsers.push(su);
  }

  // Get SchoolUser records for SMA
  const smaSchoolUsers = [];

  await prisma.schoolUser.upsert({
    where: { userId_schoolId: { userId: superAdmin.id, schoolId: smaSchool.id } },
    update: {},
    create: { userId: superAdmin.id, schoolId: smaSchool.id, role: UserRole.SUPER_ADMIN },
  });

  await prisma.schoolUser.upsert({
    where: { userId_schoolId: { userId: smaAdmin.id, schoolId: smaSchool.id } },
    update: {},
    create: { userId: smaAdmin.id, schoolId: smaSchool.id, role: UserRole.ADMIN },
  });

  for (const teacher of smaTeachers) {
    const su = await prisma.schoolUser.upsert({
      where: { userId_schoolId: { userId: teacher.id, schoolId: smaSchool.id } },
      update: {},
      create: { userId: teacher.id, schoolId: smaSchool.id, role: UserRole.GURU },
    });
    smaSchoolUsers.push(su);
  }

  // ── 5. ACADEMIC YEAR & SEMESTER ────────────────────────────────────────────
  console.log("📚 Creating academic years and semesters...");
  
  let ay = await prisma.academicYear.findFirst({ where: { name: "2025/2026" } });
  if (!ay) {
    ay = await prisma.academicYear.create({
      data: {
        name: "2025/2026",
        startDate: new Date("2025-07-01"),
        endDate: new Date("2026-06-30"),
        isActive: true,
      },
    });
  }

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
  }


  // ── 6. SUBJECTS ──────────────────────────────────────────────────────────────
  console.log("📖 Creating subjects...");
  
  const smpSubjects: Record<string, any> = {};
  for (const s of SUBJECTS) {
    const subj = await prisma.subject.upsert({
      where: { schoolId_code: { schoolId: smpSchool.id, code: s.code } },
      update: {},
      create: { ...s, schoolId: smpSchool.id },
    });
    smpSubjects[s.code] = subj;
  }

  const smaSubjects: Record<string, any> = {};
  for (const s of SUBJECTS) {
    const subj = await prisma.subject.upsert({
      where: { schoolId_code: { schoolId: smaSchool.id, code: s.code } },
      update: {},
      create: { ...s, schoolId: smaSchool.id },
    });
    smaSubjects[s.code] = subj;
  }

  // ── 7. CLASSES & STUDENTS ────────────────────────────────────────────────────
  console.log("🏛️ Creating classes (grades 7-12) and students...");

  const classes: Record<string, any> = {};
  
  // SMP: Grades 7, 8, 9
  for (let grade = 7; grade <= 9; grade++) {
    for (let parallel = 0; parallel < 2; parallel++) {
      const className = `${grade}${String.fromCharCode(65 + parallel)}`; // 7A, 7B, 8A, 8B, etc
      const teacher = smpSchoolUsers[randomBetween(0, smpSchoolUsers.length - 1)];
      
      const cls = await prisma.class.upsert({
        where: { schoolId_name_grade: { schoolId: smpSchool.id, name: className, grade } },
        update: {},
        create: {
          name: className,
          grade,
          schoolId: smpSchool.id,
          homeroomTeacherId: teacher.id,
        },
      });
      classes[`SMP-${className}`] = cls;

      // Add 15 students per class
      for (let i = 0; i < 15; i++) {
        const gender = Math.random() > 0.5 ? Gender.LAKI_LAKI : Gender.PEREMPUAN;
        const names = gender === Gender.LAKI_LAKI ? STUDENT_NAMES_LAKI : STUDENT_NAMES_PEREMPUAN;
        const name = pickRandom(names);
        
        await prisma.student.upsert({
          where: {
            classId_nis: {
              classId: cls.id,
              nis: `SMP-${className}-${String(i + 1).padStart(3, '0')}`,
            },
          },
          update: {},
          create: {
            nis: `SMP-${className}-${String(i + 1).padStart(3, '0')}`,
            name,
            gender,
            birthDate: new Date(2008 + (9 - grade), randomBetween(1, 12), randomBetween(1, 28)),
            birthPlace: pickRandom(KOTA),
            address: `Jl. Merdeka No. ${randomBetween(1, 200)}, Jakarta`,
            religion: "Islam",
            status: StudentStatus.AKTIF,
            classId: cls.id,
          },
        });
      }
    }
  }

  // SMA: Grades 10, 11, 12
  for (let grade = 10; grade <= 12; grade++) {
    for (let parallel = 0; parallel < 2; parallel++) {
      const className = `${grade}${String.fromCharCode(65 + parallel)}`;
      const teacher = smaSchoolUsers[randomBetween(0, smaSchoolUsers.length - 1)];
      
      const cls = await prisma.class.upsert({
        where: { schoolId_name_grade: { schoolId: smaSchool.id, name: className, grade } },
        update: {},
        create: {
          name: className,
          grade,
          schoolId: smaSchool.id,
          homeroomTeacherId: teacher.id,
        },
      });
      classes[`SMA-${className}`] = cls;

      // Add 15 students per class
      for (let i = 0; i < 15; i++) {
        const gender = Math.random() > 0.5 ? Gender.LAKI_LAKI : Gender.PEREMPUAN;
        const names = gender === Gender.LAKI_LAKI ? STUDENT_NAMES_LAKI : STUDENT_NAMES_PEREMPUAN;
        const name = pickRandom(names);
        
        await prisma.student.upsert({
          where: {
            classId_nis: {
              classId: cls.id,
              nis: `SMA-${className}-${String(i + 1).padStart(3, '0')}`,
            },
          },
          update: {},
          create: {
            nis: `SMA-${className}-${String(i + 1).padStart(3, '0')}`,
            name,
            gender,
            birthDate: new Date(2005 + (12 - grade), randomBetween(1, 12), randomBetween(1, 28)),
            birthPlace: pickRandom(KOTA),
            address: `Jl. Merdeka No. ${randomBetween(1, 200)}, Jakarta`,
            religion: "Islam",
            status: StudentStatus.AKTIF,
            classId: cls.id,
          },
        });
      }
    }
  }

  console.log("✅ Classes and students created! Total: 180 students (6 classes × 2 parallels × 15 students)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
