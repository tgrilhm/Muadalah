import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateScheduleSchema } from '@/lib/validations/schedule.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * Helper: time range overlap check
 * Returns true if [s1, e1) overlaps with [s2, e2)
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
 * GET /api/jadwal/:id
 * Detail jadwal pelajaran
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        include: { schoolUsers: { select: { schoolId: true } } },
      });

      if (!dbUser || dbUser.schoolUsers.length === 0) {
        return NextResponse.json(
          { success: false, error: 'User tidak terdaftar di sekolah manapun' },
          { status: 403 }
        );
      }
      schoolId = dbUser.schoolUsers[0].schoolId;
    } else {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      schoolId = firstSchool?.id ?? '';
    }

    const schedule = await prisma.schedule.findFirst({
      where: { id, class: { schoolId } },
      include: {
        class: { select: { id: true, name: true, grade: true, major: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: 'Jadwal tidak ditemukan' },
        { status: 404 }
      );
    }

    // Enrich with teacher info
    const classSubject = await prisma.classSubject.findFirst({
      where: { classId: schedule.classId, subjectId: schedule.subjectId },
      include: {
        teacher: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...schedule,
        teacher: classSubject?.teacher
          ? { id: classSubject.teacher.id, user: classSubject.teacher.user }
          : null,
      },
    });
  } catch (error) {
    console.error('GET /api/jadwal/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/jadwal/:id
 * Update jadwal pelajaran (partial update)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
          { success: false, error: 'Tidak memiliki izin untuk mengubah jadwal' },
          { status: 403 }
        );
      }
      schoolId = schoolUser.schoolId;
    } else {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      schoolId = firstSchool?.id ?? '';
    }

    // Verify schedule exists and belongs to this school
    const existing = await prisma.schedule.findFirst({
      where: { id, class: { schoolId } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Jadwal tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateScheduleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Data tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Merge with existing values for conflict detection
    const effectiveClassId = updateData.classId ?? existing.classId;
    const effectiveSubjectId = updateData.subjectId ?? existing.subjectId;
    const effectiveDayOfWeek = updateData.dayOfWeek ?? existing.dayOfWeek;
    const effectiveStartTime = updateData.startTime ?? existing.startTime;
    const effectiveEndTime = updateData.endTime ?? existing.endTime;

    // Validate class belongs to school if classId is changing
    if (updateData.classId) {
      const classRecord = await prisma.class.findFirst({
        where: { id: updateData.classId, schoolId },
      });
      if (!classRecord) {
        return NextResponse.json(
          { success: false, error: 'Kelas tidak ditemukan di sekolah ini' },
          { status: 404 }
        );
      }
    }

    // Validate subject belongs to school if subjectId is changing
    if (updateData.subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: updateData.subjectId, schoolId },
      });
      if (!subject) {
        return NextResponse.json(
          { success: false, error: 'Mata pelajaran tidak ditemukan di sekolah ini' },
          { status: 404 }
        );
      }
    }

    // Check ClassSubject assignment
    const classSubject = await prisma.classSubject.findFirst({
      where: { classId: effectiveClassId, subjectId: effectiveSubjectId },
      include: {
        teacher: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (!classSubject) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mata pelajaran belum diassign ke kelas ini. Silakan assign di menu Manajemen Kelas.',
        },
        { status: 422 }
      );
    }

    // ---- Conflict Detection (exclude current schedule id) ----

    // 1. Class conflict
    const classConflicts = await prisma.schedule.findMany({
      where: {
        classId: effectiveClassId,
        dayOfWeek: effectiveDayOfWeek,
        id: { not: id },
      },
      include: { subject: { select: { name: true } } },
    });

    for (const conflict of classConflicts) {
      if (
        hasTimeOverlap(
          effectiveStartTime,
          effectiveEndTime,
          conflict.startTime,
          conflict.endTime
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Konflik jadwal: kelas sudah memiliki pelajaran "${conflict.subject.name}" pada ${effectiveDayOfWeek} ${conflict.startTime}–${conflict.endTime}`,
          },
          { status: 409 }
        );
      }
    }

    // 2. Teacher conflict
    const teacherId = classSubject.teacherId;
    const allTeacherSchedules = await prisma.schedule.findMany({
      where: {
        dayOfWeek: effectiveDayOfWeek,
        id: { not: id },
        class: { schoolId },
        subject: {
          classSubjects: { some: { teacherId } },
        },
      },
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
      },
    });

    for (const ts of allTeacherSchedules) {
      if (
        hasTimeOverlap(
          effectiveStartTime,
          effectiveEndTime,
          ts.startTime,
          ts.endTime
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Konflik jadwal guru: ${classSubject.teacher.user.name} sudah mengajar "${ts.subject.name}" di kelas ${ts.class.name} pada ${effectiveDayOfWeek} ${ts.startTime}–${ts.endTime}`,
          },
          { status: 409 }
        );
      }
    }

    // ---- Update Schedule ----
    const updated = await prisma.schedule.update({
      where: { id },
      data: {
        ...(updateData.classId ? { classId: updateData.classId } : {}),
        ...(updateData.subjectId ? { subjectId: updateData.subjectId } : {}),
        ...(updateData.dayOfWeek ? { dayOfWeek: updateData.dayOfWeek } : {}),
        ...(updateData.startTime ? { startTime: updateData.startTime } : {}),
        ...(updateData.endTime ? { endTime: updateData.endTime } : {}),
        ...(Object.prototype.hasOwnProperty.call(updateData, 'room')
          ? { room: updateData.room ?? null }
          : {}),
      },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        teacher: {
          id: classSubject.teacher.id,
          user: classSubject.teacher.user,
        },
      },
    });
  } catch (error) {
    console.error('PATCH /api/jadwal/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jadwal/:id
 * Hapus jadwal pelajaran (hard delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
          { success: false, error: 'Tidak memiliki izin untuk menghapus jadwal' },
          { status: 403 }
        );
      }
      schoolId = schoolUser.schoolId;
    } else {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      schoolId = firstSchool?.id ?? '';
    }

    // Verify schedule belongs to this school
    const schedule = await prisma.schedule.findFirst({
      where: { id, class: { schoolId } },
      include: { subject: { select: { name: true } } },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: 'Jadwal tidak ditemukan' },
        { status: 404 }
      );
    }

    await prisma.schedule.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Jadwal berhasil dihapus' });
  } catch (error) {
    console.error('DELETE /api/jadwal/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
