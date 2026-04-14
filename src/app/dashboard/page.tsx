import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCompanyByEmail, getCompanySourcesWithStats } from '@/lib/data/companies'
import { getHbeStats } from '@/lib/data/certificates'
import { getSources } from '@/lib/data/sources'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
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
import { logout } from '../(auth)/actions'
import type { HbeCertificateData } from '@/lib/types/database'
import PaginationControls from './PaginationControls'

const hbeTypeLabels: Record<string, { label: string; color: string }> = {
  'HBE-G': { label: 'HBE-G advanced', color: '#4ade80' },
  'HBE-C': { label: 'HBE-C', color: '#60a5fa' },
  'HBE-IXB': { label: 'HBE-IXB', color: '#a78bfa' },
  'HBE-O': { label: 'HBE-O', color: '#fbbf24' },
}

const transportSectorLabels: Record<string, string> = {
  road: 'Road',
  maritime: 'Maritime',
  aviation: 'Aviation',
  inland_waterway: 'Inland Waterway',
}

type SearchParams = Promise<{ page?: string; perPage?: string }>

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1'))
  const perPage = parseInt(params.perPage || '5')
  const validPerPage = [5, 10, 15].includes(perPage) ? perPage : 5

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
  const sourcesWithStats = await getCompanySourcesWithStats(company.id)

  let hbeStats = null
  let hbeCertificates: (HbeCertificateData & { id: string })[] = []
  let totalPages = 1
  let totalCount = 0

  if (hbeSource) {
    hbeStats = await getHbeStats(hbeSource.id)

    const { data: allCerts, count } = await supabase
      .from('certificates')
      .select('id, raw_data', { count: 'exact' })
      .eq('source_id', hbeSource.id)
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * validPerPage, currentPage * validPerPage - 1)

    if (allCerts) {
      hbeCertificates = allCerts.map((cert) => ({
        id: cert.id,
        ...(cert.raw_data as HbeCertificateData),
      }))
    }

    totalCount = count || 0
    totalPages = Math.ceil(totalCount / validPerPage)
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
              sx={{ fontWeight: 600, color: 'white', mr: 6 }}
            >
              Carbon<span style={{ color: '#4ade80' }}>Leap</span>
            </Typography>

            <Box sx={{ display: 'flex', gap: 4, flexGrow: 1 }}>
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: 'white', fontWeight: 500 }}>
                  Portfolio
                </Typography>
              </Link>
              <Link href="/dashboard/uploads" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: 'grey.500' }}>Uploads</Typography>
              </Link>
              <Typography sx={{ color: 'grey.500' }}>Sources</Typography>
              <Typography sx={{ color: 'grey.500' }}>Settings</Typography>
            </Box>

            <Avatar sx={{ bgcolor: '#4ade80', color: 'black', fontWeight: 600 }}>
              {userInitials}
            </Avatar>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
              Your portfolio
            </Typography>
            <Typography sx={{ color: 'grey.500' }}>
              {company.name} · {sourcesWithStats.length} active sources
            </Typography>
          </Box>
          <Link href="/dashboard/upload">
            <Button
              variant="outlined"
              sx={{
                borderColor: 'grey.700',
                color: 'white',
                '&:hover': { borderColor: 'grey.500' },
              }}
            >
              + Upload certificates
            </Button>
          </Link>
        </Box>

        <Box
          sx={{
            bgcolor: '#fef3c7',
            borderRadius: 2,
            p: 2,
            mb: 4,
          }}
        >
          <Typography sx={{ color: '#92400e' }}>
            Sources use different units and methodologies — totals across sources are not shown as they would create false comparability.
          </Typography>
        </Box>

        {hbeStats && hbeStats.totalCertificates > 0 ? (
          <Card sx={{ bgcolor: 'background.paper', mb: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: '#4ade80',
                    }}
                  />
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                      HBE
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'grey.500' }}>
                      Dutch biofuel tickets · NEa Registry Netherlands
                    </Typography>
                  </Box>
                </Box>
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

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 4,
                  py: 3,
                  borderTop: '1px solid',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Certificates
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                    {hbeStats.totalCertificates}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.500' }}>
                    total records
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Total Energy
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                    {hbeStats.totalEnergyGj.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.500' }}>
                    GJ
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Latest Issue
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                    {hbeStats.latestDeliveryDate || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.500' }}>
                    DD/MM/YYYY format
                  </Typography>
                </Box>
              </Box>

              {hbeCertificates.length > 0 && (
                <TableContainer sx={{
                  mt: 2,
                  '&::-webkit-scrollbar': { height: 8 },
                  '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                  '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.800', borderRadius: 4 },
                  '&::-webkit-scrollbar-thumb:hover': { bgcolor: 'grey.700' },
                }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Certificate ID</TableCell>
                        <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Type</TableCell>
                        <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Energy (GJ)</TableCell>
                        <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>HBEs Issued</TableCell>
                        <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Double Counting</TableCell>
                        <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Multiplier</TableCell>
                        <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Feedstock</TableCell>
                        <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>NTA8003 Code</TableCell>
                        <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Delivery Date</TableCell>
                        <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Booking Date</TableCell>
                        <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Sector</TableCell>
                        <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Supplier</TableCell>
                        <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>REV Account</TableCell>
                        <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {hbeCertificates.map((cert) => {
                        const typeInfo = hbeTypeLabels[cert.hbe_type] || { label: cert.hbe_type, color: '#6b7280' }
                        return (
                          <TableRow key={cert.id}>
                            <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                              {cert.certificate_id}
                            </TableCell>
                            <TableCell sx={{ borderColor: 'divider' }}>
                              <Chip
                                label={typeInfo.label}
                                size="small"
                                sx={{
                                  bgcolor: `${typeInfo.color}20`,
                                  color: typeInfo.color,
                                  border: `1px solid ${typeInfo.color}40`,
                                  fontSize: '0.7rem',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: 'white', borderColor: 'divider' }}>
                              {cert.energy_delivered_gj}
                            </TableCell>
                            <TableCell sx={{ color: 'white', borderColor: 'divider' }}>
                              {cert.hbes_issued}
                            </TableCell>
                            <TableCell sx={{ borderColor: 'divider' }}>
                              <Chip
                                label={cert.double_counting ? 'Yes' : 'No'}
                                size="small"
                                sx={{
                                  bgcolor: cert.double_counting ? '#4ade8020' : '#6b728020',
                                  color: cert.double_counting ? '#4ade80' : '#6b7280',
                                  fontSize: '0.7rem',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: 'white', borderColor: 'divider' }}>
                              {cert.multiplier}x
                            </TableCell>
                            <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                              {cert.feedstock}
                            </TableCell>
                            <TableCell sx={{ color: 'grey.400', borderColor: 'divider', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {cert.nta8003_code}
                            </TableCell>
                            <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                              {cert.delivery_date}
                            </TableCell>
                            <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                              {cert.booking_date}
                            </TableCell>
                            <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                              {transportSectorLabels[cert.transport_sector] || cert.transport_sector}
                            </TableCell>
                            <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                              {cert.supplier_name}
                            </TableCell>
                            <TableCell sx={{ color: 'grey.400', borderColor: 'divider', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {cert.rev_account_id}
                            </TableCell>
                            <TableCell sx={{ borderColor: 'divider' }}>
                              <Chip
                                label={cert.verification_status}
                                size="small"
                                sx={{
                                  bgcolor: cert.verification_status === 'verified' ? '#4ade8020' : '#f59e0b20',
                                  color: cert.verification_status === 'verified' ? '#4ade80' : '#f59e0b',
                                  fontSize: '0.7rem',
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                perPage={validPerPage}
                totalCount={totalCount}
              />
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" sx={{ color: 'grey.500', mb: 1 }}>
                No certificates yet
              </Typography>
              <Typography sx={{ color: 'grey.600', mb: 3 }}>
                Upload your first CSV to get started
              </Typography>
              <Link href="/dashboard/upload">
                <Button variant="contained">
                  Upload Certificates
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <form action={logout}>
            <Button type="submit" sx={{ color: 'grey.500' }}>
              Sign out
            </Button>
          </form>
        </Box>
      </Container>
    </Box>
  )
}
