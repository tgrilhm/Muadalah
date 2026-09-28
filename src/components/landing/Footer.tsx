/**
 * Footer Component - Landing Page
 * UI UX Pro Max: Professional & Trust-focused Design
 */

'use client'

import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-[#F2F4F6] border-t border-[#E2E8F0] py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Footer Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 lg:mb-16">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-5xl -mt-1">
                  account_balance
                </span>
              </div>
              <span className="font-h3 text-[#1E3A5F] text-xl font-bold">
                Muadalah
              </span>
            </Link>
            <p className="text-sm text-[#475569] max-w-xs">
              Modernizing school administration with precision and ease.
            </p>
          </div>

          {/* Product Links */}
          <div className="flex flex-col gap-3">
            <span className="font-label text-[#0F172A] uppercase tracking-wider text-sm">
              Product
            </span>
            <a
              href="#features"
              className="text-sm text-[#475569] hover:text-[#2563EB] transition-colors"
            >
              Features
            </a>
            <a
              href="#"
              className="text-sm text-[#475569] hover:text-[#2563EB] transition-colors"
            >
              Pricing
            </a>
            <a
              href="#"
              className="text-sm text-[#475569] hover:text-[#2563EB] transition-colors"
            >
              Security
            </a>
          </div>

          {/* Support Links */}
          <div className="flex flex-col gap-3">
            <span className="font-label text-[#0F172A] uppercase tracking-wider text-sm">
              Support
            </span>
            <a
              href="#"
              className="text-sm text-[#475569] hover:text-[#2563EB] transition-colors"
            >
              Help Center
            </a>
            <a
              href="#"
              className="text-sm text-[#475569] hover:text-[#2563EB] transition-colors"
            >
              Contact Us
            </a>
            <a
              href="#"
              className="text-sm text-[#475569] hover:text-[#2563EB] transition-colors"
            >
              Documentation
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#E2E8F0] mb-8" />

        {/* Copyright Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-xs text-[#94A3B8]">
            © {currentYear} Muadalah Management System. All rights reserved.
          </p>

          {/* Legal Links */}
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-xs text-[#94A3B8] hover:text-[#2563EB] transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-xs text-[#94A3B8] hover:text-[#2563EB] transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="text-xs text-[#94A3B8] hover:text-[#2563EB] transition-colors"
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
