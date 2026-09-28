/**
 * CTA Section - REDESIGNED
 * High-impact call-to-action with gradient effects
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

export default function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="cta"
      ref={ref}
      className="relative w-full py-24 px-6 lg:px-8 bg-white overflow-hidden"
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="relative bg-gradient-to-br from-[#2563EB] via-[#1E40AF] to-[#0F172A] rounded-3xl p-16 md:p-20 text-center overflow-hidden group"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="3" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>

          {/* Floating Gradient Orbs */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-500" />

          {/* Content */}
          <div className="relative z-10">
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <svg className="w-4 h-4 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                Gratis untuk 30 hari pertama
              </span>
            </motion.div>

            {/* Main Headline */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              Siap Mengubah Cara <br className="hidden md:block" /> Sekolah Anda Beroperasi?
            </h2>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Bergabunglah dengan puluhan sekolah yang telah merasakan transformasi digital. 
              Dapatkan akses penuh ke semua fitur dan dukungan tim ahli kami.
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap justify-center gap-8 mb-12 py-8 border-y border-white/20">
              <div>
                <div className="text-3xl md:text-4xl font-black text-[#60A5FA]">50+</div>
                <div className="text-sm text-white/80">Sekolah Aktif</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-black text-[#60A5FA]">10K+</div>
                <div className="text-sm text-white/80">Pengguna Terdaftar</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-black text-[#60A5FA]">99.9%</div>
                <div className="text-sm text-white/80">Uptime Guarantee</div>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href="/login"
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-[#2563EB] font-bold text-lg rounded-xl hover:bg-[#F0F7FF] active:scale-95 transition-all duration-200 shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] group/btn"
            >
              <span>Mulai Uji Coba Gratis</span>
              <svg className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            {/* Trust Text */}
            <p className="text-white/70 text-sm mt-8">
              Tidak perlu kartu kredit. Gratis, tanpa komitmen. Batalkan kapan saja.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
