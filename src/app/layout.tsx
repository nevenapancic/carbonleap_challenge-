import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import ThemeProvider from '@/lib/theme/ThemeProvider'
import { createClient } from '@/lib/supabase/server'
import { getCompanyByEmail } from '@/lib/data/companies'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Faithful Registry',
  description: 'Carbon certificate portfolio dashboard',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Try to get user's theme preference from database
  let initialTheme: 'light' | 'dark' = 'dark'

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user?.email) {
      const company = await getCompanyByEmail(user.email)
      if (company?.theme_mode) {
        initialTheme = company.theme_mode
      }
    }
  } catch {
    // Silently fail - use default theme
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AppRouterCacheProvider>
          <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
