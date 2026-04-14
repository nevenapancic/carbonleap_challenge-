'use client'

import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#0d9488',
    },
    secondary: {
      main: '#f97316',
    },
    warning: {
      main: '#f59e0b',
    },
  },
  typography: {
    fontFamily: 'inherit',
  },
})

export default theme
