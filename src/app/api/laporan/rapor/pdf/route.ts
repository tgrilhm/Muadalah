import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { raporPdfQuerySchema } from '@/lib/validations/laporan.schema';
import { calculateFinalScore } from '@/lib/grade.utils';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { GradeType } from '@prisma/client';

// ─── Helper: draw table ───────────────────────────────────────────────────
function drawTable(
  doc: jsPDF,
  headers: string[],
  widths: number[],
  rows: string[][],
  startX: number,
  startY: number,
  rowHeight = 8,
  headerBg = [0, 62, 199] as [number, number, number],
) {
  const totalWidth = widths.reduce((a, b) => a + b, 0);

  // Header
  doc.setFillColor(...headerBg);
  doc.rect(startX, startY, totalWidth, rowHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  let x = startX;
  headers.forEach((h, i) => {
    doc.text(h, x + widths[i] / 2, startY + rowHeight / 2 + 2.5, { align: 'center' });
    x += widths[i];
  });

  // Data rows
  let y = startY + rowHeight;
  rows.forEach((row, rowIndex) => {
    // Alternating row background
    if (rowIndex % 2 === 1) {
      doc.setFillColor(242, 244, 246);
      doc.rect(startX, y, totalWidth, rowHeight, 'F');
    }

    doc.setTextColor(25, 28, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    let cx = startX;
    row.forEach((cell, colIndex) => {
      const cellAlign = colIndex === 1 ? 'left' : 'center';
      const textX = cellAlign === 'left' ? cx + 2 : cx + widths[colIndex] / 2;
      doc.text(String(cell), textX, y + rowHeight / 2 + 2.5, { align: cellAlign });
      cx += widths[colIndex];
    });

    // Border bottom
    doc.setDrawColor(224, 227, 229);
    doc.line(startX, y + rowHeight, startX + totalWidth, y + rowHeight);
    y += rowHeight;
  });

  // Outer border
  doc.setDrawColor(0, 62, 199);
  doc.setLineWidth(0.3);
  doc.rect(startX, startY, totalWidth, y - startY);
  doc.setLineWidth(0.2);

  return y; // return bottom Y position
}

/**
 * GET /api/laporan/rapor/pdf
 * Generate PDF rapor siswa menggunakan jsPDF
 *
 * Query: studentId, semesterId
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
    const validation = raporPdfQuerySchema.safeParse({
      studentId: searchParams.get('studentId'),
      semesterId: searchParams.get('semesterId'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { studentId, semesterId } = validation.data;

    // Ambil data siswa
    const student = await prisma.student.findFirst({
      where: { id: studentId, class: { schoolId } },
      include: {
        class: {
          select: { name: true, grade: true },
          include: {
            homeroomTeacher: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    // Ambil data semester
    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
      include: { academicYear: { select: { name: true, schoolId: true } } },
    });

    if (!semester) {
      return NextResponse.json({ success: false, error: 'Semester tidak ditemukan' }, { status: 404 });
    }

    // Ambil semua nilai siswa di semester ini
    const grades = await prisma.grade.findMany({
      where: { studentId, semesterId },
      include: { subject: { select: { id: true, name: true, code: true } } },
      orderBy: [{ subject: { name: 'asc' } }, { date: 'asc' }],
    });

    // Ambil data absensi semester ini
    const attendances = await prisma.attendance.findMany({
      where: { studentId, semesterId },
      select: { status: true },
    });

    const absensiStat = {
      hadir: attendances.filter((a) => a.status === 'HADIR').length,
      sakit: attendances.filter((a) => a.status === 'SAKIT').length,
      izin: attendances.filter((a) => a.status === 'IZIN').length,
      alfa: attendances.filter((a) => a.status === 'ALFA').length,
    };

    // Ambil info sekolah
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: { institution: { select: { name: true } } },
    });

    // Group grades by subject
    const subjectMap = new Map<
      string,
      { subject: { name: string; code: string }; grades: Array<{ type: GradeType; score: number }> }
    >();

    for (const grade of grades) {
      if (!subjectMap.has(grade.subjectId)) {
        subjectMap.set(grade.subjectId, { subject: grade.subject, grades: [] });
      }
      subjectMap.get(grade.subjectId)!.grades.push({ type: grade.type, score: grade.score });
    }

    // Kalkulasi nilai akhir per mapel
    const subjectResults = Array.from(subjectMap.values()).map(({ subject, grades: subjectGrades }) => {
      const result = calculateFinalScore(subjectGrades);
      const predikat = result.finalScore >= 90 ? 'A' : result.finalScore >= 80 ? 'B' : result.finalScore >= 70 ? 'C' : result.finalScore >= 60 ? 'D' : 'E';
      return {
        name: subject.name,
        code: subject.code,
        avgUH: result.avgUH && result.avgUH > 0 ? result.avgUH.toFixed(1) : '-',
        uts: result.utsScore && result.utsScore > 0 ? result.utsScore.toFixed(1) : '-',
        uas: result.uasScore && result.uasScore > 0 ? result.uasScore.toFixed(1) : '-',
        finalScore: result.finalScore && result.finalScore > 0 ? result.finalScore.toFixed(1) : '-',
        predikat: result.isComplete ? predikat : '-',
      };
    });

    // Overall average
    const completed = subjectResults.filter((s) => s.finalScore !== '-');
    const overallAvg =
      completed.length > 0
        ? (completed.reduce((sum, s) => sum + parseFloat(s.finalScore as string), 0) / completed.length).toFixed(1)
        : '-';

    // ─── Generate PDF ─────────────────────────────────────────────────────
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const marginL = 15;
    const marginR = 15;
    const contentW = pageW - marginL - marginR;

    // ── HEADER ──
    doc.setFillColor(0, 62, 199);
    doc.rect(0, 0, pageW, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(school?.name?.toUpperCase() ?? 'SEKOLAH', pageW / 2, 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(school?.institution?.name ?? '', pageW / 2, 16, { align: 'center' });
    doc.text(`Laporan Hasil Belajar — Semester ${semester.name} — Tahun Ajaran ${semester.academicYear.name}`, pageW / 2, 22, { align: 'center' });

    // ── JUDUL RAPOR ──
    doc.setTextColor(0, 62, 199);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('LAPORAN HASIL BELAJAR SISWA', pageW / 2, 38, { align: 'center' });

    doc.setDrawColor(0, 62, 199);
    doc.setLineWidth(0.8);
    doc.line(marginL, 41, pageW - marginR, 41);

    // ── IDENTITAS SISWA ──
    let y = 47;
    doc.setTextColor(25, 28, 30);
    doc.setFontSize(9);

    const tglLahir = student.birthDate
      ? format(new Date(student.birthDate), 'dd MMMM yyyy', { locale: localeId })
      : '-';

    const identitasData = [
      ['Nama Siswa', student.name],
      ['NIS / NISN', `${student.nis}${student.nisn ? ` / ${student.nisn}` : ''}`],
      ['Kelas', student.class.name],
      ['Tempat, Tgl Lahir', `${student.birthPlace ?? '-'}, ${tglLahir}`],
      ['Semester / Tahun Ajaran', `${semester.name} / ${semester.academicYear.name}`],
    ];

    // Background identitas
    doc.setFillColor(242, 244, 246);
    doc.roundedRect(marginL, y - 3, contentW, identitasData.length * 7 + 4, 2, 2, 'F');

    identitasData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 95, 118);
      doc.text(`${label}:`, marginL + 3, y + 2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(25, 28, 30);
      doc.text(value, marginL + 55, y + 2);
      y += 7;
    });

    y += 5;

    // ── TABEL NILAI ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 62, 199);
    doc.text('REKAPITULASI NILAI', marginL, y);
    y += 4;

    const tableHeaders = ['No', 'Mata Pelajaran', 'Rata-rata UH', 'UTS', 'UAS', 'Nilai Akhir', 'Predikat'];
    const colWidths = [8, 65, 22, 18, 18, 22, 18];
    const tableRows = subjectResults.map((sr, i) => [
      String(i + 1),
      sr.name,
      String(sr.avgUH),
      String(sr.uts),
      String(sr.uas),
      String(sr.finalScore),
      sr.predikat,
    ]);

    y = drawTable(doc, tableHeaders, colWidths, tableRows, marginL, y) + 3;

    // ── RATA-RATA KESELURUHAN ──
    doc.setFillColor(0, 62, 199);
    doc.rect(marginL, y, contentW, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('RATA-RATA KESELURUHAN', marginL + 3, y + 5.5);
    doc.text(String(overallAvg), pageW - marginR - 8, y + 5.5, { align: 'center' });
    y += 12;

    // ── ABSENSI ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 62, 199);
    doc.text('REKAPITULASI KEHADIRAN', marginL, y);
    y += 4;

    const absensiHeaders = ['Hadir', 'Sakit', 'Izin', 'Alpa', 'Total'];
    const totalAbsensi = absensiStat.hadir + absensiStat.sakit + absensiStat.izin + absensiStat.alfa;
    const absensiRows = [[
      String(absensiStat.hadir),
      String(absensiStat.sakit),
      String(absensiStat.izin),
      String(absensiStat.alfa),
      String(totalAbsensi),
    ]];
    const absensiWidths = [36, 36, 36, 36, 36];
    y = drawTable(doc, absensiHeaders, absensiWidths, absensiRows, marginL, y, 8) + 8;

    // ── TANDA TANGAN ──
    const sigY = Math.max(y, 230);
    doc.setTextColor(25, 28, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const waliKelasName = student.class.homeroomTeacher?.user?.name ?? '_______________';
    const dicetak = format(new Date(), 'dd MMMM yyyy', { locale: localeId });

    // Kanan: kepala sekolah
    doc.text(`_________________, ${dicetak}`, pageW - marginR, sigY, { align: 'right' });
    doc.text('Kepala Sekolah,', pageW - marginR - 25, sigY + 5);
    doc.line(pageW - marginR - 40, sigY + 30, pageW - marginR, sigY + 30);
    doc.setFont('helvetica', 'bold');
    doc.text('NIP. _______________', pageW - marginR - 28, sigY + 35);

    // Kiri: wali kelas
    doc.setFont('helvetica', 'normal');
    doc.text('Wali Kelas,', marginL, sigY + 5);
    doc.line(marginL, sigY + 30, marginL + 50, sigY + 30);
    doc.setFont('helvetica', 'bold');
    doc.text(waliKelasName, marginL + 2, sigY + 35);

    // ── FOOTER ──
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(0, 62, 199, 0.1);
    doc.setDrawColor(183, 196, 255);
    doc.setLineWidth(0.3);
    doc.line(marginL, pageH - 10, pageW - marginR, pageH - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(115, 118, 136);
    doc.text(`Dicetak oleh sistem Muadalah • ${school?.name ?? ''} • ${dicetak}`, pageW / 2, pageH - 6, { align: 'center' });

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const safeStudentName = student.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `rapor-${safeStudentName}-semester-${semester.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('GET /api/laporan/rapor/pdf error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
