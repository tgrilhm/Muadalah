import { beforeAll, afterAll, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Setup test environment
beforeAll(async () => {
  // Ensure test database is connected
  await prisma.$connect();
});

// Cleanup after each test
afterEach(async () => {
  // Clean up test data in reverse order to respect foreign keys
  await prisma.message.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.parentContact.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.schoolUser.deleteMany();
  await prisma.paymentSetting.deleteMany();
  await prisma.school.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();
});

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
