import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { laporanSummaryQuerySchema } from '@/lib/validations/laporan.schema';
import { AttendanceStatus } from '@prisma/client';

/**
 * GET /api/laporan
 * Data ringkasan untuk halaman laporan
 *
 * Returns:
 * - stats: total siswa, rata-rata nilai, tingkat kehadiran, penyelesaian SPP
 * - nilaiDistribusi: rata-rata nilai per grade/kelas
 * - kehadiranBreakdown: hadir/sakit/izin/alfa count & percent
 * - semesterInfo: info semester aktif
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
    const validation = laporanSummaryQuerySchema.safeParse({
      semesterId: searchParams.get('semesterId') ?? undefined,
      classId: searchParams.get('classId') ?? undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { semesterId: semesterIdParam } = validation.data;

    // Ambil semester aktif jika tidak ada parameter
    let activeSemester = null;
    if (semesterIdParam) {
      activeSemester = await prisma.semester.findUnique({
        where: { id: semesterIdParam },
        include: { academicYear: { select: { name: true, schoolId: true } } },
      });
    } else {
      activeSemester = await prisma.semester.findFirst({
        where: { isActive: true, academicYear: { schoolId } },
        include: { academicYear: { select: { name: true, schoolId: true } } },
        orderBy: { startDate: 'desc' },
      });
    }

    const semesterId = activeSemester?.id;

    // 1. Total siswa aktif
    const totalSiswa = await prisma.student.count({
      where: { status: 'AKTIF', class: { schoolId } },
    });

    // 2. Rata-rata nilai (dari semester aktif)
    let rataRataNilai = 0;
    if (semesterId) {
      const avgResult = await prisma.grade.aggregate({
        where: {
          semesterId,
          student: { class: { schoolId } },
        },
        _avg: { score: true },
      });
      rataRataNilai = Math.round((avgResult._avg.score ?? 0) * 10) / 10;
    }

    // 3. Tingkat kehadiran (semester aktif)
    let tingkatKehadiran = 0;
    let kehadiranBreakdown = {
      hadir: 0,
      sakit: 0,
      izin: 0,
      alfa: 0,
      terlambat: 0,
      total: 0,
    };

    if (semesterId) {
      const kehadiranStats = await prisma.attendance.groupBy({
        by: ['status'],
        where: {
          semesterId,
          student: { class: { schoolId } },
        },
        _count: { status: true },
      });

      for (const stat of kehadiranStats) {
        const count = stat._count.status;
        kehadiranBreakdown.total += count;

        switch (stat.status) {
          case AttendanceStatus.HADIR:
            kehadiranBreakdown.hadir = count;
            break;
          case AttendanceStatus.SAKIT:
            kehadiranBreakdown.sakit = count;
            break;
          case AttendanceStatus.IZIN:
            kehadiranBreakdown.izin = count;
            break;
          case AttendanceStatus.ALFA:
            kehadiranBreakdown.alfa = count;
            break;
          case AttendanceStatus.TERLAMBAT:
            kehadiranBreakdown.terlambat = count;
            break;
        }
      }

      if (kehadiranBreakdown.total > 0) {
        tingkatKehadiran =
          Math.round(
            ((kehadiranBreakdown.hadir + kehadiranBreakdown.terlambat) /
              kehadiranBreakdown.total) *
              1000
          ) / 10;
      }
    }

    // 4. Penyelesaian SPP (bulan ini)
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const totalPembayaranBulanIni = await prisma.payment.count({
      where: {
        month: currentMonth,
        year: currentYear,
        student: { class: { schoolId } },
      },
    });

    const lunasBulanIni = await prisma.payment.count({
      where: {
        month: currentMonth,
        year: currentYear,
        status: 'LUNAS',
        student: { class: { schoolId } },
      },
    });

    const penyelesaianSPP =
      totalPembayaranBulanIni > 0
        ? Math.round((lunasBulanIni / totalPembayaranBulanIni) * 100)
        : 0;

    // 5. Distribusi nilai per grade kelas
    const kelas = await prisma.class.findMany({
      where: { schoolId },
      select: { id: true, name: true, grade: true },
      orderBy: { grade: 'asc' },
    });

    const nilaiDistribusi = [];
    for (const k of kelas) {
      let avg = 0;
      if (semesterId) {
        const result = await prisma.grade.aggregate({
          where: {
            semesterId,
            student: { classId: k.id },
          },
          _avg: { score: true },
        });
        avg = Math.round((result._avg.score ?? 0) * 10) / 10;
      }
      nilaiDistribusi.push({
        kelasId: k.id,
        kelasName: k.name,
        grade: k.grade,
        rataRata: avg,
      });
    }

    // Hitung percentage untuk kehadiran breakdown
    const kehadiranPercentage = {
      hadir:
        kehadiranBreakdown.total > 0
          ? Math.round((kehadiranBreakdown.hadir / kehadiranBreakdown.total) * 100)
          : 0,
      sakit:
        kehadiranBreakdown.total > 0
          ? Math.round((kehadiranBreakdown.sakit / kehadiranBreakdown.total) * 100)
          : 0,
      izin:
        kehadiranBreakdown.total > 0
          ? Math.round((kehadiranBreakdown.izin / kehadiranBreakdown.total) * 100)
          : 0,
      alfa:
        kehadiranBreakdown.total > 0
          ? Math.round((kehadiranBreakdown.alfa / kehadiranBreakdown.total) * 100)
          : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        semester: activeSemester
          ? {
              id: activeSemester.id,
              name: activeSemester.name,
              academicYear: activeSemester.academicYear.name,
            }
          : null,
        stats: {
          totalSiswa,
          rataRataNilai,
          tingkatKehadiran,
          penyelesaianSPP,
        },
        kehadiranBreakdown: {
          ...kehadiranBreakdown,
          percentage: kehadiranPercentage,
        },
        nilaiDistribusi,
        bulanIni: {
          month: currentMonth,
          year: currentYear,
          totalPembayaran: totalPembayaranBulanIni,
          lunas: lunasBulanIni,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/laporan error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
