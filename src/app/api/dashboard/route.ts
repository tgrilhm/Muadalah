import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dashboard
 * Aggregate statistik utama untuk dashboard
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
        return NextResponse.json({ success: false, error: 'User tidak terdaftar di sekolah' }, { status: 403 });
      }
      schoolId = dbUser.schoolUsers[0].schoolId;
    } else {
      const school = await prisma.school.findFirst({ select: { id: true } });
      schoolId = school?.id ?? '';
    }

    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Run semua query secara paralel untuk performa
    const [
      totalSiswaAktif,
      totalKelas,
      kehadiranHariIni,
      gradeAggregate,
      activeSemester,
      paymentSetting,
      totalSiswaForSPP,
      totalTerkumpul,
      siswaSudahBayar,
    ] = await Promise.all([
      // 1. Total siswa aktif
      prisma.student.count({
        where: { status: 'AKTIF', class: { schoolId } },
      }),

      // 2. Total kelas
      prisma.class.count({ where: { schoolId } }),

      // 3. Kehadiran hari ini
      prisma.attendance.findMany({
        where: {
          date: today,
          student: { class: { schoolId } },
        },
        select: { status: true },
      }),

      // 4. Rata-rata nilai semester berjalan
      prisma.grade.aggregate({
        where: {
          student: { class: { schoolId }, status: 'AKTIF' },
          semester: { isActive: true },
        },
        _avg: { score: true },
      }),

      // 5. Semester aktif
      prisma.semester.findFirst({
        where: { isActive: true },
        select: { id: true, name: true },
      }),

      // 6. Setting SPP
      prisma.paymentSetting.findFirst({
        where: { schoolId, type: 'SPP' },
      }),

      // 7. Siswa aktif untuk SPP
      prisma.student.count({
        where: { status: 'AKTIF', class: { schoolId } },
      }),

      // 8. Total terkumpul SPP bulan ini
      prisma.payment.aggregate({
        where: {
          type: 'SPP',
          month: currentMonth,
          year: currentYear,
          status: 'LUNAS',
          student: { class: { schoolId } },
        },
        _sum: { amount: true },
      }),

      // 9. Siswa sudah bayar SPP bulan ini
      prisma.payment.count({
        where: {
          type: 'SPP',
          month: currentMonth,
          year: currentYear,
          status: 'LUNAS',
          student: { class: { schoolId } },
        },
      }),
    ]);

    // Hitung kehadiran hari ini
    const hadirCount = kehadiranHariIni.filter((a) => a.status === 'HADIR').length;
    const totalKehadiran = kehadiranHariIni.length;
    const persentaseKehadiran = totalKehadiran > 0
      ? Math.round((hadirCount / totalKehadiran) * 100 * 10) / 10
      : 0;

    // Hitung SPP
    const nominalSPP = paymentSetting?.amount ?? 0;
    const totalTarget = totalSiswaForSPP * nominalSPP;
    const totalTerkumpulVal = totalTerkumpul._sum.amount ?? 0;
    const persentaseSPP = totalTarget > 0
      ? Math.round((totalTerkumpulVal / totalTarget) * 100)
      : 0;

    // Siswa bermasalah: kehadiran < 75% pada semester aktif
    // Ambil siswa aktif beserta jumlah kehadiran dan total absensi
    let siswaBermasalah: Array<{
      id: string;
      name: string;
      kelas: string;
      persentaseKehadiran: number;
    }> = [];

    if (activeSemester) {
      const siswaAktif = await prisma.student.findMany({
        where: { status: 'AKTIF', class: { schoolId } },
        select: {
          id: true,
          name: true,
          class: { select: { name: true } },
          attendances: {
            where: { semesterId: activeSemester.id },
            select: { status: true },
          },
        },
        take: 200, // limit untuk performa
      });

      siswaBermasalah = siswaAktif
        .filter((s) => {
          if (s.attendances.length === 0) return false;
          const hadir = s.attendances.filter((a) => a.status === 'HADIR').length;
          return (hadir / s.attendances.length) * 100 < 75;
        })
        .map((s) => {
          const hadir = s.attendances.filter((a) => a.status === 'HADIR').length;
          return {
            id: s.id,
            name: s.name,
            kelas: s.class.name,
            persentaseKehadiran: Math.round((hadir / s.attendances.length) * 100),
          };
        })
        .sort((a, b) => a.persentaseKehadiran - b.persentaseKehadiran)
        .slice(0, 5);
    }

    return NextResponse.json({
      success: true,
      data: {
        totalSiswaAktif,
        totalKelas,
        kehadiranHariIni: {
          persentase: persentaseKehadiran,
          hadir: hadirCount,
          tidakHadir: totalKehadiran - hadirCount,
          total: totalKehadiran,
          tanggal: today.toISOString().split('T')[0],
        },
        rataRataNilai: {
          rataRata: Math.round((gradeAggregate._avg.score ?? 0) * 10) / 10,
          semesterId: activeSemester?.id ?? null,
          semesterName: activeSemester?.name ?? null,
        },
        sppBulanIni: {
          terkumpul: totalTerkumpulVal,
          target: totalTarget,
          persentase: persentaseSPP,
        },
        siswaBermasalah: {
          count: siswaBermasalah.length,
          list: siswaBermasalah,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
