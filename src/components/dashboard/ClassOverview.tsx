/**
 * ClassOverview Widget
 * Grid of class cards with quick stats
 * Phase 1C - Dashboard Widgets
 */

'use client'

import { motion } from 'framer-motion'
import { Users, TrendingUp } from 'lucide-react'

interface ClassData {
  id: string
  name: string
  grade: number
  studentCount: number
  teacher: string
  attendance: number
  color: string
}

interface ClassOverviewProps {
  classes?: ClassData[]
  loading?: boolean
}

const defaultClasses: ClassData[] = [
  { id: '1', name: '7A', grade: 7, studentCount: 32, teacher: 'Ibu Siti', attendance: 92, color: 'bg-blue-50' },
  { id: '2', name: '7B', grade: 7, studentCount: 30, teacher: 'Pak Ahmad', attendance: 88, color: 'bg-green-50' },
  { id: '3', name: '8A', grade: 8, studentCount: 33, teacher: 'Ibu Rina', attendance: 94, color: 'bg-purple-50' },
  { id: '4', name: '8B', grade: 8, studentCount: 31, teacher: 'Pak Budi', attendance: 90, color: 'bg-amber-50' },
  { id: '5', name: '9A', grade: 9, studentCount: 29, teacher: 'Ibu Dina', attendance: 91, color: 'bg-red-50' },
  { id: '6', name: '9B', grade: 9, studentCount: 28, teacher: 'Pak Rudi', attendance: 89, color: 'bg-indigo-50' },
]

export default function ClassOverview({ classes = defaultClasses, loading = false }: ClassOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-100 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-16 mb-3" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-4 bg-gray-200 rounded w-28" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-600" />
        Daftar Kelas
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls, index) => (
          <motion.div
            key={cls.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              ${cls.color} rounded-lg p-4 border border-gray-200 cursor-pointer
              hover:shadow-md transition-all hover:scale-105
            `}
          >
            {/* Class Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-2xl font-bold text-gray-900">{cls.name}</h4>
                <p className="text-xs text-gray-600">Kelas {cls.grade}</p>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs font-semibold text-green-600">
                <TrendingUp className="w-3 h-3" />
                {cls.attendance}%
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Jumlah Siswa</span>
                <span className="font-semibold text-gray-900">{cls.studentCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Wali Kelas</span>
                <span className="font-medium text-gray-800">{cls.teacher}</span>
              </div>
            </div>

            {/* Attendance Bar */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="text-gray-600">Kehadiran</span>
                <span className="font-semibold text-gray-900">{cls.attendance}%</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${cls.attendance}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
