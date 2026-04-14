import Link from 'next/link'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { signup } from '../actions'

type SearchParams = Promise<{ error?: string }>

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { error } = await searchParams

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Faithful Registry
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            Create your account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form action={signup}>
            <TextField
              id="companyName"
              name="companyName"
              type="text"
              label="Company Name"
              fullWidth
              required
              margin="normal"
            />
            <TextField
              id="email"
              name="email"
              type="email"
              label="Email"
              fullWidth
              required
              margin="normal"
            />
            <TextField
              id="password"
              name="password"
              type="password"
              label="Password"
              fullWidth
              required
              margin="normal"
              slotProps={{ htmlInput: { minLength: 6 } }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 2 }}
            >
              Sign up
            </Button>
          </form>

          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 3 }}
            color="text.secondary"
          >
            Already have an account?{' '}
            <Link
              href="/login"
              style={{ color: '#0d9488', textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
