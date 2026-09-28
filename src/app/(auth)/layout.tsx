/**
 * Auth Layout - Protected and public auth pages
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - Muadalah',
  description: 'Masuk ke sistem manajemen sekolah Muadalah',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
