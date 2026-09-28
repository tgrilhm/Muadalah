import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UpdateAcademicYearSchema } from '@/lib/validations/academic.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/tahun-ajaran/[id]
 * Get academic year detail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bypassAuth = process.env.NODE_ENV === 'development';
    let schoolId = 'default-school-id';

    if (!bypassAuth) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        include: { schoolUsers: true },
      });

      if (!dbUser || dbUser.schoolUsers.length === 0) {
        return NextResponse.json(
          { error: 'User not associated with any school' },
          { status: 403 }
        );
      }

      schoolId = dbUser.schoolUsers[0].schoolId;
    } else {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      schoolId = firstSchool?.id || 'default-school-id';
    }

    const academicYear = await prisma.academicYear.findFirst({
      where: { id, schoolId },
      include: {
        semesters: {
          orderBy: { number: 'asc' },
        },
        _count: {
          select: { semesters: true },
        },
      },
    });

    if (!academicYear) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    return NextResponse.json({ data: academicYear });
  } catch (error) {
    console.error('Error fetching academic year:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/tahun-ajaran/[id]
 * Update academic year
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { schoolUsers: true },
    });

    if (!dbUser || dbUser.schoolUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not associated with any school' },
        { status: 403 }
      );
    }

    const userRole = dbUser.schoolUsers[0].role;
    const schoolId = dbUser.schoolUsers[0].schoolId;

    if (!['ADMIN', 'KEPALA_SEKOLAH'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existingYear = await prisma.academicYear.findFirst({
      where: { id, schoolId },
    });

    if (!existingYear) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = UpdateAcademicYearSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 422 }
      );
    }

    const updateData = validationResult.data;

    if (updateData.name) {
      const duplicate = await prisma.academicYear.findFirst({
        where: {
          schoolId,
          name: updateData.name,
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Tahun ajaran dengan nama yang sama sudah ada' },
          { status: 409 }
        );
      }
    }

    const updatedYear = await prisma.academicYear.update({
      where: { id },
      data: {
        ...updateData,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
      },
      include: {
        _count: {
          select: { semesters: true },
        },
      },
    });

    return NextResponse.json({ data: updatedYear });
  } catch (error) {
    console.error('Error updating academic year:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/tahun-ajaran/[id]
 * Delete academic year
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { schoolUsers: true },
    });

    if (!dbUser || dbUser.schoolUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not associated with any school' },
        { status: 403 }
      );
    }

    const userRole = dbUser.schoolUsers[0].role;
    const schoolId = dbUser.schoolUsers[0].schoolId;

    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const academicYear = await prisma.academicYear.findFirst({
      where: { id, schoolId },
      include: {
        _count: {
          select: { semesters: true },
        },
      },
    });

    if (!academicYear) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    if (academicYear._count.semesters > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus tahun ajaran yang memiliki semester' },
        { status: 400 }
      );
    }

    await prisma.academicYear.delete({ where: { id } });

    return NextResponse.json({ message: 'Academic year deleted successfully' });
  } catch (error) {
    console.error('Error deleting academic year:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
