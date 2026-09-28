'use client';

import { useState } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';
import { TahunAjaranModal, SemesterModal } from '@/components/settings/academic-modals';
import { SubjectModal } from '@/components/settings/subject-modal';

type SettingsTab = 'profil-sekolah' | 'tahun-ajaran' | 'mata-pelajaran' | 'manajemen-user';

export default function PengaturanPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('tahun-ajaran');
  const [showAcademicYearModal, setShowAcademicYearModal] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  return (
    <div className="flex flex-col w-full h-full relative">
      <div className="px-8 py-8 w-full max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-[32px] leading-[1.25] font-bold text-[#0D0C22] mb-2 tracking-tight">
              Pengaturan Sistem
            </h1>
            <p className="text-[16px] leading-[1.5] text-[#434656] max-w-2xl">
              Kelola konfigurasi dasar sekolah, tahun ajaran aktif, struktur kurikulum, dan hak akses pengguna sistem.
            </p>
          </div>
        </div>

        {/* Main Container */}
        <div className="flex flex-col lg:flex-row gap-6 bg-white rounded-xl shadow-sm">
          {/* Sidebar Tabs */}
          <div className="w-full lg:w-64 flex-shrink-0 border-r border-[#E2E8F0] flex flex-col p-4">
            <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0">
              <TabButton
                icon="domain"
                label="Profil Sekolah"
                active={activeTab === 'profil-sekolah'}
                onClick={() => setActiveTab('profil-sekolah')}
                filled={activeTab === 'profil-sekolah'}
              />
              <TabButton
                icon="calendar_month"
                label="Tahun Ajaran"
                active={activeTab === 'tahun-ajaran'}
                onClick={() => setActiveTab('tahun-ajaran')}
                filled={activeTab === 'tahun-ajaran'}
              />
              <TabButton
                icon="book"
                label="Mata Pelajaran"
                active={activeTab === 'mata-pelajaran'}
                onClick={() => setActiveTab('mata-pelajaran')}
                filled={activeTab === 'mata-pelajaran'}
              />
              <TabButton
                icon="manage_accounts"
                label="Manajemen User"
                active={activeTab === 'manajemen-user'}
                onClick={() => setActiveTab('manajemen-user')}
                filled={activeTab === 'manajemen-user'}
              />
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 min-w-0">
            {activeTab === 'profil-sekolah' && <ProfilSekolahTab />}
            {activeTab === 'tahun-ajaran' && <TahunAjaranTab />}
            {activeTab === 'mata-pelajaran' && <MataPelajaranTab />}
            {activeTab === 'manajemen-user' && <ManajemenUserTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
  filled = false,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  filled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all text-[14px] leading-[1] tracking-[0.05em] font-semibold flex-shrink-0 lg:w-full ${
        active
          ? 'bg-[#0052ff] text-white shadow-sm'
          : 'text-[#434656] hover:bg-[#f2f4f6] hover:text-[#191c1e]'
      }`}
    >
      <MaterialIcon name={icon} size="sm" fill={filled} />
      {label}
    </button>
  );
}

function ProfilSekolahTab() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] leading-[1.4] font-semibold text-[#191c1e]">
          Informasi Sekolah
        </h2>
        <button 
          onClick={() => alert('Fitur simpan akan segera tersedia')}
          className="px-4 py-2 bg-[#003ec7] text-white text-[14px] font-semibold rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center gap-2"
        >
          <MaterialIcon name="save" size="sm" />
          Simpan Perubahan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="block text-[14px] font-semibold tracking-[0.05em] text-[#434656]">
            Nama Sekolah
          </label>
          <input
            type="text"
            defaultValue="SMA Muadalah Bina Insani"
            className="w-full px-4 py-3 bg-[#f2f4f6] rounded-lg text-[16px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/30 focus:bg-white border border-transparent transition-all"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-[14px] font-semibold tracking-[0.05em] text-[#434656]">
            NPSN / NSM
          </label>
          <input
            type="text"
            defaultValue="69981234"
            className="w-full px-4 py-3 bg-[#f2f4f6] rounded-lg text-[16px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/30 focus:bg-white border border-transparent transition-all"
          />
        </div>

        <div className="space-y-3 col-span-1 md:col-span-2">
          <label className="block text-[14px] font-semibold tracking-[0.05em] text-[#434656]">
            Alamat Lengkap
          </label>
          <textarea
            rows={3}
            defaultValue="Jl. Pendidikan No. 123, Komplek Pesantren Bina Insani"
            className="w-full px-4 py-3 bg-[#f2f4f6] rounded-lg text-[16px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/30 focus:bg-white border border-transparent transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}

function TahunAjaranTab() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] leading-[1.4] font-semibold text-[#191c1e]">
          Manajemen Tahun Ajaran
        </h2>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#003ec7] text-white text-[14px] font-semibold rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center gap-2"
        >
          <MaterialIcon name="add" size="sm" />
          Tahun Ajaran Baru
        </button>
      </div>

      {/* Active Banner */}
      <div className="bg-[#003ec7]/10 rounded-xl p-6 flex items-center gap-6 border-l-4 border-[#003ec7]">
        <div className="w-12 h-12 rounded-full bg-[#003ec7] flex items-center justify-center flex-shrink-0">
          <MaterialIcon name="flag" size="md" fill className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[12px] font-medium text-[#003ec7] uppercase tracking-wider mb-1">
            Tahun Ajaran Aktif Saat Ini
          </p>
          <h3 className="text-[24px] leading-[1.3] font-semibold text-[#191c1e]">
            2023/2024 - Semester Genap
          </h3>
        </div>
        <button 
          onClick={() => alert('Fitur tutup semester akan segera tersedia')}
          className="px-4 py-3 bg-white text-[#003ec7] text-[14px] font-semibold rounded-lg shadow-sm hover:bg-[#f7f9fb] transition-colors whitespace-nowrap"
        >
          Tutup Semester
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              <th className="py-3 px-4 text-[14px] font-semibold tracking-[0.05em] text-[#434656] uppercase">
                Tahun Ajaran
              </th>
              <th className="py-3 px-4 text-[14px] font-semibold tracking-[0.05em] text-[#434656] uppercase">
                Semester
              </th>
              <th className="py-3 px-4 text-[14px] font-semibold tracking-[0.05em] text-[#434656] uppercase">
                Status
              </th>
              <th className="py-3 px-4 text-[14px] font-semibold tracking-[0.05em] text-[#434656] uppercase">
                Mulai
              </th>
              <th className="py-3 px-4 text-[14px] font-semibold tracking-[0.05em] text-[#434656] uppercase">
                Akhir
              </th>
              <th className="py-3 px-4 text-right text-[14px] font-semibold tracking-[0.05em] text-[#434656] uppercase">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="text-[14px]">
            <tr className="group hover:bg-[#f2f4f6] transition-colors">
              <td className="py-4 px-4 text-[#191c1e] font-medium">2023/2024</td>
              <td className="py-4 px-4 text-[#434656]">Genap</td>
              <td className="py-4 px-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-[12px] font-medium">
                  Aktif
                </span>
              </td>
              <td className="py-4 px-4 text-[#434656]">Jan 2024</td>
              <td className="py-4 px-4 text-[#434656]">Jun 2024</td>
              <td className="py-4 px-4 text-right">
                <button className="p-2 text-[#737688] hover:text-[#003ec7] transition-colors">
                  <MaterialIcon name="edit" size="sm" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <TahunAjaranModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        onSave={() => setShowModal(false)}
      />
    </div>
  );
}

function MataPelajaranTab() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] leading-[1.4] font-semibold text-[#191c1e]">
          Daftar Mata Pelajaran
        </h2>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#003ec7] text-white text-[14px] font-semibold rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center gap-2"
        >
          <MaterialIcon name="add" size="sm" />
          Mata Pelajaran Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SubjectCard name="Matematika" code="MAT" teachers={5} />
        <SubjectCard name="Bahasa Indonesia" code="BIND" teachers={3} />
        <SubjectCard name="Bahasa Inggris" code="BING" teachers={4} />
      </div>

      <SubjectModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={() => setShowModal(false)}
      />
    </div>
  );
}

function SubjectCard({ name, code, teachers }: { name: string; code: string; teachers: number }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-[#003ec7]/10 flex items-center justify-center">
          <MaterialIcon name="book" size="sm" className="text-[#003ec7]" fill />
        </div>
        <button className="p-1 text-[#737688] hover:text-[#191c1e] transition-colors">
          <MaterialIcon name="more_vert" size="sm" />
        </button>
      </div>
      <h3 className="text-[16px] font-semibold text-[#191c1e] mb-1">{name}</h3>
      <p className="text-[12px] text-[#434656] mb-3">Kode: {code}</p>
      <div className="flex items-center gap-2 text-[12px] text-[#434656]">
        <MaterialIcon name="person" size="xs" />
        <span>{teachers} Guru Pengajar</span>
      </div>
    </div>
  );
}

function ManajemenUserTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-[20px] leading-[1.4] font-semibold text-[#191c1e]">
        Manajemen User (Coming Soon)
      </h2>
      <p className="text-[#434656]">Fitur manajemen user akan segera tersedia.</p>
    </div>
  );
}
