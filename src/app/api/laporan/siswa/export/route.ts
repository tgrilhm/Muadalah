import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { laporanSiswaQuerySchema } from '@/lib/validations/laporan.schema';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const GENDER_LABEL: Record<string, string> = {
  LAKI_LAKI: 'L',
  PEREMPUAN: 'P',
};

const STATUS_LABEL: Record<string, string> = {
  AKTIF: 'Aktif',
  LULUS: 'Lulus',
  PINDAH: 'Pindah',
  KELUAR: 'Keluar',
};

const STATUS_COLOR: Record<string, string> = {
  AKTIF: 'FF10B981',
  LULUS: 'FF003EC7',
  PINDAH: 'FFF59E0B',
  KELUAR: 'FFBA1A1A',
};

/**
 * GET /api/laporan/siswa/export
 * Export data siswa ke Excel
 *
 * Query: classId (optional), status (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const bypassAuth = process.env.NODE_ENV === 'development';
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
        include: { schoolUsers: true },
      });

      if (!dbUser || dbUser.schoolUsers.length === 0) {
        return NextResponse.json(
          { success: false, error: 'User tidak terdaftar di sekolah manapun' },
          { status: 403 }
        );
      }
      schoolId = dbUser.schoolUsers[0].schoolId;
    } else {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      schoolId = firstSchool?.id ?? '';
    }

    // Validasi query
    const searchParams = request.nextUrl.searchParams;
    const validation = laporanSiswaQuerySchema.safeParse({
      classId: searchParams.get('classId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { classId, status } = validation.data;

    // Ambil data siswa
    const students = await prisma.student.findMany({
      where: {
        class: { schoolId },
        ...(classId ? { classId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        class: { select: { name: true, grade: true } },
        parentContacts: {
          select: { name: true, relation: true, phone: true },
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [
        { class: { grade: 'asc' } },
        { class: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } });

    // Buat Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Muadalah';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Data Siswa', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Header judul
    worksheet.mergeCells('A1:N1');
    const t1 = worksheet.getCell('A1');
    t1.value = `DATA SISWA — ${school?.name?.toUpperCase() ?? ''}`;
    t1.font = { bold: true, size: 14, color: { argb: 'FF003EC7' } };
    t1.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A2:N2');
    const filterDesc = [
      classId ? `Kelas terpilih` : 'Semua Kelas',
      status ? STATUS_LABEL[status] : 'Semua Status',
    ].join(' | ');
    worksheet.getCell('A2').value = `Filter: ${filterDesc}  |  Dicetak: ${format(new Date(), 'dd MMMM yyyy', { locale: localeId })}`;
    worksheet.getCell('A2').font = { size: 10, color: { argb: 'FF737688' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    // Header tabel
    const headers = [
      'No', 'NIS', 'NISN', 'Nama Lengkap', 'L/P', 'Kelas',
      'Tempat Lahir', 'Tgl Lahir', 'Agama', 'Alamat', 'No. Telp',
      'Status', 'Kontak Ortu', 'Tgl Masuk',
    ];
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 32;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003EC7' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFB7C4FF' } },
        left: { style: 'thin', color: { argb: 'FFB7C4FF' } },
        bottom: { style: 'thin', color: { argb: 'FFB7C4FF' } },
        right: { style: 'thin', color: { argb: 'FFB7C4FF' } },
      };
    });

    // Data rows
    students.forEach((student, index) => {
      const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF2F4F6';
      const tglLahir = student.birthDate
        ? format(new Date(student.birthDate), 'dd/MM/yyyy')
        : '-';
      const tglMasuk = student.enrollDate
        ? format(new Date(student.enrollDate), 'dd/MM/yyyy')
        : '-';
      const kontakOrtu = student.parentContacts[0]
        ? `${student.parentContacts[0].name} (${student.parentContacts[0].relation}): ${student.parentContacts[0].phone}`
        : '-';

      const row = worksheet.addRow([
        index + 1,
        student.nis,
        student.nisn ?? '-',
        student.name,
        GENDER_LABEL[student.gender] ?? student.gender,
        student.class.name,
        student.birthPlace ?? '-',
        tglLahir,
        student.religion ?? '-',
        student.address ?? '-',
        student.phone ?? '-',
        STATUS_LABEL[student.status] ?? student.status,
        kontakOrtu,
        tglMasuk,
      ]);

      row.height = 22;
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E3E5' } },
          left: { style: 'thin', color: { argb: 'FFE0E3E5' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E3E5' } },
          right: { style: 'thin', color: { argb: 'FFE0E3E5' } },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Teks rata kiri
      [4, 10, 13].forEach((col) => {
        row.getCell(col).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      });

      // Warnai status
      const statusCell = row.getCell(12);
      statusCell.font = { bold: true, color: { argb: STATUS_COLOR[student.status] ?? 'FF000000' } };
    });

    // Summary row
    worksheet.addRow([]);
    const summaryRow = worksheet.addRow([`Total: ${students.length} siswa`, '', '', '', '', '', '', '', '', '', '', '', '', '']);
    summaryRow.getCell(1).font = { bold: true, size: 11 };

    // Column widths
    worksheet.columns = [
      { width: 5 }, { width: 14 }, { width: 16 }, { width: 28 }, { width: 5 }, { width: 8 },
      { width: 16 }, { width: 12 }, { width: 10 }, { width: 30 }, { width: 14 },
      { width: 10 }, { width: 32 }, { width: 12 },
    ] as ExcelJS.Column[];

    const buffer = await workbook.xlsx.writeBuffer();
    const dateSuffix = format(new Date(), 'yyyy-MM-dd');
    const filename = `data-siswa-${dateSuffix}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('GET /api/laporan/siswa/export error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
