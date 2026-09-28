import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dashboard/nilai
 * Data distribusi nilai & top performers untuk dashboard
 * Query params: semesterId? (default: semester aktif)
 */
export async function GET(request: NextRequest) {
  try {
    const bypassAuth = process.env.NODE_ENV === 'development';
    let schoolId = '';

    if (!bypassAuth) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        include: { schoolUsers: true },
      });
      if (!dbUser || dbUser.schoolUsers.length === 0) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
      schoolId = dbUser.schoolUsers[0].schoolId;
    } else {
      const school = await prisma.school.findFirst({ select: { id: true } });
      schoolId = school?.id ?? '';
    }

    const searchParams = request.nextUrl.searchParams;
    const semesterIdParam = searchParams.get('semesterId');

    // Cari semester aktif jika tidak diberikan
    const semester = semesterIdParam
      ? await prisma.semester.findUnique({ where: { id: semesterIdParam }, select: { id: true, name: true } })
      : await prisma.semester.findFirst({ where: { isActive: true }, select: { id: true, name: true } });

    if (!semester) {
      return NextResponse.json({
        success: true,
        data: {
          distribusi: [],
          topPerformers: [],
          semesterId: null,
        },
      });
    }

    // Fetch semua nilai semester ini
    const grades = await prisma.grade.findMany({
      where: {
        semesterId: semester.id,
        student: { class: { schoolId }, status: 'AKTIF' },
      },
      select: {
        score: true,
        maxScore: true,
        studentId: true,
        student: {
          select: {
            id: true,
            name: true,
            photo: true,
            class: { select: { name: true } },
          },
        },
      },
    });

    // Hitung rata-rata per siswa
    const byStudent: Record<string, {
      id: string;
      name: string;
      photo: string | null;
      kelas: string;
      totalScore: number;
      totalMax: number;
      count: number;
    }> = {};

    grades.forEach((g) => {
      const normalized = (g.score / g.maxScore) * 100;
      if (!byStudent[g.studentId]) {
        byStudent[g.studentId] = {
          id: g.student.id,
          name: g.student.name,
          photo: g.student.photo,
          kelas: g.student.class.name,
          totalScore: 0,
          totalMax: 0,
          count: 0,
        };
      }
      byStudent[g.studentId].totalScore += normalized;
      byStudent[g.studentId].count++;
    });

    const studentAverages = Object.values(byStudent).map((s) => ({
      id: s.id,
      name: s.name,
      photo: s.photo,
      kelas: s.kelas,
      rataRata: s.count > 0 ? Math.round((s.totalScore / s.count) * 10) / 10 : 0,
    })).sort((a, b) => b.rataRata - a.rataRata);

    // Top 4 performers
    const topPerformers = studentAverages.slice(0, 4).map((s, idx) => ({
      ...s,
      ranking: idx + 1,
    }));

    // Distribusi nilai
    const ranges = [
      { range: '< 60', min: 0, max: 59 },
      { range: '60–69', min: 60, max: 69 },
      { range: '70–79', min: 70, max: 79 },
      { range: '80–89', min: 80, max: 89 },
      { range: '≥ 90', min: 90, max: 100 },
    ];

    const totalStudents = studentAverages.length;
    const distribusi = ranges.map(({ range, min, max }) => {
      const count = studentAverages.filter(
        (s) => s.rataRata >= min && s.rataRata <= max
      ).length;
      return {
        range,
        count,
        persentase: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        distribusi,
        topPerformers,
        semesterId: semester.id,
        semesterName: semester.name,
      },
    });
  } catch (error) {
    console.error('GET /api/dashboard/nilai error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
