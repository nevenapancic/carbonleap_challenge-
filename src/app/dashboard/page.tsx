import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Alert from '@mui/material/Alert'
import { logout } from '../(auth)/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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
          <form action={logout}>
            <Button type="submit" color="inherit" size="small">
              Sign out
            </Button>
          </form>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 4 }}>
          Sources use different units and methodologies — totals across sources
          are not shown as they would create false comparability.
        </Alert>

        <Typography variant="h5" gutterBottom>
          Your Carbon Certificate Portfolio
        </Typography>

        <Typography color="text.secondary">
          Dashboard coming in Phase 3. Upload functionality coming in Phase 2.
        </Typography>
      </Container>
    </Box>
  )
}
