import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCompanyByEmail } from '@/lib/data/companies'
import { getHbeCertificates, getHbeStats } from '@/lib/data/certificates'
import { getSources } from '@/lib/data/sources'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'

const hbeTypeLabels: Record<string, { label: string; color: string }> = {
  'HBE-G': { label: 'HBE-G advanced', color: '#4ade80' },
  'HBE-C': { label: 'HBE-C', color: '#60a5fa' },
  'HBE-IXB': { label: 'HBE-IXB', color: '#a78bfa' },
  'HBE-O': { label: 'HBE-O', color: '#fbbf24' },
}

export default async function CertificatesPage() {
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
  const hbeSource = sources.find((s) => s.name === 'HBE')

  let hbeStats = null
  let hbeCertificates: Awaited<ReturnType<typeof getHbeCertificates>> = []

  if (hbeSource) {
    hbeStats = await getHbeStats(hbeSource.id, company.id)
    hbeCertificates = await getHbeCertificates(hbeSource.id, company.id)
  }

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
                <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                  Portfolio
                </Typography>
              </Link>
              <Link href="/dashboard/uploads" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: 'text.secondary' }}>Uploads</Typography>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Link href="/dashboard">
            <Button sx={{ color: 'grey.500' }}>← Back</Button>
          </Link>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
            HBE Certificates
          </Typography>
          <Chip
            label="GJ"
            sx={{
              bgcolor: 'transparent',
              border: '1px solid #4ade80',
              color: '#4ade80',
              fontWeight: 600,
            }}
          />
        </Box>

        {hbeStats && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 3,
              mb: 4,
            }}
          >
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase' }}>
                  Total Certificates
                </Typography>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                  {hbeStats.totalCertificates}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase' }}>
                  Total Energy
                </Typography>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                  {hbeStats.totalEnergyGj.toLocaleString()} GJ
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase' }}>
                  Total HBEs Issued
                </Typography>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                  {hbeStats.totalHbesIssued.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        <Card sx={{ bgcolor: 'background.paper' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'grey.500', borderColor: 'divider' }}>Certificate ID</TableCell>
                  <TableCell sx={{ color: 'grey.500', borderColor: 'divider' }}>Energy (GJ)</TableCell>
                  <TableCell sx={{ color: 'grey.500', borderColor: 'divider' }}>HBEs Issued</TableCell>
                  <TableCell sx={{ color: 'grey.500', borderColor: 'divider' }}>Type</TableCell>
                  <TableCell sx={{ color: 'grey.500', borderColor: 'divider' }}>GHG Reduction</TableCell>
                  <TableCell sx={{ color: 'grey.500', borderColor: 'divider' }}>Feedstock</TableCell>
                  <TableCell sx={{ color: 'grey.500', borderColor: 'divider' }}>Country</TableCell>
                  <TableCell sx={{ color: 'grey.500', borderColor: 'divider' }}>Certification</TableCell>
                  <TableCell sx={{ color: 'grey.500', borderColor: 'divider' }}>PoS Number</TableCell>
                  <TableCell sx={{ color: 'grey.500', borderColor: 'divider' }}>Sector</TableCell>
                  <TableCell sx={{ color: 'grey.500', borderColor: 'divider' }}>Delivery Date</TableCell>
                  <TableCell sx={{ color: 'grey.500', borderColor: 'divider' }}>Supplier</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hbeCertificates.map((cert) => {
                  const typeInfo = hbeTypeLabels[cert.hbe_type] || { label: cert.hbe_type, color: '#6b7280' }
                  return (
                    <TableRow key={cert.id}>
                      <TableCell sx={{ color: 'white', borderColor: 'divider' }}>
                        {cert.certificate_id}
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderColor: 'divider' }}>
                        {cert.energy_delivered_gj}
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderColor: 'divider' }}>
                        {cert.hbes_issued}
                      </TableCell>
                      <TableCell sx={{ borderColor: 'divider' }}>
                        <Chip
                          label={typeInfo.label}
                          size="small"
                          sx={{
                            bgcolor: `${typeInfo.color}20`,
                            color: typeInfo.color,
                            border: `1px solid ${typeInfo.color}40`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderColor: 'divider' }}>
                        <Chip
                          label={`${cert.ghg_reduction_percentage}%`}
                          size="small"
                          sx={{
                            bgcolor: cert.ghg_reduction_percentage >= 65 ? '#4ade8020' : '#f59e0b20',
                            color: cert.ghg_reduction_percentage >= 65 ? '#4ade80' : '#f59e0b',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderColor: 'divider' }}>
                        {cert.feedstock}
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderColor: 'divider' }}>
                        {cert.production_country}
                      </TableCell>
                      <TableCell sx={{ borderColor: 'divider' }}>
                        <Chip
                          label={cert.sustainability_scheme}
                          size="small"
                          sx={{
                            bgcolor: '#3b82f620',
                            color: '#3b82f6',
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'grey.400', borderColor: 'divider', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {cert.pos_number}
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderColor: 'divider' }}>
                        {cert.transport_sector}
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderColor: 'divider' }}>
                        {cert.delivery_date}
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderColor: 'divider' }}>
                        {cert.supplier_name}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Container>
    </Box>
  )
}
