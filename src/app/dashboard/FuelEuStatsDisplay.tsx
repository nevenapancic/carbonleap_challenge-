'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useRealtimeFuelEuStats, type FuelEuStats } from '@/hooks/useRealtimeStats'

type Props = {
  sourceId: string
  companyId: string
  initialStats: FuelEuStats
}

export default function FuelEuStatsDisplay({ sourceId, companyId, initialStats }: Props) {
  const { stats } = useRealtimeFuelEuStats(sourceId, companyId, initialStats)

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 4,
        py: 3,
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box>
        <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
          Certificates
        </Typography>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
          {stats.totalCertificates}
        </Typography>
        <Typography variant="body2" sx={{ color: 'grey.500' }}>
          total records
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
          Total Fuel
        </Typography>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
          {stats.totalFuelConsumptionMt.toLocaleString()}
        </Typography>
        <Typography variant="body2" sx={{ color: 'grey.500' }}>
          Metric Tons
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
          Avg GHG Intensity
        </Typography>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
          {stats.avgGhgIntensity}
        </Typography>
        <Typography variant="body2" sx={{ color: 'grey.500' }}>
          gCO2eq/MJ
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
          Compliant
        </Typography>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
          {stats.compliantCount}
        </Typography>
        <Typography variant="body2" sx={{ color: 'grey.500' }}>
          certificates
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
          Unique Vessels
        </Typography>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
          {stats.uniqueVessels}
        </Typography>
        <Typography variant="body2" sx={{ color: 'grey.500' }}>
          IMO numbers
        </Typography>
      </Box>
    </Box>
  )
}
