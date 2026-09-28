import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UpdateSemesterSchema } from '@/lib/validations/academic.schema';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const semester = await prisma.semester.findUnique({
      where: { id },
      include: {
        academicYear: true,
        _count: {
          select: {
            grades: true,
            attendances: true,
          },
        },
      },
    });

    if (!semester) {
      return NextResponse.json({ error: 'Semester not found' }, { status: 404 });
    }

    return NextResponse.json({ data: semester });
  } catch (error) {
    console.error('Error fetching semester:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: 'User not associated with any school' }, { status: 403 });
    }

    const userRole = dbUser.schoolUsers[0].role;

    if (!['ADMIN', 'KEPALA_SEKOLAH'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existingSemester = await prisma.semester.findUnique({
      where: { id },
    });

    if (!existingSemester) {
      return NextResponse.json({ error: 'Semester not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = UpdateSemesterSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 422 }
      );
    }

    const updateData = validationResult.data;

    const updatedSemester = await prisma.semester.update({
      where: { id },
      data: {
        ...updateData,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
      },
      include: {
        academicYear: true,
      },
    });

    return NextResponse.json({ data: updatedSemester });
  } catch (error) {
    console.error('Error updating semester:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: 'User not associated with any school' }, { status: 403 });
    }

    const userRole = dbUser.schoolUsers[0].role;

    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const semester = await prisma.semester.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            grades: true,
            attendances: true,
          },
        },
      },
    });

    if (!semester) {
      return NextResponse.json({ error: 'Semester not found' }, { status: 404 });
    }

    if (semester._count.grades > 0 || semester._count.attendances > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus semester yang memiliki data nilai atau absensi' },
        { status: 400 }
      );
    }

    await prisma.semester.delete({ where: { id } });

    return NextResponse.json({ message: 'Semester deleted successfully' });
  } catch (error) {
    console.error('Error deleting semester:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
