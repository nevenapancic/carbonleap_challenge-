'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import { useThemeMode } from '@/lib/theme/ThemeProvider'

export default function ThemeToggle() {
  const { mode, toggleTheme } = useThemeMode()

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography sx={{ color: mode === 'dark' ? 'white' : 'text.primary', fontWeight: 500 }}>
          Dark Mode
        </Typography>
        <Typography variant="body2" sx={{ color: 'grey.500' }}>
          {mode === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
        </Typography>
      </Box>
      <Switch
        checked={mode === 'dark'}
        onChange={toggleTheme}
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
  )
}
