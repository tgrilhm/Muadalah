import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { statistikQuerySchema } from '@/lib/validations/grade.schema';
import { calculateFinalScore, calculateDistribution } from '@/lib/grade.utils';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/nilai/statistik
 * Statistik distribusi nilai untuk satu kelas + mapel + semester
 *
 * Query: ?classId=&subjectId=&semesterId=
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
    const validation = statistikQuerySchema.safeParse({
      classId: searchParams.get('classId'),
      subjectId: searchParams.get('subjectId') ?? undefined,
      semesterId: searchParams.get('semesterId'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { classId, subjectId, semesterId } = validation.data;

    // Verify class in this school
    const classData = await prisma.class.findFirst({
      where: { id: classId, schoolId },
      include: {
        students: {
          where: { status: 'AKTIF' },
          select: { id: true, name: true },
        },
      },
    });

    if (!classData) {
      return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    // Get all grades for class + semester
    const allGrades = await prisma.grade.findMany({
      where: {
        semesterId,
        ...(subjectId ? { subjectId } : {}),
        student: { classId },
      },
      include: {
        student: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    // Get unique subjects from the grades
    const subjectMap = new Map<string, { id: string; name: string; code: string }>();
    for (const grade of allGrades) {
      if (!subjectMap.has(grade.subjectId)) {
        subjectMap.set(grade.subjectId, grade.subject);
      }
    }
    const subjects = Array.from(subjectMap.values());

    // Calculate stats per subject
    const subjectStats = subjects.map((subject) => {
      const subjectGrades = allGrades.filter((g) => g.subjectId === subject.id);

      // Calculate final scores per student for this subject
      const studentIds = new Set(classData.students.map((s) => s.id));
      const finalScores: number[] = [];

      for (const studentId of studentIds) {
        const studentGrades = subjectGrades.filter((g) => g.studentId === studentId);
        if (studentGrades.length > 0) {
          const result = calculateFinalScore(studentGrades);
          if (result.finalScore > 0) {
            finalScores.push(result.finalScore);
          }
        }
      }

      const distribution = calculateDistribution(finalScores);
      const avg = finalScores.length > 0
        ? Math.round((finalScores.reduce((a, b) => a + b, 0) / finalScores.length) * 10) / 10
        : 0;
      const highest = finalScores.length > 0 ? Math.max(...finalScores) : 0;
      const lowest = finalScores.length > 0 ? Math.min(...finalScores) : 0;
      const belowKKM = finalScores.filter((s) => s < 70).length;

      return {
        subject,
        totalStudents: finalScores.length,
        average: avg,
        highest,
        lowest,
        belowKKM,
        belowKKMPercentage: finalScores.length > 0 ? Math.round((belowKKM / finalScores.length) * 100) : 0,
        distribution,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        class: { id: classData.id, name: classData.name, grade: classData.grade },
        semesterId,
        subjects: subjectStats,
      },
    });
  } catch (error) {
    console.error('GET /api/nilai/statistik error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
