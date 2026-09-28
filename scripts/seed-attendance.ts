import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { AttendanceStatus } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(7, 0, 0, 0); // Set to 7 AM
  d.setDate(d.getDate() - n);
  // Skip weekends
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("📋 Creating attendance records...");

  try {
    // Get active semester
    const semester = await prisma.semester.findFirst({
      where: { isActive: true },
    });

    if (!semester) {
      console.error("❌ No active semester found");
      process.exit(1);
    }

    // Get all active students
    const students = await prisma.student.findMany({
      where: { status: "AKTIF" },
      include: {
        class: true,
      },
    });

    console.log(`👨‍🎓 Found ${students.length} students`);

    // Get first teacher from each school as recorder
    const smpSchool = await prisma.school.findFirst({ where: { level: "SMP" } });
    const smaSchool = await prisma.school.findFirst({ where: { level: "SMA" } });

    const smpRecorder = await prisma.schoolUser.findFirst({
      where: { schoolId: smpSchool!.id, role: "GURU" },
    });

    const smaRecorder = await prisma.schoolUser.findFirst({
      where: { schoolId: smaSchool!.id, role: "GURU" },
    });

    // Delete existing attendance
    await prisma.attendance.deleteMany({});
    console.log("🗑️  Cleared existing attendance");

    const attendanceToCreate = [];

    // Create attendance for last 30 school days (excluding weekends)
    for (let day = 1; day <= 30; day++) {
      const date = daysAgo(day);

      for (const student of students) {
        // Determine status (80% HADIR, 10% SAKIT, 5% IZIN, 5% ALFA)
        const rand = Math.random();
        let status: AttendanceStatus;
        if (rand < 0.80) status = AttendanceStatus.HADIR;
        else if (rand < 0.90) status = AttendanceStatus.SAKIT;
        else if (rand < 0.95) status = AttendanceStatus.IZIN;
        else status = AttendanceStatus.ALFA;

        // Determine recorder based on school
        const isSmP = student.class.grade >= 7 && student.class.grade <= 9;
        const recorder = isSmP ? smpRecorder! : smaRecorder!;

        attendanceToCreate.push({
          studentId: student.id,
          date,
          status,
          semesterId: semester.id,
          recordedById: recorder.id,
        });
      }
    }

    // Bulk create all attendance
    console.log(`💾 Creating ${attendanceToCreate.length} attendance records...`);
    await prisma.attendance.createMany({
      data: attendanceToCreate,
      skipDuplicates: true,
    });

    console.log(`✅ Attendance created! Total: ${attendanceToCreate.length} records`);
    console.log(`   ${students.length} students × 30 days = ${students.length * 30} expected`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
