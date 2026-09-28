import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  SemesterQuerySchema,
  CreateSemesterSchema,
} from '@/lib/validations/academic.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/semester
 * List semesters with pagination and filters
 */
export async function GET(request: NextRequest) {
  const bypassAuth = process.env.NODE_ENV === 'development';

  try {
    let schoolId = 'default-school-id';

    if (!bypassAuth) {
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
        return NextResponse.json(
          { error: 'User not associated with any school' },
          { status: 403 }
        );
      }

      schoolId = dbUser.schoolUsers[0].schoolId;
    } else {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      schoolId = firstSchool?.id || 'default-school-id';
    }

    const searchParams = request.nextUrl.searchParams;
    const queryResult = SemesterQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      academicYearId: searchParams.get('academicYearId') || undefined,
      isActive: searchParams.get('isActive') || undefined,
      sortBy: searchParams.get('sortBy') || 'number',
      sortOrder: searchParams.get('sortOrder') || 'asc',
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, academicYearId, isActive, sortBy, sortOrder } = queryResult.data;

    const where: any = {};

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const skip = (page - 1) * limit;
    const [semesters, totalCount] = await Promise.all([
      prisma.semester.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          academicYear: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              grades: true,
              attendances: true,
            },
          },
        },
      }),
      prisma.semester.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: semesters,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/semester
 * Create a new semester
 */
export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: 'User not associated with any school' },
        { status: 403 }
      );
    }

    const userRole = dbUser.schoolUsers[0].role;

    if (!['ADMIN', 'KEPALA_SEKOLAH'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = CreateSemesterSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 422 }
      );
    }

    const semesterData = validationResult.data;

    const academicYear = await prisma.academicYear.findUnique({
      where: { id: semesterData.academicYearId },
    });

    if (!academicYear) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    const existingSemester = await prisma.semester.findFirst({
      where: {
        academicYearId: semesterData.academicYearId,
        number: semesterData.number,
      },
    });

    if (existingSemester) {
      return NextResponse.json(
        { error: 'Semester dengan nomor yang sama sudah ada dalam tahun ajaran ini' },
        { status: 409 }
      );
    }

    let newSemester;

    if (semesterData.isActive) {
      await prisma.$transaction(async (tx) => {
        await tx.semester.updateMany({
          where: {
            academicYearId: semesterData.academicYearId,
            isActive: true,
          },
          data: { isActive: false },
        });

        newSemester = await tx.semester.create({
          data: {
            ...semesterData,
            startDate: new Date(semesterData.startDate),
            endDate: new Date(semesterData.endDate),
          },
          include: {
            academicYear: true,
          },
        });
      });
    } else {
      newSemester = await prisma.semester.create({
        data: {
          ...semesterData,
          startDate: new Date(semesterData.startDate),
          endDate: new Date(semesterData.endDate),
        },
        include: {
          academicYear: true,
        },
      });
    }

    return NextResponse.json({ data: newSemester }, { status: 201 });
  } catch (error) {
    console.error('Error creating semester:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
