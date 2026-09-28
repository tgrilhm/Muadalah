import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMessageSchema, messageQuerySchema } from '@/lib/validations/message.schema';
import { createClient } from '@/lib/supabase/server';

// ==================== HELPERS ====================

async function getSenderInfo(bypassAuth: boolean) {
  if (bypassAuth) {
    // Dev mode: pakai user pertama
    const user = await prisma.user.findFirst({
      select: { id: true, name: true, avatar: true },
    });
    const school = await prisma.school.findFirst({ select: { id: true } });
    return { userId: user?.id ?? '', schoolId: school?.id ?? '', userName: user?.name ?? '' };
  }
  return null;
}

/**
 * GET /api/pesan
 * Daftar percakapan (grouped by recipientId — last message per kontak)
 * Query: search, type, page, limit
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
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
    };

    const validation = messageQuerySchema.safeParse(rawParams);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { search, type, page, limit } = validation.data;
    const skip = (page - 1) * limit;

    // Build where untuk Messages milik user ini
    const messageWhere: Record<string, unknown> = { senderId: userId };
    if (type) messageWhere.type = type;

    // Ambil semua messages dari user ini, group by recipientId
    // Ambil semua dulu lalu group di memory (data tidak terlalu besar per user)
    const allMessages = await prisma.message.findMany({
      where: messageWhere,
      include: {
        recipient: {
          include: {
            student: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
          },
        },
        sender: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by recipientId — ambil last message per kontak
    const conversationMap = new Map<string, typeof allMessages[0]>();
    for (const msg of allMessages) {
      if (!conversationMap.has(msg.recipientId)) {
        conversationMap.set(msg.recipientId, msg);
      }
    }

    // Hitung unread per kontak (pesan dari recipient ke sender — tidak ada di model ini,
    // karena pesan searah. Unread = pesan yang dikirim oleh sender tapi belum diread oleh recipient.
    // Dalam scope ini, kita track isRead di Message model)
    const conversations = Array.from(conversationMap.values());

    // Filter search
    const filtered = search
      ? conversations.filter((c) => {
          const name = c.recipient.name.toLowerCase();
          const student = c.recipient.student.name.toLowerCase();
          const q = search.toLowerCase();
          return name.includes(q) || student.includes(q);
        })
      : conversations;

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    // Hitung unread count per kontak
    const recipientIds = paginated.map((c) => c.recipientId);
    const unreadCounts = await prisma.message.groupBy({
      by: ['recipientId'],
      where: { senderId: userId, recipientId: { in: recipientIds }, isRead: false },
      _count: { id: true },
    });
    const unreadMap = new Map(unreadCounts.map((u) => [u.recipientId, u._count.id]));

    const result = paginated.map((c) => ({
      recipientId: c.recipientId,
      recipientName: c.recipient.name,
      recipientRelation: c.recipient.relation,
      recipientPhone: c.recipient.phone,
      studentId: c.recipient.student.id,
      studentName: c.recipient.student.name,
      className: c.recipient.student.class?.name ?? '',
      lastMessage: {
        id: c.id,
        subject: c.subject,
        content: c.content,
        type: c.type,
        isRead: c.isRead,
        createdAt: c.createdAt.toISOString(),
      },
      unreadCount: unreadMap.get(c.recipientId) ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data: result,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /api/pesan]', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/**
 * POST /api/pesan
 * Kirim pesan baru ke satu penerima (ParentContact)
 */
export async function POST(request: NextRequest) {
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
      const info = await getSenderInfo(true);
      userId = info?.userId ?? '';
    }

    const body = await request.json();
    const validation = sendMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Data tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { recipientId, subject, content, type } = validation.data;

    // Verifikasi penerima ada
    const recipient = await prisma.parentContact.findUnique({
      where: { id: recipientId },
    });
    if (!recipient) {
      return NextResponse.json({ success: false, error: 'Penerima tidak ditemukan' }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: { senderId: userId, recipientId, subject, content, type },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        recipient: {
          include: {
            student: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: message.id,
          subject: message.subject,
          content: message.content,
          type: message.type,
          isRead: message.isRead,
          createdAt: message.createdAt.toISOString(),
          sender: message.sender,
          recipient: {
            id: message.recipient.id,
            name: message.recipient.name,
            relation: message.recipient.relation,
            studentName: message.recipient.student.name,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/pesan]', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
