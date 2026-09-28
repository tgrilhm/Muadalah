import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { laporanPembayaranQuerySchema } from '@/lib/validations/laporan.schema';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const BULAN_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const STATUS_LABEL: Record<string, string> = {
  LUNAS: 'Lunas',
  BELUM_BAYAR: 'Belum Bayar',
  CICILAN: 'Cicilan',
  TERLAMBAT: 'Terlambat',
};

const STATUS_COLOR: Record<string, string> = {
  LUNAS: 'FF10B981',
  BELUM_BAYAR: 'FFBA1A1A',
  CICILAN: 'FFF59E0B',
  TERLAMBAT: 'FFEF4444',
};

/**
 * GET /api/laporan/pembayaran/export
 * Export data pembayaran SPP ke Excel
 *
 * Query: year, month (optional), classId (optional)
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
    const validation = laporanPembayaranQuerySchema.safeParse({
      year: searchParams.get('year') ?? new Date().getFullYear().toString(),
      month: searchParams.get('month') ?? undefined,
      classId: searchParams.get('classId') ?? undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { year, month, classId } = validation.data;

    // Ambil data pembayaran
    const payments = await prisma.payment.findMany({
      where: {
        year,
        ...(month ? { month } : {}),
        student: {
          class: { schoolId },
          ...(classId ? { classId } : {}),
        },
      },
      include: {
        student: {
          select: { id: true, name: true, nis: true },
          include: { class: { select: { name: true, grade: true } } },
        },
      },
      orderBy: [
        { student: { class: { grade: 'asc' } } },
        { student: { class: { name: 'asc' } } },
        { student: { name: 'asc' } },
        { month: 'asc' },
      ],
    });

    const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } });

    // Buat Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Muadalah';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Pembayaran SPP', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Header judul
    const judul = month
      ? `LAPORAN PEMBAYARAN SPP — ${BULAN_NAMES[month]} ${year}`
      : `LAPORAN PEMBAYARAN SPP — TAHUN ${year}`;

    worksheet.mergeCells('A1:J1');
    const t1 = worksheet.getCell('A1');
    t1.value = `${judul} — ${school?.name?.toUpperCase() ?? ''}`;
    t1.font = { bold: true, size: 14, color: { argb: 'FF003EC7' } };
    t1.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A2:J2');
    worksheet.getCell('A2').value = `Dicetak: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: localeId })}`;
    worksheet.getCell('A2').font = { size: 10, color: { argb: 'FF737688' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    // Header tabel
    const headerRow = worksheet.addRow([
      'No', 'NIS', 'Nama Siswa', 'Kelas', 'Bulan', 'Tipe', 'Nominal (Rp)', 'Status', 'No. Kwitansi', 'Tanggal Bayar',
    ]);
    headerRow.height = 30;
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

    let totalLunas = 0;
    let totalBelum = 0;

    payments.forEach((payment, index) => {
      const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF2F4F6';
      const tanggalBayar = payment.paidAt
        ? format(new Date(payment.paidAt), 'dd/MM/yyyy', { locale: localeId })
        : '-';

      const row = worksheet.addRow([
        index + 1,
        payment.student.nis,
        payment.student.name,
        payment.student.class.name,
        BULAN_NAMES[payment.month],
        payment.type,
        payment.amount,
        STATUS_LABEL[payment.status] ?? payment.status,
        payment.receiptNo ?? '-',
        tanggalBayar,
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

      // Nama siswa rata kiri
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };

      // Format nominal sebagai currency
      const nominalCell = row.getCell(7);
      nominalCell.numFmt = '#,##0';
      nominalCell.alignment = { horizontal: 'right', vertical: 'middle' };

      // Warnai status
      const statusCell = row.getCell(8);
      statusCell.font = { bold: true, color: { argb: STATUS_COLOR[payment.status] ?? 'FF000000' } };

      if (payment.status === 'LUNAS') totalLunas += payment.amount;
      else totalBelum += payment.amount;
    });

    // Baris total
    worksheet.addRow([]);
    const totalRow = worksheet.addRow([
      '', '', '', '', '', 'TOTAL LUNAS:', totalLunas, '', '', '',
    ]);
    totalRow.getCell(6).font = { bold: true };
    totalRow.getCell(7).font = { bold: true, color: { argb: 'FF10B981' } };
    totalRow.getCell(7).numFmt = 'Rp #,##0';

    const tunggakanRow = worksheet.addRow([
      '', '', '', '', '', 'TOTAL BELUM BAYAR:', totalBelum, '', '', '',
    ]);
    tunggakanRow.getCell(6).font = { bold: true };
    tunggakanRow.getCell(7).font = { bold: true, color: { argb: 'FFBA1A1A' } };
    tunggakanRow.getCell(7).numFmt = 'Rp #,##0';

    // Column widths
    worksheet.columns = [
      { width: 5 }, { width: 14 }, { width: 30 }, { width: 8 },
      { width: 12 }, { width: 14 }, { width: 16 }, { width: 14 },
      { width: 20 }, { width: 14 },
    ] as ExcelJS.Column[];

    const buffer = await workbook.xlsx.writeBuffer();
    const monthSuffix = month ? `-${BULAN_NAMES[month].toLowerCase()}` : '';
    const filename = `laporan-pembayaran${monthSuffix}-${year}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('GET /api/laporan/pembayaran/export error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
