import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSources } from '@/lib/data/sources'
import { getCompanyByEmail } from '@/lib/data/companies'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Avatar from '@mui/material/Avatar'
import UploadForm from './UploadForm'

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const company = await getCompanyByEmail(user.email!)
  if (!company) {
    redirect('/login')
  }

  const sources = await getSources()
  const supportedSources = sources.filter((s) => s.name === 'HBE' || s.name === 'SAF' || s.name === 'FuelEU Maritime')

  const userInitials = company.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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
                <Typography sx={{ color: 'text.secondary' }}>Dashboard</Typography>
              </Link>
              <Link href="/dashboard/uploads" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                  Uploads
                </Typography>
              </Link>
              <Link href="/dashboard/sources" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: 'text.secondary' }}>Sources</Typography>
              </Link>
              <Link href="/dashboard/settings" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: 'text.secondary' }}>Settings</Typography>
              </Link>
            </Box>

            <Avatar sx={{ bgcolor: '#4ade80', color: 'black', fontWeight: 600 }}>
              {userInitials}
            </Avatar>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 600, mb: 1 }}>
            Upload certificates
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Import certificate data from CSV files
          </Typography>
        </Box>

        <UploadForm sources={supportedSources} />
      </Container>
    </Box>
  )
}
