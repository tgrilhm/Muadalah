import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tunggakanQuerySchema } from '@/lib/validations/payment.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/pembayaran/tunggakan
 * Daftar siswa aktif yang belum membayar SPP untuk bulan tertentu
 *
 * Query params: classId?, month?, year?, page, limit
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
        include: { schoolUsers: { select: { schoolId: true, role: true } } },
      });

      if (!dbUser || dbUser.schoolUsers.length === 0) {
        return NextResponse.json(
          { success: false, error: 'User tidak terdaftar di sekolah manapun' },
          { status: 403 }
        );
      }

      const { role, schoolId: sid } = dbUser.schoolUsers[0];
      if (!['ADMIN', 'SUPER_ADMIN', 'KEPALA_SEKOLAH'].includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Tidak memiliki akses untuk melihat tunggakan' },
          { status: 403 }
        );
      }
      schoolId = sid;
    } else {
      const school = await prisma.school.findFirst({ select: { id: true } });
      schoolId = school?.id ?? '';
    }

    const searchParams = request.nextUrl.searchParams;
    const now = new Date();
    const rawParams = {
      classId: searchParams.get('classId') ?? undefined,
      month: searchParams.get('month') ?? String(now.getMonth() + 1),
      year: searchParams.get('year') ?? String(now.getFullYear()),
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
    };

    const validation = tunggakanQuerySchema.safeParse(rawParams);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { classId, month, year, page, limit } = validation.data;
    const currentMonth = month ?? now.getMonth() + 1;
    const currentYear = year ?? now.getFullYear();
    const skip = (page - 1) * limit;

    // Find active students who do NOT have a LUNAS SPP payment for this month/year
    const paidStudentIds = await prisma.payment.findMany({
      where: {
        type: 'SPP',
        month: currentMonth,
        year: currentYear,
        status: 'LUNAS',
        student: { class: { schoolId } },
      },
      select: { studentId: true },
    });
    const paidIds = paidStudentIds.map((p) => p.studentId);

    const whereClause = {
      status: 'AKTIF' as const,
      class: {
        schoolId,
        ...(classId ? { id: classId } : {}),
      },
      ...(paidIds.length > 0 ? { id: { notIn: paidIds } } : {}),
    };

    const [students, total] = await prisma.$transaction([
      prisma.student.findMany({
        where: whereClause,
        include: {
          class: { select: { id: true, name: true, grade: true } },
          payments: {
            where: {
              type: 'SPP',
              year: currentYear,
            },
            select: { month: true, status: true },
            orderBy: { month: 'asc' },
          },
        },
        orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.student.count({ where: whereClause }),
    ]);

    // Enrich with tunggakan months info
    const enriched = students.map((student) => {
      const paidMonths = new Set(
        student.payments.filter((p) => p.status === 'LUNAS').map((p) => p.month)
      );
      // Count months from Jan to currentMonth that are not paid
      const tunggakanMonths: number[] = [];
      for (let m = 1; m <= currentMonth; m++) {
        if (!paidMonths.has(m)) {
          tunggakanMonths.push(m);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { payments: _payments, ...studentWithoutPayments } = student;

      return {
        ...studentWithoutPayments,
        jumlahBulanTunggak: tunggakanMonths.length,
        bulanTunggak: tunggakanMonths,
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        month: currentMonth,
        year: currentYear,
      },
    });
  } catch (error) {
    console.error('GET /api/pembayaran/tunggakan error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
