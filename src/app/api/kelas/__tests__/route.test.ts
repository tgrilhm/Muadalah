import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '../route';
import { prisma } from '@/lib/prisma';
import { createTestContext, createTestClass } from '@/__tests__/helpers';

// Mock Next.js modules
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('GET /api/kelas', () => {
  let testContext: Awaited<ReturnType<typeof createTestContext>>;

  beforeEach(async () => {
    testContext = await createTestContext('ADMIN');
  });

  it('should return paginated list of classes', async () => {
    // Create test classes
    await createTestClass(testContext.school.id, { name: 'Kelas 7A', grade: 7 });
    await createTestClass(testContext.school.id, { name: 'Kelas 7B', grade: 7 });
    await createTestClass(testContext.school.id, { name: 'Kelas 8A', grade: 8 });

    const request = new Request('http://localhost:3000/api/kelas?page=1&limit=10');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(3);
    expect(data.meta).toMatchObject({
      total: 3,
      page: 1,
      limit: 10,
    });
  });

  it('should filter classes by grade', async () => {
    await createTestClass(testContext.school.id, { name: 'Kelas 7A', grade: 7 });
    await createTestClass(testContext.school.id, { name: 'Kelas 8A', grade: 8 });

    const request = new Request('http://localhost:3000/api/kelas?grade=7');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].grade).toBe(7);
  });

  it('should search classes by name', async () => {
    await createTestClass(testContext.school.id, { name: 'Kelas 7A', grade: 7 });
    await createTestClass(testContext.school.id, { name: 'Kelas 7B', grade: 7 });

    const request = new Request('http://localhost:3000/api/kelas?search=7A');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].name).toContain('7A');
  });

  it('should sort classes by name ascending', async () => {
    await createTestClass(testContext.school.id, { name: 'Kelas 7C', grade: 7 });
    await createTestClass(testContext.school.id, { name: 'Kelas 7A', grade: 7 });
    await createTestClass(testContext.school.id, { name: 'Kelas 7B', grade: 7 });

    const request = new Request('http://localhost:3000/api/kelas?sortBy=name&sortOrder=asc');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data[0].name).toBe('Kelas 7A');
    expect(data.data[1].name).toBe('Kelas 7B');
    expect(data.data[2].name).toBe('Kelas 7C');
  });

  it('should return empty array when no classes exist', async () => {
    const request = new Request('http://localhost:3000/api/kelas');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(0);
    expect(data.meta.total).toBe(0);
  });

  it('should handle invalid query parameters', async () => {
    const request = new Request('http://localhost:3000/api/kelas?page=-1&limit=500');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid query parameters');
  });
});

describe('POST /api/kelas', () => {
  let testContext: Awaited<ReturnType<typeof createTestContext>>;

  beforeEach(async () => {
    testContext = await createTestContext('ADMIN');
  });

  it('should create a new class successfully', async () => {
    const classData = {
      name: 'Kelas 7A',
      grade: 7,
      schoolId: testContext.school.id,
      major: null,
      homeroomTeacherId: null,
    };

    const request = new Request('http://localhost:3000/api/kelas', {
      method: 'POST',
      body: JSON.stringify(classData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toMatchObject({
      name: 'Kelas 7A',
      grade: 7,
      schoolId: testContext.school.id,
    });
  });

  it('should reject duplicate class name in same grade', async () => {
    await createTestClass(testContext.school.id, { name: 'Kelas 7A', grade: 7 });

    const classData = {
      name: 'Kelas 7A',
      grade: 7,
      schoolId: testContext.school.id,
    };

    const request = new Request('http://localhost:3000/api/kelas', {
      method: 'POST',
      body: JSON.stringify(classData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('sudah ada');
  });

  it('should validate SMP grade range (7-9)', async () => {
    const classData = {
      name: 'Kelas 10A',
      grade: 10,
      schoolId: testContext.school.id,
    };

    const request = new Request('http://localhost:3000/api/kelas', {
      method: 'POST',
      body: JSON.stringify(classData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('SMP');
  });

  it('should reject invalid grade', async () => {
    const classData = {
      name: 'Kelas Invalid',
      grade: 6,
      schoolId: testContext.school.id,
    };

    const request = new Request('http://localhost:3000/api/kelas', {
      method: 'POST',
      body: JSON.stringify(classData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe('Validation failed');
  });

  it('should reject missing required fields', async () => {
    const classData = {
      grade: 7,
      schoolId: testContext.school.id,
    };

    const request = new Request('http://localhost:3000/api/kelas', {
      method: 'POST',
      body: JSON.stringify(classData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe('Validation failed');
  });

  it('should allow KEPALA_SEKOLAH to create class', async () => {
    const kepalaContext = await createTestContext('KEPALA_SEKOLAH');

    const classData = {
      name: 'Kelas 7B',
      grade: 7,
      schoolId: kepalaContext.school.id,
    };

    const request = new Request('http://localhost:3000/api/kelas', {
      method: 'POST',
      body: JSON.stringify(classData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
  });
});
