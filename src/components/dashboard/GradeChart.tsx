/**
 * GradeChart Component
 * Bar chart showing average grades by subject
 * Phase 1B - Dashboard Charts
 */

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface GradeData {
  subject: string
  average: number
  color: string
}

interface GradeChartProps {
  data?: GradeData[]
  loading?: boolean
}

const defaultData: GradeData[] = [
  { subject: 'Mat', average: 85, color: '#2563EB' },
  { subject: 'B.Ind', average: 88, color: '#10B981' },
  { subject: 'IPA', average: 82, color: '#0EA5E9' },
  { subject: 'IPS', average: 86, color: '#8B5CF6' },
  { subject: 'B.Ing', average: 84, color: '#F59E0B' },
  { subject: 'PKn', average: 90, color: '#EF4444' },
]

export default function GradeChart({ data = defaultData, loading = false }: GradeChartProps) {
  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading chart...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="subject" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value: number) => [`${value}`, 'Rata-rata']}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
          />
          <Bar dataKey="average" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
