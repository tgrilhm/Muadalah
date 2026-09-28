import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { uploadFile, deleteFile, generateStudentPhotoPath } from '@/lib/supabase-storage';

const BUCKET_NAME = 'students';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * POST /api/students/[id]/photo
 * Upload student photo to Supabase Storage
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role
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

    // Check permissions
    if (!['ADMIN', 'KEPALA_SEKOLAH', 'GURU'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Verify student exists and belongs to user's school
    const student = await prisma.student.findFirst({
      where: {
        id,
        class: {
          schoolId,
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
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
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Delete old photo if exists
    if (student.photo) {
      try {
        // Extract path from old photo URL
        const oldPhotoUrl = new URL(student.photo);
        const oldPhotoPath = oldPhotoUrl.pathname.split('/storage/v1/object/public/student-photos/')[1];
        if (oldPhotoPath) {
          await deleteFile(BUCKET_NAME, oldPhotoPath);
        }
      } catch (error) {
        console.error('Error deleting old photo:', error);
        // Continue even if old photo deletion fails
      }
    }

    // Generate unique file path
    const filePath = generateStudentPhotoPath(id, file.name);

    // Upload file to Supabase Storage
    const photoUrl = await uploadFile(BUCKET_NAME, filePath, file);

    // Update student record with new photo URL
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        photo: photoUrl,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        photo: true,
      },
    });

    return NextResponse.json({
      data: updatedStudent,
      message: 'Photo uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/students/[id]/photo
 * Remove student photo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role
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

    // Check permissions
    if (!['ADMIN', 'KEPALA_SEKOLAH', 'GURU'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Verify student exists and belongs to user's school
    const student = await prisma.student.findFirst({
      where: {
        id,
        class: {
          schoolId,
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (!student.photo) {
      return NextResponse.json(
        { error: 'Student has no photo to delete' },
        { status: 400 }
      );
    }

    // Delete photo from storage
    try {
      const photoUrl = new URL(student.photo);
      const photoPath = photoUrl.pathname.split('/storage/v1/object/public/student-photos/')[1];
      if (photoPath) {
        await deleteFile(BUCKET_NAME, photoPath);
      }
    } catch (error) {
      console.error('Error deleting photo from storage:', error);
      // Continue to update database even if storage deletion fails
    }

    // Update student record to remove photo URL
    await prisma.student.update({
      where: { id },
      data: {
        photo: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
