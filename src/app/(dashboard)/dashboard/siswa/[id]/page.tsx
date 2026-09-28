'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useStudent, useDeleteStudent } from '@/hooks/use-students';
import { MaterialIcon } from '@/components/ui/material-icon';
import { StudentAvatar } from '@/components/students/student-avatar';
import { StudentStatus, Gender } from '@prisma/client';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useDownloadRaporPdf } from '@/hooks/use-laporan';
import { useQuery } from '@tanstack/react-query';

const statusConfig = {
  [StudentStatus.AKTIF]: { label: 'Aktif', className: 'bg-green-100 text-green-800' },
  [StudentStatus.LULUS]: { label: 'Lulus', className: 'bg-blue-100 text-blue-800' },
  [StudentStatus.PINDAH]: { label: 'Pindah', className: 'bg-orange-100 text-orange-800' },
  [StudentStatus.KELUAR]: { label: 'Keluar', className: 'bg-gray-100 text-gray-800' },
};

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const studentId = params.id as string;

  const { data, isLoading, error } = useStudent(studentId);
  const deleteMutation = useDeleteStudent();
  const downloadRapor = useDownloadRaporPdf();

  // Fetch semester aktif untuk rapor
  const { data: semesterRes } = useQuery<{ success: boolean; data: Array<{ id: string; name: string; isActive: boolean }> }>({
    queryKey: ['semesters-for-rapor'],
    queryFn: async () => {
      const res = await fetch('/api/semester');
      return res.json();
    },
  });
  const activeSemester = semesterRes?.data?.find((s) => s.isActive) ?? semesterRes?.data?.[0];

  const handleDownloadRapor = async () => {
    if (!activeSemester) {
      toast({ title: 'Semester tidak ditemukan', description: 'Pastikan ada semester aktif.', variant: 'destructive' });
      return;
    }
    try {
      await downloadRapor.mutateAsync({ studentId, semesterId: activeSemester.id });
      toast({ title: '✅ Rapor berhasil diunduh', description: `Rapor ${activeSemester.name} telah diunduh.` });
    } catch (err) {
      toast({ title: '❌ Gagal mengunduh rapor', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus data siswa ini?')) return;

    try {
      await deleteMutation.mutateAsync(studentId);
      toast({
        title: 'Berhasil',
        description: 'Data siswa berhasil dihapus',
      });
      router.push('/dashboard/siswa');
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Gagal menghapus data siswa',
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
          href="/dashboard/siswa"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }), 
            'w-fit flex items-center gap-2 text-[var(--muadalah-on-surface-variant)] hover:text-[var(--muadalah-primary)]'
          )}
        >
          <MaterialIcon name="arrow_back" size="sm" />
          Kembali ke Daftar Siswa
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-[var(--muadalah-surface-card)] rounded-xl border border-[var(--muadalah-border-subtle)] shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <StudentAvatar name={student.name} photo={student.photo} size="xl" />

          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[var(--muadalah-on-surface)]">{student.name}</h1>
                <p className="text-[var(--muadalah-on-surface-variant)]">NIS: {student.nis}</p>
                {student.nisn && (
                  <p className="text-sm text-[var(--muadalah-on-surface-variant)]">NISN: {student.nisn}</p>
                )}
              </div>
              <Badge className={statusConfig[student.status as StudentStatus].className}>
                {statusConfig[student.status as StudentStatus].label}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div>
                <p className="text-sm text-[var(--muadalah-on-surface-variant)]">Kelas</p>
                <p className="font-medium text-[var(--muadalah-on-surface)]">{student.class.name}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--muadalah-on-surface-variant)]">Jenis Kelamin</p>
                <p className="font-medium text-[var(--muadalah-on-surface)]">
                  {student.gender === Gender.LAKI_LAKI ? 'Laki-laki' : 'Perempuan'}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--muadalah-on-surface-variant)]">Tanggal Masuk</p>
                <p className="font-medium text-[var(--muadalah-on-surface)]">
                  {format(new Date(student.enrollDate), 'dd MMMM yyyy', { locale: localeId })}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Link
                href={`/dashboard/siswa/${student.id}/edit`}
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'flex items-center gap-2 bg-[var(--muadalah-primary)] hover:bg-[var(--muadalah-surface-tint)]'
                )}
              >
                <MaterialIcon name="edit" size="sm" />
                Edit Data
              </Link>
              <Button
                variant="outline"
                onClick={handleDownloadRapor}
                disabled={downloadRapor.isPending || !activeSemester}
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50"
              >
                {downloadRapor.isPending ? (
                  <MaterialIcon name="progress_activity" size="sm" className="animate-spin" />
                ) : (
                  <MaterialIcon name="picture_as_pdf" size="sm" />
                )}
                Rapor PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="text-destructive hover:text-destructive flex items-center gap-2"
              >
                <MaterialIcon name="delete" size="sm" />
                Hapus
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Informasi Pribadi</h2>
          <div className="space-y-3">
            {student.birthPlace && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tempat Lahir</span>
                <span className="font-medium">{student.birthPlace}</span>
              </div>
            )}
            {student.birthDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal Lahir</span>
                <span className="font-medium">
                  {format(new Date(student.birthDate), 'dd MMMM yyyy', { locale: localeId })}
                </span>
              </div>
            )}
            {student.religion && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agama</span>
                <span className="font-medium">{student.religion}</span>
              </div>
            )}
            {student.phone && (
              <div className="flex items-center gap-2">
                <MaterialIcon name="phone" size="sm" className="text-muted-foreground" />
                <span className="font-medium">{student.phone}</span>
              </div>
            )}
            {student.address && (
              <div className="flex items-start gap-2">
                <MaterialIcon name="location_on" size="sm" className="text-muted-foreground mt-1" />
                <span className="font-medium">{student.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Parent Contacts */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Kontak Orang Tua</h2>
          <div className="space-y-4">
            {student.parentContacts?.map((contact: any) => (
              <div key={contact.id} className="border-l-4 border-primary pl-4">
                <p className="font-medium">{contact.name}</p>
                <p className="text-sm text-muted-foreground">{contact.relation}</p>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <MaterialIcon name="phone" className="w-3 h-3" />
                  <span>{contact.phone}</span>
                </div>
                {contact.email && (
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <MaterialIcon name="mail" className="w-3 h-3" />
                    <span>{contact.email}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
