import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UpdateClassSchema } from '@/lib/validations/class.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/kelas/[id]
 * Get class detail with students and teacher info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // TEMPORARY: Bypass auth for testing (REMOVE in production!)
    const bypassAuth = process.env.NODE_ENV === 'development';
    let schoolId = 'default-school-id';

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

      // Get user's school context
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

    // Fetch class with related data
    const classData = await prisma.class.findFirst({
      where: {
        id,
        schoolId,
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
        students: {
          where: {
            status: 'AKTIF',
          },
          select: {
            id: true,
            nis: true,
            name: true,
            gender: true,
            photo: true,
            status: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            teacher: {
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
        },
        _count: {
          select: {
            students: true,
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

    return NextResponse.json({ data: classData });
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/kelas/[id]
 * Update class information
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

      // Check permissions (only ADMIN and KEPALA_SEKOLAH can update)
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
    const existingClass = await prisma.class.findFirst({
      where: {
        id,
        schoolId,
      },
      include: {
        school: {
          select: {
            level: true,
          },
        },
      },
    });

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = UpdateClassSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 422 }
      );
    }

    const updateData = validationResult.data;

    // If updating grade, validate it matches school level
    if (updateData.grade !== undefined) {
      const isSMP = existingClass.school.level === 'SMP';
      const isSMA = existingClass.school.level === 'SMA';

      if (isSMP && (updateData.grade < 7 || updateData.grade > 9)) {
        return NextResponse.json(
          { error: 'SMP hanya memiliki kelas 7-9' },
          { status: 400 }
        );
      }

      if (isSMA && (updateData.grade < 10 || updateData.grade > 12)) {
        return NextResponse.json(
          { error: 'SMA hanya memiliki kelas 10-12' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate class name if name or grade is being updated
    if (updateData.name || updateData.grade !== undefined) {
      const nameToCheck = updateData.name || existingClass.name;
      const gradeToCheck = updateData.grade !== undefined ? updateData.grade : existingClass.grade;

      const duplicate = await prisma.class.findFirst({
        where: {
          schoolId,
          name: nameToCheck,
          grade: gradeToCheck,
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Kelas dengan nama dan tingkat yang sama sudah ada' },
          { status: 409 }
        );
      }
    }

    // If homeroomTeacherId is being updated, verify the teacher
    if (updateData.homeroomTeacherId !== undefined) {
      if (updateData.homeroomTeacherId !== null) {
        const teacher = await prisma.schoolUser.findFirst({
          where: {
            id: updateData.homeroomTeacherId,
            schoolId,
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
    }

    // Update class
    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        ...updateData,
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

    return NextResponse.json({ data: updatedClass });
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/kelas/[id]
 * Delete a class (only if no active students)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

      // Check permissions (only ADMIN can delete classes)
      if (userRole !== 'ADMIN') {
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
        id,
        schoolId,
      },
      include: {
        _count: {
          select: {
            students: true,
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

    // Check if class has active students
    if (classData._count.students > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus kelas yang masih memiliki siswa aktif' },
        { status: 400 }
      );
    }

    // Delete the class
    await prisma.class.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Class deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
