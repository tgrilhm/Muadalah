import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

async function getSenderId(bypassAuth: boolean): Promise<string> {
  if (bypassAuth) {
    const user = await prisma.user.findFirst({ select: { id: true } });
    return user?.id ?? '';
  }
  return '';
}

/**
 * GET /api/pesan/[id]
 * Ambil thread pesan dengan satu kontak (recipientId = id)
 * Side-effect: tandai semua pesan sebagai sudah dibaca
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recipientId } = await params;
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
      userId = await getSenderId(true);
    }

    // Verifikasi kontak ada
    const recipient = await prisma.parentContact.findUnique({
      where: { id: recipientId },
      include: {
        student: { select: { id: true, name: true, nis: true, class: { select: { id: true, name: true } } } },
      },
    });

    if (!recipient) {
      return NextResponse.json({ success: false, error: 'Kontak tidak ditemukan' }, { status: 404 });
    }

    // Ambil semua pesan dalam thread ini
    const messages = await prisma.message.findMany({
      where: { senderId: userId, recipientId },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark semua unread sebagai read
    await prisma.message.updateMany({
      where: { senderId: userId, recipientId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: {
        recipient: {
          id: recipient.id,
          name: recipient.name,
          relation: recipient.relation,
          phone: recipient.phone,
          email: recipient.email,
          student: {
            id: recipient.student.id,
            name: recipient.student.name,
            nis: recipient.student.nis,
            class: recipient.student.class,
          },
        },
        messages: messages.map((m) => ({
          id: m.id,
          subject: m.subject,
          content: m.content,
          type: m.type,
          isRead: m.isRead,
          readAt: m.readAt?.toISOString() ?? null,
          createdAt: m.createdAt.toISOString(),
          sender: m.sender,
        })),
        totalMessages: messages.length,
      },
    });
  } catch (error) {
    console.error('[GET /api/pesan/[id]]', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/**
 * DELETE /api/pesan/[id]
 * Hapus satu pesan berdasarkan message ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
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
      userId = await getSenderId(true);
    }

    // Cek pesan ada dan milik user ini
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      return NextResponse.json({ success: false, error: 'Pesan tidak ditemukan' }, { status: 404 });
    }
    if (message.senderId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Tidak boleh menghapus pesan orang lain' },
        { status: 403 }
      );
    }

    await prisma.message.delete({ where: { id: messageId } });

    return NextResponse.json({ success: true, message: 'Pesan berhasil dihapus' });
  } catch (error) {
    console.error('[DELETE /api/pesan/[id]]', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
