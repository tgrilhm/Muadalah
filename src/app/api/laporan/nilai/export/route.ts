import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { laporanNilaiQuerySchema } from '@/lib/validations/laporan.schema';
import { calculateFinalScore } from '@/lib/grade.utils';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { GradeType } from '@prisma/client';

/**
 * GET /api/laporan/nilai/export
 * Export nilai siswa ke Excel (2 sheet: Rekap + Ranking)
 *
 * Query: semesterId, classId (optional), subjectId (optional)
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
    const validation = laporanNilaiQuerySchema.safeParse({
      semesterId: searchParams.get('semesterId'),
      classId: searchParams.get('classId') ?? undefined,
      subjectId: searchParams.get('subjectId') ?? undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak valid', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { semesterId, classId, subjectId } = validation.data;

    // Ambil info semester
    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
      include: { academicYear: { select: { name: true } } },
    });

    if (!semester) {
      return NextResponse.json({ success: false, error: 'Semester tidak ditemukan' }, { status: 404 });
    }

    // Ambil semua nilai dalam semester ini
    const grades = await prisma.grade.findMany({
      where: {
        semesterId,
        ...(subjectId ? { subjectId } : {}),
        student: {
          class: { schoolId },
          ...(classId ? { classId } : {}),
          status: 'AKTIF',
        },
      },
      include: {
        student: {
          select: { id: true, name: true, nis: true, classId: true },
          include: { class: { select: { name: true, grade: true } } },
        },
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ student: { name: 'asc' } }, { subject: { name: 'asc' } }],
    });

    // Group by student → subject → grades
    const studentMap = new Map<
      string,
      {
        student: { id: string; name: string; nis: string; class: { name: string; grade: number } };
        subjects: Map<
          string,
          {
            subject: { id: string; name: string; code: string };
            grades: Array<{ type: GradeType; score: number }>;
          }
        >;
      }
    >();

    for (const grade of grades) {
      const sid = grade.studentId;
      if (!studentMap.has(sid)) {
        studentMap.set(sid, {
          student: {
            id: grade.student.id,
            name: grade.student.name,
            nis: grade.student.nis,
            class: grade.student.class,
          },
          subjects: new Map(),
        });
      }
      const sEntry = studentMap.get(sid)!;
      const subId = grade.subjectId;
      if (!sEntry.subjects.has(subId)) {
        sEntry.subjects.set(subId, { subject: grade.subject, grades: [] });
      }
      sEntry.subjects.get(subId)!.grades.push({ type: grade.type, score: grade.score });
    }

    // Kumpulkan semua mata pelajaran unik (dalam urutan)
    const allSubjects = new Map<string, { id: string; name: string; code: string }>();
    for (const { subjects } of studentMap.values()) {
      for (const [subId, { subject }] of subjects.entries()) {
        if (!allSubjects.has(subId)) allSubjects.set(subId, subject);
      }
    }
    const subjectList = Array.from(allSubjects.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Hitung nilai akhir per siswa per mapel
    type StudentResult = {
      student: { id: string; name: string; nis: string; class: { name: string; grade: number } };
      nilaiPerMapel: { subjectId: string; subjectName: string; finalScore: number; isComplete: boolean }[];
      rataRata: number;
      ranking: number;
    };

    const studentResults: StudentResult[] = [];

    for (const { student, subjects } of studentMap.values()) {
      const nilaiPerMapel = subjectList.map((sub) => {
        const entry = subjects.get(sub.id);
        if (!entry) return { subjectId: sub.id, subjectName: sub.name, finalScore: 0, isComplete: false };
        const result = calculateFinalScore(entry.grades);
        return {
          subjectId: sub.id,
          subjectName: sub.name,
          finalScore: result.finalScore,
          isComplete: result.isComplete,
        };
      });

      const completed = nilaiPerMapel.filter((n) => n.isComplete);
      const rataRata =
        completed.length > 0
          ? Math.round((completed.reduce((s, n) => s + n.finalScore, 0) / completed.length) * 10) / 10
          : 0;

      studentResults.push({ student, nilaiPerMapel, rataRata, ranking: 0 });
    }

    // Sort by rata-rata (descending) dan beri ranking
    studentResults.sort((a, b) => b.rataRata - a.rataRata);
    studentResults.forEach((r, i) => { r.ranking = i + 1; });

    // Buat Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Muadalah';
    workbook.created = new Date();

    const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } });

    // ─── Sheet 1: Rekap Nilai ───
    const sheetRekap = workbook.addWorksheet('Rekap Nilai', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    const colCount = subjectList.length + 4; // No + NIS + Nama + Kelas + mapel + rata2
    const lastCol = String.fromCharCode(64 + Math.min(colCount + 1, 90));

    sheetRekap.mergeCells(`A1:${lastCol}1`);
    const t1 = sheetRekap.getCell('A1');
    t1.value = `REKAP NILAI SISWA — ${school?.name?.toUpperCase() ?? ''}`;
    t1.font = { bold: true, size: 14, color: { argb: 'FF003EC7' } };
    t1.alignment = { horizontal: 'center', vertical: 'middle' };

    sheetRekap.mergeCells(`A2:${lastCol}2`);
    const t2 = sheetRekap.getCell('A2');
    t2.value = `Semester ${semester.name} — Tahun Ajaran ${semester.academicYear.name}`;
    t2.font = { size: 11, color: { argb: 'FF505F76' } };
    t2.alignment = { horizontal: 'center' };

    sheetRekap.mergeCells(`A3:${lastCol}3`);
    sheetRekap.getCell('A3').value = `Dicetak: ${format(new Date(), 'dd MMMM yyyy', { locale: localeId })}`;
    sheetRekap.getCell('A3').font = { size: 10, color: { argb: 'FF737688' } };
    sheetRekap.getCell('A3').alignment = { horizontal: 'center' };

    sheetRekap.addRow([]);

    // Header tabel
    const headerValues = ['No', 'NIS', 'Nama Siswa', 'Kelas', ...subjectList.map((s) => s.code), 'Rata-rata'];
    const headerRow = sheetRekap.addRow(headerValues);
    headerRow.height = 35;
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
    studentResults.forEach((sr, index) => {
      const row = sheetRekap.addRow([
        index + 1,
        sr.student.nis,
        sr.student.name,
        sr.student.class.name,
        ...sr.nilaiPerMapel.map((n) => (n.finalScore > 0 ? n.finalScore : '-')),
        sr.rataRata > 0 ? sr.rataRata : '-',
      ]);

      const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF2F4F6';
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
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
      row.height = 20;

      // Warnai rata-rata
      const avgCell = row.getCell(headerValues.length);
      const avg = sr.rataRata;
      if (avg >= 85) avgCell.font = { bold: true, color: { argb: 'FF10B981' } };
      else if (avg < 70 && avg > 0) avgCell.font = { bold: true, color: { argb: 'FFBA1A1A' } };
    });

    // Set column widths sheet1
    const cols: ExcelJS.Column[] = [
      { key: 'no', width: 5 } as ExcelJS.Column,
      { key: 'nis', width: 14 } as ExcelJS.Column,
      { key: 'nama', width: 28 } as ExcelJS.Column,
      { key: 'kelas', width: 8 } as ExcelJS.Column,
      ...subjectList.map(() => ({ key: 'sub', width: 8 }) as ExcelJS.Column),
      { key: 'rata', width: 10 } as ExcelJS.Column,
    ];
    sheetRekap.columns = cols;

    // ─── Sheet 2: Ranking ───
    const sheetRanking = workbook.addWorksheet('Ranking');
    sheetRanking.mergeCells('A1:F1');
    sheetRanking.getCell('A1').value = `RANKING SISWA — Semester ${semester.name} — ${semester.academicYear.name}`;
    sheetRanking.getCell('A1').font = { bold: true, size: 13, color: { argb: 'FF003EC7' } };
    sheetRanking.getCell('A1').alignment = { horizontal: 'center' };
    sheetRanking.addRow([]);

    const rankHeader = sheetRanking.addRow(['Ranking', 'NIS', 'Nama Siswa', 'Kelas', 'Rata-rata', 'Predikat']);
    rankHeader.height = 28;
    rankHeader.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003EC7' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    studentResults.forEach((sr, index) => {
      const predikat = sr.rataRata >= 90 ? 'A' : sr.rataRata >= 80 ? 'B' : sr.rataRata >= 70 ? 'C' : sr.rataRata >= 60 ? 'D' : 'E';
      const row = sheetRanking.addRow([
        sr.ranking,
        sr.student.nis,
        sr.student.name,
        sr.student.class.name,
        sr.rataRata,
        predikat,
      ]);
      const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF2F4F6';
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
      if (index < 3) row.getCell(1).font = { bold: true, color: { argb: 'FFF59E0B' } };
      row.height = 20;
    });

    sheetRanking.columns = [
      { width: 10 }, { width: 14 }, { width: 30 }, { width: 10 }, { width: 12 }, { width: 10 },
    ] as ExcelJS.Column[];

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `rekap-nilai-${semester.name.toLowerCase().replace(/\s+/g, '-')}-${semester.academicYear.name.replace('/', '-')}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('GET /api/laporan/nilai/export error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
