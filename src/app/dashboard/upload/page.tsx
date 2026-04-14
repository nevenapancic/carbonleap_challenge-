import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSources } from '@/lib/data/sources'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import UploadForm from './UploadForm'

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const sources = await getSources()
  const hbeSource = sources.filter((s) => s.name === 'HBE')

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Faithful Registry
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            {user.email}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link href="/dashboard" style={{ color: '#0d9488', textDecoration: 'none' }}>
            Dashboard
          </Link>
          <Typography color="text.primary">Upload</Typography>
        </Breadcrumbs>

        <UploadForm sources={hbeSource} />

        <Box sx={{ mt: 3 }}>
          <Link href="/dashboard">
            <Button variant="text">
              Back to Dashboard
            </Button>
          </Link>
        </Box>
      </Container>
    </Box>
  )
}
