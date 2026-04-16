'use client'

import { useState, useTransition } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import type { FuelEuMaritimeCertificateData } from '@/lib/types/database'
import { getPaginatedFuelEuCertificates, deleteFuelEuCertificate, updateFuelEuCertificate } from './actions'
import DeleteConfirmationDialog from './DeleteConfirmationDialog'
import EditFuelEuCertificateModal from './EditFuelEuCertificateModal'

const fuelCategoryLabels: Record<string, { label: string; color: string }> = {
  'fossil': { label: 'Fossil', color: '#6b7280' },
  'biofuel': { label: 'Biofuel', color: '#4ade80' },
  'rfnbo': { label: 'RFNBO', color: '#60a5fa' },
  'recycled_carbon_fuel': { label: 'Recycled Carbon', color: '#a78bfa' },
  'low_carbon': { label: 'Low Carbon', color: '#34d399' },
}

const fuelTypeLabels: Record<string, { label: string; color: string }> = {
  'HFO': { label: 'HFO', color: '#6b7280' },
  'VLSFO': { label: 'VLSFO', color: '#9ca3af' },
  'LFO': { label: 'LFO', color: '#78716c' },
  'MGO': { label: 'MGO', color: '#a1a1aa' },
  'MDO': { label: 'MDO', color: '#71717a' },
  'LNG': { label: 'LNG', color: '#60a5fa' },
  'Methanol': { label: 'Methanol', color: '#34d399' },
  'Ethanol': { label: 'Ethanol', color: '#4ade80' },
  'Ammonia': { label: 'Ammonia', color: '#a78bfa' },
  'Hydrogen': { label: 'Hydrogen', color: '#22d3ee' },
  'Biodiesel': { label: 'Biodiesel', color: '#86efac' },
  'Bio-LNG': { label: 'Bio-LNG', color: '#93c5fd' },
  'Bio-Methanol': { label: 'Bio-Methanol', color: '#6ee7b7' },
  'E-Methanol': { label: 'E-Methanol', color: '#5eead4' },
  'E-LNG': { label: 'E-LNG', color: '#7dd3fc' },
  'E-Ammonia': { label: 'E-Ammonia', color: '#c4b5fd' },
  'E-Hydrogen': { label: 'E-Hydrogen', color: '#67e8f9' },
  'Other': { label: 'Other', color: '#d4d4d8' },
}

const complianceLabels: Record<string, { label: string; color: string }> = {
  'compliant': { label: 'Compliant', color: '#4ade80' },
  'non_compliant': { label: 'Non-Compliant', color: '#ef4444' },
  'pending': { label: 'Pending', color: '#f59e0b' },
  'banked': { label: 'Banked', color: '#60a5fa' },
  'pooled': { label: 'Pooled', color: '#a78bfa' },
}

const voyageTypeLabels: Record<string, { label: string; color: string }> = {
  'intra_eu': { label: 'Intra-EU', color: '#60a5fa' },
  'eu_to_third_country': { label: 'EU to Third', color: '#f59e0b' },
  'third_country_to_eu': { label: 'Third to EU', color: '#a78bfa' },
  'outermost_region': { label: 'Outermost', color: '#34d399' },
}

type Props = {
  sourceId: string
  companyId: string
  initialCertificates: (FuelEuMaritimeCertificateData & { id: string })[]
  initialTotalCount: number
  initialTotalPages: number
}

export default function FuelEuCertificatesTable({
  sourceId,
  companyId,
  initialCertificates,
  initialTotalCount,
  initialTotalPages,
}: Props) {
  const [certificates, setCertificates] = useState(initialCertificates)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(5)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [isPending, startTransition] = useTransition()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<(FuelEuMaritimeCertificateData & { id: string }) | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fetchPage = (page: number, itemsPerPage: number) => {
    startTransition(async () => {
      const result = await getPaginatedFuelEuCertificates(sourceId, companyId, page, itemsPerPage)
      setCertificates(result.certificates)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
      setCurrentPage(page)
      setPerPage(itemsPerPage)
    })
  }

  const handlePageChange = (page: number) => {
    fetchPage(page, perPage)
  }

  const handlePerPageChange = (newPerPage: number) => {
    fetchPage(1, newPerPage)
  }

  const handleEditClick = (cert: FuelEuMaritimeCertificateData & { id: string }) => {
    setSelectedCertificate(cert)
    setEditModalOpen(true)
  }

  const handleDeleteClick = (cert: FuelEuMaritimeCertificateData & { id: string }) => {
    setSelectedCertificate(cert)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCertificate) return
    setIsDeleting(true)
    const result = await deleteFuelEuCertificate(selectedCertificate.id)
    setIsDeleting(false)
    if (result.success) {
      setDeleteDialogOpen(false)
      setSelectedCertificate(null)
      fetchPage(currentPage, perPage)
    }
  }

  const handleSave = async (data: Partial<FuelEuMaritimeCertificateData>) => {
    if (!selectedCertificate) return
    setIsSaving(true)
    const result = await updateFuelEuCertificate(selectedCertificate.id, data)
    setIsSaving(false)
    if (result.success) {
      setEditModalOpen(false)
      setSelectedCertificate(null)
      fetchPage(currentPage, perPage)
    }
  }

  if (certificates.length === 0 && !isPending) {
    return null
  }

  const startItem = (currentPage - 1) * perPage + 1
  const endItem = Math.min(currentPage * perPage, totalCount)

  return (
    <Box sx={{ position: 'relative' }}>
      {isPending && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: 1,
          }}
        >
          <CircularProgress sx={{ color: '#22d3ee' }} />
        </Box>
      )}

      <TableContainer
        sx={{
          '&::-webkit-scrollbar': { height: 8 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.800', borderRadius: 4 },
          '&::-webkit-scrollbar-thumb:hover': { bgcolor: 'grey.700' },
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap', width: 80 }}>Actions</TableCell>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Certificate ID</TableCell>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Ship Name</TableCell>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>IMO Number</TableCell>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Voyage Type</TableCell>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Departure</TableCell>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Arrival</TableCell>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Fuel Type</TableCell>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Fuel Category</TableCell>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Fuel (MT)</TableCell>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>GHG Intensity</TableCell>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Target GHG</TableCell>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Compliance</TableCell>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Verification</TableCell>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap' }}>Period</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {certificates.map((cert) => {
              const fuelCategoryInfo = fuelCategoryLabels[cert.fuel_category] || { label: cert.fuel_category, color: '#6b7280' }
              const fuelTypeInfo = fuelTypeLabels[cert.fuel_type] || { label: cert.fuel_type, color: '#6b7280' }
              const complianceInfo = complianceLabels[cert.compliance_status] || { label: cert.compliance_status, color: '#6b7280' }
              const voyageInfo = voyageTypeLabels[cert.voyage_type] || { label: cert.voyage_type, color: '#6b7280' }
              return (
                <TableRow key={cert.id}>
                  <TableCell sx={{ borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditClick(cert)}
                      sx={{ color: '#22d3ee', '&:hover': { bgcolor: '#22d3ee20' } }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(cert)}
                      sx={{ color: '#ef4444', '&:hover': { bgcolor: '#ef444420' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {cert.certificate_id}
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {cert.ship_name}
                  </TableCell>
                  <TableCell sx={{ color: 'grey.400', borderColor: 'divider', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {cert.imo_number}
                  </TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip
                      label={voyageInfo.label}
                      size="small"
                      sx={{
                        bgcolor: `${voyageInfo.color}20`,
                        color: voyageInfo.color,
                        fontSize: '0.65rem',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                    <Box>{cert.port_of_departure}</Box>
                    <Box sx={{ color: 'grey.500', fontSize: '0.7rem' }}>{cert.departure_date}</Box>
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                    <Box>{cert.port_of_arrival}</Box>
                    <Box sx={{ color: 'grey.500', fontSize: '0.7rem' }}>{cert.arrival_date}</Box>
                  </TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip
                      label={fuelTypeInfo.label}
                      size="small"
                      sx={{
                        bgcolor: `${fuelTypeInfo.color}20`,
                        color: fuelTypeInfo.color,
                        fontSize: '0.7rem',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip
                      label={fuelCategoryInfo.label}
                      size="small"
                      sx={{
                        bgcolor: `${fuelCategoryInfo.color}20`,
                        color: fuelCategoryInfo.color,
                        fontSize: '0.7rem',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderColor: 'divider' }}>
                    {cert.total_fuel_consumption_mt.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip
                      label={`${cert.ghg_intensity_gco2eq_mj.toFixed(1)}`}
                      size="small"
                      sx={{
                        bgcolor: cert.ghg_intensity_gco2eq_mj <= cert.target_ghg_intensity ? '#4ade8020' : '#ef444420',
                        color: cert.ghg_intensity_gco2eq_mj <= cert.target_ghg_intensity ? '#4ade80' : '#ef4444',
                        fontSize: '0.7rem',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'grey.400', borderColor: 'divider', fontSize: '0.8rem' }}>
                    {cert.target_ghg_intensity.toFixed(1)}
                  </TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip
                      label={complianceInfo.label}
                      size="small"
                      sx={{
                        bgcolor: `${complianceInfo.color}20`,
                        color: complianceInfo.color,
                        fontSize: '0.7rem',
                      }}
                    />
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
                  <TableCell sx={{ color: 'white', borderColor: 'divider' }}>
                    {cert.reporting_period}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {totalCount > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 3,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ color: 'grey.500', fontSize: '0.875rem' }}>
            Showing {startItem}-{endItem} of {totalCount} certificates
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: 'grey.500', fontSize: '0.875rem' }}>
                Per page:
              </Typography>
              <Select
                value={perPage}
                onChange={(e) => handlePerPageChange(e.target.value as number)}
                size="small"
                variant="standard"
                disableUnderline
                disabled={isPending}
                sx={{
                  color: 'white',
                  '.MuiSelect-select': { py: 0.5, px: 1 },
                  '.MuiSvgIcon-root': { color: 'grey.400' },
                }}
                MenuProps={{
                  slotProps: {
                    paper: {
                      sx: { bgcolor: 'background.paper' }
                    }
                  }
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={15}>15</MenuItem>
              </Select>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isPending}
                sx={{ color: 'grey.400', minWidth: 'auto', '&:disabled': { color: 'grey.700' } }}
              >
                &larr;
              </Button>

              {(() => {
                const maxVisible = 3
                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
                const endPage = Math.min(totalPages, startPage + maxVisible - 1)
                if (endPage - startPage + 1 < maxVisible) {
                  startPage = Math.max(1, endPage - maxVisible + 1)
                }
                return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
                  <Button
                    key={page}
                    size="small"
                    onClick={() => handlePageChange(page)}
                    disabled={isPending}
                    sx={{
                      minWidth: 36,
                      bgcolor: page === currentPage ? '#22d3ee20' : 'transparent',
                      color: page === currentPage ? '#22d3ee' : 'grey.400',
                      border: page === currentPage ? '1px solid #22d3ee40' : 'none',
                      '&:hover': { bgcolor: '#22d3ee10' },
                    }}
                  >
                    {page}
                  </Button>
                ))
              })()}

              <Button
                size="small"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isPending}
                sx={{ color: 'grey.400', minWidth: 'auto', '&:disabled': { color: 'grey.700' } }}
              >
                &rarr;
              </Button>

              <Typography sx={{ color: 'grey.500', ml: 1, fontSize: '0.875rem' }}>
                Page {currentPage} of {totalPages}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setSelectedCertificate(null)
        }}
        onConfirm={handleDeleteConfirm}
        certificateId={selectedCertificate?.certificate_id || ''}
        isDeleting={isDeleting}
      />

      {selectedCertificate && (
        <EditFuelEuCertificateModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setSelectedCertificate(null)
          }}
          onSave={handleSave}
          certificate={selectedCertificate}
          isSaving={isSaving}
        />
      )}
    </Box>
  )
}
