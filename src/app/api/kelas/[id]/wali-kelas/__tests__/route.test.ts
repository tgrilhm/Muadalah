import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PUT } from '../route';
import { createTestContext, createTestClass, createTestUser, createTestSchoolUser } from '@/__tests__/helpers';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('PUT /api/kelas/[id]/wali-kelas', () => {
  let testContext: Awaited<ReturnType<typeof createTestContext>>;
  let testClass: Awaited<ReturnType<typeof createTestClass>>;

  beforeEach(async () => {
    testContext = await createTestContext('ADMIN');
    testClass = await createTestClass(testContext.school.id, {
      name: 'Kelas 7A',
      grade: 7,
    });
  });

  it('should set homeroom teacher successfully', async () => {
    // Create a teacher
    const teacherUser = await createTestUser({ name: 'Teacher 1' });
    const teacher = await createTestSchoolUser(
      teacherUser.id,
      testContext.school.id,
      { role: 'GURU' }
    );

    const requestBody = {
      homeroomTeacherId: teacher.id,
    };

    const request = new Request(
      `http://localhost:3000/api/kelas/${testClass.id}/wali-kelas`,
      {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: testClass.id }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('berhasil ditetapkan');
    expect(data.data.homeroomTeacherId).toBe(teacher.id);
  });

  it('should remove homeroom teacher by setting to null', async () => {
    // First set a teacher
    const teacherUser = await createTestUser({ name: 'Teacher 1' });
    const teacher = await createTestSchoolUser(
      teacherUser.id,
      testContext.school.id,
      { role: 'GURU' }
    );

    await prisma.class.update({
      where: { id: testClass.id },
      data: { homeroomTeacherId: teacher.id },
    });

    // Now remove teacher
    const requestBody = {
      homeroomTeacherId: null,
    };

    const request = new Request(
      `http://localhost:3000/api/kelas/${testClass.id}/wali-kelas`,
      {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: testClass.id }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('dihapus');
    expect(data.data.homeroomTeacherId).toBeNull();
  });

  it('should reject non-teacher user', async () => {
    // Create an admin user (not GURU)
    const adminUser = await createTestUser({ name: 'Admin User' });
    const admin = await createTestSchoolUser(
      adminUser.id,
      testContext.school.id,
      { role: 'ADMIN' }
    );

    const requestBody = {
      homeroomTeacherId: admin.id,
    };

    const request = new Request(
      `http://localhost:3000/api/kelas/${testClass.id}/wali-kelas`,
      {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: testClass.id }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('tidak valid');
  });

  it('should reject if teacher is already wali kelas for another class', async () => {
    // Create teacher
    const teacherUser = await createTestUser({ name: 'Teacher 1' });
    const teacher = await createTestSchoolUser(
      teacherUser.id,
      testContext.school.id,
      { role: 'GURU' }
    );

    // Create another class with this teacher as wali kelas
    const anotherClass = await createTestClass(testContext.school.id, {
      name: 'Kelas 7B',
      grade: 7,
      homeroomTeacherId: teacher.id,
    });

    // Try to assign same teacher to current class
    const requestBody = {
      homeroomTeacherId: teacher.id,
    };

    const request = new Request(
      `http://localhost:3000/api/kelas/${testClass.id}/wali-kelas`,
      {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: testClass.id }),
    });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('sudah menjadi wali kelas');
    expect(data.existingClass).toBeDefined();
  });

  it('should reject non-existent teacher ID', async () => {
    const requestBody = {
      homeroomTeacherId: 'invalid-teacher-id',
    };

    const request = new Request(
      `http://localhost:3000/api/kelas/${testClass.id}/wali-kelas`,
      {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: testClass.id }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('tidak valid');
  });

  it('should return 404 for non-existent class', async () => {
    const requestBody = {
      homeroomTeacherId: null,
    };

    const request = new Request(
      'http://localhost:3000/api/kelas/invalid-id/wali-kelas',
      {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'invalid-id' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Class not found');
  });

  it('should allow KEPALA_SEKOLAH to set wali kelas', async () => {
    const kepalaContext = await createTestContext('KEPALA_SEKOLAH');
    const kepalaClass = await createTestClass(kepalaContext.school.id, {
      name: 'Kelas 7C',
      grade: 7,
    });

    const teacherUser = await createTestUser({ name: 'Teacher 2' });
    const teacher = await createTestSchoolUser(
      teacherUser.id,
      kepalaContext.school.id,
      { role: 'GURU' }
    );

    const requestBody = {
      homeroomTeacherId: teacher.id,
    };

    const request = new Request(
      `http://localhost:3000/api/kelas/${kepalaClass.id}/wali-kelas`,
      {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: kepalaClass.id }),
    });

    expect(response.status).toBe(200);
  });
});
