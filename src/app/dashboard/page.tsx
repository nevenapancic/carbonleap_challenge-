import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCompanyByEmail, getCompanySourcesWithStats, getCompanyUploads } from '@/lib/data/companies'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { logout } from '../(auth)/actions'

const sourceColors: Record<string, string> = {
  teal: '#0d9488',
  coral: '#f97316',
  amber: '#f59e0b',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const company = await getCompanyByEmail(user.email!)

  if (!company) {
    redirect('/login')
  }

  const sourcesWithStats = await getCompanySourcesWithStats(company.id)
  const uploads = await getCompanyUploads(company.id)

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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5">
            Your Carbon Certificate Portfolio
          </Typography>
          <Link href="/dashboard/upload">
            <Button variant="contained">
              Upload Certificates
            </Button>
          </Link>
        </Box>

        {sourcesWithStats.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No certificates yet
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Upload your first CSV to get started
              </Typography>
              <Link href="/dashboard/upload">
                <Button variant="contained">
                  Upload Certificates
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {sourcesWithStats.map(({ source, certificateCount, uploadCount }) => (
              <Card
                key={source.id}
                sx={{
                  borderLeft: 4,
                  borderColor: sourceColors[source.color || ''] || '#6b7280',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h6">{source.name}</Typography>
                    <Chip
                      label={source.unit_label}
                      size="small"
                      sx={{
                        bgcolor: sourceColors[source.color || ''] || '#6b7280',
                        color: 'white',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {source.methodology_description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <Box>
                      <Typography
                        variant="h4"
                        sx={{ color: sourceColors[source.color || ''] || '#6b7280' }}
                      >
                        {certificateCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        certificates
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" color="text.secondary">
                        {uploadCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        uploads
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {uploads.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h6" gutterBottom>
              Upload History
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>File</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Certificates</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell>{upload.filename}</TableCell>
                      <TableCell>
                        <Chip
                          label={upload.source.name}
                          size="small"
                          sx={{
                            bgcolor: sourceColors[upload.source.color || ''] || '#6b7280',
                            color: 'white',
                          }}
                        />
                      </TableCell>
                      <TableCell>{upload.certificateCount}</TableCell>
                      <TableCell>
                        <Chip
                          label={upload.status}
                          size="small"
                          color={
                            upload.status === 'done'
                              ? 'success'
                              : upload.status === 'failed'
                              ? 'error'
                              : 'warning'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(upload.uploaded_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Container>
    </Box>
  )
}
