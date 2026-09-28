import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ClassQuerySchema, CreateClassSchema } from '@/lib/validations/class.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/kelas
 * List classes with pagination, search, and filters
 */
export async function GET(request: NextRequest) {
  // TEMPORARY: Bypass auth for testing (REMOVE in production!)
  const bypassAuth = process.env.NODE_ENV === 'development';

  try {
    let schoolId = 'default-school-id'; // Default for testing

    if (!bypassAuth) {
      // Auth check
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Get school context from user session
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
      // For testing: Get first school from database
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      schoolId = firstSchool?.id || 'default-school-id';
    }

    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams;
    const queryResult = ClassQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
      grade: searchParams.get('grade') || undefined,
      major: searchParams.get('major') || undefined,
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: searchParams.get('sortOrder') || 'asc',
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search, grade, major, sortBy, sortOrder } = queryResult.data;

    // Build where clause for filtering
    const where: any = {
      schoolId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (grade !== undefined) {
      where.grade = grade;
    }

    if (major) {
      where.major = major;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [classes, totalCount] = await Promise.all([
      prisma.class.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          homeroomTeacher: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              students: true,
            },
          },
        },
      }),
      prisma.class.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: classes,
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
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/kelas
 * Create a new class
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role and school
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

    // Check permissions (only ADMIN and KEPALA_SEKOLAH can create classes)
    if (!['ADMIN', 'KEPALA_SEKOLAH'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = CreateClassSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 422 }
      );
    }

    const classData = validationResult.data;

    // Verify school exists and user has access
    const school = await prisma.school.findUnique({
      where: { id: classData.schoolId },
      select: { id: true, level: true },
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // SUPER_ADMIN can create class for any school, others only for their school
    if (userRole !== 'SUPER_ADMIN' && classData.schoolId !== userSchoolId) {
      return NextResponse.json(
        { error: 'Cannot create class for a different school' },
        { status: 403 }
      );
    }

    // Validate grade matches school level
    const isSMP = school.level === 'SMP';
    const isSMA = school.level === 'SMA';

    if (isSMP && (classData.grade < 7 || classData.grade > 9)) {
      return NextResponse.json(
        { error: 'SMP hanya memiliki kelas 7-9' },
        { status: 400 }
      );
    }

    if (isSMA && (classData.grade < 10 || classData.grade > 12)) {
      return NextResponse.json(
        { error: 'SMA hanya memiliki kelas 10-12' },
        { status: 400 }
      );
    }

    // Check for duplicate class name in same school
    const existingClass = await prisma.class.findFirst({
      where: {
        schoolId: classData.schoolId,
        name: classData.name,
        grade: classData.grade,
      },
    });

    if (existingClass) {
      return NextResponse.json(
        { error: 'Kelas dengan nama dan tingkat yang sama sudah ada' },
        { status: 409 }
      );
    }

    // If homeroomTeacherId provided, verify it's a valid teacher in the school
    if (classData.homeroomTeacherId) {
      const teacher = await prisma.schoolUser.findFirst({
        where: {
          id: classData.homeroomTeacherId,
          schoolId: classData.schoolId,
          role: 'GURU',
        },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: 'Wali kelas tidak valid atau bukan guru di sekolah ini' },
          { status: 400 }
        );
      }
    }

    // Create class
    const newClass = await prisma.class.create({
      data: classData,
      include: {
        homeroomTeacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: newClass },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
