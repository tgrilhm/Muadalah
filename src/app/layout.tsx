/**
 * Landing Page Root Layout
 * Phase 0A - Public-facing landing page structure
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryProvider } from '@/providers/query-provider'
import { AgentationWrapper } from '@/components/agentation-wrapper'
import './globals.css'
import './landing-design-tokens.css'
import './landing-enhancements.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Muadalah - Sistem Manajemen Sekolah Modern',
  description: 'Platform terintegrasi untuk mengelola operasional sekolah SMP & SMA. Manajemen siswa, absensi digital, penilaian, SPP, dan komunikasi dalam satu sistem.',
  keywords: [
    'sistem manajemen sekolah',
    'admin sekolah',
    'SMP',
    'SMA',
    'absensi digital',
    'platform pendidikan',
  ],
  openGraph: {
    title: 'Muadalah - Sistem Manajemen Sekolah Modern',
    description: 'Solusi terintegrasi untuk transformasi digital sekolah Anda',
    url: 'https://muadalah.id',
    type: 'website',
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Muadalah - Sistem Manajemen Sekolah Modern',
    description: 'Platform manajemen sekolah yang modern dan terpercaya',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        {/* Google Fonts - UI UX Pro Max Typography */}
        <link
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700;800&family=Crimson+Text:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Material Symbols */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} bg-surface text-text-default`}>
        <QueryProvider>
          {children}
          <AgentationWrapper />
        </QueryProvider>
      </body>
    </html>
  )
}
