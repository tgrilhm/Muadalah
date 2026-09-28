import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DayOfWeek } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const SCHEDULE_TIMES = [
  { start: "07:00", end: "08:30" },
  { start: "08:30", end: "10:00" },
  { start: "10:00", end: "11:30" },
  { start: "11:30", end: "13:00" },
  { start: "13:00", end: "14:30" },
];

const ROOMS = ["R-101", "R-102", "R-201", "R-202", "Lab-IPA", "Lab-Komputer", "Aula"];

async function main() {
  console.log("📅 Creating schedules for all classes...");

  try {
    // Get all classes and subjects
    const smpSchool = await prisma.school.findFirst({ where: { level: "SMP" } });
    const smaSchool = await prisma.school.findFirst({ where: { level: "SMA" } });

    if (!smpSchool || !smaSchool) {
      console.error("❌ Schools not found. Run seed-comprehensive.ts first.");
      process.exit(1);
    }

    const smpClasses = await prisma.class.findMany({ where: { schoolId: smpSchool.id } });
    const smaClasses = await prisma.class.findMany({ where: { schoolId: smaSchool.id } });
    
    const smpSubjects = await prisma.subject.findMany({ where: { schoolId: smpSchool.id } });
    const smaSubjects = await prisma.subject.findMany({ where: { schoolId: smaSchool.id } });

    const smpTeachers = await prisma.schoolUser.findMany({
      where: { schoolId: smpSchool.id, role: "GURU" },
    });
    const smaTeachers = await prisma.schoolUser.findMany({
      where: { schoolId: smaSchool.id, role: "GURU" },
    });

    const DAYS = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

    // Delete existing schedules first
    await prisma.schedule.deleteMany({});
    console.log("🗑️  Cleared existing schedules");

    const schedulesToCreate = [];

    // Prepare schedules for SMP classes
    for (const cls of smpClasses) {
      for (let day = 0; day < 6; day++) {
        for (let slot = 0; slot < 4; slot++) {
          const subject = smpSubjects[randomBetween(0, smpSubjects.length - 1)];
          const teacher = smpTeachers[randomBetween(0, smpTeachers.length - 1)];
          const time = SCHEDULE_TIMES[slot];
          const room = pickRandom(ROOMS);

          schedulesToCreate.push({
            classId: cls.id,
            subjectId: subject.id,
            dayOfWeek: DAYS[day] as DayOfWeek,
            startTime: time.start,
            endTime: time.end,
            room,
          });
        }
      }
    }

    // Prepare schedules for SMA classes
    for (const cls of smaClasses) {
      for (let day = 0; day < 6; day++) {
        for (let slot = 0; slot < 4; slot++) {
          const subject = smaSubjects[randomBetween(0, smaSubjects.length - 1)];
          const teacher = smaTeachers[randomBetween(0, smaTeachers.length - 1)];
          const time = SCHEDULE_TIMES[slot];
          const room = pickRandom(ROOMS);

          schedulesToCreate.push({
            classId: cls.id,
            subjectId: subject.id,
            dayOfWeek: DAYS[day] as DayOfWeek,
            startTime: time.start,
            endTime: time.end,
            room,
          });
        }
      }
    }

    // Bulk create all schedules
    await prisma.schedule.createMany({
      data: schedulesToCreate,
    });

    console.log(`✅ Schedules created! Total: ${schedulesToCreate.length} schedules`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
