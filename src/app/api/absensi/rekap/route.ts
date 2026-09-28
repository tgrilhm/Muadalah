import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { attendanceRekapQuerySchema } from '@/lib/validations/attendance.schema';
import { createClient } from '@/lib/supabase/server';
import { AttendanceStatus } from '@prisma/client';

/**
 * GET /api/absensi/rekap
 * Get attendance recap/summary for a class within a date range
 * 
 * Query params:
 * - classId (required)
 * - startDate (required, YYYY-MM-DD)
 * - endDate (required, YYYY-MM-DD)
 * - studentId (optional, for individual student)
 */
export async function GET(request: NextRequest) {
  try {
    // TEMPORARY: Bypass auth for testing (REMOVE in production!)
    const bypassAuth = process.env.NODE_ENV === 'development';

    let schoolId = 'default-school-id';

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
    } else {
      // For testing: Get first school
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      schoolId = firstSchool?.id || 'default-school-id';
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      classId: searchParams.get('classId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      studentId: searchParams.get('studentId') || undefined,
    };

    const validation = attendanceRekapQuerySchema.safeParse(queryParams);

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

    const { classId, startDate, endDate, studentId } = validation.data;

    // Verify class exists and user has access
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: schoolId,
      },
    });

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    // Build where clause for students
    const studentWhere: any = {
      classId,
    };

    if (studentId) {
      studentWhere.id = studentId;
    }

    // Fetch students with their attendance records
    const students = await prisma.student.findMany({
      where: studentWhere,
      select: {
        id: true,
        name: true,
        nis: true,
        attendances: {
          where: {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          select: {
            date: true,
            status: true,
            notes: true,
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calculate summary for each student
    const rekapData = students.map((student) => {
      const summary = student.attendances.reduce(
        (acc, att) => {
          acc.total++;
          acc[att.status.toLowerCase() as keyof typeof acc]++;
          return acc;
        },
        {
          total: 0,
          hadir: 0,
          alfa: 0,
          sakit: 0,
          izin: 0,
          terlambat: 0,
        }
      );

      const percentage = summary.total > 0 
        ? ((summary.hadir / summary.total) * 100) 
        : 0;

      return {
        student: {
          id: student.id,
          name: student.name,
          nis: student.nis,
        },
        attendances: student.attendances.map((att) => ({
          date: att.date.toISOString().split('T')[0],
          status: att.status,
          notes: att.notes,
        })),
        summary: {
          ...summary,
          percentage: Math.round(percentage * 10) / 10,
        },
      };
    });

    // Calculate overall class summary
    const overallSummary = rekapData.reduce(
      (acc, student) => {
        acc.totalStudents++;
        acc.totalDays = Math.max(acc.totalDays, student.attendances.length);
        acc.hadir += student.summary.hadir;
        acc.alfa += student.summary.alfa;
        acc.sakit += student.summary.sakit;
        acc.izin += student.summary.izin;
        acc.terlambat += student.summary.terlambat;
        return acc;
      },
      {
        totalStudents: 0,
        totalDays: 0,
        hadir: 0,
        alfa: 0,
        sakit: 0,
        izin: 0,
        terlambat: 0,
      }
    );

    const totalRecords = overallSummary.hadir + overallSummary.alfa + 
                        overallSummary.sakit + overallSummary.izin + 
                        overallSummary.terlambat;
    
    const overallPercentage = totalRecords > 0
      ? ((overallSummary.hadir / totalRecords) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: rekapData,
      summary: {
        ...overallSummary,
        percentage: Math.round(overallPercentage * 10) / 10,
      },
      meta: {
        classId,
        startDate,
        endDate,
        totalStudents: students.length,
      },
    });
  } catch (error) {
    console.error('Attendance rekap error:', error);
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
