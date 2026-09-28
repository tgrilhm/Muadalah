import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

const PARENT_RELATIONS = ["Ayah", "Ibu", "Wali"];

async function main() {
  console.log("💬 Creating communication data (parent contacts + messages)...");

  try {
    // Get all students
    const students = await prisma.student.findMany({
      where: { status: "AKTIF" },
      take: 210,
    });

    console.log(`👨‍🎓 Found ${students.length} students`);

    // Get teachers for message senders
    const teachers = await prisma.schoolUser.findMany({
      where: { role: "GURU" },
      include: { user: true },
    });

    // Delete existing data
    await prisma.message.deleteMany({});
    await prisma.parentContact.deleteMany({});
    console.log("🗑️  Cleared existing communication data");

    const contactsToCreate = [];
    const messagesToCreate = [];

    // Create parent contacts (1-2 per student)
    for (const student of students) {
      const numContacts = Math.random() > 0.3 ? 2 : 1;
      
      for (let i = 0; i < numContacts; i++) {
        const relation = PARENT_RELATIONS[i % 3];
        contactsToCreate.push({
          name: `${relation} ${student.name}`,
          relation,
          phone: `08${Math.floor(Math.random() * 900000000 + 100000000)}`,
          email: `parent${student.id.slice(-8)}@example.com`,
          studentId: student.id,
        });
      }
    }

    // Bulk create contacts
    console.log(`💾 Creating ${contactsToCreate.length} parent contacts...`);
    const createdContacts = await prisma.parentContact.createManyAndReturn({
      data: contactsToCreate,
    });

    console.log(`✅ Parent contacts created: ${createdContacts.length}`);

    // Create messages (2-5 per contact)
    for (const contact of createdContacts) {
      const numMessages = Math.floor(Math.random() * 4) + 2;
      const teacher = pickRandom(teachers);

      for (let i = 0; i < numMessages; i++) {
        messagesToCreate.push({
          senderId: teacher.userId,
          recipientId: contact.id,
          subject: pickRandom([
            "Pemberitahuan Kehadiran",
            "Nilai Ujian",
            "Reminder Pembayaran SPP",
            "Prestasi Siswa",
            "Pemanggilan Orang Tua",
          ]),
          content: pickRandom([
            "Siswa Anda telah absen hari ini tanpa keterangan.",
            "Nilai ujian semester siswa Anda sangat baik.",
            "Pembayaran SPP bulan ini belum diterima.",
            "Siswa Anda mendapat prestasi di lomba matematika.",
            "Mohon datang ke sekolah untuk membahas perkembangan siswa.",
          ]),
          type: pickRandom(["UMUM", "AKADEMIK", "KEHADIRAN", "PEMBAYARAN"]),
          isRead: Math.random() > 0.3,
        });
      }
    }

    // Bulk create messages
    console.log(`💾 Creating ${messagesToCreate.length} messages...`);
    await prisma.message.createMany({
      data: messagesToCreate,
      skipDuplicates: true,
    });

    console.log(`✅ Messages created: ${messagesToCreate.length}`);
    console.log("\n🎉 ALL COMPREHENSIVE DATA COMPLETE!");
    console.log("\n📊 Final Summary:");
    console.log(`   - Parent Contacts: ${createdContacts.length}`);
    console.log(`   - Messages: ${messagesToCreate.length}`);
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
