'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MaterialIcon } from '@/components/ui/material-icon';
import { StudentAvatar } from './student-avatar';
import { StudentStatus, Gender } from '@prisma/client';

interface Student {
  id: string;
  nis: string;
  nisn?: string | null;
  name: string;
  gender: Gender;
  photo?: string | null;
  status: StudentStatus;
  class: {
    id: string;
    name: string;
    grade: number;
  };
}

interface StudentTableProps {
  students: Student[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

const statusConfig = {
  [StudentStatus.AKTIF]: {
    label: 'Aktif',
    variant: 'default' as const,
    className: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] font-medium text-xs hover:bg-[#10B981]/10',
    dotColor: 'bg-[#10B981]',
  },
  [StudentStatus.LULUS]: {
    label: 'Lulus',
    variant: 'secondary' as const,
    className: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-medium text-xs hover:bg-blue-100',
    dotColor: 'bg-blue-800',
  },
  [StudentStatus.PINDAH]: {
    label: 'Pindah',
    variant: 'secondary' as const,
    className: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 font-medium text-xs hover:bg-orange-100',
    dotColor: 'bg-orange-800',
  },
  [StudentStatus.KELUAR]: {
    label: 'Keluar',
    variant: 'secondary' as const,
    className: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 font-medium text-xs hover:bg-gray-100',
    dotColor: 'bg-gray-800',
  },
};

/**
 * StudentTable Component
 * Displays list of students in a table format with actions
 */
export function StudentTable({ students, isLoading, onDelete }: StudentTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Siswa</TableHead>
              <TableHead>NISN</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>L/P</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={7}>
                  <div className="h-12 bg-muted animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="rounded-md border p-12 text-center">
        <p className="text-muted-foreground">Tidak ada data siswa</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">No</TableHead>
            <TableHead className="w-[300px]">Siswa</TableHead>
            <TableHead className="w-[130px]">NISN</TableHead>
            <TableHead className="w-[90px]">Kelas</TableHead>
            <TableHead className="w-[60px]">L/P</TableHead>
            <TableHead className="w-[115px]">Status</TableHead>
            <TableHead className="w-[130px] text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student, index) => (
            <TableRow key={student.id} className="group hover:bg-muted/50">
              <TableCell className="font-medium text-muted-foreground">
                {index + 1}
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-3">
                  <StudentAvatar
                    name={student.name}
                    photo={student.photo}
                    size="md"
                  />
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      NIS: {student.nis}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <span className="text-sm">
                  {student.nisn || '-'}
                </span>
              </TableCell>

              <TableCell>
                <span className="text-sm font-medium">
                  {student.class.name}
                </span>
              </TableCell>

              <TableCell>
                <span className="text-sm">
                  {student.gender === Gender.LAKI_LAKI ? 'L' : 'P'}
                </span>
              </TableCell>

              <TableCell>
                <span className={statusConfig[student.status].className}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[student.status].dotColor}`}></span>
                  {statusConfig[student.status].label}
                </span>
              </TableCell>

              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Link
                    href={`/dashboard/siswa/${student.id}`}
                    title="Lihat Detail"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-[var(--muadalah-primary-container)]/10 hover:text-[var(--muadalah-primary)] transition-colors text-muted-foreground"
                  >
                    <MaterialIcon name="visibility" size="sm" />
                  </Link>

                  <Link
                    href={`/dashboard/siswa/${student.id}/edit`}
                    title="Edit"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-[var(--muadalah-primary-container)]/10 hover:text-[var(--muadalah-primary)] transition-colors text-muted-foreground"
                  >
                    <MaterialIcon name="edit" size="sm" />
                  </Link>

                  {onDelete && (
                    <button
                      onClick={() => onDelete(student.id)}
                      title="Hapus"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <MaterialIcon name="delete" size="sm" />
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
