import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCompanyByEmail } from '@/lib/data/companies'
import { getSources } from '@/lib/data/sources'
import { getHbeStats } from '@/lib/data/certificates'
import { getSafStats } from '@/lib/data/saf'
import { getFuelEuStats } from '@/lib/data/fueleu'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import PortfolioPieChart from './PortfolioPieChart'

export default async function SourcesPage() {
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

  const hbeStats = hbeSource ? await getHbeStats(hbeSource.id, company.id) : null
  const safStats = safSource ? await getSafStats(safSource.id, company.id) : null
  const fuelEuStats = fuelEuSource ? await getFuelEuStats(fuelEuSource.id, company.id) : null

  const userInitials = company.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const totalCertificates =
    (hbeStats?.totalCertificates || 0) +
    (safStats?.totalCertificates || 0) +
    (fuelEuStats?.totalCertificates || 0)

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
                <Typography sx={{ color: 'text.secondary' }}>Uploads</Typography>
              </Link>
              <Link href="/dashboard/sources" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>Sources</Typography>
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
            Sources Overview
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {company.name} · {totalCertificates} total certificates across all sources
          </Typography>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Total Sources
                </Typography>
                <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 600, mt: 1 }}>
                  {[hbeStats, safStats, fuelEuStats].filter(s => s && s.totalCertificates > 0).length}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  active registries
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Total Certificates
                </Typography>
                <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 600, mt: 1 }}>
                  {totalCertificates.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  across all sources
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Compliance Rate
                </Typography>
                <Typography variant="h3" sx={{ color: '#4ade80', fontWeight: 600, mt: 1 }}>
                  {fuelEuStats && fuelEuStats.totalCertificates > 0
                    ? Math.round((fuelEuStats.compliantCount / fuelEuStats.totalCertificates) * 100)
                    : 100}%
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  FuelEU Maritime compliant
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Portfolio Distribution Pie Chart */}
        {totalCertificates > 0 && (
          <Card sx={{ bgcolor: 'background.paper', mb: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600, mb: 3 }}>
                Portfolio Distribution
              </Typography>
              <PortfolioPieChart
                data={[
                  ...(hbeStats && hbeStats.totalCertificates > 0
                    ? [{ name: 'HBE', value: hbeStats.totalCertificates, color: '#4ade80' }]
                    : []),
                  ...(safStats && safStats.totalCertificates > 0
                    ? [{ name: 'SAF', value: safStats.totalCertificates, color: '#60a5fa' }]
                    : []),
                  ...(fuelEuStats && fuelEuStats.totalCertificates > 0
                    ? [{ name: 'FuelEU Maritime', value: fuelEuStats.totalCertificates, color: '#22d3ee' }]
                    : []),
                ]}
              />
            </CardContent>
          </Card>
        )}

        {/* HBE Source Card */}
        {hbeStats && hbeStats.totalCertificates > 0 && (
          <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: '#4ade8020',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography sx={{ color: '#4ade80', fontWeight: 700, fontSize: '1.2rem' }}>H</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      HBE - Dutch Biofuel Tickets
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      NEa Registry Netherlands · Energy in GJ
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="Active"
                  sx={{ bgcolor: '#4ade8020', color: '#4ade80', fontWeight: 600 }}
                />
              </Box>

              <Divider sx={{ borderColor: 'divider', mb: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Certificates
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mt: 0.5 }}>
                    {hbeStats.totalCertificates.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Total Energy
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mt: 0.5 }}>
                    {hbeStats.totalEnergyGj.toLocaleString()} <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>GJ</Typography>
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    HBEs Issued
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mt: 0.5 }}>
                    {hbeStats.totalHbesIssued.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Latest Delivery
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mt: 0.5 }}>
                    {hbeStats.latestDeliveryDate || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

            </CardContent>
          </Card>
        )}

        {/* SAF Source Card */}
        {safStats && safStats.totalCertificates > 0 && (
          <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: '#60a5fa20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography sx={{ color: '#60a5fa', fontWeight: 700, fontSize: '1.2rem' }}>S</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      SAF - Sustainable Aviation Fuel
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      ICAO CORSIA / EU RED · Volume in MT
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="Active"
                  sx={{ bgcolor: '#60a5fa20', color: '#60a5fa', fontWeight: 600 }}
                />
              </Box>

              <Divider sx={{ borderColor: 'divider', mb: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 6, md: 2.4 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Certificates
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mt: 0.5 }}>
                    {safStats.totalCertificates.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 2.4 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Total Volume
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mt: 0.5 }}>
                    {safStats.totalVolumeMt.toLocaleString()} <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>MT</Typography>
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 2.4 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Avg GHG Reduction
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#4ade80', fontWeight: 600, mt: 0.5 }}>
                    {safStats.avgGhgReduction}%
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 2.4 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    CORSIA Eligible
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mt: 0.5 }}>
                    {safStats.corsiaEligibleCount}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 2.4 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Latest Delivery
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mt: 0.5 }}>
                    {safStats.latestDeliveryDate || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

            </CardContent>
          </Card>
        )}

        {/* FuelEU Maritime Source Card */}
        {fuelEuStats && fuelEuStats.totalCertificates > 0 && (
          <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: '#22d3ee20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography sx={{ color: '#22d3ee', fontWeight: 700, fontSize: '1.2rem' }}>F</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      FuelEU Maritime
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      EU Maritime Fuel Regulation · GHG Intensity in gCO2eq/MJ
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="Active"
                  sx={{ bgcolor: '#22d3ee20', color: '#22d3ee', fontWeight: 600 }}
                />
              </Box>

              <Divider sx={{ borderColor: 'divider', mb: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 6, md: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Certificates
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mt: 0.5 }}>
                    {fuelEuStats.totalCertificates.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Fuel Consumption
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mt: 0.5 }}>
                    {fuelEuStats.totalFuelConsumptionMt.toLocaleString()} <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>MT</Typography>
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Avg GHG Intensity
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mt: 0.5 }}>
                    {fuelEuStats.avgGhgIntensity}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Compliant
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#4ade80', fontWeight: 600, mt: 0.5 }}>
                    {fuelEuStats.compliantCount} / {fuelEuStats.totalCertificates}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Unique Vessels
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mt: 0.5 }}>
                    {fuelEuStats.uniqueVessels}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Reporting Period
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mt: 0.5 }}>
                    {fuelEuStats.latestReportingPeriod || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(!hbeStats || hbeStats.totalCertificates === 0) &&
         (!safStats || safStats.totalCertificates === 0) &&
         (!fuelEuStats || fuelEuStats.totalCertificates === 0) && (
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                No sources yet
              </Typography>
              <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                Upload certificates to see your source statistics
              </Typography>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  )
}
