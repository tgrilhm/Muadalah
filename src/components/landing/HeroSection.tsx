/**
 * Hero Section - REDESIGNED
 * Completely new approach with modern card-based layout
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative w-full min-h-screen pt-32 pb-16 px-6 lg:px-8 bg-gradient-to-br from-[#F8FAFC] via-white to-[#F1F5F9] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#1E40AF] text-white rounded-full shadow-lg">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="4" className="animate-pulse" />
              </svg>
              <span className="text-sm font-bold uppercase tracking-wider">
                Platform Modern 2024
              </span>
            </div>

            {/* Headline - Dramatically Different */}
            <h1 className="text-5xl md:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight">
              <span className="block text-[#0F172A]">Sistem Manajemen</span>
              <span className="block text-[#0F172A]">Sekolah</span>
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#60A5FA]">
                Terpadu & Modern
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl text-[#475569] leading-relaxed max-w-xl">
              Platform all-in-one untuk <strong className="text-[#2563EB]">SMP & SMA</strong>. 
              Kelola siswa, absensi, nilai, dan pembayaran dalam satu dashboard yang intuitif.
            </p>

            {/* CTA Buttons - New Style */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/login"
                className="group relative px-8 py-4 bg-[#2563EB] text-white font-bold rounded-xl overflow-hidden shadow-2xl shadow-[#2563EB]/30 transition-all hover:shadow-[#2563EB]/50 hover:scale-105"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <span>Mulai Sekarang</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <a
                href="#features"
                className="px-8 py-4 bg-white text-[#2563EB] font-bold rounded-xl border-2 border-[#2563EB] hover:bg-[#2563EB] hover:text-white transition-all shadow-lg"
              >
                Lihat Fitur
              </a>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-8 pt-8 border-t-2 border-[#E2E8F0]">
              <div>
                <div className="text-4xl font-black text-[#2563EB]">1000+</div>
                <div className="text-sm text-[#64748B] font-medium">Siswa Aktif</div>
              </div>
              <div>
                <div className="text-4xl font-black text-[#2563EB]">50+</div>
                <div className="text-sm text-[#64748B] font-medium">Guru Professional</div>
              </div>
              <div>
                <div className="text-4xl font-black text-[#2563EB]">2</div>
                <div className="text-sm text-[#64748B] font-medium">Sekolah Terhubung</div>
              </div>
            </div>
          </motion.div>

          {/* Right: Visual Card */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Main Dashboard Card */}
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E2E8F0]">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-[#2563EB] to-[#1E40AF] p-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <div className="text-sm font-medium opacity-90">Dashboard Sekolah</div>
                    <div className="text-2xl font-bold mt-1">SMP & SMA Muadalah</div>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl backdrop-blur flex items-center justify-center">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card Body - Stats Grid */}
              <div className="p-6 space-y-4">
                {/* Stat Item 1 */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] rounded-xl">
                  <div className="w-12 h-12 bg-[#2563EB] rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-[#64748B] font-medium">Total Siswa</div>
                    <div className="text-2xl font-black text-[#0F172A]">1,247</div>
                  </div>
                  <div className="text-[#10B981] font-bold text-sm">+12%</div>
                </div>

                {/* Stat Item 2 */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#F0FDF4] to-[#DCFCE7] rounded-xl">
                  <div className="w-12 h-12 bg-[#10B981] rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-[#64748B] font-medium">Kehadiran Hari Ini</div>
                    <div className="text-2xl font-black text-[#0F172A]">98.5%</div>
                  </div>
                  <div className="text-[#10B981] font-bold text-sm">Excellent</div>
                </div>
              </div>
            </div>

            {/* Floating Mini Card */}
            <motion.div
              className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-2xl border border-[#E2E8F0]"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#10B981] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-[#64748B] font-medium">Status</div>
                  <div className="text-sm font-bold text-[#0F172A]">Semua Sistem Aktif</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-[#2563EB]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-[#60A5FA]/10 rounded-full blur-3xl" />
    </section>
  )
}
