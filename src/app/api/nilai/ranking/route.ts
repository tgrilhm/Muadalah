import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rankingQuerySchema } from '@/lib/validations/grade.schema';
import { calculateFinalScore } from '@/lib/grade.utils';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/nilai/ranking
 * Ranking siswa dalam satu kelas berdasarkan rata-rata nilai akhir semua mapel
 *
 * Query: ?classId=&semesterId=
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
    const validation = rankingQuerySchema.safeParse({
      classId: searchParams.get('classId'),
      semesterId: searchParams.get('semesterId'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { classId, semesterId } = validation.data;

    // Verify class in this school
    const classData = await prisma.class.findFirst({
      where: { id: classId, schoolId },
      include: {
        students: {
          where: { status: 'AKTIF' },
          select: { id: true, name: true, nis: true, photo: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!classData) {
      return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    // Get semester info
    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
      include: { academicYear: { select: { name: true } } },
    });

    if (!semester) {
      return NextResponse.json({ success: false, error: 'Semester tidak ditemukan' }, { status: 404 });
    }

    // Get all grades for this class + semester in one query (avoid N+1)
    const allGrades = await prisma.grade.findMany({
      where: {
        semesterId,
        student: { classId },
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    // Get unique subjects
    const subjectMap = new Map<string, { id: string; name: string; code: string }>();
    for (const grade of allGrades) {
      if (!subjectMap.has(grade.subjectId)) {
        subjectMap.set(grade.subjectId, grade.subject);
      }
    }
    const subjects = Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Calculate per-student data
    const studentRankings = classData.students.map((student) => {
      const studentGrades = allGrades.filter((g) => g.studentId === student.id);

      // Group by subject and calculate final score for each
      const subjectScores: Record<string, number | null> = {};
      let totalFinalScore = 0;
      let completedSubjects = 0;

      for (const subject of subjects) {
        const subjectGrades = studentGrades.filter((g) => g.subjectId === subject.id);
        if (subjectGrades.length === 0) {
          subjectScores[subject.id] = null;
        } else {
          const result = calculateFinalScore(subjectGrades);
          subjectScores[subject.id] = result.finalScore;
          totalFinalScore += result.finalScore;
          completedSubjects++;
        }
      }

      const averageScore =
        completedSubjects > 0
          ? Math.round((totalFinalScore / completedSubjects) * 10) / 10
          : 0;

      return {
        studentId: student.id,
        studentName: student.name,
        nis: student.nis,
        photo: student.photo,
        averageScore,
        subjectScores,
        completedSubjects,
        totalSubjects: subjects.length,
      };
    });

    // Sort by averageScore descending and assign rank
    const sorted = [...studentRankings].sort((a, b) => b.averageScore - a.averageScore);
    const ranked = sorted.map((student, index) => ({
      ...student,
      rank: index + 1,
    }));

    return NextResponse.json({
      success: true,
      data: {
        class: {
          id: classData.id,
          name: classData.name,
          grade: classData.grade,
        },
        semester: {
          id: semester.id,
          name: semester.name,
          number: semester.number,
          academicYear: semester.academicYear.name,
        },
        subjects,
        ranking: ranked,
        totalStudents: ranked.length,
      },
    });
  } catch (error) {
    console.error('GET /api/nilai/ranking error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
