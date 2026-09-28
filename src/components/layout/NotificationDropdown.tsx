/**
 * NotificationDropdown Component
 * Bell icon with notification dropdown
 * Header Component
 */

'use client'

import { useState } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'info' | 'success' | 'warning' | 'error'
}

interface NotificationDropdownProps {
  notifications?: Notification[]
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
}

const defaultNotifications: Notification[] = [
  {
    id: '1',
    title: 'Siswa Baru Terdaftar',
    message: 'Ahmad Fauzi telah terdaftar di kelas 7A',
    time: '2 jam lalu',
    read: false,
    type: 'info',
  },
  {
    id: '2',
    title: 'Pembayaran Diterima',
    message: 'SPP Ahmad Fauzi (Rp 500.000) telah diterima',
    time: '5 jam lalu',
    read: false,
    type: 'success',
  },
  {
    id: '3',
    title: 'Absensi Rendah',
    message: '3 siswa memiliki kehadiran di bawah 75%',
    time: '1 hari lalu',
    read: true,
    type: 'warning',
  },
]

const typeColors = {
  info: 'bg-blue-100 text-blue-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-amber-100 text-amber-600',
  error: 'bg-red-100 text-red-600',
}

export default function NotificationDropdown({
  notifications = defaultNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifs, setNotifs] = useState(notifications)

  const unreadCount = notifs.filter((n) => !n.read).length

  const handleMarkAsRead = (id: string) => {
    setNotifs(notifs.map((n) => (n.id === id ? { ...n, read: true } : n)))
    onMarkAsRead?.(id)
  }

  const handleMarkAllAsRead = () => {
    setNotifs(notifs.map((n) => ({ ...n, read: true })))
    onMarkAllAsRead?.()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
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
              className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-20"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>

              {/* Notifications */}
              <div className="max-h-96 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">
                    Tidak ada notifikasi
                  </div>
                ) : (
                  notifs.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        !notif.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${typeColors[notif.type]}`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">{notif.title}</h4>
                          <p className="text-xs text-gray-600 mb-1">{notif.message}</p>
                          <p className="text-xs text-gray-400">{notif.time}</p>
                        </div>
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Tandai dibaca"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-200 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                  Lihat Semua Notifikasi
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
