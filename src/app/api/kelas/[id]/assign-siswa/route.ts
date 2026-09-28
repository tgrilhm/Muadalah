import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AssignStudentsSchema } from '@/lib/validations/class.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/kelas/[id]/assign-siswa
 * Bulk assign or unassign students to/from a class
 */
export async function POST(
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

      // Check permissions (only ADMIN and KEPALA_SEKOLAH can assign students)
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
    });

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = AssignStudentsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 422 }
      );
    }

    const { studentIds, action } = validationResult.data;

    // Verify all students exist and belong to the same school
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
      },
      include: {
        class: {
          select: {
            id: true,
            schoolId: true,
          },
        },
      },
    });

    // Check if all students were found
    if (students.length !== studentIds.length) {
      const foundIds = students.map((s) => s.id);
      const missingIds = studentIds.filter((id) => !foundIds.includes(id));
      return NextResponse.json(
        { error: 'Some students not found', missingIds },
        { status: 404 }
      );
    }

    // Check if all students belong to the same school
    const invalidStudents = students.filter((s) => s.class.schoolId !== schoolId);
    if (invalidStudents.length > 0) {
      return NextResponse.json(
        {
          error: 'Some students do not belong to your school',
          invalidIds: invalidStudents.map((s) => s.id),
        },
        { status: 403 }
      );
    }

    if (action === 'assign') {
      // Check if any students are already in the target class
      const alreadyAssigned = students.filter((s) => s.classId === classId);
      if (alreadyAssigned.length > 0) {
        return NextResponse.json(
          {
            error: 'Some students are already in this class',
            alreadyAssignedIds: alreadyAssigned.map((s) => s.id),
          },
          { status: 400 }
        );
      }

      // Bulk update students to assign them to the class
      await prisma.student.updateMany({
        where: {
          id: { in: studentIds },
        },
        data: {
          classId,
          updatedAt: new Date(),
        },
      });

      // Fetch updated students
      const updatedStudents = await prisma.student.findMany({
        where: {
          id: { in: studentIds },
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
      });

      return NextResponse.json({
        message: `${studentIds.length} siswa berhasil dipindahkan ke kelas ini`,
        data: updatedStudents,
      });
    } else if (action === 'unassign') {
      // Check if students are actually in the target class
      const notInClass = students.filter((s) => s.classId !== classId);
      if (notInClass.length > 0) {
        return NextResponse.json(
          {
            error: 'Some students are not in this class',
            notInClassIds: notInClass.map((s) => s.id),
          },
          { status: 400 }
        );
      }

      // For unassign, we need a default class to move them to
      // Find or create an "Unassigned" class for the school
      let unassignedClass = await prisma.class.findFirst({
        where: {
          schoolId,
          name: 'Belum Ditempatkan',
          grade: classData.grade, // Same grade level
        },
      });

      // If no unassigned class exists, create one
      if (!unassignedClass) {
        unassignedClass = await prisma.class.create({
          data: {
            name: 'Belum Ditempatkan',
            grade: classData.grade,
            major: null,
            schoolId,
          },
        });
      }

      // Move students to the unassigned class
      await prisma.student.updateMany({
        where: {
          id: { in: studentIds },
        },
        data: {
          classId: unassignedClass.id,
          updatedAt: new Date(),
        },
      });

      // Fetch updated students
      const updatedStudents = await prisma.student.findMany({
        where: {
          id: { in: studentIds },
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
      });

      return NextResponse.json({
        message: `${studentIds.length} siswa berhasil dipindahkan dari kelas ini`,
        data: updatedStudents,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error assigning students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
