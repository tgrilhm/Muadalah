import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { GradeType } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("📊 Creating grades for all students...");

  try {
    // Get active semester
    const semester = await prisma.semester.findFirst({
      where: { isActive: true },
    });

    if (!semester) {
      console.error("❌ No active semester found");
      process.exit(1);
    }

    // Get all students with their classes
    const students = await prisma.student.findMany({
      where: { status: "AKTIF" },
      include: {
        class: {
          include: {
            school: true,
          },
        },
      },
    });

    // Get all subjects per school
    const smpSchool = await prisma.school.findFirst({ where: { level: "SMP" } });
    const smaSchool = await prisma.school.findFirst({ where: { level: "SMA" } });

    if (!smpSchool || !smaSchool) {
      console.error("❌ Schools not found");
      process.exit(1);
    }

    const smpSubjects = await prisma.subject.findMany({ where: { schoolId: smpSchool.id } });
    const smaSubjects = await prisma.subject.findMany({ where: { schoolId: smaSchool.id } });

    console.log(`📚 Found ${students.length} students`);

    // Delete existing grades
    await prisma.grade.deleteMany({});
    console.log("🗑️  Cleared existing grades");

    const gradesToCreate = [];

    // Create grades for each student
    for (const student of students) {
      const subjects = student.class.school.level === "SMP" ? smpSubjects : smaSubjects;

      for (const subject of subjects) {
        // Create 3 UH (Ulangan Harian) grades
        for (let i = 1; i <= 3; i++) {
          gradesToCreate.push({
            studentId: student.id,
            subjectId: subject.id,
            semesterId: semester.id,
            type: GradeType.ULANGAN_HARIAN,
            score: randomBetween(70, 100),
            maxScore: 100,
            weight: 1,
            description: `Ulangan Harian ${i}`,
            date: daysAgo(randomBetween(30, 90)),
          });
        }

        // Create 1 UTS grade
        gradesToCreate.push({
          studentId: student.id,
          subjectId: subject.id,
          semesterId: semester.id,
          type: GradeType.UTS,
          score: randomBetween(70, 100),
          maxScore: 100,
          weight: 1,
          description: "Ujian Tengah Semester",
          date: daysAgo(randomBetween(20, 40)),
        });

        // Create 1 UAS grade
        gradesToCreate.push({
          studentId: student.id,
          subjectId: subject.id,
          semesterId: semester.id,
          type: GradeType.UAS,
          score: randomBetween(70, 100),
          maxScore: 100,
          weight: 1,
          description: "Ujian Akhir Semester",
          date: daysAgo(randomBetween(1, 15)),
        });
      }
    }

    // Bulk create all grades
    console.log(`💾 Creating ${gradesToCreate.length} grades...`);
    await prisma.grade.createMany({
      data: gradesToCreate,
    });

    console.log(`✅ Grades created! Total: ${gradesToCreate.length} grades`);
    console.log(`   180 students × 8 subjects × 5 grades = ${180 * 8 * 5} expected`);
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
