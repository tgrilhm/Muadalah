import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, PATCH, DELETE } from '../route';
import { createTestContext, createTestClass, createTestSchoolUser } from '@/__tests__/helpers';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('GET /api/kelas/[id]', () => {
  let testContext: Awaited<ReturnType<typeof createTestContext>>;

  beforeEach(async () => {
    testContext = await createTestContext('ADMIN');
  });

  it('should return class detail with relations', async () => {
    const testClass = await createTestClass(testContext.school.id, {
      name: 'Kelas 7A',
      grade: 7,
    });

    const request = new Request(`http://localhost:3000/api/kelas/${testClass.id}`);
    const response = await GET(request, { params: Promise.resolve({ id: testClass.id }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toMatchObject({
      id: testClass.id,
      name: 'Kelas 7A',
      grade: 7,
    });
    expect(data.data.school).toBeDefined();
    expect(data.data.students).toBeDefined();
  });

  it('should return 404 for non-existent class', async () => {
    const request = new Request('http://localhost:3000/api/kelas/invalid-id');
    const response = await GET(request, { params: Promise.resolve({ id: 'invalid-id' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Class not found');
  });

  it('should include homeroom teacher info when assigned', async () => {
    const teacher = await createTestSchoolUser(
      testContext.user.id,
      testContext.school.id,
      { role: 'GURU' }
    );

    const testClass = await createTestClass(testContext.school.id, {
      name: 'Kelas 7A',
      grade: 7,
      homeroomTeacherId: teacher.id,
    });

    const request = new Request(`http://localhost:3000/api/kelas/${testClass.id}`);
    const response = await GET(request, { params: Promise.resolve({ id: testClass.id }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.homeroomTeacher).toBeDefined();
    expect(data.data.homeroomTeacher.id).toBe(teacher.id);
  });
});

describe('PATCH /api/kelas/[id]', () => {
  let testContext: Awaited<ReturnType<typeof createTestContext>>;

  beforeEach(async () => {
    testContext = await createTestContext('ADMIN');
  });

  it('should update class name', async () => {
    const testClass = await createTestClass(testContext.school.id, {
      name: 'Kelas 7A',
      grade: 7,
    });

    const updateData = { name: 'Kelas 7A Updated' };
    const request = new Request(`http://localhost:3000/api/kelas/${testClass.id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: testClass.id }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.name).toBe('Kelas 7A Updated');
  });

  it('should update class grade', async () => {
    const testClass = await createTestClass(testContext.school.id, {
      name: 'Kelas 7A',
      grade: 7,
    });

    const updateData = { grade: 8 };
    const request = new Request(`http://localhost:3000/api/kelas/${testClass.id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: testClass.id }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.grade).toBe(8);
  });

  it('should reject duplicate class name', async () => {
    await createTestClass(testContext.school.id, { name: 'Kelas 7B', grade: 7 });
    const testClass = await createTestClass(testContext.school.id, {
      name: 'Kelas 7A',
      grade: 7,
    });

    const updateData = { name: 'Kelas 7B' };
    const request = new Request(`http://localhost:3000/api/kelas/${testClass.id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: testClass.id }) });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('sudah ada');
  });

  it('should validate grade for SMP', async () => {
    const testClass = await createTestClass(testContext.school.id, {
      name: 'Kelas 7A',
      grade: 7,
    });

    const updateData = { grade: 10 };
    const request = new Request(`http://localhost:3000/api/kelas/${testClass.id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: testClass.id }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('SMP');
  });

  it('should return 404 for non-existent class', async () => {
    const updateData = { name: 'Updated' };
    const request = new Request('http://localhost:3000/api/kelas/invalid-id', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'invalid-id' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Class not found');
  });
});

describe('DELETE /api/kelas/[id]', () => {
  let testContext: Awaited<ReturnType<typeof createTestContext>>;

  beforeEach(async () => {
    testContext = await createTestContext('ADMIN');
  });

  it('should delete empty class', async () => {
    const testClass = await createTestClass(testContext.school.id, {
      name: 'Kelas 7A',
      grade: 7,
    });

    const request = new Request(`http://localhost:3000/api/kelas/${testClass.id}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: testClass.id }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('deleted successfully');
  });

  it('should return 404 for non-existent class', async () => {
    const request = new Request('http://localhost:3000/api/kelas/invalid-id', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid-id' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Class not found');
  });
});
