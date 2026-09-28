import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { attendanceQuerySchema } from '@/lib/validations/attendance.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/absensi
 * List attendance records with filtering
 * 
 * Query params:
 * - studentId (optional)
 * - classId (optional)
 * - date (optional, YYYY-MM-DD)
 * - startDate (optional, YYYY-MM-DD)
 * - endDate (optional, YYYY-MM-DD)
 * - status (optional)
 * - semesterId (optional)
 * - page (optional, default: 1)
 * - limit (optional, default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    // Get schoolId from query parameter (required)
    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      return NextResponse.json(
        { success: false, error: 'schoolId is required' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      studentId: searchParams.get('studentId') || undefined,
      classId: searchParams.get('classId') || undefined,
      date: searchParams.get('date') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      status: searchParams.get('status') || undefined,
      semesterId: searchParams.get('semesterId') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const validation = attendanceQuerySchema.safeParse(queryParams);

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

    const {
      studentId,
      classId,
      date,
      startDate,
      endDate,
      status,
      semesterId,
      page,
      limit,
    } = validation.data;

    // Build where clause
    const whereClause: any = {
      student: {
        schoolId: schoolId,
      },
    };

    if (studentId) {
      whereClause.studentId = studentId;
    }

    if (classId) {
      whereClause.student.classId = classId;
    }

    if (date) {
      whereClause.date = new Date(date);
    } else if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (status) {
      whereClause.status = status;
    }

    if (semesterId) {
      whereClause.semesterId = semesterId;
    }

    // Calculate pagination
    const skip = ((page || 1) - 1) * (limit || 20);
    const take = Math.min(limit || 20, 100);

    // Fetch attendance records
    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              nis: true,
              classId: true,
            },
          },
          recordedBy: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take,
      }),
      prisma.attendance.count({ where: whereClause }),
    ]);

    // Format response
    const formattedData = attendances.map((att) => ({
      id: att.id,
      date: att.date.toISOString().split('T')[0],
      status: att.status,
      notes: att.notes,
      student: att.student,
      recordedBy: att.recordedBy,
      createdAt: att.createdAt,
    }));

    const totalPages = Math.ceil(total / take);

    return NextResponse.json({
      success: true,
      data: formattedData,
      meta: {
        page: page || 1,
        limit: take,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Attendance list error:', error);
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
