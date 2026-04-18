import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCompanyByEmail } from '@/lib/data/companies'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import { logout } from '../../(auth)/actions'
import ThemeToggle from './ThemeToggle'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const company = await getCompanyByEmail(user.email!)
  if (!company) {
    redirect('/login')
  }

  const userInitials = company.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        component="header"
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: 'text.primary', mr: 6 }}
            >
              Carbon<span style={{ color: '#4ade80' }}>Leap</span>
            </Typography>

            <Box sx={{ display: 'flex', gap: 4, flexGrow: 1 }}>
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: 'text.secondary' }}>Portfolio</Typography>
              </Link>
              <Link href="/dashboard/uploads" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: 'text.secondary' }}>Uploads</Typography>
              </Link>
              <Typography sx={{ color: 'text.secondary' }}>Sources</Typography>
              <Link href="/dashboard/settings" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                  Settings
                </Typography>
              </Link>
            </Box>

            <Avatar sx={{ bgcolor: '#4ade80', color: 'black', fontWeight: 600 }}>
              {userInitials}
            </Avatar>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 600, mb: 4 }}>
          Settings
        </Typography>

        <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600, mb: 3 }}>
              Company Profile
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
              <Avatar
                sx={{
                  bgcolor: '#4ade80',
                  color: 'black',
                  fontWeight: 600,
                  width: 64,
                  height: 64,
                  fontSize: '1.5rem',
                }}
              >
                {userInitials}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  {company.name}
                </Typography>
                <Typography sx={{ color: 'text.secondary' }}>
                  Member since {formatDate(company.created_at)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'grey.800', my: 3 }} />

            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Company Name
                </Typography>
                <Typography sx={{ color: 'text.primary' }}>
                  {company.name}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Company Email
                </Typography>
                <Typography sx={{ color: 'text.primary' }}>
                  {company.email}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Company ID
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {company.id}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600, mb: 3 }}>
              Appearance
            </Typography>
            <ThemeToggle companyId={company.id} initialTheme={company.theme_mode || 'dark'} />
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600, mb: 2 }}>
              Sign Out
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 3 }}>
              Sign out of your account on this device.
            </Typography>
            <form action={logout}>
              <Button
                type="submit"
                variant="outlined"
                sx={{
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  '&:hover': {
                    borderColor: '#dc2626',
                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                  },
                }}
              >
                Sign Out
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
