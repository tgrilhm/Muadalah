import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PaymentStatus, PaymentType } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1); // First day of month
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log("💰 Creating payment records (SPP)...");

  try {
    // Get all active students
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

    console.log(`👨‍🎓 Found ${students.length} students`);

    // Get payment settings for SPP
    const smpSetting = await prisma.paymentSetting.findFirst({
      where: { type: PaymentType.SPP, school: { level: "SMP" } },
    });

    const smaSetting = await prisma.paymentSetting.findFirst({
      where: { type: PaymentType.SPP, school: { level: "SMA" } },
    });

    if (!smpSetting || !smaSetting) {
      console.error("❌ Payment settings not found. Run seed-comprehensive.ts first.");
      process.exit(1);
    }

    // Delete existing payments
    await prisma.payment.deleteMany({});
    console.log("🗑️  Cleared existing payments");

    const paymentsToCreate = [];
    let receiptCounter = 1;

    // Create SPP payments for last 6 months
    for (const student of students) {
      const isSMP = student.class.grade >= 7 && student.class.grade <= 9;
      const amount = isSMP ? smpSetting.amount : smaSetting.amount;

      for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
        const month = monthsAgo(monthOffset);
        
        // Determine payment status (70% LUNAS, 20% BELUM_BAYAR, 10% CICILAN)
        const rand = Math.random();
        let status: PaymentStatus;
        let paidAt: Date | null = null;
        let notes: string | null = null;

        if (rand < 0.70) {
          status = PaymentStatus.LUNAS;
          paidAt = new Date(month.getFullYear(), month.getMonth(), randomBetween(5, 15));
        } else if (rand < 0.90) {
          status = PaymentStatus.BELUM_BAYAR;
          paidAt = null;
        } else {
          status = PaymentStatus.CICILAN;
          paidAt = new Date(month.getFullYear(), month.getMonth(), randomBetween(5, 15));
          notes = "Cicilan 50% - Rp " + (amount * 0.5).toLocaleString('id-ID');
        }

        const year = month.getFullYear();
        const monthNum = String(month.getMonth() + 1).padStart(2, '0');
        const receiptNo = `KWT-${year}-${monthNum}-${String(receiptCounter).padStart(4, '0')}`;
        receiptCounter++;

        paymentsToCreate.push({
          studentId: student.id,
          type: PaymentType.SPP,
          amount,
          status,
          month: month.getMonth() + 1,
          year: month.getFullYear(),
          paidAt,
          receiptNo,
          notes,
        });
      }
    }

    // Bulk create all payments
    console.log(`💾 Creating ${paymentsToCreate.length} payment records...`);
    await prisma.payment.createMany({
      data: paymentsToCreate,
      skipDuplicates: true,
    });

    console.log(`✅ Payments created! Total: ${paymentsToCreate.length} records`);
    console.log(`   ${students.length} students × 6 months = ${students.length * 6} expected`);
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
