import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bulkGradeInputSchema } from '@/lib/validations/grade.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/nilai/bulk
 * Input nilai satu kelas sekaligus untuk satu mata pelajaran dan satu jenis nilai
 *
 * Body:
 * {
 *   "classId": "string",
 *   "subjectId": "string",
 *   "semesterId": "string",
 *   "type": "ULANGAN_HARIAN | UTS | UAS | TUGAS | PRAKTIKUM | PROYEK",
 *   "date": "YYYY-MM-DD",
 *   "grades": [
 *     { "studentId": "string", "score": 0-100, "description": "string?" }
 *   ]
 * }
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
    const validation = bulkGradeInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Data tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { classId, subjectId, semesterId, type, date, grades } = validation.data;

    // Verify class exists in this school
    const classData = await prisma.class.findFirst({
      where: { id: classId, schoolId },
      include: {
        students: { select: { id: true }, where: { status: 'AKTIF' } },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Kelas tidak ditemukan' },
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

    // Verify semester exists
    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
    });

    if (!semester) {
      return NextResponse.json(
        { success: false, error: 'Semester tidak ditemukan' },
        { status: 404 }
      );
    }

    // Verify all students in the request belong to this class
    const classStudentIds = new Set(classData.students.map((s) => s.id));
    const invalidStudents = grades.filter((g) => !classStudentIds.has(g.studentId));

    if (invalidStudents.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Beberapa siswa tidak terdaftar di kelas ini',
          invalidStudentIds: invalidStudents.map((g) => g.studentId),
        },
        { status: 400 }
      );
    }

    const gradeDate = date ? new Date(date) : new Date();

    // Bulk create grade records in a transaction
    const result = await prisma.$transaction(
      grades.map((g) =>
        prisma.grade.create({
          data: {
            studentId: g.studentId,
            subjectId,
            semesterId,
            type,
            score: g.score,
            maxScore: 100,
            weight: 1,
            description: g.description ?? null,
            date: gradeDate,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `${result.length} data nilai berhasil disimpan`,
      data: {
        count: result.length,
        type,
        classId,
        subjectId,
        semesterId,
        date: gradeDate.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('POST /api/nilai/bulk error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
