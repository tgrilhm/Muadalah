/**
 * SchoolSelector Component
 * Dropdown to switch between schools for multi-school support
 * Header Component
 */

'use client'

import { useState } from 'react'
import { School, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface School {
  id: string
  name: string
  type: 'SMP' | 'SMA' | 'ALL'
}

interface SchoolSelectorProps {
  currentSchool?: School
  schools?: School[]
  onSchoolChange?: (school: School) => void
}

const defaultSchools: School[] = [
  { id: 'all', name: 'Semua Unit', type: 'ALL' },
  { id: 'smp', name: 'SMP Muadalah', type: 'SMP' },
  { id: 'sma', name: 'SMA Muadalah', type: 'SMA' },
]

export default function SchoolSelector({
  currentSchool,
  schools = defaultSchools,
  onSchoolChange,
}: SchoolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(currentSchool || schools[0] || defaultSchools[0])

  const handleSelect = (school: School) => {
    setSelected(school)
    setIsOpen(false)
    onSchoolChange?.(school)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all min-w-[180px]"
      >
        <School className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-medium text-gray-900 flex-1 text-left">
          {selected.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-2 left-0 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20"
            >
              {schools.map((school) => (
                <button
                  key={school.id}
                  onClick={() => handleSelect(school)}
                  className={`
                    w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors flex items-center gap-3
                    ${selected.id === school.id ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'}
                  `}
                >
                  <School className="w-4 h-4" />
                  <span className="flex-1">{school.name}</span>
                  {selected.id === school.id && (
                    <span className="text-blue-600">✓</span>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
