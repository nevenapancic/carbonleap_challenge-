import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCompanyByEmail, getCompanyUploads } from '@/lib/data/companies'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import DownloadButton from './DownloadButton'

const sourceColors: Record<string, string> = {
  teal: '#4ade80',
  coral: '#f97316',
  amber: '#f59e0b',
}

export default async function UploadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const company = await getCompanyByEmail(user.email!)
  if (!company) {
    redirect('/login')
  }

  const uploads = await getCompanyUploads(company.id)

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 600, mb: 1 }}>
              Upload history
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              {uploads.length} uploads total
            </Typography>
          </Box>
          <Link href="/dashboard/upload">
            <Button
              variant="outlined"
              sx={{
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': { borderColor: 'text.secondary' },
              }}
            >
              + Upload certificates
            </Button>
          </Link>
        </Box>

        {uploads.length === 0 ? (
          <Card sx={{ bgcolor: 'background.paper', p: 6, textAlign: 'center' }}>
            <Typography sx={{ color: 'text.secondary', mb: 2 }}>
              No uploads yet
            </Typography>
            <Link href="/dashboard/upload">
              <Button variant="contained">
                Upload your first CSV
              </Button>
            </Link>
          </Card>
        ) : (
          <Card sx={{ bgcolor: 'background.paper' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'text.secondary', borderColor: 'divider' }}>File name</TableCell>
                    <TableCell sx={{ color: 'text.secondary', borderColor: 'divider' }}>Source</TableCell>
                    <TableCell sx={{ color: 'text.secondary', borderColor: 'divider' }}>Certificates</TableCell>
                    <TableCell sx={{ color: 'text.secondary', borderColor: 'divider' }}>Status</TableCell>
                    <TableCell sx={{ color: 'text.secondary', borderColor: 'divider' }}>Uploaded</TableCell>
                    <TableCell sx={{ color: 'text.secondary', borderColor: 'divider' }}>Download</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell sx={{ color: 'text.primary', borderColor: 'divider' }}>
                        {upload.filename}
                      </TableCell>
                      <TableCell sx={{ borderColor: 'divider' }}>
                        <Chip
                          label={upload.source.name}
                          size="small"
                          sx={{
                            bgcolor: `${sourceColors[upload.source.color || ''] || '#6b7280'}20`,
                            color: sourceColors[upload.source.color || ''] || '#6b7280',
                            border: `1px solid ${sourceColors[upload.source.color || ''] || '#6b7280'}40`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary', borderColor: 'divider' }}>
                        {upload.certificateCount}
                      </TableCell>
                      <TableCell sx={{ borderColor: 'divider' }}>
                        <Chip
                          label={upload.status}
                          size="small"
                          sx={{
                            bgcolor: upload.status === 'done'
                              ? '#4ade8020'
                              : upload.status === 'failed'
                              ? '#ef444420'
                              : '#f59e0b20',
                            color: upload.status === 'done'
                              ? '#4ade80'
                              : upload.status === 'failed'
                              ? '#ef4444'
                              : '#f59e0b',
                            border: `1px solid ${
                              upload.status === 'done'
                                ? '#4ade8040'
                                : upload.status === 'failed'
                                ? '#ef444440'
                                : '#f59e0b40'
                            }`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', borderColor: 'divider' }}>
                        {new Date(upload.uploaded_at).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell sx={{ borderColor: 'divider' }}>
                        {upload.file_url ? (
                          <DownloadButton fileUrl={upload.file_url} filename={upload.filename || 'download.csv'} />
                        ) : (
                          <Typography sx={{ color: 'grey.600', fontSize: '0.75rem' }}>—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </Container>
    </Box>
  )
}
