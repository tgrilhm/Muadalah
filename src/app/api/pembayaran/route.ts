import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPaymentSchema, paymentQuerySchema } from '@/lib/validations/payment.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * Auto-generate receipt number: KWT-{YYYY}-{MM}-{4-digit-seq}
 * e.g. KWT-2026-08-0001
 */
async function generateReceiptNo(month: number, year: number): Promise<string> {
  const monthStr = String(month).padStart(2, '0');
  const count = await prisma.payment.count({
    where: { month, year },
  });
  const seq = String(count + 1).padStart(4, '0');
  return `KWT-${year}-${monthStr}-${seq}`;
}

async function getSchoolId(bypassAuth: boolean): Promise<string | null> {
  if (bypassAuth) {
    const school = await prisma.school.findFirst({ select: { id: true } });
    return school?.id ?? null;
  }
  return null;
}

/**
 * GET /api/pembayaran
 * Daftar pembayaran dengan pagination & filter
 *
 * Query params: schoolId, studentId, classId, status, type, month, year, search, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    // Get schoolId from query parameter (required)
    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      return NextResponse.json(
        { success: false, error: 'schoolId is required' },
        { status: 400 }
      );
    }

    // Parse query params
    const rawParams = {
      studentId: searchParams.get('studentId') ?? undefined,
      classId: searchParams.get('classId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      month: searchParams.get('month') ?? undefined,
      year: searchParams.get('year') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
    };

    const validation = paymentQuerySchema.safeParse(rawParams);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { studentId, classId, status, type, month, year, search, page, limit } = validation.data;
    const skip = (page - 1) * limit;

    const where = {
      student: {
        ...(studentId ? { id: studentId } : {}),
        ...(classId ? { classId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { nis: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
        class: { schoolId },
      },
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(month ? { month } : {}),
      ...(year ? { year } : {}),
    };

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              nis: true,
              photo: true,
              class: {
                select: { id: true, name: true, grade: true },
              },
            },
          },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }, { student: { name: 'asc' } }],
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/pembayaran error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pembayaran
 * Catat pembayaran baru
 */
export async function POST(request: NextRequest) {
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

      const schoolUser = dbUser.schoolUsers[0];
      if (!['ADMIN', 'SUPER_ADMIN'].includes(schoolUser.role)) {
        return NextResponse.json(
          { success: false, error: 'Hanya Admin yang dapat mencatat pembayaran' },
          { status: 403 }
        );
      }
      schoolId = schoolUser.schoolId;
    } else {
      const sid = await getSchoolId(true);
      schoolId = sid ?? '';
    }

    const body = await request.json();
    const validation = createPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Data tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { studentId, type, month, year, amount, status, notes, receiptNo } = validation.data;

    // Verify student belongs to this school
    const student = await prisma.student.findFirst({
      where: { id: studentId, class: { schoolId } },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check for duplicate
    const existing = await prisma.payment.findUnique({
      where: {
        studentId_month_year_type: { studentId, month, year, type },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pembayaran sudah tercatat',
          message: `Pembayaran ${type} bulan ${month}/${year} untuk siswa ini sudah ada`,
        },
        { status: 409 }
      );
    }

    // Auto-generate receipt number if not provided
    const finalReceiptNo = receiptNo ?? (await generateReceiptNo(month, year));

    const payment = await prisma.payment.create({
      data: {
        studentId,
        type,
        month,
        year,
        amount,
        status: status ?? 'LUNAS',
        notes: notes ?? null,
        receiptNo: finalReceiptNo,
        paidAt: status === 'LUNAS' || !status ? new Date() : null,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nis: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/pembayaran error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
