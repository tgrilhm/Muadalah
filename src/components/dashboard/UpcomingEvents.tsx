/**
 * UpcomingEvents Widget
 * Calendar-style widget showing upcoming school events
 * Phase 1C - Dashboard Widgets
 */

'use client'

import { Calendar, Clock, Users, Flag } from 'lucide-react'
import { motion } from 'framer-motion'

interface Event {
  id: string
  title: string
  date: string
  startDate?: string
  endDate?: string
  icon: 'calendar' | 'users' | 'flag'
  color: 'red' | 'blue' | 'green' | 'purple'
}

interface UpcomingEventsProps {
  events?: Event[]
  loading?: boolean
}

const iconMap = {
  calendar: Calendar,
  users: Users,
  flag: Flag,
}

const colorClasses = {
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    border: 'border-red-200',
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    border: 'border-green-200',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-200',
  },
}

const defaultEvents: Event[] = [
  {
    id: '1',
    title: 'Ujian Tengah Semester',
    startDate: '15 Agustus',
    endDate: '20 Agustus',
    date: '15-20 Agustus 2026',
    icon: 'calendar',
    color: 'red',
  },
  {
    id: '2',
    title: 'Rapat Guru',
    date: '12 Agustus 2026',
    icon: 'users',
    color: 'blue',
  },
  {
    id: '3',
    title: 'Libur Hari Kemerdekaan',
    date: '17 Agustus 2026',
    icon: 'flag',
    color: 'red',
  },
]

export default function UpcomingEvents({ events = defaultEvents, loading = false }: UpcomingEventsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Upcoming Events
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
          Lihat Kalender →
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Tidak ada event mendatang</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, index) => {
            const IconComponent = iconMap[event.icon]
            const colors = colorClasses[event.color]

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.bg}`}>
                  <IconComponent className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">{event.title}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span>{event.date}</span>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                  {event.startDate && event.endDate ? '5 hari' : 'Segera'}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
