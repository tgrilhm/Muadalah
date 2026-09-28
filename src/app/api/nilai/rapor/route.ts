import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { raporQuerySchema } from '@/lib/validations/grade.schema';
import { calculateFinalScore } from '@/lib/grade.utils';
import { createClient } from '@/lib/supabase/server';
import { GradeType } from '@prisma/client';

/**
 * GET /api/nilai/rapor
 * Kalkulasi rapor (nilai akhir berbobot) per mapel untuk satu siswa di satu semester
 *
 * Query: ?studentId=&semesterId=
 *
 * Return:
 * {
 *   student: { id, name, nis, class },
 *   semester: { id, name, number },
 *   subjects: [
 *     {
 *       subject: { id, name, code },
 *       grades: [...],
 *       finalScore: number,
 *       avgUH: number,
 *       utsScore: number,
 *       uasScore: number,
 *       isComplete: boolean,
 *     }
 *   ],
 *   overallAverage: number
 * }
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

    const searchParams = request.nextUrl.searchParams;
    const validation = raporQuerySchema.safeParse({
      studentId: searchParams.get('studentId'),
      semesterId: searchParams.get('semesterId'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { studentId, semesterId } = validation.data;

    // Get student data
    const student = await prisma.student.findFirst({
      where: { id: studentId, class: { schoolId } },
      include: {
        class: { select: { id: true, name: true, grade: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    // Get semester
    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
      include: { academicYear: { select: { name: true } } },
    });

    if (!semester) {
      return NextResponse.json({ success: false, error: 'Semester tidak ditemukan' }, { status: 404 });
    }

    // Get all grades for this student in this semester
    const grades = await prisma.grade.findMany({
      where: { studentId, semesterId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ subject: { name: 'asc' } }, { date: 'asc' }],
    });

    // Group by subject
    const subjectMap = new Map<
      string,
      {
        subject: { id: string; name: string; code: string };
        grades: Array<{ type: GradeType; score: number; id: string; date: Date; description: string | null }>;
      }
    >();

    for (const grade of grades) {
      const key = grade.subjectId;
      if (!subjectMap.has(key)) {
        subjectMap.set(key, { subject: grade.subject, grades: [] });
      }
      subjectMap.get(key)!.grades.push({
        type: grade.type,
        score: grade.score,
        id: grade.id,
        date: grade.date,
        description: grade.description,
      });
    }

    // Calculate final score per subject
    const subjects = Array.from(subjectMap.values()).map(({ subject, grades: subjectGrades }) => {
      const result = calculateFinalScore(subjectGrades);
      return {
        subject,
        grades: subjectGrades,
        finalScore: result.finalScore,
        avgUH: result.avgUH,
        utsScore: result.utsScore,
        uasScore: result.uasScore,
        isComplete: result.isComplete,
        gradeLabel: result.finalScore >= 90 ? 'A' : result.finalScore >= 80 ? 'B' : result.finalScore >= 70 ? 'C' : 'D',
      };
    });

    // Overall average (only from completed subjects)
    const completedSubjects = subjects.filter((s) => s.isComplete);
    const overallAverage =
      completedSubjects.length > 0
        ? Math.round(
            (completedSubjects.reduce((sum, s) => sum + s.finalScore, 0) / completedSubjects.length) * 10
          ) / 10
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.name,
          nis: student.nis,
          photo: student.photo,
          class: student.class,
        },
        semester: {
          id: semester.id,
          name: semester.name,
          number: semester.number,
          academicYear: semester.academicYear.name,
        },
        subjects,
        overallAverage,
        totalSubjects: subjects.length,
        completedSubjects: completedSubjects.length,
      },
    });
  } catch (error) {
    console.error('GET /api/nilai/rapor error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
