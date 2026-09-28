import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

const BULAN_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/**
 * GET /api/dashboard/kehadiran
 * Data grafik kehadiran bulanan untuk chart
 * Query params: year? (default: tahun berjalan)
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
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()));

    // Fetch semua absensi di tahun tersebut
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const attendances = await prisma.attendance.findMany({
      where: {
        date: { gte: startOfYear, lte: endOfYear },
        student: { class: { schoolId }, status: 'AKTIF' },
      },
      select: {
        date: true,
        status: true,
      },
    });

    // Group by bulan
    const byMonth: Record<number, { hadir: number; total: number }> = {};
    for (let m = 0; m < 12; m++) {
      byMonth[m] = { hadir: 0, total: 0 };
    }

    attendances.forEach((a) => {
      const month = new Date(a.date).getMonth(); // 0-indexed
      byMonth[month].total++;
      if (a.status === 'HADIR') {
        byMonth[month].hadir++;
      }
    });

    const data = Object.entries(byMonth).map(([monthIdx, val]) => {
      const idx = parseInt(monthIdx);
      const persentase = val.total > 0
        ? Math.round((val.hadir / val.total) * 100 * 10) / 10
        : 0;
      return {
        bulan: BULAN_LABELS[idx],
        bulanIndex: idx + 1,
        hadir: val.hadir,
        total: val.total,
        persentase,
      };
    });

    return NextResponse.json({
      success: true,
      data: { data, year },
    });
  } catch (error) {
    console.error('GET /api/dashboard/kehadiran error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
