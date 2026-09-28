import Link from 'next/link';

interface ClassCardProps {
  classData: {
    id: string;
    name: string;
    grade: number;
    major: string | null;
    homeroomTeacher?: {
      user: {
        name: string;
      };
    } | null;
    _count: {
      students: number;
    };
    students?: Array<{
      id: string;
      name: string;
      photo?: string | null;
    }>;
  };
}

export function ClassCard({ classData }: ClassCardProps) {
  const capacity = 35; // Default capacity
  const studentCount = classData._count.students;
  const firstThreeStudents = classData.students?.slice(0, 3) || [];
  const remainingCount = Math.max(0, studentCount - 3);

  // Format class display name
  const displayName = classData.major
    ? `${classData.grade} ${classData.major} ${classData.name}`
    : `${classData.grade} ${classData.name}`;

  return (
    <div className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 relative overflow-hidden group flex flex-col h-full border border-[var(--muadalah-border-subtle)] hover:-translate-y-1">
      {/* Gradient top bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--muadalah-primary)] to-[var(--muadalah-primary-container)]"></div>

      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-[var(--muadalah-primary-container)]/10 flex items-center justify-center ring-2 ring-[var(--muadalah-primary)]/5">
              <span className="text-2xl font-bold text-[var(--muadalah-primary)]">
                {classData.grade}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--muadalah-on-surface)] mb-1">
                {classData.major || classData.name}
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                Aktif
              </span>
            </div>
          </div>
          <button className="p-2 text-[var(--muadalah-outline)] hover:text-[var(--muadalah-on-surface)] transition-colors rounded-full hover:bg-[var(--muadalah-surface-container-low)]">
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>

        {/* Info section */}
        <div className="space-y-4 flex-1">
          {/* Homeroom teacher */}
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--muadalah-outline)] text-[20px]">person_check</span>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-[var(--muadalah-outline)] mb-0.5">Wali Kelas</span>
              <span className="text-sm font-medium text-[var(--muadalah-on-surface)] truncate">
                {classData.homeroomTeacher?.user.name || 'Belum ditentukan'}
              </span>
            </div>
          </div>

          {/* Student count */}
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--muadalah-outline)] text-[20px]">groups</span>
            <div className="flex flex-col flex-1">
              <span className="text-xs font-medium text-[var(--muadalah-outline)] mb-0.5">Jumlah Siswa</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-[var(--muadalah-on-surface)]">
                  {studentCount}
                </span>
                <span className="text-sm text-[var(--muadalah-on-surface-variant)]">
                  / {capacity} Kapasitas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 bg-[var(--muadalah-surface-container-low)]/30 -mx-6 -mb-6 px-6 pb-6 flex items-center justify-between border-t border-[var(--muadalah-border-subtle)]">
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {firstThreeStudents.map((student, index) => (
              <div
                key={student.id}
                className="w-8 h-8 rounded-full bg-[var(--muadalah-surface-variant)] flex items-center justify-center text-xs font-semibold text-[var(--muadalah-on-surface)] border-2 border-[var(--muadalah-surface-card)] overflow-hidden shadow-sm"
                style={
                  student.photo
                    ? { backgroundImage: `url(${student.photo})`, backgroundSize: 'cover' }
                    : {}
                }
                title={student.name}
              >
                {!student.photo && student.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="w-8 h-8 rounded-full bg-[var(--muadalah-surface-container-low)] flex items-center justify-center text-xs font-medium text-[var(--muadalah-on-surface-variant)] border-2 border-[var(--muadalah-surface-card)] shadow-sm">
                +{remainingCount}
              </div>
            )}
          </div>

          {/* Detail link */}
          <Link
            href={`/dashboard/kelas/${classData.id}`}
            className="text-[var(--muadalah-primary)] hover:text-[var(--muadalah-surface-tint)] text-sm font-semibold flex items-center gap-1 transition-all"
          >
            Detail
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
