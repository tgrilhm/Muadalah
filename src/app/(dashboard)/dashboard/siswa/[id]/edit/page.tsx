'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useStudent, useUpdateStudent } from '@/hooks/use-students';
import { MaterialIcon } from '@/components/ui/material-icon';
import { StudentForm } from '@/components/students/student-form';
import { UpdateStudentInput } from '@/lib/validations/student.schema';

// Mock classes data - should be fetched from API
const mockClasses = [
  { id: '1', name: '10A', grade: 10 },
  { id: '2', name: '10B', grade: 10 },
  { id: '3', name: '11A', grade: 11 },
  { id: '4', name: '11B', grade: 11 },
  { id: '5', name: '12A', grade: 12 },
  { id: '6', name: '12B', grade: 12 },
];

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const studentId = params.id as string;

  const { data, isLoading, error } = useStudent(studentId);
  const updateMutation = useUpdateStudent();

  const handleSubmit = async (formData: any) => {
    try {
      await updateMutation.mutateAsync({
        id: studentId,
        data: formData as UpdateStudentInput,
      });

      toast({
        title: 'Berhasil',
        description: 'Data siswa berhasil diperbarui',
      });

      // Redirect to student detail page
      router.push(`/dashboard/siswa/${studentId}`);
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal memperbarui data siswa',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">Gagal memuat data siswa</p>
        <Button onClick={() => router.push('/dashboard/siswa')}>
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const student = data.data;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href={`/dashboard/siswa/${studentId}`}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'w-fit flex items-center gap-2 text-[var(--muadalah-on-surface-variant)] hover:text-[var(--muadalah-primary)]'
          )}
        >
          <MaterialIcon name="arrow_back" size="sm" />
          Kembali ke Detail Siswa
        </Link>

        <div className="flex flex-col gap-2">
          <nav className="flex items-center gap-2 text-sm text-[var(--muadalah-on-surface-variant)]">
            <Link href="/dashboard" className="hover:text-[var(--muadalah-primary)] transition-colors">
              Dashboard
            </Link>
            <MaterialIcon name="chevron_right" size="xs" />
            <Link href="/dashboard/siswa" className="hover:text-[var(--muadalah-primary)] transition-colors">
              Manajemen Siswa
            </Link>
            <MaterialIcon name="chevron_right" size="xs" />
            <Link
              href={`/dashboard/siswa/${studentId}`}
              className="hover:text-[var(--muadalah-primary)] transition-colors"
            >
              {student.name}
            </Link>
            <MaterialIcon name="chevron_right" size="xs" />
            <span className="text-[var(--muadalah-on-surface)] font-medium">Edit</span>
          </nav>
          <h1 className="text-[32px] font-bold leading-tight text-[var(--muadalah-on-surface)]">Edit Data Siswa</h1>
          <p className="text-[var(--muadalah-on-surface-variant)] mt-1">
            Perbarui informasi siswa {student.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] shadow-sm p-6">
        <StudentForm
          onSubmit={handleSubmit}
          classes={mockClasses}
          isSubmitting={updateMutation.isPending}
          defaultValues={{
            nis: student.nis,
            nisn: student.nisn,
            name: student.name,
            gender: student.gender,
            classId: student.classId,
            birthPlace: student.birthPlace,
            birthDate: student.birthDate,
            religion: student.religion,
            address: student.address,
            phone: student.phone,
            photo: student.photo,
            status: student.status,
            parentContacts: student.parentContacts || [],
          }}
        />
      </div>
    </div>
  );
}
