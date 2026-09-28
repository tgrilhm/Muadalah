import { prisma } from '@/lib/prisma';
import { Institution, School, User, SchoolUser, Class } from '@prisma/client';

/**
 * Test data factory for creating database records
 */

export async function createTestInstitution(
  data?: Partial<Institution>
): Promise<Institution> {
  return prisma.institution.create({
    data: {
      name: data?.name || 'Test Institution',
      address: data?.address || 'Test Address',
      phone: data?.phone || '08123456789',
      email: data?.email || 'test@institution.com',
      ...data,
    },
  });
}

export async function createTestSchool(
  institutionId: string,
  data?: Partial<School>
): Promise<School> {
  return prisma.school.create({
    data: {
      name: data?.name || 'Test School',
      level: data?.level || 'SMP',
      address: data?.address || 'Test School Address',
      phone: data?.phone || '08123456789',
      npsn: data?.npsn || `NPSN${Date.now()}`,
      institutionId,
      ...data,
    },
  });
}

export async function createTestUser(data?: Partial<User>): Promise<User> {
  return prisma.user.create({
    data: {
      supabaseId: data?.supabaseId || `sb_${Date.now()}_${Math.random()}`,
      email: data?.email || `test${Date.now()}@example.com`,
      name: data?.name || 'Test User',
      phone: data?.phone || '08123456789',
      isActive: data?.isActive ?? true,
      ...data,
    },
  });
}

export async function createTestSchoolUser(
  userId: string,
  schoolId: string,
  data?: Partial<SchoolUser>
): Promise<SchoolUser> {
  return prisma.schoolUser.create({
    data: {
      role: data?.role || 'ADMIN',
      userId,
      schoolId,
      ...data,
    },
  });
}

export async function createTestClass(
  schoolId: string,
  data?: Partial<Class>
): Promise<Class> {
  return prisma.class.create({
    data: {
      name: data?.name || `Test Class ${Date.now()}`,
      grade: data?.grade || 7,
      major: data?.major || null,
      schoolId,
      homeroomTeacherId: data?.homeroomTeacherId || null,
      ...data,
    },
  });
}

/**
 * Helper to create a complete test context with institution, school, and user
 */
export async function createTestContext(role: 'ADMIN' | 'KEPALA_SEKOLAH' | 'GURU' = 'ADMIN') {
  const institution = await createTestInstitution();
  const school = await createTestSchool(institution.id);
  const user = await createTestUser();
  const schoolUser = await createTestSchoolUser(user.id, school.id, { role });

  return {
    institution,
    school,
    user,
    schoolUser,
  };
}

/**
 * Mock authenticated request with user context
 */
export function mockAuthContext(supabaseId: string) {
  // This will be used to mock Supabase auth in tests
  return {
    user: {
      id: supabaseId,
      email: `${supabaseId}@example.com`,
    },
  };
}
