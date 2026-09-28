import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { laporanAbsensiQuerySchema } from '@/lib/validations/laporan.schema';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

/**
 * GET /api/laporan/absensi/export
 * Export rekap absensi ke Excel
 *
 * Query: semesterId, classId (optional)
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

    // Validasi query params
    const searchParams = request.nextUrl.searchParams;
    const validation = laporanAbsensiQuerySchema.safeParse({
      semesterId: searchParams.get('semesterId'),
      classId: searchParams.get('classId') ?? undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { semesterId, classId } = validation.data;

    // Ambil info semester
    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
      include: { academicYear: { select: { name: true } } },
    });

    if (!semester) {
      return NextResponse.json({ success: false, error: 'Semester tidak ditemukan' }, { status: 404 });
    }

    // Ambil data siswa
    const students = await prisma.student.findMany({
      where: {
        class: { schoolId },
        ...(classId ? { classId } : {}),
        status: 'AKTIF',
      },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        attendances: {
          where: { semesterId },
          select: { status: true, date: true },
        },
      },
      orderBy: [{ class: { grade: 'asc' } }, { class: { name: 'asc' } }, { name: 'asc' }],
    });

    // Generate Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Muadalah';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Rekap Absensi', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Metadata sekolah
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    });

    // Header judul
    worksheet.mergeCells('A1:K1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `REKAP ABSENSI SISWA — ${school?.name?.toUpperCase() ?? 'SEKOLAH'}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF003EC7' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A2:K2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `Semester ${semester.name} — Tahun Ajaran ${semester.academicYear.name}`;
    subtitleCell.font = { size: 11, color: { argb: 'FF505F76' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A3:K3');
    const dateCell = worksheet.getCell('A3');
    dateCell.value = `Dicetak: ${format(new Date(), 'dd MMMM yyyy', { locale: localeId })}`;
    dateCell.font = { size: 10, color: { argb: 'FF737688' } };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.addRow([]); // Baris kosong

    // Header tabel
    const headerRow = worksheet.addRow([
      'No',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'Hadir',
      'Sakit',
      'Izin',
      'Alpa',
      'Terlambat',
      'Total Hari',
      '% Kehadiran',
    ]);

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF003EC7' },
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFB7C4FF' } },
        left: { style: 'thin', color: { argb: 'FFB7C4FF' } },
        bottom: { style: 'thin', color: { argb: 'FFB7C4FF' } },
        right: { style: 'thin', color: { argb: 'FFB7C4FF' } },
      };
    });
    headerRow.height = 30;

    // Data rows
    students.forEach((student, index) => {
      const hadir = student.attendances.filter((a) => a.status === 'HADIR').length;
      const sakit = student.attendances.filter((a) => a.status === 'SAKIT').length;
      const izin = student.attendances.filter((a) => a.status === 'IZIN').length;
      const alfa = student.attendances.filter((a) => a.status === 'ALFA').length;
      const terlambat = student.attendances.filter((a) => a.status === 'TERLAMBAT').length;
      const total = student.attendances.length;
      const persentase = total > 0 ? Math.round(((hadir + terlambat) / total) * 1000) / 10 : 0;

      const dataRow = worksheet.addRow([
        index + 1,
        student.nis,
        student.name,
        student.class.name,
        hadir,
        sakit,
        izin,
        alfa,
        terlambat,
        total,
        `${persentase}%`,
      ]);

      // Warna alternating rows
      const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF2F4F6';
      dataRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E3E5' } },
          left: { style: 'thin', color: { argb: 'FFE0E3E5' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E3E5' } },
          right: { style: 'thin', color: { argb: 'FFE0E3E5' } },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Nama siswa rata kiri
      dataRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };

      // Warnai persentase kehadiran rendah
      const persenCell = dataRow.getCell(11);
      if (persentase < 75) {
        persenCell.font = { bold: true, color: { argb: 'FFBA1A1A' } };
      } else if (persentase >= 90) {
        persenCell.font = { bold: true, color: { argb: 'FF10B981' } };
      }

      dataRow.height = 22;
    });

    // Set column widths
    worksheet.columns = [
      { key: 'no', width: 5 },
      { key: 'nis', width: 14 },
      { key: 'nama', width: 30 },
      { key: 'kelas', width: 10 },
      { key: 'hadir', width: 8 },
      { key: 'sakit', width: 8 },
      { key: 'izin', width: 8 },
      { key: 'alfa', width: 8 },
      { key: 'terlambat', width: 12 },
      { key: 'total', width: 10 },
      { key: 'persentase', width: 14 },
    ];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `rekap-absensi-${semester.name.toLowerCase().replace(/\s+/g, '-')}-${semester.academicYear.name.replace('/', '-')}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('GET /api/laporan/absensi/export error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
