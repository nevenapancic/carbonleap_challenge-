'use client'

import { createTheme } from '@mui/material/styles'

export const darkTheme = createTheme({
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

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#16a34a',
    },
    secondary: {
      main: '#d97706',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fef3c7',
      dark: '#92400e',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#6b7280',
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

// Default export for backwards compatibility
export default darkTheme
