import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastMessageSchema } from '@/lib/validations/message.schema';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/pesan/broadcast
 * Broadcast pesan ke semua orang tua di satu kelas atau seluruh sekolah
 * Body: { classId?, schoolWide, subject, content, type }
 */
export async function POST(request: NextRequest) {
  try {
    const bypassAuth = process.env.NODE_ENV === 'development';
    let userId = '';
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

      if (!dbUser) {
        return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
      }

      const schoolUser = dbUser.schoolUsers[0];
      // Hanya ADMIN, SUPER_ADMIN, KEPALA_SEKOLAH yang bisa broadcast
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH'];
      if (!allowedRoles.includes(schoolUser?.role ?? '')) {
        return NextResponse.json(
          { success: false, error: 'Hanya Admin dan Kepala Sekolah yang bisa broadcast' },
          { status: 403 }
        );
      }

      userId = dbUser.id;
      schoolId = schoolUser?.schoolId ?? '';
    } else {
      const user = await prisma.user.findFirst({ select: { id: true } });
      const school = await prisma.school.findFirst({ select: { id: true } });
      userId = user?.id ?? '';
      schoolId = school?.id ?? '';
    }

    const body = await request.json();
    const validation = broadcastMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Data tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { classId, schoolWide, subject, content, type } = validation.data;

    // Tentukan target penerima
    let parentContacts: { id: string }[] = [];

    if (schoolWide) {
      // Semua kontak ortu di seluruh sekolah
      parentContacts = await prisma.parentContact.findMany({
        where: { student: { class: { schoolId } } },
        select: { id: true },
      });
    } else if (classId) {
      // Semua kontak ortu di satu kelas
      parentContacts = await prisma.parentContact.findMany({
        where: { student: { classId } },
        select: { id: true },
      });
    }

    if (parentContacts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada penerima yang ditemukan untuk broadcast' },
        { status: 422 }
      );
    }

    // Bulk insert menggunakan createMany
    const messageData = parentContacts.map((contact) => ({
      senderId: userId,
      recipientId: contact.id,
      subject,
      content,
      type,
    }));

    const result = await prisma.message.createMany({
      data: messageData,
      skipDuplicates: false,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          sent: result.count,
          totalTargets: parentContacts.length,
          subject,
          type,
        },
        message: `Pesan berhasil dikirim ke ${result.count} orang tua`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/pesan/broadcast]', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
