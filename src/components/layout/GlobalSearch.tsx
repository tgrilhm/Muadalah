/**
 * GlobalSearch Component
 * Search bar for students, classes, teachers
 * Header Component
 */

'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchResult {
  id: string
  title: string
  type: 'student' | 'class' | 'teacher'
  description?: string
}

interface GlobalSearchProps {
  onSearch?: (query: string) => void
  results?: SearchResult[]
  loading?: boolean
}

const mockResults: SearchResult[] = [
  { id: '1', title: 'Ahmad Fauzi', type: 'student', description: 'Kelas 7A' },
  { id: '2', title: 'Siti Nurhaliza', type: 'student', description: 'Kelas 8B' },
  { id: '3', title: 'Kelas 7A', type: 'class', description: '32 siswa' },
  { id: '4', title: 'Ibu Siti', type: 'teacher', description: 'Guru Matematika' },
]

const typeColors = {
  student: 'bg-blue-100 text-blue-700',
  class: 'bg-green-100 text-green-700',
  teacher: 'bg-purple-100 text-purple-700',
}

export default function GlobalSearch({ onSearch, results = mockResults, loading = false }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    onSearch?.(value)

    if (value.trim()) {
      setFilteredResults(
        results.filter((r) =>
          r.title.toLowerCase().includes(value.toLowerCase()) ||
          r.description?.toLowerCase().includes(value.toLowerCase())
        )
      )
    } else {
      setFilteredResults([])
    }
  }

  const handleClear = () => {
    setQuery('')
    setFilteredResults([])
  }

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari siswa, kelas, atau guru..."
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="w-full pl-10 pr-10 py-2 bg-gray-100 rounded-lg border border-gray-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-sm"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && (query || filteredResults.length > 0) && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsFocused(false)}
            />

            {/* Results */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-20"
            >
              {loading ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  Mencari...
                </div>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((result) => (
                  <motion.button
                    key={result.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${typeColors[result.type]}`}>
                        {result.type === 'student' ? '👤' : result.type === 'class' ? '📚' : '👨‍🏫'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{result.title}</p>
                        {result.description && (
                          <p className="text-xs text-gray-600">{result.description}</p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  Tidak ada hasil
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
