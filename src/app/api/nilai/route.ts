import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { gradeQuerySchema, createGradeSchema } from '@/lib/validations/grade.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/nilai
 * Daftar nilai dengan filter dan pagination
 *
 * Query params: studentId, classId, subjectId, semesterId, type, page, limit
 */
export async function GET(request: NextRequest) {
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
        include: { schoolUsers: true },
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
      studentId: searchParams.get('studentId') ?? undefined,
      classId: searchParams.get('classId') ?? undefined,
      subjectId: searchParams.get('subjectId') ?? undefined,
      semesterId: searchParams.get('semesterId') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '50',
    };

    const validation = gradeQuerySchema.safeParse(rawParams);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { studentId, classId, subjectId, semesterId, type, page, limit } = validation.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      student: {
        ...(studentId ? { id: studentId } : {}),
        ...(classId ? { classId } : {}),
        class: { schoolId },
      },
      ...(subjectId ? { subjectId } : {}),
      ...(semesterId ? { semesterId } : {}),
      ...(type ? { type } : {}),
    };

    const [grades, total] = await prisma.$transaction([
      prisma.grade.findMany({
        where,
        include: {
          student: {
            select: { id: true, name: true, nis: true, photo: true },
          },
          subject: {
            select: { id: true, name: true, code: true },
          },
          semester: {
            select: { id: true, name: true, number: true },
          },
        },
        orderBy: [{ student: { name: 'asc' } }, { date: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.grade.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: grades,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/nilai error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nilai
 * Input nilai satu siswa
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
        include: { schoolUsers: true },
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

    const body = await request.json();
    const validation = createGradeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Data tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { studentId, subjectId, semesterId, type, score, maxScore, weight, description, date } =
      validation.data;

    // Verify student exists in this school
    const student = await prisma.student.findFirst({
      where: { id: studentId, class: { schoolId } },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    // Verify subject belongs to this school
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId },
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Mata pelajaran tidak ditemukan' },
        { status: 404 }
      );
    }

    const grade = await prisma.grade.create({
      data: {
        studentId,
        subjectId,
        semesterId,
        type,
        score,
        maxScore: maxScore ?? 100,
        weight: weight ?? 1,
        description: description ?? null,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        student: { select: { id: true, name: true, nis: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, data: grade }, { status: 201 });
  } catch (error) {
    console.error('POST /api/nilai error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
