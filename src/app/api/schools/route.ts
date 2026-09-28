import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/schools
 * Get all schools for school switcher
 */
export async function GET() {
  const bypassAuth = process.env.NODE_ENV === 'development';

  try {
    let schools;

    if (bypassAuth) {
      // Development: Return all schools
      schools = await prisma.school.findMany({
        select: {
          id: true,
          name: true,
          level: true,
          institutionId: true,
        },
        orderBy: {
          level: 'asc',
        },
      });
    } else {
      // Production: Get user's schools only
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        include: {
          schoolUsers: {
            include: {
              school: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                  institutionId: true,
                },
              },
            },
          },
        },
      });

      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      schools = dbUser.schoolUsers.map((su) => su.school);
    }

    return NextResponse.json({
      success: true,
      data: schools,
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
