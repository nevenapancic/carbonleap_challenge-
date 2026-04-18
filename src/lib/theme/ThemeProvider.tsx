'use client'

import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { darkTheme, lightTheme } from './theme'

type ThemeMode = 'light' | 'dark'

type ThemeContextType = {
  mode: ThemeMode
  toggleTheme: () => void
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useThemeMode() {
  const context = useContext(ThemeContext)
  if (!context) {
    // Return default values when context is not available (SSR or outside provider)
    return {
      mode: 'dark' as const,
      toggleTheme: () => {},
      setMode: () => {},
    }
  }
  return context
}

type Props = {
  children: React.ReactNode
  initialTheme?: ThemeMode
}

export default function ThemeProvider({ children, initialTheme = 'dark' }: Props) {
  const [mode, setModeState] = useState<ThemeMode>(initialTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem('theme-mode', newMode)
  }

  const toggleTheme = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark'
    setMode(newMode)
  }

  const theme = useMemo(() => {
    return mode === 'dark' ? darkTheme : lightTheme
  }, [mode])

  const contextValue = useMemo(() => ({
    mode,
    toggleTheme,
    setMode,
  }), [mode])

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <MuiThemeProvider theme={darkTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    )
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}
