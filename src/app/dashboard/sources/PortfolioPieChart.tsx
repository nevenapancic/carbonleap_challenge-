'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

type SourceData = {
  name: string
  value: number
  color: string
}

type Props = {
  data: SourceData[]
}

export default function PortfolioPieChart({ data }: Props) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
        <Typography sx={{ color: 'text.secondary' }}>No certificates yet</Typography>
      </Box>
    )
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: SourceData }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      const percentage = ((item.value / total) * 100).toFixed(1)
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1.5,
            boxShadow: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: item.color, fontWeight: 600 }}>
            {item.name}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {item.value.toLocaleString()} certificates
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {percentage}% of portfolio
          </Typography>
        </Box>
      )
    }
    return null
  }

  const renderLegend = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, ml: 2 }}>
        {data.map((entry) => {
          const percentage = ((entry.value / total) * 100).toFixed(1)
          return (
            <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: entry.color,
                  flexShrink: 0,
                }}
              />
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                  {entry.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {entry.value.toLocaleString()} ({percentage}%)
                </Typography>
              </Box>
            </Box>
          )
        })}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: 200, height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      {renderLegend()}
    </Box>
  )
}
