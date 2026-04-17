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
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import type { SafCertificateData } from '@/lib/types/database'
import { getPaginatedSafCertificates, deleteSafCertificate, updateSafCertificate } from './actions'
import DeleteConfirmationDialog from './DeleteConfirmationDialog'
import EditSafCertificateModal from './EditSafCertificateModal'

const pathwayLabels: Record<string, { label: string; color: string }> = {
  'HEFA': { label: 'HEFA', color: '#4ade80' },
  'FT': { label: 'Fischer-Tropsch', color: '#60a5fa' },
  'ATJ': { label: 'Alcohol-to-Jet', color: '#a78bfa' },
  'SIP': { label: 'SIP', color: '#fbbf24' },
  'PtL': { label: 'Power-to-Liquid', color: '#f472b6' },
  'CHJ': { label: 'CHJ', color: '#34d399' },
  'HC-HEFA': { label: 'HC-HEFA', color: '#22d3ee' },
  'Co-processing': { label: 'Co-processing', color: '#fb923c' },
  'Other': { label: 'Other', color: '#6b7280' },
}

const certSchemeLabels: Record<string, { label: string; color: string }> = {
  'ISCC-EU': { label: 'ISCC-EU', color: '#3b82f6' },
  'ISCC-CORSIA': { label: 'ISCC-CORSIA', color: '#8b5cf6' },
  'ISCC-PLUS': { label: 'ISCC-PLUS', color: '#6366f1' },
  'RSB-CORSIA': { label: 'RSB-CORSIA', color: '#14b8a6' },
  'RSB-EU-RED': { label: 'RSB-EU-RED', color: '#10b981' },
  'RSB-Global': { label: 'RSB-Global', color: '#059669' },
  'REDcert': { label: 'REDcert', color: '#f59e0b' },
  '2BSvs': { label: '2BSvs', color: '#ef4444' },
  'Other': { label: 'Other', color: '#6b7280' },
}

const statusLabels: Record<string, { label: string; color: string }> = {
  'active': { label: 'Active', color: '#4ade80' },
  'retired': { label: 'Retired', color: '#6b7280' },
  'expired': { label: 'Expired', color: '#ef4444' },
  'cancelled': { label: 'Cancelled', color: '#f59e0b' },
}

type Props = {
  sourceId: string
  companyId: string
  initialCertificates: (SafCertificateData & { id: string })[]
  initialTotalCount: number
  initialTotalPages: number
}

export default function SafCertificatesTable({
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
  const [selectedCertificate, setSelectedCertificate] = useState<(SafCertificateData & { id: string }) | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (column: string) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortColumn(column)
    setSortDirection(newDirection)
    fetchPage(1, perPage, column, newDirection)
  }

  const SortableHeader = ({ column, label }: { column: string; label: string }) => (
    <TableCell
      sx={{
        color: 'grey.500',
        borderColor: 'divider',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover': { color: 'grey.300' },
      }}
      onClick={() => handleSort(column)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {label}
        <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5 }}>
          <ArrowUpwardIcon
            sx={{
              fontSize: 12,
              color: sortColumn === column && sortDirection === 'asc' ? '#60a5fa' : 'grey.700',
              mb: -0.5,
            }}
          />
          <ArrowDownwardIcon
            sx={{
              fontSize: 12,
              color: sortColumn === column && sortDirection === 'desc' ? '#60a5fa' : 'grey.700',
              mt: -0.5,
            }}
          />
        </Box>
      </Box>
    </TableCell>
  )

  const fetchPage = (page: number, itemsPerPage: number, sortCol?: string | null, sortDir?: 'asc' | 'desc') => {
    const col = sortCol !== undefined ? sortCol : sortColumn
    const dir = sortDir !== undefined ? sortDir : sortDirection
    startTransition(async () => {
      const result = await getPaginatedSafCertificates(sourceId, companyId, page, itemsPerPage, col, dir)
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

  const handleEditClick = (cert: SafCertificateData & { id: string }) => {
    setSelectedCertificate(cert)
    setEditModalOpen(true)
  }

  const handleDeleteClick = (cert: SafCertificateData & { id: string }) => {
    setSelectedCertificate(cert)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCertificate) return
    setIsDeleting(true)
    const result = await deleteSafCertificate(selectedCertificate.id)
    setIsDeleting(false)
    if (result.success) {
      setDeleteDialogOpen(false)
      setSelectedCertificate(null)
      fetchPage(currentPage, perPage)
    }
  }

  const handleSave = async (data: Partial<SafCertificateData>) => {
    if (!selectedCertificate) return
    setIsSaving(true)
    const result = await updateSafCertificate(selectedCertificate.id, data)
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
          <CircularProgress sx={{ color: '#60a5fa' }} />
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
              <SortableHeader column="certificate_id" label="Certificate ID" />
              <SortableHeader column="production_pathway" label="Pathway" />
              <SortableHeader column="volume_mt" label="Volume (MT)" />
              <SortableHeader column="volume_liters" label="Volume (L)" />
              <SortableHeader column="ghg_reduction_percentage" label="GHG Reduction" />
              <SortableHeader column="feedstock_type" label="Feedstock" />
              <SortableHeader column="feedstock_country" label="Feedstock Country" />
              <SortableHeader column="producer_name" label="Producer" />
              <SortableHeader column="production_country" label="Production Country" />
              <SortableHeader column="certification_scheme" label="Certification" />
              <SortableHeader column="corsia_eligible" label="CORSIA" />
              <SortableHeader column="eu_red_compliant" label="EU RED" />
              <SortableHeader column="pos_number" label="PoS Number" />
              <SortableHeader column="issuance_date" label="Issuance Date" />
              <SortableHeader column="delivery_date" label="Delivery Date" />
              <SortableHeader column="airline_name" label="Airline" />
              <SortableHeader column="certificate_status" label="Status" />
              <SortableHeader column="verification_status" label="Verification" />
            </TableRow>
          </TableHead>
          <TableBody>
            {certificates.map((cert) => {
              const pathwayInfo = pathwayLabels[cert.production_pathway] || { label: cert.production_pathway, color: '#6b7280' }
              const schemeInfo = certSchemeLabels[cert.certification_scheme] || { label: cert.certification_scheme, color: '#6b7280' }
              const statusInfo = statusLabels[cert.certificate_status] || { label: cert.certificate_status, color: '#6b7280' }
              return (
                <TableRow key={cert.id}>
                  <TableCell sx={{ borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditClick(cert)}
                      sx={{ color: '#60a5fa', '&:hover': { bgcolor: '#60a5fa20' } }}
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
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip
                      label={pathwayInfo.label}
                      size="small"
                      sx={{
                        bgcolor: `${pathwayInfo.color}20`,
                        color: pathwayInfo.color,
                        border: `1px solid ${pathwayInfo.color}40`,
                        fontSize: '0.7rem',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderColor: 'divider' }}>
                    {cert.volume_mt.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderColor: 'divider' }}>
                    {cert.volume_liters.toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip
                      label={`${cert.ghg_reduction_percentage}%`}
                      size="small"
                      sx={{
                        bgcolor: cert.ghg_reduction_percentage >= 65 ? '#4ade8020' : '#f59e0b20',
                        color: cert.ghg_reduction_percentage >= 65 ? '#4ade80' : '#f59e0b',
                        fontSize: '0.7rem',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {cert.feedstock_type}
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {cert.feedstock_country}
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {cert.producer_name}
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {cert.production_country}
                  </TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip
                      label={schemeInfo.label}
                      size="small"
                      sx={{
                        bgcolor: `${schemeInfo.color}20`,
                        color: schemeInfo.color,
                        fontSize: '0.65rem',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip
                      label={cert.corsia_eligible ? 'Yes' : 'No'}
                      size="small"
                      sx={{
                        bgcolor: cert.corsia_eligible ? '#4ade8020' : '#6b728020',
                        color: cert.corsia_eligible ? '#4ade80' : '#6b7280',
                        fontSize: '0.7rem',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip
                      label={cert.eu_red_compliant ? 'Yes' : 'No'}
                      size="small"
                      sx={{
                        bgcolor: cert.eu_red_compliant ? '#4ade8020' : '#6b728020',
                        color: cert.eu_red_compliant ? '#4ade80' : '#6b7280',
                        fontSize: '0.7rem',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'grey.400', borderColor: 'divider', fontFamily: 'monospace', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                    {cert.pos_number}
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {cert.issuance_date}
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {cert.delivery_date}
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {cert.airline_name || '-'}
                  </TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip
                      label={statusInfo.label}
                      size="small"
                      sx={{
                        bgcolor: `${statusInfo.color}20`,
                        color: statusInfo.color,
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
                      bgcolor: page === currentPage ? '#60a5fa20' : 'transparent',
                      color: page === currentPage ? '#60a5fa' : 'grey.400',
                      border: page === currentPage ? '1px solid #60a5fa40' : 'none',
                      '&:hover': { bgcolor: '#60a5fa10' },
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
        <EditSafCertificateModal
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
