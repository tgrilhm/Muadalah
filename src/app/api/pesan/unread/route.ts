import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/pesan/unread
 * Hitung total pesan belum dibaca milik user saat ini
 * Digunakan untuk badge di sidebar dan dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const bypassAuth = process.env.NODE_ENV === 'development';
    let userId = '';

    if (!bypassAuth) {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
      if (!dbUser) {
        return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
      }
      userId = dbUser.id;
    } else {
      const user = await prisma.user.findFirst({ select: { id: true } });
      userId = user?.id ?? '';
    }

    const count = await prisma.message.count({
      where: { senderId: userId, isRead: false },
    });

    return NextResponse.json({ success: true, data: { count } });
  } catch (error) {
    console.error('[GET /api/pesan/unread]', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
