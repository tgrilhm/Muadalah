import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ringkasanQuerySchema } from '@/lib/validations/payment.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/pembayaran/ringkasan
 * Statistik pembayaran: total target, terkumpul, tunggakan, persentase
 *
 * Query params: month?, year?
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
      const school = await prisma.school.findFirst({ select: { id: true } });
      schoolId = school?.id ?? '';
    }

    const searchParams = request.nextUrl.searchParams;
    const now = new Date();
    const rawParams = {
      month: searchParams.get('month') ?? String(now.getMonth() + 1),
      year: searchParams.get('year') ?? String(now.getFullYear()),
    };

    const validation = ringkasanQuerySchema.safeParse(rawParams);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { month, year } = validation.data;
    const currentMonth = month ?? now.getMonth() + 1;
    const currentYear = year ?? now.getFullYear();

    // Get SPP payment setting for this school
    const paymentSetting = await prisma.paymentSetting.findFirst({
      where: { schoolId, type: 'SPP' },
    });
    const nominalSPP = paymentSetting?.amount ?? 0;

    // Count active students in this school
    const totalSiswaAktif = await prisma.student.count({
      where: {
        status: 'AKTIF',
        class: { schoolId },
      },
    });

    // Total target = active students × SPP nominal
    const totalTarget = totalSiswaAktif * nominalSPP;

    // Sum collected payments for this month/year (LUNAS only)
    const terkumpulResult = await prisma.payment.aggregate({
      where: {
        type: 'SPP',
        month: currentMonth,
        year: currentYear,
        status: 'LUNAS',
        student: { class: { schoolId } },
      },
      _sum: { amount: true },
    });
    const totalTerkumpul = terkumpulResult._sum.amount ?? 0;

    // Count students who have PAID (LUNAS) this month
    const siswaSudahBayar = await prisma.payment.count({
      where: {
        type: 'SPP',
        month: currentMonth,
        year: currentYear,
        status: 'LUNAS',
        student: { class: { schoolId } },
      },
    });

    const siswaBelumBayar = totalSiswaAktif - siswaSudahBayar;
    const totalTunggakan = Math.max(0, totalTarget - totalTerkumpul);
    const persentase = totalTarget > 0 ? Math.round((totalTerkumpul / totalTarget) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        month: currentMonth,
        year: currentYear,
        nominalSPP,
        totalSiswaAktif,
        siswaSudahBayar,
        siswaBelumBayar,
        totalTarget,
        totalTerkumpul,
        totalTunggakan,
        persentase,
      },
    });
  } catch (error) {
    console.error('GET /api/pembayaran/ringkasan error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
