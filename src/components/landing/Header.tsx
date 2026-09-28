/**
 * Header Component - Landing Page Navigation
 * UI UX Pro Max: Trust & Professional Design
 */

'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="h-20 max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white">account_balance</span>
          </div>
          <span className="font-h2 text-[#1E3A5F] text-2xl font-bold tracking-tight">
            Muadalah
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#home"
            className="text-sm font-medium text-[#1E3A5F] hover:text-[#2563EB] transition-colors"
          >
            Home
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-[#475569] hover:text-[#2563EB] transition-colors"
          >
            Features
          </a>
          <a
            href="#about"
            className="text-sm font-medium text-[#475569] hover:text-[#2563EB] transition-colors"
          >
            About
          </a>
          <a
            href="#contact"
            className="text-sm font-medium text-[#475569] hover:text-[#2563EB] transition-colors"
          >
            Contact
          </a>
        </nav>

        {/* CTA Button */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-6 py-2.5 bg-[#2563EB] text-white rounded-full font-semibold text-sm hover:bg-[#1D4ED8] transition-all shadow-lg shadow-[#2563EB]/20 hover:shadow-xl hover:shadow-[#2563EB]/30"
          >
            Login
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#E2E8F0] shadow-lg">
          <nav className="flex flex-col px-6 py-4 gap-3">
            <a
              href="#home"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-[#1E3A5F] hover:text-[#2563EB] py-2 transition-colors"
            >
              Home
            </a>
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-[#475569] hover:text-[#2563EB] py-2 transition-colors"
            >
              Features
            </a>
            <a
              href="#about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-[#475569] hover:text-[#2563EB] py-2 transition-colors"
            >
              About
            </a>
            <a
              href="#contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-[#475569] hover:text-[#2563EB] py-2 transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
