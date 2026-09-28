import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { attendanceStatsQuerySchema } from '@/lib/validations/attendance.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/absensi/statistik
 * Get attendance statistics and analytics
 * 
 * Query params:
 * - schoolId (required)
 * - classId (optional)
 * - startDate (required, YYYY-MM-DD)
 * - endDate (required, YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    // TEMPORARY: Bypass auth for testing
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
      schoolId: searchParams.get('schoolId') || schoolId,
      classId: searchParams.get('classId') || undefined,
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    };

    const validation = attendanceStatsQuerySchema.safeParse(queryParams);

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

    const { schoolId: validatedSchoolId, classId, startDate, endDate } = validation.data;

    // Verify user has access to this school
    if (schoolId !== validatedSchoolId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to access this school' },
        { status: 403 }
      );
    }

    // Fetch all attendance records for the period
    const whereClause: any = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      student: {
        school: {
          id: schoolId,
        },
      },
    };

    if (classId) {
      whereClause.student = {
        ...whereClause.student,
        classId,
      };
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            classId: true,
          },
        },
      },
    });

    // Calculate overall statistics
    const byStatus = attendances.reduce(
      (acc, att) => {
        acc[att.status] = (acc[att.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalRecords = attendances.length;
    const totalStudents = new Set(attendances.map((a) => a.studentId)).size;
    const totalDays = new Set(attendances.map((a) => a.date.toISOString().split('T')[0]))
      .size;

    const hadir = byStatus['HADIR'] || 0;
    const overallPercentage = totalRecords > 0 ? (hadir / totalRecords) * 100 : 0;

    // Calculate daily trend
    const dailyData: Record<string, { hadir: number; total: number }> = {};

    attendances.forEach((att) => {
      const dateStr = att.date.toISOString().split('T')[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { hadir: 0, total: 0 };
      }
      dailyData[dateStr].total++;
      if (att.status === 'HADIR') {
        dailyData[dateStr].hadir++;
      }
    });

    const dailyTrend = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        percentage: Math.round((data.hadir / data.total) * 100 * 10) / 10,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Get top absent students (students with most absences)
    const studentAbsences: Record<string, { name: string; classId: string; count: number }> =
      {};

    attendances.forEach((att) => {
      if (att.status === 'ALFA') {
        if (!studentAbsences[att.studentId]) {
          studentAbsences[att.studentId] = {
            name: att.student.name,
            classId: att.student.classId,
            count: 0,
          };
        }
        studentAbsences[att.studentId].count++;
      }
    });

    const topAbsent = Object.entries(studentAbsences)
      .map(([id, data]) => ({
        studentId: id,
        ...data,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        overall: {
          totalDays,
          totalStudents,
          totalRecords,
          totalPresent: hadir,
          percentage: Math.round(overallPercentage * 10) / 10,
        },
        byStatus: {
          HADIR: byStatus['HADIR'] || 0,
          ALFA: byStatus['ALFA'] || 0,
          SAKIT: byStatus['SAKIT'] || 0,
          IZIN: byStatus['IZIN'] || 0,
          TERLAMBAT: byStatus['TERLAMBAT'] || 0,
        },
        dailyTrend,
        topAbsent,
      },
      meta: {
        schoolId,
        classId: classId || 'all',
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Attendance statistik error:', error);
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
