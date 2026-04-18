'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useRealtimeHbeStats, type HbeStats } from '@/hooks/useRealtimeStats'

type Props = {
  sourceId: string
  companyId: string
  initialStats: HbeStats
}

export default function HbeStatsDisplay({ sourceId, companyId, initialStats }: Props) {
  const { stats } = useRealtimeHbeStats(sourceId, companyId, initialStats)

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 4,
        py: 3,
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
          Certificates
        </Typography>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 600 }}>
          {stats.totalCertificates}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          total records
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
          Total Energy
        </Typography>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 600 }}>
          {stats.totalEnergyGj.toLocaleString()}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          GJ
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
          Latest Issue
        </Typography>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 600 }}>
          {stats.latestDeliveryDate || 'N/A'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          DD/MM/YYYY format
        </Typography>
      </Box>
    </Box>
  )
}
