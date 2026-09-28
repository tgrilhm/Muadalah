import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SetHomeroomTeacherSchema } from '@/lib/validations/class.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * PUT /api/kelas/[id]/wali-kelas
 * Set or update homeroom teacher for a class
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;

    // TEMPORARY: Bypass auth for testing (REMOVE in production!)
    const bypassAuth = process.env.NODE_ENV === 'development';
    let schoolId = 'default-school-id';
    let userRole = 'ADMIN';

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

      userRole = dbUser.schoolUsers[0].role;
      schoolId = dbUser.schoolUsers[0].schoolId;

      // Check permissions (only ADMIN and KEPALA_SEKOLAH can set wali kelas)
      if (!['ADMIN', 'KEPALA_SEKOLAH'].includes(userRole)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    } else {
      // For testing: Get first school from database
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      schoolId = firstSchool?.id || 'default-school-id';
    }

    // Verify class exists and belongs to user's school
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId,
      },
      include: {
        homeroomTeacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = SetHomeroomTeacherSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 422 }
      );
    }

    const { homeroomTeacherId } = validationResult.data;

    // If setting a new teacher (not removing), verify the teacher
    if (homeroomTeacherId !== null) {
      const teacher = await prisma.schoolUser.findFirst({
        where: {
          id: homeroomTeacherId,
          schoolId,
          role: 'GURU',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: 'Wali kelas tidak valid atau bukan guru di sekolah ini' },
          { status: 400 }
        );
      }

      // Check if teacher is already a homeroom teacher for another class in same school
      const existingAssignment = await prisma.class.findFirst({
        where: {
          homeroomTeacherId,
          schoolId,
          id: { not: classId },
        },
        select: {
          id: true,
          name: true,
          grade: true,
        },
      });

      if (existingAssignment) {
        return NextResponse.json(
          {
            error: 'Guru ini sudah menjadi wali kelas di kelas lain',
            existingClass: existingAssignment,
          },
          { status: 409 }
        );
      }
    }

    // Update class homeroom teacher
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        homeroomTeacherId,
        updatedAt: new Date(),
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        homeroomTeacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
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
    });

    const message = homeroomTeacherId
      ? 'Wali kelas berhasil ditetapkan'
      : 'Wali kelas berhasil dihapus';

    return NextResponse.json({
      message,
      data: updatedClass,
    });
  } catch (error) {
    console.error('Error setting homeroom teacher:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
