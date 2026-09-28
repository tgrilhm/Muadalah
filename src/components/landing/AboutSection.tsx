/**
 * About Section - REDESIGNED
 * Modern feature-focused layout instead of static boxes
 */

'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

export default function AboutSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const features = [
    {
      icon: '📚',
      title: 'Standar Kurikulum',
      description: 'Sesuai dengan standar kurikulum nasional Indonesia untuk SMP & SMA',
    },
    {
      icon: '📈',
      title: 'Skalabilitas Tinggi',
      description: 'Mendukung pertumbuhan dari puluhan hingga ribuan siswa',
    },
    {
      icon: '🔒',
      title: 'Keamanan Data',
      description: 'Enkripsi tingkat enterprise dan backup berkala',
    },
    {
      icon: '⚡',
      title: 'Performa Cepat',
      description: 'Loading instant dan response time di bawah 1 detik',
    },
    {
      icon: '📱',
      title: 'Multi-Perangkat',
      description: 'Akses dari desktop, tablet, atau mobile dengan seamless',
    },
    {
      icon: '🌐',
      title: 'Integrasi Penuh',
      description: 'Semua modul terhubung dalam satu sistem terpadu',
    },
  ]

  return (
    <section
      id="about"
      ref={ref}
      className="relative w-full py-24 bg-white overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#2563EB]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#60A5FA]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="text-sm font-bold text-[#2563EB] uppercase tracking-[0.15em] mb-4">
            Mengapa Muadalah
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-[#0F172A] mb-6">
            Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#1E40AF]">Terpercaya</span> untuk Sekolah Modern
          </h2>
          <p className="text-xl text-[#475569] leading-relaxed">
            Digunakan oleh lebih dari 50 sekolah dan 10,000+ pengguna aktif di seluruh Indonesia
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group bg-gradient-to-br from-white to-[#F8FAFC] p-8 rounded-2xl border border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">{feature.title}</h3>
              <p className="text-[#64748B] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Trust Section */}
        <motion.div
          className="bg-gradient-to-br from-[#F0F7FF] to-[#E0ECFF] rounded-3xl p-12 border border-[#DBEAFE]"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Stat 1 */}
            <div className="space-y-3">
              <div className="text-5xl font-black text-[#2563EB]">50+</div>
              <div className="text-lg font-bold text-[#0F172A]">Sekolah Terhubung</div>
              <p className="text-[#475569]">Dari SMP hingga SMA di berbagai provinsi</p>
            </div>

            {/* Stat 2 */}
            <div className="space-y-3">
              <div className="text-5xl font-black text-[#10B981]">10,000+</div>
              <div className="text-lg font-bold text-[#0F172A]">Pengguna Aktif</div>
              <p className="text-[#475569]">Guru, admin, dan kepala sekolah setiap hari</p>
            </div>

            {/* Stat 3 */}
            <div className="space-y-3">
              <div className="text-5xl font-black text-[#F59E0B]">99.9%</div>
              <div className="text-lg font-bold text-[#0F172A]">Uptime</div>
              <p className="text-[#475569]">Sistem selalu siap saat Anda membutuhkan</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
