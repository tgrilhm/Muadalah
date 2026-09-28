import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { createTestContext, createTestClass, createTestUser, createTestSchoolUser } from '@/__tests__/helpers';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('POST /api/kelas/[id]/assign-siswa', () => {
  let testContext: Awaited<ReturnType<typeof createTestContext>>;
  let testClass: Awaited<ReturnType<typeof createTestClass>>;

  beforeEach(async () => {
    testContext = await createTestContext('ADMIN');
    testClass = await createTestClass(testContext.school.id, {
      name: 'Kelas 7A',
      grade: 7,
    });
  });

  describe('assign action', () => {
    it('should assign students to class successfully', async () => {
      // Create target class
      const targetClass = await createTestClass(testContext.school.id, {
        name: 'Kelas 7B',
        grade: 7,
      });

      // Create students in original class
      const student1 = await prisma.student.create({
        data: {
          nis: '001',
          name: 'Student 1',
          gender: 'LAKI_LAKI',
          classId: testClass.id,
        },
      });

      const student2 = await prisma.student.create({
        data: {
          nis: '002',
          name: 'Student 2',
          gender: 'PEREMPUAN',
          classId: testClass.id,
        },
      });

      const requestBody = {
        studentIds: [student1.id, student2.id],
        action: 'assign',
      };

      const request = new Request(
        `http://localhost:3000/api/kelas/${targetClass.id}/assign-siswa`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: targetClass.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('berhasil dipindahkan');
      expect(data.data).toHaveLength(2);
      expect(data.data[0].classId).toBe(targetClass.id);
    });

    it('should reject if students already in target class', async () => {
      const student = await prisma.student.create({
        data: {
          nis: '001',
          name: 'Student 1',
          gender: 'LAKI_LAKI',
          classId: testClass.id,
        },
      });

      const requestBody = {
        studentIds: [student.id],
        action: 'assign',
      };

      const request = new Request(
        `http://localhost:3000/api/kelas/${testClass.id}/assign-siswa`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: testClass.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already in this class');
    });

    it('should reject non-existent student IDs', async () => {
      const requestBody = {
        studentIds: ['invalid-id-1', 'invalid-id-2'],
        action: 'assign',
      };

      const request = new Request(
        `http://localhost:3000/api/kelas/${testClass.id}/assign-siswa`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: testClass.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should reject empty student array', async () => {
      const requestBody = {
        studentIds: [],
        action: 'assign',
      };

      const request = new Request(
        `http://localhost:3000/api/kelas/${testClass.id}/assign-siswa`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: testClass.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('unassign action', () => {
    it('should unassign students from class', async () => {
      const student = await prisma.student.create({
        data: {
          nis: '001',
          name: 'Student 1',
          gender: 'LAKI_LAKI',
          classId: testClass.id,
        },
      });

      const requestBody = {
        studentIds: [student.id],
        action: 'unassign',
      };

      const request = new Request(
        `http://localhost:3000/api/kelas/${testClass.id}/assign-siswa`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: testClass.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('berhasil dipindahkan dari');
      expect(data.data[0].classId).not.toBe(testClass.id);
    });

    it('should create "Belum Ditempatkan" class if not exists', async () => {
      const student = await prisma.student.create({
        data: {
          nis: '001',
          name: 'Student 1',
          gender: 'LAKI_LAKI',
          classId: testClass.id,
        },
      });

      const requestBody = {
        studentIds: [student.id],
        action: 'unassign',
      };

      const request = new Request(
        `http://localhost:3000/api/kelas/${testClass.id}/assign-siswa`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      await POST(request, { params: Promise.resolve({ id: testClass.id }) });

      // Verify "Belum Ditempatkan" class was created
      const unassignedClass = await prisma.class.findFirst({
        where: {
          schoolId: testContext.school.id,
          name: 'Belum Ditempatkan',
          grade: testClass.grade,
        },
      });

      expect(unassignedClass).toBeDefined();
    });

    it('should reject if students not in target class', async () => {
      const otherClass = await createTestClass(testContext.school.id, {
        name: 'Kelas 7C',
        grade: 7,
      });

      const student = await prisma.student.create({
        data: {
          nis: '001',
          name: 'Student 1',
          gender: 'LAKI_LAKI',
          classId: otherClass.id,
        },
      });

      const requestBody = {
        studentIds: [student.id],
        action: 'unassign',
      };

      const request = new Request(
        `http://localhost:3000/api/kelas/${testClass.id}/assign-siswa`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: testClass.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('not in this class');
    });
  });
});
