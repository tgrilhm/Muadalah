import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateStudentSchema, StudentQuerySchema } from '@/lib/validations/student.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/students
 * List students with pagination, search, and filters
 */
export async function GET(request: NextRequest) {
  // TEMPORARY: Bypass auth for testing (REMOVE in production!)
  const bypassAuth = process.env.NODE_ENV === 'development';
  
  try {
    // Get schoolId from query parameter (required)
    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      return NextResponse.json(
        { error: 'schoolId is required' },
        { status: 400 }
      );
    }

    // Parse and validate query params
    const queryResult = StudentQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
      classId: searchParams.get('classId') || undefined,
      status: searchParams.get('status') || undefined,
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: searchParams.get('sortOrder') || 'asc',
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search, classId, status, sortBy, sortOrder } = queryResult.data;

    // Build where clause for filtering
    const where: any = {
      class: {
        schoolId,
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nis: { contains: search, mode: 'insensitive' } },
        { nisn: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (classId) {
      where.classId = classId;
    }

    if (status) {
      where.status = status;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [students, totalCount] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              grade: true,
              major: true,
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      data: students,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/students
 * Create a new student
 */
export async function POST(request: NextRequest) {
  try {
    // TEMPORARY: Bypass auth for testing in development (REMOVE in production!)
    const bypassAuth = process.env.NODE_ENV === 'development';
    let schoolId = '';

    if (!bypassAuth) {
      // Auth check
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        include: { schoolUsers: true },
      });

      if (!dbUser || dbUser.schoolUsers.length === 0) {
        return NextResponse.json({ error: 'User not associated with any school' }, { status: 403 });
      }

      const userRole = dbUser.schoolUsers[0].role;
      if (!['ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'SUPER_ADMIN'].includes(userRole)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      schoolId = dbUser.schoolUsers[0].schoolId;
    } else {
      // For testing: use first school
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      schoolId = firstSchool?.id || '';
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = CreateStudentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 422 }
      );
    }

    const { parentContacts, ...studentData } = validationResult.data;

    // Verify class belongs to school
    const classInfo = await prisma.class.findUnique({
      where: { id: studentData.classId },
      select: { schoolId: true },
    });

    if (!classInfo || (schoolId && classInfo.schoolId !== schoolId)) {
      return NextResponse.json(
        { error: 'Invalid class or class does not belong to your school' },
        { status: 400 }
      );
    }

    // Check for duplicate NIS in the same class
    const existingStudent = await prisma.student.findFirst({
      where: {
        classId: studentData.classId,
        nis: studentData.nis,
      },
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: 'NIS already exists in this class' },
        { status: 409 }
      );
    }

    // Create student with parent contacts in a transaction
    const student = await prisma.student.create({
      data: {
        ...studentData,
        birthDate: studentData.birthDate ? new Date(studentData.birthDate) : null,
        enrollDate: studentData.enrollDate ? new Date(studentData.enrollDate) : new Date(),
        parentContacts: {
          create: parentContacts,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            major: true,
          },
        },
        parentContacts: true,
      },
    });

    return NextResponse.json(
      { data: student },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
