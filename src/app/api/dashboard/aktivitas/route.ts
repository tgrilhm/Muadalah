import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

/**
 * GET /api/dashboard/aktivitas
 * Aktivitas terbaru dari semua modul
 */
export async function GET(_request: NextRequest) {
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

    // Ambil aktivitas terbaru dari beberapa modul secara paralel
    const [recentStudents, recentPayments, recentAttendances, recentGrades] = await Promise.all([
      // Siswa terbaru
      prisma.student.findMany({
        where: { class: { schoolId } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          name: true,
          createdAt: true,
          class: { select: { name: true } },
        },
      }),

      // Pembayaran terbaru
      prisma.payment.findMany({
        where: { student: { class: { schoolId } }, status: 'LUNAS' },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          updatedAt: true,
          amount: true,
          student: { select: { name: true } },
        },
      }),

      // Absensi terbaru (per record unik hari ini)
      prisma.attendance.findMany({
        where: { student: { class: { schoolId } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          date: true,
          createdAt: true,
          student: {
            select: { name: true, class: { select: { name: true } } },
          },
        },
      }),

      // Nilai terbaru
      prisma.grade.findMany({
        where: { student: { class: { schoolId } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          score: true,
          type: true,
          createdAt: true,
          student: { select: { name: true } },
          subject: { select: { name: true } },
        },
      }),
    ]);

    type ActivityWithDate = {
      id: string;
      type: string;
      action: string;
      detail: string;
      time: string;
      icon: string;
      createdAt: Date;
    };

    const activitiesWithDate: ActivityWithDate[] = [
      ...recentStudents.map((s) => ({
        id: `student-${s.id}`,
        type: 'student',
        action: 'Siswa baru ditambahkan',
        detail: `${s.name} — Kelas ${s.class.name}`,
        time: timeAgo(s.createdAt),
        icon: 'person_add',
        createdAt: s.createdAt,
      })),
      ...recentPayments.map((p) => ({
        id: `payment-${p.id}`,
        type: 'payment',
        action: 'Pembayaran SPP diterima',
        detail: `${p.student.name} — Rp ${p.amount.toLocaleString('id-ID')}`,
        time: timeAgo(p.updatedAt),
        icon: 'payments',
        createdAt: p.updatedAt,
      })),
      ...recentAttendances.map((a) => ({
        id: `attendance-${a.id}`,
        type: 'attendance',
        action: 'Absensi dicatat',
        detail: `${a.student.name} — Kelas ${a.student.class.name}`,
        time: timeAgo(a.createdAt),
        icon: 'assignment_turned_in',
        createdAt: a.createdAt,
      })),
      ...recentGrades.map((g) => ({
        id: `grade-${g.id}`,
        type: 'grade',
        action: 'Nilai diinput',
        detail: `${g.student.name} — ${g.subject.name} (${g.score})`,
        time: timeAgo(g.createdAt),
        icon: 'bar_chart',
        createdAt: g.createdAt,
      })),
    ];

    const activities = activitiesWithDate
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 8)
      .map(({ createdAt: _d, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      data: { data: activities },
    });
  } catch (error) {
    console.error('GET /api/dashboard/aktivitas error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
