import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCompanyByEmail, getCompanySourcesWithStats } from '@/lib/data/companies'
import { getHbeStats } from '@/lib/data/certificates'
import { getSafStats } from '@/lib/data/saf'
import { getFuelEuStats } from '@/lib/data/fueleu'
import { getSources } from '@/lib/data/sources'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import { logout } from '../(auth)/actions'
import HbeCertificatesTable from './HbeCertificatesTable'
import SafCertificatesTable from './SafCertificatesTable'
import FuelEuCertificatesTable from './FuelEuCertificatesTable'
import { getPaginatedCertificates, getPaginatedSafCertificates, getPaginatedFuelEuCertificates } from './actions'

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

  const sources = await getSources()
  const hbeSource = sources.find((s) => s.name === 'HBE')
  const safSource = sources.find((s) => s.name === 'SAF' || s.name.toLowerCase().includes('saf'))
  const fuelEuSource = sources.find((s) => s.name === 'FuelEU Maritime' || s.name.toLowerCase().includes('fueleu'))
  const sourcesWithStats = await getCompanySourcesWithStats(company.id)

  let hbeStats = null
  let initialCertificates: Awaited<ReturnType<typeof getPaginatedCertificates>> | null = null

  if (hbeSource) {
    hbeStats = await getHbeStats(hbeSource.id, company.id)
    initialCertificates = await getPaginatedCertificates(hbeSource.id, company.id, 1, 5)
  }

  let safStats = null
  let initialSafCertificates: Awaited<ReturnType<typeof getPaginatedSafCertificates>> | null = null

  if (safSource) {
    safStats = await getSafStats(safSource.id, company.id)
    initialSafCertificates = await getPaginatedSafCertificates(safSource.id, company.id, 1, 5)
  }

  let fuelEuStats = null
  let initialFuelEuCertificates: Awaited<ReturnType<typeof getPaginatedFuelEuCertificates>> | null = null

  if (fuelEuSource) {
    fuelEuStats = await getFuelEuStats(fuelEuSource.id, company.id)
    initialFuelEuCertificates = await getPaginatedFuelEuCertificates(fuelEuSource.id, company.id, 1, 5)
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

        {hbeStats && hbeStats.totalCertificates > 0 && (
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

              {initialCertificates && initialCertificates.certificates.length > 0 && hbeSource && (
                <Box sx={{ mt: 2 }}>
                  <HbeCertificatesTable
                    sourceId={hbeSource.id}
                    companyId={company.id}
                    initialCertificates={initialCertificates.certificates}
                    initialTotalCount={initialCertificates.totalCount}
                    initialTotalPages={initialCertificates.totalPages}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {safStats && safStats.totalCertificates > 0 && (
          <Card sx={{ bgcolor: 'background.paper', mb: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: '#60a5fa',
                    }}
                  />
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                      SAF
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'grey.500' }}>
                      Sustainable Aviation Fuel · ICAO CORSIA / EU RED
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="MT"
                  sx={{
                    bgcolor: 'transparent',
                    border: '1px solid #60a5fa',
                    color: '#60a5fa',
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
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
                    {safStats.totalCertificates}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.500' }}>
                    total records
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Total Volume
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                    {safStats.totalVolumeMt.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.500' }}>
                    Metric Tons
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Avg GHG Reduction
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                    {safStats.avgGhgReduction}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.500' }}>
                    lifecycle reduction
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    CORSIA Eligible
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                    {safStats.corsiaEligibleCount}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.500' }}>
                    certificates
                  </Typography>
                </Box>
              </Box>

              {initialSafCertificates && initialSafCertificates.certificates.length > 0 && safSource && (
                <Box sx={{ mt: 2 }}>
                  <SafCertificatesTable
                    sourceId={safSource.id}
                    companyId={company.id}
                    initialCertificates={initialSafCertificates.certificates}
                    initialTotalCount={initialSafCertificates.totalCount}
                    initialTotalPages={initialSafCertificates.totalPages}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {fuelEuStats && fuelEuStats.totalCertificates > 0 && (
          <Card sx={{ bgcolor: 'background.paper', mb: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: '#22d3ee',
                    }}
                  />
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                      FuelEU Maritime
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'grey.500' }}>
                      EU Maritime Fuel Regulation · GHG Intensity Compliance
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="gCO2eq/MJ"
                  sx={{
                    bgcolor: 'transparent',
                    border: '1px solid #22d3ee',
                    color: '#22d3ee',
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
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
                    {fuelEuStats.totalCertificates}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.500' }}>
                    total records
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Total Fuel
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                    {fuelEuStats.totalFuelConsumptionMt.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.500' }}>
                    Metric Tons
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Avg GHG Intensity
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                    {fuelEuStats.avgGhgIntensity}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.500' }}>
                    gCO2eq/MJ
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Compliant
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                    {fuelEuStats.compliantCount}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.500' }}>
                    certificates
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Unique Vessels
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                    {fuelEuStats.uniqueVessels}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.500' }}>
                    IMO numbers
                  </Typography>
                </Box>
              </Box>

              {initialFuelEuCertificates && initialFuelEuCertificates.certificates.length > 0 && fuelEuSource && (
                <Box sx={{ mt: 2 }}>
                  <FuelEuCertificatesTable
                    sourceId={fuelEuSource.id}
                    companyId={company.id}
                    initialCertificates={initialFuelEuCertificates.certificates}
                    initialTotalCount={initialFuelEuCertificates.totalCount}
                    initialTotalPages={initialFuelEuCertificates.totalPages}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {(!hbeStats || hbeStats.totalCertificates === 0) && (!safStats || safStats.totalCertificates === 0) && (!fuelEuStats || fuelEuStats.totalCertificates === 0) && (
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
