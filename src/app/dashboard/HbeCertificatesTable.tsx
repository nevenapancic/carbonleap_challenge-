'use client'

import { useState, useTransition, useMemo, useCallback, useEffect, useRef } from 'react'
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
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import type { HbeCertificateData } from '@/lib/types/database'
import { getPaginatedCertificates, deleteHbeCertificate, updateHbeCertificate } from './actions'
import DeleteConfirmationDialog from './DeleteConfirmationDialog'
import EditHbeCertificateModal from './EditHbeCertificateModal'

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

type Props = {
  sourceId: string
  companyId: string
  initialCertificates: (HbeCertificateData & { id: string })[]
  initialTotalCount: number
  initialTotalPages: number
}

export default function HbeCertificatesTable({
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
  const [selectedCertificate, setSelectedCertificate] = useState<(HbeCertificateData & { id: string }) | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value)
    }, 300)
  }, [])

  // Trigger search when searchQuery changes
  useEffect(() => {
    fetchPage(1, perPage, sortColumn, sortDirection, searchQuery)
  }, [searchQuery])

  const clearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
  }

  // Optional columns that should be hidden if all values are empty
  const optionalColumns = [
    'pos_number',
    'booking_date',
    'supplier_name',
    'rev_account_id',
  ] as const

  // Calculate which optional columns have data
  const visibleOptionalColumns = useMemo(() => {
    const visible = new Set<string>()
    for (const cert of certificates) {
      for (const col of optionalColumns) {
        const value = cert[col as keyof typeof cert]
        if (value !== null && value !== undefined && value !== '') {
          visible.add(col)
        }
      }
    }
    return visible
  }, [certificates])

  const isColumnVisible = (col: string) => {
    if (!optionalColumns.includes(col as typeof optionalColumns[number])) return true
    return visibleOptionalColumns.has(col)
  }

  const handleSort = (column: string) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortColumn(column)
    setSortDirection(newDirection)
    fetchPage(1, perPage, column, newDirection, searchQuery)
  }

  const SortableHeader = ({ column, label }: { column: string; label: string }) => {
    if (!isColumnVisible(column)) return null
    return (
      <TableCell
        sx={{
          color: 'text.secondary',
          borderColor: 'divider',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { color: 'text.primary' },
        }}
        onClick={() => handleSort(column)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {label}
          <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5 }}>
            <ArrowUpwardIcon
              sx={{
                fontSize: 12,
                color: sortColumn === column && sortDirection === 'asc' ? '#4ade80' : 'grey.700',
                mb: -0.5,
              }}
            />
            <ArrowDownwardIcon
              sx={{
                fontSize: 12,
                color: sortColumn === column && sortDirection === 'desc' ? '#4ade80' : 'grey.700',
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </TableCell>
    )
  }

  // Cell component that conditionally renders based on column visibility
  const Cell = ({ column, children, sx: cellSx }: { column: string; children: React.ReactNode; sx?: object }) => {
    if (!isColumnVisible(column)) return null
    return <TableCell sx={{ borderColor: 'divider', ...cellSx }}>{children}</TableCell>
  }

  const fetchPage = (page: number, itemsPerPage: number, sortCol?: string | null, sortDir?: 'asc' | 'desc', search?: string) => {
    const col = sortCol !== undefined ? sortCol : sortColumn
    const dir = sortDir !== undefined ? sortDir : sortDirection
    const searchTerm = search !== undefined ? search : searchQuery
    startTransition(async () => {
      const result = await getPaginatedCertificates(sourceId, companyId, page, itemsPerPage, col, dir, searchTerm)
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

  const handleEditClick = (cert: HbeCertificateData & { id: string }) => {
    setSelectedCertificate(cert)
    setEditModalOpen(true)
  }

  const handleDeleteClick = (cert: HbeCertificateData & { id: string }) => {
    setSelectedCertificate(cert)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCertificate) return
    setIsDeleting(true)
    const result = await deleteHbeCertificate(selectedCertificate.id)
    setIsDeleting(false)
    if (result.success) {
      setDeleteDialogOpen(false)
      setSelectedCertificate(null)
      fetchPage(currentPage, perPage)
    }
  }

  const handleSave = async (data: Partial<HbeCertificateData>) => {
    if (!selectedCertificate) return
    setIsSaving(true)
    const result = await updateHbeCertificate(selectedCertificate.id, data)
    setIsSaving(false)
    if (result.success) {
      setEditModalOpen(false)
      setSelectedCertificate(null)
      fetchPage(currentPage, perPage)
    }
  }

  // Only hide the entire component if there are no certificates initially and no search is active
  if (certificates.length === 0 && !isPending && !searchQuery && initialTotalCount === 0) {
    return null
  }

  const hasNoResults = certificates.length === 0 && !isPending

  const startItem = (currentPage - 1) * perPage + 1
  const endItem = Math.min(currentPage * perPage, totalCount)

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Search Input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search certificates..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          sx={{
            width: 250,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
              '& fieldset': { borderColor: 'divider' },
              '&:hover fieldset': { borderColor: 'grey.600' },
              '&.Mui-focused fieldset': { borderColor: '#4ade80' },
            },
            '& .MuiInputBase-input': {
              color: 'text.primary',
              fontSize: '0.875rem',
              '&::placeholder': { color: 'text.secondary', opacity: 1 },
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'grey.500', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={clearSearch} sx={{ color: 'grey.500' }}>
                    <ClearIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
      </Box>

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
          <CircularProgress sx={{ color: '#4ade80' }} />
        </Box>
      )}

      {hasNoResults ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography sx={{ color: 'grey.500' }}>
            No certificates found{searchQuery ? ` for "${searchQuery}"` : ''}
          </Typography>
        </Box>
      ) : (
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
              <TableCell sx={{ color: 'text.secondary', borderColor: 'divider', whiteSpace: 'nowrap', width: 80, position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>Actions</TableCell>
              <SortableHeader column="certificate_id" label="Certificate ID" />
              <SortableHeader column="hbe_type" label="Type" />
              <SortableHeader column="energy_delivered_gj" label="Energy (GJ)" />
              <SortableHeader column="hbes_issued" label="HBEs Issued" />
              <SortableHeader column="ghg_reduction_percentage" label="GHG Reduction" />
              <SortableHeader column="double_counting" label="Double Counting" />
              <SortableHeader column="multiplier" label="Multiplier" />
              <SortableHeader column="feedstock" label="Feedstock" />
              <SortableHeader column="nta8003_code" label="NTA8003" />
              <SortableHeader column="production_country" label="Country" />
              <SortableHeader column="sustainability_scheme" label="Certification" />
              <SortableHeader column="pos_number" label="PoS Number" />
              <SortableHeader column="delivery_date" label="Delivery Date" />
              <SortableHeader column="booking_date" label="Booking Date" />
              <SortableHeader column="transport_sector" label="Sector" />
              <SortableHeader column="supplier_name" label="Supplier" />
              <SortableHeader column="rev_account_id" label="REV Account" />
              <SortableHeader column="verification_status" label="Status" />
            </TableRow>
          </TableHead>
          <TableBody>
            {certificates.map((cert) => {
              const typeInfo = hbeTypeLabels[cert.hbe_type] || { label: cert.hbe_type, color: '#6b7280' }
              return (
                <TableRow key={cert.id}>
                  <TableCell sx={{ borderColor: 'divider', whiteSpace: 'nowrap', position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                    <IconButton size="small" onClick={() => handleEditClick(cert)} sx={{ color: '#4ade80', '&:hover': { bgcolor: '#4ade8020' } }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteClick(cert)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#ef444420' } }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell sx={{ color: 'text.primary', borderColor: 'divider', whiteSpace: 'nowrap' }}>
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
                  <TableCell sx={{ color: 'text.primary', borderColor: 'divider' }}>
                    {cert.energy_delivered_gj}
                  </TableCell>
                  <TableCell sx={{ color: 'text.primary', borderColor: 'divider' }}>
                    {cert.hbes_issued}
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
                  <TableCell sx={{ color: 'text.primary', borderColor: 'divider' }}>
                    {cert.multiplier}x
                  </TableCell>
                  <TableCell sx={{ color: 'text.primary', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {cert.feedstock}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', borderColor: 'divider', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {cert.nta8003_code}
                  </TableCell>
                  <TableCell sx={{ color: 'text.primary', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {cert.production_country}
                  </TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip
                      label={cert.sustainability_scheme}
                      size="small"
                      sx={{
                        bgcolor: '#3b82f620',
                        color: '#3b82f6',
                        fontSize: '0.65rem',
                      }}
                    />
                  </TableCell>
                  <Cell column="pos_number" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                    {cert.pos_number}
                  </Cell>
                  <TableCell sx={{ color: 'text.primary', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {cert.delivery_date}
                  </TableCell>
                  <Cell column="booking_date" sx={{ color: 'text.primary', whiteSpace: 'nowrap' }}>
                    {cert.booking_date}
                  </Cell>
                  <TableCell sx={{ color: 'text.primary', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {transportSectorLabels[cert.transport_sector] || cert.transport_sector}
                  </TableCell>
                  <Cell column="supplier_name" sx={{ color: 'text.primary', whiteSpace: 'nowrap' }}>
                    {cert.supplier_name}
                  </Cell>
                  <Cell column="rev_account_id" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {cert.rev_account_id}
                  </Cell>
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
                  color: 'text.primary',
                  '.MuiSelect-select': { py: 0.5, px: 1 },
                  '.MuiSvgIcon-root': { color: 'text.secondary' },
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
                      bgcolor: page === currentPage ? '#4ade8020' : 'transparent',
                      color: page === currentPage ? '#4ade80' : 'grey.400',
                      border: page === currentPage ? '1px solid #4ade8040' : 'none',
                      '&:hover': { bgcolor: '#4ade8010' },
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
        <EditHbeCertificateModal
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
