import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  AcademicYearQuerySchema,
  CreateAcademicYearSchema,
} from '@/lib/validations/academic.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/tahun-ajaran
 * List academic years with pagination and filters
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
    const queryResult = AcademicYearQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') || undefined,
      sortBy: searchParams.get('sortBy') || 'startDate',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search, isActive, sortBy, sortOrder } = queryResult.data;

    const where: any = { schoolId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const skip = (page - 1) * limit;
    const [academicYears, totalCount] = await Promise.all([
      prisma.academicYear.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { semesters: true },
          },
        },
      }),
      prisma.academicYear.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: academicYears,
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
    console.error('Error fetching academic years:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/tahun-ajaran
 * Create a new academic year
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
    const userSchoolId = dbUser.schoolUsers[0].schoolId;

    if (!['ADMIN', 'KEPALA_SEKOLAH'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = CreateAcademicYearSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 422 }
      );
    }

    const academicYearData = validationResult.data;

    if (userRole !== 'SUPER_ADMIN' && academicYearData.schoolId !== userSchoolId) {
      return NextResponse.json(
        { error: 'Cannot create academic year for a different school' },
        { status: 403 }
      );
    }

    const school = await prisma.school.findUnique({
      where: { id: academicYearData.schoolId },
      select: { id: true },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const existingYear = await prisma.academicYear.findFirst({
      where: {
        schoolId: academicYearData.schoolId,
        name: academicYearData.name,
      },
    });

    if (existingYear) {
      return NextResponse.json(
        { error: 'Tahun ajaran dengan nama yang sama sudah ada' },
        { status: 409 }
      );
    }

    let newAcademicYear;

    if (academicYearData.isActive) {
      await prisma.$transaction(async (tx) => {
        await tx.academicYear.updateMany({
          where: {
            schoolId: academicYearData.schoolId,
            isActive: true,
          },
          data: { isActive: false },
        });

        newAcademicYear = await tx.academicYear.create({
          data: {
            ...academicYearData,
            startDate: new Date(academicYearData.startDate),
            endDate: new Date(academicYearData.endDate),
          },
          include: {
            _count: {
              select: { semesters: true },
            },
          },
        });
      });
    } else {
      newAcademicYear = await prisma.academicYear.create({
        data: {
          ...academicYearData,
          startDate: new Date(academicYearData.startDate),
          endDate: new Date(academicYearData.endDate),
        },
        include: {
          _count: {
            select: { semesters: true },
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: newAcademicYear }, { status: 201 });
  } catch (error) {
    console.error('Error creating academic year:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
