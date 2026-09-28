/**
 * UserMenu Component
 * User profile button with dropdown menu
 * Header Component
 */

'use client'

import { useState } from 'react'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useLogout } from '@/hooks'

interface UserMenuProps {
  user?: {
    name: string
    role: string
    avatar?: string
  }
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { logout, loading } = useLogout()
  const router = useRouter()

  const defaultUser = {
    name: user?.name || 'Admin User',
    role: user?.role || 'Administrator',
    avatar: user?.avatar,
  }

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
  }

  const handleSettings = () => {
    setIsOpen(false)
    router.push('/dashboard/pengaturan')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-gray-900">{defaultUser.name}</p>
          <p className="text-xs text-gray-600">{defaultUser.role}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
          {defaultUser.avatar ? (
            <img src={defaultUser.avatar} alt={defaultUser.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform hidden md:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20"
            >
              {/* User Info */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-900">{defaultUser.name}</p>
                <p className="text-xs text-gray-600">{defaultUser.role}</p>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={handleSettings}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <Settings className="w-4 h-4" />
                  Pengaturan
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  {loading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
