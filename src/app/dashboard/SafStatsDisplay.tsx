'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useRealtimeSafStats, type SafStats } from '@/hooks/useRealtimeStats'

type Props = {
  sourceId: string
  companyId: string
  initialStats: SafStats
}

export default function SafStatsDisplay({ sourceId, companyId, initialStats }: Props) {
  const { stats } = useRealtimeSafStats(sourceId, companyId, initialStats)

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
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
          Total Volume
        </Typography>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 600 }}>
          {stats.totalVolumeMt.toLocaleString()}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Metric Tons
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
          Avg GHG Reduction
        </Typography>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 600 }}>
          {stats.avgGhgReduction}%
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          lifecycle reduction
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
          CORSIA Eligible
        </Typography>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 600 }}>
          {stats.corsiaEligibleCount}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          certificates
        </Typography>
      </Box>
    </Box>
  )
}
