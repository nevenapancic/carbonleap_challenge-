'use client'

import { useTransition } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import CircularProgress from '@mui/material/CircularProgress'
import { useThemeMode } from '@/lib/theme/ThemeProvider'
import { updateThemeMode } from './actions'
import type { ThemeMode } from '@/lib/types/database'

type Props = {
  companyId: string
  initialTheme: ThemeMode
}

export default function ThemeToggle({ companyId, initialTheme }: Props) {
  const { mode, setMode } = useThemeMode()
  const [isPending, startTransition] = useTransition()

  const currentMode = mode || initialTheme

  const handleToggle = () => {
    const newMode: ThemeMode = currentMode === 'dark' ? 'light' : 'dark'

    setMode(newMode)
    
    startTransition(async () => {
      await updateThemeMode(companyId, newMode)
    })
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
          Dark Mode
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {currentMode === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isPending && <CircularProgress size={16} sx={{ color: 'text.secondary' }} />}
        <Switch
          checked={currentMode === 'dark'}
          onChange={handleToggle}
          disabled={isPending}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#4ade80',
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: '#4ade80',
            },
          }}
        />
      </Box>
    </Box>
  )
}
