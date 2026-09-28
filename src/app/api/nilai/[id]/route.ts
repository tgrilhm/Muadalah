import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateGradeSchema } from '@/lib/validations/grade.schema';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getSchoolId(bypassAuth: boolean): Promise<{ schoolId: string; error?: NextResponse }> {
  if (!bypassAuth) {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { schoolId: '', error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { schoolUsers: true },
    });

    if (!dbUser || dbUser.schoolUsers.length === 0) {
      return {
        schoolId: '',
        error: NextResponse.json({ success: false, error: 'User tidak terdaftar di sekolah manapun' }, { status: 403 }),
      };
    }
    return { schoolId: dbUser.schoolUsers[0].schoolId };
  }

  const firstSchool = await prisma.school.findFirst({ select: { id: true } });
  return { schoolId: firstSchool?.id ?? '' };
}

/**
 * GET /api/nilai/:id
 * Detail satu record nilai
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const bypassAuth = process.env.NODE_ENV === 'development';
    const { schoolId, error } = await getSchoolId(bypassAuth);
    if (error) return error;

    const grade = await prisma.grade.findFirst({
      where: {
        id,
        student: { class: { schoolId } },
      },
      include: {
        student: { select: { id: true, name: true, nis: true, photo: true } },
        subject: { select: { id: true, name: true, code: true } },
        semester: { select: { id: true, name: true, number: true } },
      },
    });

    if (!grade) {
      return NextResponse.json({ success: false, error: 'Nilai tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: grade });
  } catch (error) {
    console.error('GET /api/nilai/:id error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/**
 * PATCH /api/nilai/:id
 * Update sebagian field nilai
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const bypassAuth = process.env.NODE_ENV === 'development';
    const { schoolId, error } = await getSchoolId(bypassAuth);
    if (error) return error;

    // Check grade exists
    const existing = await prisma.grade.findFirst({
      where: { id, student: { class: { schoolId } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Nilai tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateGradeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Data tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { type, score, maxScore, weight, description, date } = validation.data;

    const updated = await prisma.grade.update({
      where: { id },
      data: {
        ...(type !== undefined ? { type } : {}),
        ...(score !== undefined ? { score } : {}),
        ...(maxScore !== undefined ? { maxScore } : {}),
        ...(weight !== undefined ? { weight } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(date !== undefined ? { date: new Date(date) } : {}),
      },
      include: {
        student: { select: { id: true, name: true, nis: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('PATCH /api/nilai/:id error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/**
 * DELETE /api/nilai/:id
 * Hapus record nilai
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const bypassAuth = process.env.NODE_ENV === 'development';
    const { schoolId, error } = await getSchoolId(bypassAuth);
    if (error) return error;

    // Check grade exists in this school
    const existing = await prisma.grade.findFirst({
      where: { id, student: { class: { schoolId } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Nilai tidak ditemukan' }, { status: 404 });
    }

    await prisma.grade.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Nilai berhasil dihapus' });
  } catch (error) {
    console.error('DELETE /api/nilai/:id error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
