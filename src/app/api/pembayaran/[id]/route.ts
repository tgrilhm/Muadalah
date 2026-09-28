import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updatePaymentSchema } from '@/lib/validations/payment.schema';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getSchoolIdFromRequest(bypassAuth: boolean, request?: NextRequest) {
  if (bypassAuth) {
    const school = await prisma.school.findFirst({ select: { id: true } });
    return { schoolId: school?.id ?? '', role: 'ADMIN' as const };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { schoolUsers: { select: { schoolId: true, role: true } } },
  });

  if (!dbUser || dbUser.schoolUsers.length === 0) return null;

  return {
    schoolId: dbUser.schoolUsers[0].schoolId,
    role: dbUser.schoolUsers[0].role,
  };
}

/**
 * GET /api/pembayaran/:id
 * Detail pembayaran
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const bypassAuth = process.env.NODE_ENV === 'development';

    const auth = await getSchoolIdFromRequest(bypassAuth);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        student: { class: { schoolId: auth.schoolId } },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nis: true,
            nisn: true,
            photo: true,
            class: { select: { id: true, name: true, grade: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Pembayaran tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error('GET /api/pembayaran/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pembayaran/:id
 * Update status, amount, or notes
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const bypassAuth = process.env.NODE_ENV === 'development';

    const auth = await getSchoolIdFromRequest(bypassAuth);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!bypassAuth && !['ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: 'Hanya Admin yang dapat mengubah pembayaran' },
        { status: 403 }
      );
    }

    // Verify payment belongs to this school
    const existing = await prisma.payment.findFirst({
      where: { id, student: { class: { schoolId: auth.schoolId } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Pembayaran tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updatePaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Data tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { status, amount, notes, paidAt } = validation.data;

    // Auto-set paidAt when status changes to LUNAS
    let resolvedPaidAt: Date | null | undefined = paidAt ? new Date(paidAt) : undefined;
    if (status === 'LUNAS' && !existing.paidAt && !paidAt) {
      resolvedPaidAt = new Date();
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(amount !== undefined ? { amount } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(resolvedPaidAt !== undefined ? { paidAt: resolvedPaidAt } : {}),
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

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error('PATCH /api/pembayaran/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pembayaran/:id
 * Hard delete (untuk pembayaran yang salah input)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const bypassAuth = process.env.NODE_ENV === 'development';

    const auth = await getSchoolIdFromRequest(bypassAuth);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!bypassAuth && !['ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: 'Hanya Admin yang dapat menghapus pembayaran' },
        { status: 403 }
      );
    }

    // Verify payment belongs to this school
    const existing = await prisma.payment.findFirst({
      where: { id, student: { class: { schoolId: auth.schoolId } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Pembayaran tidak ditemukan' },
        { status: 404 }
      );
    }

    await prisma.payment.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Pembayaran berhasil dihapus' });
  } catch (error) {
    console.error('DELETE /api/pembayaran/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
