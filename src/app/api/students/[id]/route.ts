import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UpdateStudentSchema } from '@/lib/validations/student.schema';
import { createClient } from '@/lib/supabase/server';
import { StudentStatus } from '@prisma/client';

/**
 * GET /api/students/[id]
 * Get student detail with related data
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

    // Fetch student with related data
    const student = await prisma.student.findFirst({
      where: {
        id,
        class: {
          schoolId,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            major: true,
            school: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
        parentContacts: true,
        attendances: {
          take: 10,
          orderBy: { date: 'desc' },
          select: {
            id: true,
            date: true,
            status: true,
            notes: true,
          },
        },
        grades: {
          take: 10,
          orderBy: { date: 'desc' },
          select: {
            id: true,
            type: true,
            score: true,
            maxScore: true,
            date: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: student });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/students/[id]
 * Update student information
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

      // Get user role
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
      schoolId = dbUser.schoolUsers[0].schoolId;

      // Check permissions
      if (!['ADMIN', 'KEPALA_SEKOLAH', 'GURU'].includes(userRole)) {
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

    // Verify student exists and belongs to user's school
    const existingStudent = await prisma.student.findFirst({
      where: {
        id,
        class: {
          schoolId,
        },
      },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = UpdateStudentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 422 }
      );
    }

    const updateData = validationResult.data;

    // If updating classId, verify it belongs to the same school
    if (updateData.classId && updateData.classId !== existingStudent.classId) {
      const newClass = await prisma.class.findUnique({
        where: { id: updateData.classId },
        select: { schoolId: true },
      });

      if (!newClass || newClass.schoolId !== schoolId) {
        return NextResponse.json(
          { error: 'Invalid class or class does not belong to your school' },
          { status: 400 }
        );
      }

      // Check for duplicate NIS in new class
      if (updateData.nis || existingStudent.nis) {
        const nisToCheck = updateData.nis || existingStudent.nis;
        const duplicate = await prisma.student.findFirst({
          where: {
            classId: updateData.classId,
            nis: nisToCheck,
            id: { not: id },
          },
        });

        if (duplicate) {
          return NextResponse.json(
            { error: 'NIS already exists in the target class' },
            { status: 409 }
          );
        }
      }
    }

    // Update student
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        ...updateData,
        birthDate: updateData.birthDate ? new Date(updateData.birthDate) : undefined,
        updatedAt: new Date(),
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

    return NextResponse.json({ data: updatedStudent });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/students/[id]
 * Soft delete student (set status to KELUAR)
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

      // Get user role
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
      schoolId = dbUser.schoolUsers[0].schoolId;

      // Check permissions (only ADMIN and KEPALA_SEKOLAH can delete)
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

    // Verify student exists and belongs to user's school
    const student = await prisma.student.findFirst({
      where: {
        id,
        class: {
          schoolId,
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to KELUAR
    await prisma.student.update({
      where: { id },
      data: {
        status: StudentStatus.KELUAR,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: 'Student deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
