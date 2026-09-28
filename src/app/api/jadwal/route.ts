import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scheduleQuerySchema, createScheduleSchema } from '@/lib/validations/schedule.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * Helper: time range overlap check
 * Returns true if [s1, e1) overlaps with [s2, e2)
 * String comparison is valid for zero-padded HH:MM format.
 */
function hasTimeOverlap(
  s1: string,
  e1: string,
  s2: string,
  e2: string
): boolean {
  return s1 < e2 && e1 > s2;
}

/**
 * GET /api/jadwal
 * Daftar jadwal pelajaran dengan filter dan pagination
 *
 * Query params: classId, dayOfWeek, subjectId, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId');
    
    const rawParams = {
      classId: searchParams.get('classId') ?? undefined,
      dayOfWeek: searchParams.get('dayOfWeek') ?? undefined,
      subjectId: searchParams.get('subjectId') ?? undefined,
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '100',
    };

    const validation = scheduleQuerySchema.safeParse(rawParams);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { classId, dayOfWeek, subjectId, page, limit } = validation.data;
    const skip = (page - 1) * limit;

    // Build where clause — always scoped by schoolId
    const where = {
      class: {
        schoolId,
        ...(classId ? { id: classId } : {}),
      },
      ...(dayOfWeek ? { dayOfWeek } : {}),
      ...(subjectId ? { subjectId } : {}),
    };

    const [schedules, total] = await prisma.$transaction([
      prisma.schedule.findMany({
        where,
        include: {
          class: {
            select: { id: true, name: true, grade: true, major: true },
          },
          subject: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.schedule.count({ where }),
    ]);

    // Enrich with teacher info via ClassSubject
    const enriched = await Promise.all(
      schedules.map(async (schedule) => {
        const classSubject = await prisma.classSubject.findFirst({
          where: {
            classId: schedule.classId,
            subjectId: schedule.subjectId,
          },
          include: {
            teacher: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        });
        return {
          ...schedule,
          teacher: classSubject?.teacher
            ? {
                id: classSubject.teacher.id,
                user: classSubject.teacher.user,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/jadwal error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jadwal
 * Buat jadwal baru
 */
export async function POST(request: NextRequest) {
  try {
    const bypassAuth = process.env.NODE_ENV === 'development';
    let schoolId = '';

    if (!bypassAuth) {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        include: { schoolUsers: { select: { schoolId: true, role: true } } },
      });

      if (!dbUser || dbUser.schoolUsers.length === 0) {
        return NextResponse.json(
          { success: false, error: 'User tidak terdaftar di sekolah manapun' },
          { status: 403 }
        );
      }

      const schoolUser = dbUser.schoolUsers[0];
      const allowedRoles = ['ADMIN', 'KEPALA_SEKOLAH', 'GURU'];
      if (!allowedRoles.includes(schoolUser.role)) {
        return NextResponse.json(
          { success: false, error: 'Tidak memiliki izin untuk membuat jadwal' },
          { status: 403 }
        );
      }
      schoolId = schoolUser.schoolId;
    } else {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      schoolId = firstSchool?.id ?? '';
    }

    const body = await request.json();
    const validation = createScheduleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Data tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { classId, subjectId, dayOfWeek, startTime, endTime, room } = validation.data;

    // Verify class belongs to this school
    const classRecord = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });
    if (!classRecord) {
      return NextResponse.json(
        { success: false, error: 'Kelas tidak ditemukan di sekolah ini' },
        { status: 404 }
      );
    }

    // Verify subject belongs to this school
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId },
    });
    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Mata pelajaran tidak ditemukan di sekolah ini' },
        { status: 404 }
      );
    }

    // Verify subject is assigned to this class via ClassSubject
    const classSubject = await prisma.classSubject.findFirst({
      where: { classId, subjectId },
      include: {
        teacher: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!classSubject) {
      return NextResponse.json(
        {
          success: false,
          error: `Mata pelajaran "${subject.name}" belum diassign ke kelas ini. Silakan assign terlebih dahulu di menu Manajemen Kelas.`,
        },
        { status: 422 }
      );
    }

    // ---- Conflict Detection ----

    // 1. Class conflict: same class, same day, overlapping time
    const classConflicts = await prisma.schedule.findMany({
      where: { classId, dayOfWeek },
      include: { subject: { select: { name: true } } },
    });

    for (const conflict of classConflicts) {
      if (hasTimeOverlap(startTime, endTime, conflict.startTime, conflict.endTime)) {
        return NextResponse.json(
          {
            success: false,
            error: `Konflik jadwal: kelas sudah memiliki pelajaran "${conflict.subject.name}" pada ${dayOfWeek} ${conflict.startTime}–${conflict.endTime}`,
          },
          { status: 409 }
        );
      }
    }

    // 2. Teacher conflict: same teacher, same day, overlapping time
    const teacherId = classSubject.teacherId;
    const allTeacherSchedules = await prisma.schedule.findMany({
      where: {
        dayOfWeek,
        class: { schoolId },
        subject: {
          classSubjects: {
            some: { teacherId },
          },
        },
      },
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
      },
    });

    for (const ts of allTeacherSchedules) {
      if (hasTimeOverlap(startTime, endTime, ts.startTime, ts.endTime)) {
        return NextResponse.json(
          {
            success: false,
            error: `Konflik jadwal guru: ${classSubject.teacher.user.name} sudah mengajar "${ts.subject.name}" di kelas ${ts.class.name} pada ${dayOfWeek} ${ts.startTime}–${ts.endTime}`,
          },
          { status: 409 }
        );
      }
    }

    // ---- Create Schedule ----
    const schedule = await prisma.schedule.create({
      data: {
        classId,
        subjectId,
        dayOfWeek,
        startTime,
        endTime,
        room: room ?? null,
      },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...schedule,
          teacher: {
            id: classSubject.teacher.id,
            user: classSubject.teacher.user,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/jadwal error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
