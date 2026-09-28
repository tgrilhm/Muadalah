import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { CreateStudentSchema } from '@/lib/validations/student.schema';
import ExcelJS from 'exceljs';
import { Gender, StudentStatus } from '@prisma/client';

/**
 * POST /api/students/import
 * Bulk import students from Excel file
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role and school
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { schoolUsers: true },
    });

    if (!dbUser || dbUser.schoolUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not associated with any school' },
        { status: 403 }
      );
    }

    const userRole = dbUser.schoolUsers[0].role;
    const schoolId = dbUser.schoolUsers[0].schoolId;

    // Check permissions (only ADMIN can import)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only Excel files (.xlsx, .xls) are allowed.' },
        { status: 400 }
      );
    }

    // Read Excel file
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return NextResponse.json(
        { error: 'Excel file is empty or invalid' },
        { status: 400 }
      );
    }

    // Expected columns: NIS, NISN, Nama, Jenis Kelamin, Tempat Lahir, Tanggal Lahir, Agama, Alamat, Telepon, Kelas ID, Nama Ortu, Hubungan, Telepon Ortu, Email Ortu
    const errors: Array<{ row: number; errors: string[] }> = [];
    const validStudents: any[] = [];

    // Process each row (skip header)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      const rowData = {
        nis: row.getCell(1).value?.toString() || '',
        nisn: row.getCell(2).value?.toString() || null,
        name: row.getCell(3).value?.toString() || '',
        gender: row.getCell(4).value?.toString().toUpperCase() || '',
        birthPlace: row.getCell(5).value?.toString() || null,
        birthDate: row.getCell(6).value ? new Date(row.getCell(6).value as any) : null,
        religion: row.getCell(7).value?.toString() || null,
        address: row.getCell(8).value?.toString() || null,
        phone: row.getCell(9).value?.toString() || null,
        classId: row.getCell(10).value?.toString() || '',
        parentName: row.getCell(11).value?.toString() || '',
        parentRelation: row.getCell(12).value?.toString() || '',
        parentPhone: row.getCell(13).value?.toString() || '',
        parentEmail: row.getCell(14).value?.toString() || null,
      };

      // Validate gender
      if (!['LAKI_LAKI', 'PEREMPUAN'].includes(rowData.gender)) {
        errors.push({
          row: rowNumber,
          errors: [`Jenis kelamin harus 'LAKI_LAKI' atau 'PEREMPUAN', ditemukan: '${rowData.gender}'`],
        });
        return;
      }

      // Build student data for validation
      const studentData = {
        nis: rowData.nis,
        nisn: rowData.nisn,
        name: rowData.name,
        gender: rowData.gender as Gender,
        birthPlace: rowData.birthPlace,
        birthDate: rowData.birthDate?.toISOString() || null,
        religion: rowData.religion,
        address: rowData.address,
        phone: rowData.phone,
        classId: rowData.classId,
        status: StudentStatus.AKTIF,
        parentContacts: [
          {
            name: rowData.parentName,
            relation: rowData.parentRelation,
            phone: rowData.parentPhone,
            email: rowData.parentEmail,
          },
        ],
      };

      // Validate with Zod schema
      const validationResult = CreateStudentSchema.safeParse(studentData);
      if (!validationResult.success) {
        errors.push({
          row: rowNumber,
          errors: validationResult.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
        });
        return;
      }

      validStudents.push(validationResult.data);
    });

    // If there are validation errors, return them
    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed for some rows',
          details: errors,
          successCount: 0,
          errorCount: errors.length,
        },
        { status: 422 }
      );
    }

    // Verify all classes belong to user's school
    const classIds = [...new Set(validStudents.map((s) => s.classId))];
    const classes = await prisma.class.findMany({
      where: { id: { in: classIds }, schoolId },
      select: { id: true },
    });

    const validClassIds = new Set(classes.map((c) => c.id));
    const invalidClassStudents = validStudents.filter((s) => !validClassIds.has(s.classId));

    if (invalidClassStudents.length > 0) {
      return NextResponse.json(
        {
          error: 'Some classes do not belong to your school',
          invalidClasses: invalidClassStudents.map((s) => s.classId),
        },
        { status: 400 }
      );
    }

    // Insert students in transaction
    const results = { success: 0, failed: 0, errors: [] as any[] };

    for (const studentData of validStudents) {
      try {
        const { parentContacts, ...student } = studentData;

        // Check for duplicate NIS
        const existing = await prisma.student.findFirst({
          where: { classId: student.classId, nis: student.nis },
        });

        if (existing) {
          results.failed++;
          results.errors.push({
            nis: student.nis,
            name: student.name,
            error: 'NIS sudah ada di kelas ini',
          });
          continue;
        }

        // Create student
        await prisma.student.create({
          data: {
            ...student,
            birthDate: student.birthDate ? new Date(student.birthDate) : null,
            parentContacts: {
              create: parentContacts,
            },
          },
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          nis: studentData.nis,
          name: studentData.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      summary: {
        total: validStudents.length,
        success: results.success,
        failed: results.failed,
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error('Error importing students:', error);
    return NextResponse.json(
      { error: 'Failed to import students' },
      { status: 500 }
    );
  }
}
