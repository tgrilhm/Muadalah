/**
 * AttendanceChart Component
 * Line chart showing attendance trend for last 7 days
 * Phase 1B - Dashboard Charts
 */

'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AttendanceData {
  day: string
  percentage: number
  present: number
  total: number
}

interface AttendanceChartProps {
  data?: AttendanceData[]
  loading?: boolean
}

const defaultData: AttendanceData[] = [
  { day: 'Sen', percentage: 92, present: 368, total: 400 },
  { day: 'Sel', percentage: 88, present: 352, total: 400 },
  { day: 'Rab', percentage: 94, present: 376, total: 400 },
  { day: 'Kam', percentage: 90, present: 360, total: 400 },
  { day: 'Jum', percentage: 85, present: 340, total: 400 },
  { day: 'Sab', percentage: 87, present: 348, total: 400 },
  { day: 'Min', percentage: 91, present: 364, total: 400 },
]

export default function AttendanceChart({ data = defaultData, loading = false }: AttendanceChartProps) {
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
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="day" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value: number, name: string, props: any) => {
              if (name === 'percentage') {
                return [
                  <div key="tooltip" className="text-sm">
                    <div className="font-semibold text-gray-900">{value}%</div>
                    <div className="text-gray-600 text-xs mt-1">
                      {props.payload.present}/{props.payload.total} siswa hadir
                    </div>
                  </div>,
                  'Kehadiran',
                ]
              }
              return [value, name]
            }}
          />
          <Line
            type="monotone"
            dataKey="percentage"
            stroke="#2563EB"
            strokeWidth={3}
            dot={{ fill: '#2563EB', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
