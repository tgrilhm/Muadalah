/**
 * PaymentChart Component
 * Donut chart showing payment status distribution
 * Phase 1B - Dashboard Charts
 */

'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface PaymentData {
  status: string
  count: number
  percentage: number
  color: string
}

interface PaymentChartProps {
  data?: PaymentData[]
  loading?: boolean
}

const defaultData: PaymentData[] = [
  { status: 'Lunas', count: 320, percentage: 80, color: '#10B981' },
  { status: 'Terlambat', count: 50, percentage: 12.5, color: '#F59E0B' },
  { status: 'Belum Bayar', count: 30, percentage: 7.5, color: '#EF4444' },
]

export default function PaymentChart({ data = defaultData, loading = false }: PaymentChartProps) {
  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading chart...</div>
      </div>
    )
  }

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="count"
            label={renderCustomLabel}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value: number, name: string, props: any) => [
              <div key="tooltip" className="text-sm">
                <div className="font-semibold text-gray-900">{value} siswa</div>
                <div className="text-gray-600 text-xs mt-1">
                  {props.payload.percentage}% dari total
                </div>
              </div>,
              props.payload.status,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value, entry: any) => (
              <span className="text-sm text-gray-700">
                {value} ({entry.payload.count})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
