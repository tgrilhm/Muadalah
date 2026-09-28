'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSchool } from '@/hooks/use-school';
import { useStudents, useDeleteStudent } from '@/hooks/use-students';
import { MaterialIcon } from '@/components/ui/material-icon';
import { StudentFilters } from '@/components/students/student-filters';
import { StudentTable } from '@/components/students/student-table';
import { StudentStatus } from '@prisma/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Mock classes data - should be fetched from API
const mockClasses = [
  { id: '1', name: '10A', grade: 10 },
  { id: '2', name: '10B', grade: 10 },
  { id: '3', name: '11A', grade: 11 },
  { id: '4', name: '11B', grade: 11 },
  { id: '5', name: '12A', grade: 12 },
  { id: '6', name: '12B', grade: 12 },
];

export default function StudentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { selectedSchool } = useSchool();

  // Filter state
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState<string>();
  const [status, setStatus] = useState<StudentStatus | 'all'>();
  const [page, setPage] = useState(1);
  const limit = 20;

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch students with filters - pass schoolId as first parameter
  const { data, isLoading, error } = useStudents(selectedSchool?.id, {
    page,
    limit,
    search: search || undefined,
    classId: classId === 'all' ? undefined : classId,
    status: status === 'all' ? undefined : status,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Delete mutation
  const deleteMutation = useDeleteStudent();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on search
  };

  const handleClassChange = (value: string) => {
    setClassId(value === 'all' ? undefined : value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value === 'all' ? undefined : (value as StudentStatus));
    setPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setClassId(undefined);
    setStatus(undefined);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteMutation.mutateAsync(deleteId);
      toast({
        title: 'Berhasil',
        description: 'Data siswa berhasil dihapus',
      });
      setDeleteId(null);
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Gagal menghapus data siswa',
        variant: 'destructive',
      });
    }
  };

  const students = data?.data || [];
  const meta = data?.meta;

  // Show empty state if no school selected
  if (!selectedSchool) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <MaterialIcon name="school" size="lg" className="text-[var(--muadalah-on-surface-variant)] opacity-50" />
        <div className="text-center">
          <h3 className="text-xl font-semibold text-[var(--muadalah-on-surface)] mb-2">
            Pilih Sekolah
          </h3>
          <p className="text-[var(--muadalah-on-surface-variant)]">
            Silakan pilih sekolah (SMP/SMA) dari menu header untuk melihat data siswa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <nav className="flex items-center gap-2 text-sm text-[var(--muadalah-on-surface-variant)]">
            <Link href="/dashboard" className="hover:text-[var(--muadalah-primary)] transition-colors">
              Dashboard
            </Link>
            <MaterialIcon name="chevron_right" size="xs" />
            <span className="text-[var(--muadalah-on-surface)] font-medium">Manajemen Siswa</span>
          </nav>
          <h1 className="text-[32px] font-bold leading-tight text-[var(--muadalah-on-surface)]">Daftar Siswa</h1>
        </div>
        <Link 
          href="/dashboard/siswa/tambah" 
          className={cn(
            buttonVariants({ variant: 'default' }),
            'flex items-center gap-2 bg-[var(--muadalah-primary)] hover:bg-[var(--muadalah-surface-tint)] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5'
          )}
        >
          <MaterialIcon name="add" size="sm" />
          Tambah Siswa
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm border border-[var(--muadalah-border-subtle)] overflow-hidden">
        <StudentFilters
          search={search}
          onSearchChange={handleSearchChange}
          classId={classId}
          onClassChange={handleClassChange}
          status={status}
          onStatusChange={handleStatusChange}
          classes={mockClasses}
          onReset={handleReset}
        />

        {/* Table */}
        <div className="p-6">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-4">
              Gagal memuat data siswa. Silakan coba lagi.
            </div>
          )}

          <StudentTable
            students={students}
            isLoading={isLoading}
            onDelete={(id) => setDeleteId(id)}
          />

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-[var(--muadalah-border-subtle)]">
              <p className="text-sm text-[var(--muadalah-on-surface-variant)]">
                Menampilkan{' '}
                <span className="font-medium text-[var(--muadalah-on-surface)]">
                  {(page - 1) * limit + 1}-{Math.min(page * limit, meta.total)}
                </span>{' '}
                dari{' '}
                <span className="font-medium text-[var(--muadalah-on-surface)]">{meta.total}</span>{' '}
                siswa
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!meta.hasPrevPage || isLoading}
                >
                  Sebelumnya
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        disabled={isLoading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {meta.totalPages > 5 && (
                    <>
                      <span className="text-muted-foreground px-2">...</span>
                      <Button
                        variant={page === meta.totalPages ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(meta.totalPages)}
                        disabled={isLoading}
                      >
                        {meta.totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={!meta.hasNextPage || isLoading}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Siswa?</AlertDialogTitle>
            <AlertDialogDescription>
              Status siswa akan diubah menjadi "Keluar". Data siswa tidak akan dihapus
              permanen dan masih dapat dilihat di filter status "Keluar".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
