'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MaterialIcon } from '@/components/ui/material-icon';
import { StudentStatus } from '@prisma/client';

interface Class {
  id: string;
  name: string;
  grade: number;
}

interface StudentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  classId?: string;
  onClassChange: (value: string) => void;
  status?: StudentStatus | 'all';
  onStatusChange: (value: string) => void;
  classes: Class[];
  onReset?: () => void;
}

/**
 * StudentFilters Component
 * Search and filter controls for student list
 */
export function StudentFilters({
  search,
  onSearchChange,
  classId,
  onClassChange,
  status,
  onStatusChange,
  classes,
  onReset,
}: StudentFiltersProps) {
  const hasActiveFilters = search || classId || status;

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-6 bg-[var(--muadalah-surface-container-lowest)] border-b border-[var(--muadalah-border-subtle)]">
      {/* Search Input */}
      <div className="flex-1 max-w-md relative">
        <MaterialIcon 
          name="search" 
          size="sm" 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muadalah-outline)]" 
        />
        <Input
          type="text"
          placeholder="Cari nama siswa atau NISN..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-[var(--muadalah-surface-container-low)] border-[var(--muadalah-border-subtle)] focus:ring-2 focus:ring-[var(--muadalah-primary)]/20 focus:border-[var(--muadalah-primary)]"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Class Filter */}
        <Select value={classId || 'all'} onValueChange={onClassChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Semua Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                Kelas {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={status || 'all'} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value={StudentStatus.AKTIF}>Aktif</SelectItem>
            <SelectItem value={StudentStatus.LULUS}>Lulus</SelectItem>
            <SelectItem value={StudentStatus.PINDAH}>Pindah</SelectItem>
            <SelectItem value={StudentStatus.KELUAR}>Keluar</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Button */}
        {hasActiveFilters && onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="gap-2 text-[var(--muadalah-on-surface-variant)] hover:text-[var(--muadalah-primary)] hover:bg-[var(--muadalah-surface-container)]"
          >
            <MaterialIcon name="close" size="sm" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
