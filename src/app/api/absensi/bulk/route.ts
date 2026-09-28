import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bulkAttendanceInputSchema } from '@/lib/validations/attendance.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/absensi/bulk
 * Bulk attendance input for a class
 * 
 * Body:
 * {
 *   "classId": "string",
 *   "date": "YYYY-MM-DD",
 *   "attendances": [
 *     { "studentId": "string", "status": "HADIR|ALFA|SAKIT|IZIN|TERLAMBAT", "notes": "string?" }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // TEMPORARY: Bypass auth for testing (REMOVE in production!)
    const bypassAuth = process.env.NODE_ENV === 'development';

    let schoolId = 'default-school-id';
    let userId = 'default-user-id';

    if (!bypassAuth) {
      // Auth check with Supabase
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Get user from database
      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        include: { schoolUsers: true },
      });

      if (!dbUser || dbUser.schoolUsers.length === 0) {
        return NextResponse.json(
          { success: false, error: 'User not associated with any school' },
          { status: 403 }
        );
      }

      schoolId = dbUser.schoolUsers[0].schoolId;
      userId = dbUser.id;
    } else {
      // For testing: Get first school and user
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      const firstUser = await prisma.user.findFirst({ select: { id: true } });
      schoolId = firstSchool?.id || 'default-school-id';
      userId = firstUser?.id || 'default-user-id';
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = bulkAttendanceInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { classId, date, attendances } = validation.data;

    // Verify class exists and user has access
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: schoolId,
      },
      include: {
        students: {
          select: { id: true },
        },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    // Verify all students belong to the class
    const classStudentIds = new Set(classData.students.map((s) => s.id));
    const invalidStudents = attendances.filter(
      (att) => !classStudentIds.has(att.studentId)
    );

    if (invalidStudents.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Some students do not belong to this class',
          invalidStudentIds: invalidStudents.map((s) => s.studentId),
        },
        { status: 400 }
      );
    }

    // Get active semester
    const activeSemester = await prisma.semester.findFirst({
      where: {
        isActive: true,
      },
    });

    if (!activeSemester) {
      return NextResponse.json(
        { success: false, error: 'No active semester found' },
        { status: 400 }
      );
    }

    // Validate date is within semester
    const attendanceDate = new Date(date);
    if (
      attendanceDate < activeSemester.startDate ||
      attendanceDate > activeSemester.endDate
    ) {
      return NextResponse.json(
        { success: false, error: 'Date is outside active semester' },
        { status: 400 }
      );
    }

    // Validate date is not in the future
    if (attendanceDate > new Date()) {
      return NextResponse.json(
        { success: false, error: 'Cannot record future attendance' },
        { status: 400 }
      );
    }

    // Bulk upsert attendance records in a transaction
    const result = await prisma.$transaction(
      attendances.map((att) =>
        prisma.attendance.upsert({
          where: {
            studentId_date: {
              studentId: att.studentId,
              date: attendanceDate,
            },
          },
          update: {
            status: att.status,
            notes: att.notes || null,
            recordedById: userId,
          },
          create: {
            studentId: att.studentId,
            date: attendanceDate,
            status: att.status,
            notes: att.notes || null,
            semesterId: activeSemester.id,
            recordedById: userId,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Attendance records saved successfully',
      data: {
        count: result.length,
        date,
        classId,
      },
    });
  } catch (error) {
    console.error('Bulk attendance error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
