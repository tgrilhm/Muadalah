import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

/**
 * PUT /api/tahun-ajaran/[id]/activate
 * Set academic year as active (deactivates others in same school)
 */
export async function PUT(
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

    const academicYear = await prisma.academicYear.findFirst({
      where: { id, schoolId },
    });

    if (!academicYear) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    if (academicYear.isActive) {
      return NextResponse.json({
        message: 'Academic year is already active',
        data: academicYear,
      });
    }

    const updatedYear = await prisma.$transaction(async (tx) => {
      // Deactivate all other active years
      await tx.academicYear.updateMany({
        where: {
          schoolId,
          isActive: true,
          id: { not: id },
        },
        data: { isActive: false },
      });

      // Activate target year
      return tx.academicYear.update({
        where: { id },
        data: { isActive: true },
        include: {
          _count: {
            select: { semesters: true },
          },
        },
      });
    });

    return NextResponse.json({
      message: 'Academic year activated successfully',
      data: updatedYear,
    });
  } catch (error) {
    console.error('Error activating academic year:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
