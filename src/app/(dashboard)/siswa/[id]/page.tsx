'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Calendar,
  MapPin,
  Phone,
  Home,
  GraduationCap,
  FileText,
  DollarSign,
  Users,
} from 'lucide-react';

type Student = {
  id: string;
  nis: string;
  nisn: string | null;
  name: string;
  gender: 'LAKI_LAKI' | 'PEREMPUAN';
  birthPlace: string | null;
  birthDate: string | null;
  religion: string | null;
  address: string | null;
  phone: string | null;
  photo: string | null;
  status: string;
  class: {
    id: string;
    name: string;
    grade: number;
    major: string | null;
    school: {
      id: string;
      name: string;
      level: string;
    };
  };
  parentContacts: Array<{
    id: string;
    name: string;
    relation: string;
    phone: string;
    email: string | null;
  }>;
  attendances: Array<{
    id: string;
    date: string;
    status: string;
    notes: string | null;
  }>;
  grades: Array<{
    id: string;
    type: string;
    score: number;
    maxScore: number;
    date: string;
    subject: {
      id: string;
      name: string;
      code: string;
    };
  }>;
};

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'absensi' | 'nilai' | 'pembayaran' | 'kontak'>('info');

  useEffect(() => {
    fetchStudent();
  }, [params.id]);

  const fetchStudent = async () => {
    try {
      const res = await fetch(`/api/students/${params.id}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch student');

      setStudent(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus siswa ini?')) return;

    try {
      const res = await fetch(`/api/students/${params.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete student');

      router.push('/siswa');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete student');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--muadalah-surface-container)] border-t-[var(--muadalah-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--muadalah-on-surface-variant)]">Memuat data siswa...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <span className="material-symbols-outlined text-[var(--muadalah-error)] text-[48px] mb-4">error</span>
          <p className="text-[var(--muadalah-error)] mb-4 font-medium">{error || 'Siswa tidak ditemukan'}</p>
          <Link href="/dashboard/siswa" className="text-[var(--muadalah-primary)] hover:underline font-medium">
            Kembali ke Daftar Siswa
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/siswa" className="p-2 hover:bg-[var(--muadalah-surface-container-low)] rounded-lg transition-colors text-[var(--muadalah-on-surface-variant)] hover:text-[var(--muadalah-primary)]">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--muadalah-on-surface)]">Detail Siswa</h1>
            <p className="text-sm text-[var(--muadalah-on-surface-variant)]">{student.class.school.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/siswa/${student.id}/edit`}
            className="flex items-center gap-2 px-4 py-3 bg-[var(--muadalah-primary)] text-white rounded-lg hover:bg-[var(--muadalah-surface-tint)] transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-3 bg-[var(--muadalah-error)] text-white rounded-lg hover:opacity-90 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
            Hapus
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[var(--muadalah-border-subtle)] p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            {student.photo ? (
              <img
                src={student.photo}
                alt={student.name}
                className="w-32 h-32 rounded-xl object-cover border border-[var(--muadalah-border-subtle)] shadow-sm"
              />
            ) : (
              <div className="w-32 h-32 rounded-xl bg-[var(--muadalah-surface-container)] flex items-center justify-center border border-[var(--muadalah-border-subtle)]">
                <span className="material-symbols-outlined text-[var(--muadalah-outline)] text-[64px]">person</span>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[var(--muadalah-on-surface)] mb-4">{student.name}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--muadalah-on-surface-variant)] mb-1">NIS</p>
                <p className="font-semibold text-[var(--muadalah-on-surface)]">{student.nis}</p>
              </div>
              {student.nisn && (
                <div>
                  <p className="text-sm text-[var(--muadalah-on-surface-variant)] mb-1">NISN</p>
                  <p className="font-semibold text-[var(--muadalah-on-surface)]">{student.nisn}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-[var(--muadalah-on-surface-variant)] mb-1">Jenis Kelamin</p>
                <p className="font-semibold text-[var(--muadalah-on-surface)]">
                  {student.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--muadalah-on-surface-variant)] mb-1">Kelas</p>
                <p className="font-semibold text-[var(--muadalah-on-surface)]">{student.class.name}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--muadalah-on-surface-variant)] mb-1">Status</p>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    student.status === 'AKTIF'
                      ? 'bg-[var(--muadalah-success)]/10 text-[var(--muadalah-success)]'
                      : student.status === 'LULUS'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-[var(--muadalah-surface-variant)] text-[var(--muadalah-on-surface-variant)]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    student.status === 'AKTIF'
                      ? 'bg-[var(--muadalah-success)]'
                      : student.status === 'LULUS'
                      ? 'bg-blue-800'
                      : 'bg-[var(--muadalah-on-surface-variant)]'
                  }`}></span>
                  {student.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[var(--muadalah-surface-card)] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[var(--muadalah-border-subtle)] overflow-hidden">
        <div className="border-b border-[var(--muadalah-border-subtle)]">
          <nav className="flex">
            {[
              { id: 'info', label: 'Informasi', icon: 'info' },
              { id: 'absensi', label: 'Absensi', icon: 'calendar_today' },
              { id: 'nilai', label: 'Nilai', icon: 'school' },
              { id: 'pembayaran', label: 'Pembayaran', icon: 'payments' },
              { id: 'kontak', label: 'Kontak Orang Tua', icon: 'group' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-[var(--muadalah-primary)] text-[var(--muadalah-primary)]'
                    : 'text-[var(--muadalah-on-surface-variant)] hover:text-[var(--muadalah-on-surface)]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Informasi Pribadi</h3>
              <div className="grid grid-cols-2 gap-6">
                {student.birthPlace && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Tempat Lahir</p>
                      <p className="font-medium">{student.birthPlace}</p>
                    </div>
                  </div>
                )}
                {student.birthDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Tanggal Lahir</p>
                      <p className="font-medium">
                        {format(new Date(student.birthDate), 'dd MMMM yyyy', { locale: id })}
                      </p>
                    </div>
                  </div>
                )}
                {student.religion && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Agama</p>
                      <p className="font-medium">{student.religion}</p>
                    </div>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Telepon</p>
                      <p className="font-medium">{student.phone}</p>
                    </div>
                  </div>
                )}
              </div>
              {student.address && (
                <div className="flex items-start gap-3 pt-4">
                  <Home className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Alamat</p>
                    <p className="font-medium">{student.address}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'kontak' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Kontak Orang Tua / Wali</h3>
              {student.parentContacts.length === 0 ? (
                <p className="text-gray-600">Belum ada kontak orang tua</p>
              ) : (
                <div className="space-y-4">
                  {student.parentContacts.map((contact) => (
                    <div key={contact.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{contact.name}</h4>
                          <p className="text-sm text-gray-600">{contact.relation}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="w-4 h-4" />
                          <span>{contact.phone}</span>
                        </div>
                        {contact.email && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <FileText className="w-4 h-4" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'absensi' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Riwayat Absensi (10 Terakhir)</h3>
              <p className="text-gray-600">Fitur absensi akan tersedia di Phase 4A</p>
            </div>
          )}

          {activeTab === 'nilai' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Riwayat Nilai (10 Terakhir)</h3>
              <p className="text-gray-600">Fitur nilai akan tersedia di Phase 4B</p>
            </div>
          )}

          {activeTab === 'pembayaran' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Riwayat Pembayaran</h3>
              <p className="text-gray-600">Fitur pembayaran akan tersedia di Phase 6</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
