'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCreateStudent } from '@/hooks/use-students';
import { MaterialIcon } from '@/components/ui/material-icon';
import { StudentForm } from '@/components/students/student-form';
import { CreateStudentInput } from '@/lib/validations/student.schema';

// Mock classes data - should be fetched from API
const mockClasses = [
  { id: '1', name: '10A', grade: 10 },
  { id: '2', name: '10B', grade: 10 },
  { id: '3', name: '11A', grade: 11 },
  { id: '4', name: '11B', grade: 11 },
  { id: '5', name: '12A', grade: 12 },
  { id: '6', name: '12B', grade: 12 },
];

export default function AddStudentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateStudent();

  const handleSubmit = async (data: CreateStudentInput) => {
    try {
      const result = await createMutation.mutateAsync(data);
      
      toast({
        title: 'Berhasil',
        description: 'Data siswa berhasil ditambahkan',
      });

      // Redirect to student detail page
      router.push(`/dashboard/siswa/${result.data.id}`);
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal menambahkan data siswa',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/siswa"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'w-fit flex items-center gap-2 text-[var(--muadalah-on-surface-variant)] hover:text-[var(--muadalah-primary)]'
          )}
        >
          <MaterialIcon name="arrow_back" size="sm" />
          Kembali ke Daftar Siswa
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
            <span className="text-[var(--muadalah-on-surface)] font-medium">Tambah Siswa</span>
          </nav>
          <h1 className="text-[32px] font-bold leading-tight text-[var(--muadalah-on-surface)]">Tambah Siswa Baru</h1>
          <p className="text-[var(--muadalah-on-surface-variant)] mt-1">
            Lengkapi form di bawah untuk menambahkan data siswa baru
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] shadow-sm p-6">
        <StudentForm
          onSubmit={handleSubmit}
          classes={mockClasses}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}
