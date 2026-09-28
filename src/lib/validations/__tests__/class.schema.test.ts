import { describe, it, expect } from 'vitest';
import {
  ClassQuerySchema,
  CreateClassSchema,
  UpdateClassSchema,
  AssignStudentsSchema,
  SetHomeroomTeacherSchema,
} from '../class.schema';

describe('ClassQuerySchema', () => {
  it('should validate valid query parameters', () => {
    const result = ClassQuerySchema.safeParse({
      page: '1',
      limit: '20',
      search: 'Kelas 7A',
      grade: '7',
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('should use default values', () => {
    const result = ClassQuerySchema.safeParse({});
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sortBy).toBe('name');
      expect(result.data.sortOrder).toBe('asc');
    }
  });

  it('should reject invalid grade', () => {
    const result = ClassQuerySchema.safeParse({ grade: '6' });
    expect(result.success).toBe(false);
  });

  it('should reject page less than 1', () => {
    const result = ClassQuerySchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });
});

describe('CreateClassSchema', () => {
  it('should validate valid SMP class', () => {
    const result = CreateClassSchema.safeParse({
      name: 'Kelas 7A',
      grade: 7,
      schoolId: 'clabcdef123',
      major: null,
    });

    expect(result.success).toBe(true);
  });

  it('should validate valid SMA class with major', () => {
    const result = CreateClassSchema.safeParse({
      name: 'Kelas 11 IPA',
      grade: 11,
      schoolId: 'clabcdef123',
      major: 'IPA',
    });

    expect(result.success).toBe(true);
  });

  it('should reject SMP class with major', () => {
    const result = CreateClassSchema.safeParse({
      name: 'Kelas 7A',
      grade: 7,
      schoolId: 'clabcdef123',
      major: 'IPA',
    });

    expect(result.success).toBe(false);
  });

  it('should reject missing name', () => {
    const result = CreateClassSchema.safeParse({
      grade: 7,
      schoolId: 'clabcdef123',
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid grade', () => {
    const result = CreateClassSchema.safeParse({
      name: 'Kelas 6A',
      grade: 6,
      schoolId: 'clabcdef123',
    });

    expect(result.success).toBe(false);
  });

  it('should accept SMA grade 10 without major', () => {
    const result = CreateClassSchema.safeParse({
      name: 'Kelas 10A',
      grade: 10,
      schoolId: 'clabcdef123',
      major: null,
    });

    expect(result.success).toBe(true);
  });
});

describe('UpdateClassSchema', () => {
  it('should validate partial updates', () => {
    const result = UpdateClassSchema.safeParse({
      name: 'Kelas 7B',
    });

    expect(result.success).toBe(true);
  });

  it('should validate grade update', () => {
    const result = UpdateClassSchema.safeParse({
      grade: 8,
    });

    expect(result.success).toBe(true);
  });

  it('should validate empty update', () => {
    const result = UpdateClassSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('AssignStudentsSchema', () => {
  it('should validate assign action', () => {
    const result = AssignStudentsSchema.safeParse({
      studentIds: ['clstudent1', 'clstudent2'],
      action: 'assign',
    });

    expect(result.success).toBe(true);
  });

  it('should validate unassign action', () => {
    const result = AssignStudentsSchema.safeParse({
      studentIds: ['clstudent1'],
      action: 'unassign',
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty student array', () => {
    const result = AssignStudentsSchema.safeParse({
      studentIds: [],
      action: 'assign',
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid action', () => {
    const result = AssignStudentsSchema.safeParse({
      studentIds: ['clstudent1'],
      action: 'invalid',
    });

    expect(result.success).toBe(false);
  });

  it('should reject missing studentIds', () => {
    const result = AssignStudentsSchema.safeParse({
      action: 'assign',
    });

    expect(result.success).toBe(false);
  });
});

describe('SetHomeroomTeacherSchema', () => {
  it('should validate teacher ID', () => {
    const result = SetHomeroomTeacherSchema.safeParse({
      homeroomTeacherId: 'clteacher123',
    });

    expect(result.success).toBe(true);
  });

  it('should validate null to remove teacher', () => {
    const result = SetHomeroomTeacherSchema.safeParse({
      homeroomTeacherId: null,
    });

    expect(result.success).toBe(true);
  });

  it('should reject missing field', () => {
    const result = SetHomeroomTeacherSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
