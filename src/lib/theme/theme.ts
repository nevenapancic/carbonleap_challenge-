'use client'

import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4ade80',
    },
    secondary: {
      main: '#f59e0b',
    },
    background: {
      default: '#0f0f0f',
      paper: '#1a1a1a',
    },
    warning: {
      main: '#f59e0b',
      light: '#fef3c7',
      dark: '#92400e',
    },
  },
  typography: {
    fontFamily: 'inherit',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
})

export default theme
