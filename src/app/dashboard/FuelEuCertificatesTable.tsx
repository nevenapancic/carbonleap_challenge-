'use client'

import { useState, useTransition, useMemo } from 'react'
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

// Define all optional columns that can be hidden
const optionalColumns = [
  'voyage_id', 'distance_nm', 'time_at_sea_hours', 'time_at_berth_hours',
  'fuel_consumption_sea_mt', 'fuel_consumption_berth_mt', 'lower_calorific_value_mj_kg',
  'energy_consumption_mj', 'wtt_emission_factor', 'ttw_emission_factor',
  'total_co2eq_emissions_mt', 'methane_slip_gch4_kwh', 'n2o_emissions_gn2o_kwh',
  'compliance_balance', 'certification_scheme', 'pos_number', 'feedstock_type',
  'e_value_gco2eq_mj', 'pool_id', 'banking_balance', 'borrowing_amount',
  'shore_power_mwh', 'verifier_name'
] as const

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
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Calculate which optional columns have at least one value
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
    fetchPage(1, perPage, column, newDirection)
  }

  const SortableHeader = ({ column, label }: { column: string; label: string }) => {
    if (!isColumnVisible(column)) return null
    return (
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
            <ArrowUpwardIcon sx={{ fontSize: 12, color: sortColumn === column && sortDirection === 'asc' ? '#22d3ee' : 'grey.700', mb: -0.5 }} />
            <ArrowDownwardIcon sx={{ fontSize: 12, color: sortColumn === column && sortDirection === 'desc' ? '#22d3ee' : 'grey.700', mt: -0.5 }} />
          </Box>
        </Box>
      </TableCell>
    )
  }

  const fetchPage = (page: number, itemsPerPage: number, sortCol?: string | null, sortDir?: 'asc' | 'desc') => {
    const col = sortCol !== undefined ? sortCol : sortColumn
    const dir = sortDir !== undefined ? sortDir : sortDirection
    startTransition(async () => {
      const result = await getPaginatedFuelEuCertificates(sourceId, companyId, page, itemsPerPage, col, dir)
      setCertificates(result.certificates)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
      setCurrentPage(page)
      setPerPage(itemsPerPage)
    })
  }

  const handlePageChange = (page: number) => fetchPage(page, perPage)
  const handlePerPageChange = (newPerPage: number) => fetchPage(1, newPerPage)

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

  if (certificates.length === 0 && !isPending) return null

  const startItem = (currentPage - 1) * perPage + 1
  const endItem = Math.min(currentPage * perPage, totalCount)
  const cellSx = { color: 'grey.300', borderColor: 'divider', whiteSpace: 'nowrap', fontSize: '0.8rem' }

  const Cell = ({ column, children }: { column: string; children: React.ReactNode }) => {
    if (!isColumnVisible(column)) return null
    return <TableCell sx={cellSx}>{children}</TableCell>
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {isPending && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: 1 }}>
          <CircularProgress sx={{ color: '#22d3ee' }} />
        </Box>
      )}

      <TableContainer sx={{ '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-track': { bgcolor: 'transparent' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.800', borderRadius: 4 }, '&::-webkit-scrollbar-thumb:hover': { bgcolor: 'grey.700' } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'grey.500', borderColor: 'divider', whiteSpace: 'nowrap', width: 80, position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>Actions</TableCell>
              <SortableHeader column="certificate_id" label="Certificate ID" />
              <SortableHeader column="reporting_period" label="Period" />
              <SortableHeader column="imo_number" label="IMO Number" />
              <SortableHeader column="ship_name" label="Ship Name" />
              <SortableHeader column="ship_type" label="Ship Type" />
              <SortableHeader column="flag_state" label="Flag State" />
              <SortableHeader column="gross_tonnage" label="Gross Tonnage" />
              <SortableHeader column="shipowner_company" label="Shipowner" />
              <SortableHeader column="voyage_id" label="Voyage ID" />
              <SortableHeader column="port_of_departure" label="Port Departure" />
              <SortableHeader column="port_of_arrival" label="Port Arrival" />
              <SortableHeader column="departure_date" label="Departure Date" />
              <SortableHeader column="arrival_date" label="Arrival Date" />
              <SortableHeader column="voyage_type" label="Voyage Type" />
              <SortableHeader column="distance_nm" label="Distance (NM)" />
              <SortableHeader column="time_at_sea_hours" label="Time at Sea (h)" />
              <SortableHeader column="time_at_berth_hours" label="Time at Berth (h)" />
              <SortableHeader column="fuel_type" label="Fuel Type" />
              <SortableHeader column="fuel_category" label="Fuel Category" />
              <SortableHeader column="fuel_consumption_sea_mt" label="Fuel Sea (MT)" />
              <SortableHeader column="fuel_consumption_berth_mt" label="Fuel Berth (MT)" />
              <SortableHeader column="total_fuel_consumption_mt" label="Total Fuel (MT)" />
              <SortableHeader column="lower_calorific_value_mj_kg" label="LCV (MJ/kg)" />
              <SortableHeader column="energy_consumption_mj" label="Energy (MJ)" />
              <SortableHeader column="wtt_emission_factor" label="WTT Factor" />
              <SortableHeader column="ttw_emission_factor" label="TTW Factor" />
              <SortableHeader column="wtw_emission_factor" label="WTW Factor" />
              <SortableHeader column="ghg_intensity_gco2eq_mj" label="GHG Intensity" />
              <SortableHeader column="total_co2eq_emissions_mt" label="Total CO2eq (MT)" />
              <SortableHeader column="methane_slip_gch4_kwh" label="Methane Slip" />
              <SortableHeader column="n2o_emissions_gn2o_kwh" label="N2O Emissions" />
              <SortableHeader column="target_ghg_intensity" label="Target GHG" />
              <SortableHeader column="compliance_balance" label="Compliance Balance" />
              <SortableHeader column="compliance_status" label="Compliance" />
              <SortableHeader column="rfnbo_subtarget_met" label="RFNBO Met" />
              <SortableHeader column="certification_scheme" label="Cert. Scheme" />
              <SortableHeader column="pos_number" label="POS Number" />
              <SortableHeader column="feedstock_type" label="Feedstock" />
              <SortableHeader column="e_value_gco2eq_mj" label="E-Value" />
              <SortableHeader column="multiplier" label="Multiplier" />
              <SortableHeader column="pool_id" label="Pool ID" />
              <SortableHeader column="banking_balance" label="Banking Balance" />
              <SortableHeader column="borrowing_amount" label="Borrowing" />
              <SortableHeader column="ops_connected" label="OPS Connected" />
              <SortableHeader column="ops_exception_applied" label="OPS Exception" />
              <SortableHeader column="shore_power_mwh" label="Shore Power (MWh)" />
              <SortableHeader column="verifier_name" label="Verifier" />
              <SortableHeader column="verification_status" label="Verification" />
              <SortableHeader column="document_of_compliance_issued" label="DoC Issued" />
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
                  <TableCell sx={{ borderColor: 'divider', whiteSpace: 'nowrap', position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                    <IconButton size="small" onClick={() => handleEditClick(cert)} sx={{ color: '#22d3ee', '&:hover': { bgcolor: '#22d3ee20' } }}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDeleteClick(cert)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#ef444420' } }}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                  <TableCell sx={{ ...cellSx, color: 'white' }}>{cert.certificate_id}</TableCell>
                  <TableCell sx={cellSx}>{cert.reporting_period}</TableCell>
                  <TableCell sx={{ ...cellSx, fontFamily: 'monospace' }}>{cert.imo_number}</TableCell>
                  <TableCell sx={{ ...cellSx, color: 'white' }}>{cert.ship_name}</TableCell>
                  <TableCell sx={cellSx}>{cert.ship_type}</TableCell>
                  <TableCell sx={cellSx}>{cert.flag_state}</TableCell>
                  <TableCell sx={cellSx}>{cert.gross_tonnage.toLocaleString()}</TableCell>
                  <TableCell sx={cellSx}>{cert.shipowner_company}</TableCell>
                  <Cell column="voyage_id">{cert.voyage_id || '-'}</Cell>
                  <TableCell sx={cellSx}>{cert.port_of_departure}</TableCell>
                  <TableCell sx={cellSx}>{cert.port_of_arrival}</TableCell>
                  <TableCell sx={cellSx}>{cert.departure_date}</TableCell>
                  <TableCell sx={cellSx}>{cert.arrival_date}</TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip label={voyageInfo.label} size="small" sx={{ bgcolor: `${voyageInfo.color}20`, color: voyageInfo.color, fontSize: '0.65rem' }} />
                  </TableCell>
                  <Cell column="distance_nm">{cert.distance_nm ?? '-'}</Cell>
                  <Cell column="time_at_sea_hours">{cert.time_at_sea_hours ?? '-'}</Cell>
                  <Cell column="time_at_berth_hours">{cert.time_at_berth_hours ?? '-'}</Cell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip label={fuelTypeInfo.label} size="small" sx={{ bgcolor: `${fuelTypeInfo.color}20`, color: fuelTypeInfo.color, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip label={fuelCategoryInfo.label} size="small" sx={{ bgcolor: `${fuelCategoryInfo.color}20`, color: fuelCategoryInfo.color, fontSize: '0.7rem' }} />
                  </TableCell>
                  <Cell column="fuel_consumption_sea_mt">{cert.fuel_consumption_sea_mt?.toFixed(2) ?? '-'}</Cell>
                  <Cell column="fuel_consumption_berth_mt">{cert.fuel_consumption_berth_mt?.toFixed(2) ?? '-'}</Cell>
                  <TableCell sx={cellSx}>{cert.total_fuel_consumption_mt.toFixed(2)}</TableCell>
                  <Cell column="lower_calorific_value_mj_kg">{cert.lower_calorific_value_mj_kg?.toFixed(2) ?? '-'}</Cell>
                  <Cell column="energy_consumption_mj">{cert.energy_consumption_mj?.toLocaleString() ?? '-'}</Cell>
                  <Cell column="wtt_emission_factor">{cert.wtt_emission_factor?.toFixed(2) ?? '-'}</Cell>
                  <Cell column="ttw_emission_factor">{cert.ttw_emission_factor?.toFixed(2) ?? '-'}</Cell>
                  <TableCell sx={cellSx}>{cert.wtw_emission_factor.toFixed(2)}</TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip label={cert.ghg_intensity_gco2eq_mj.toFixed(1)} size="small" sx={{ bgcolor: cert.ghg_intensity_gco2eq_mj <= cert.target_ghg_intensity ? '#4ade8020' : '#ef444420', color: cert.ghg_intensity_gco2eq_mj <= cert.target_ghg_intensity ? '#4ade80' : '#ef4444', fontSize: '0.7rem' }} />
                  </TableCell>
                  <Cell column="total_co2eq_emissions_mt">{cert.total_co2eq_emissions_mt?.toFixed(2) ?? '-'}</Cell>
                  <Cell column="methane_slip_gch4_kwh">{cert.methane_slip_gch4_kwh?.toFixed(4) ?? '-'}</Cell>
                  <Cell column="n2o_emissions_gn2o_kwh">{cert.n2o_emissions_gn2o_kwh?.toFixed(4) ?? '-'}</Cell>
                  <TableCell sx={cellSx}>{cert.target_ghg_intensity.toFixed(2)}</TableCell>
                  <Cell column="compliance_balance">{cert.compliance_balance?.toFixed(2) ?? '-'}</Cell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip label={complianceInfo.label} size="small" sx={{ bgcolor: `${complianceInfo.color}20`, color: complianceInfo.color, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip label={cert.rfnbo_subtarget_met ? 'Yes' : 'No'} size="small" sx={{ bgcolor: cert.rfnbo_subtarget_met ? '#4ade8020' : '#6b728020', color: cert.rfnbo_subtarget_met ? '#4ade80' : '#6b7280', fontSize: '0.7rem' }} />
                  </TableCell>
                  <Cell column="certification_scheme">{cert.certification_scheme || '-'}</Cell>
                  <Cell column="pos_number">{cert.pos_number || '-'}</Cell>
                  <Cell column="feedstock_type">{cert.feedstock_type || '-'}</Cell>
                  <Cell column="e_value_gco2eq_mj">{cert.e_value_gco2eq_mj?.toFixed(2) ?? '-'}</Cell>
                  <TableCell sx={cellSx}>{cert.multiplier.toFixed(1)}</TableCell>
                  <Cell column="pool_id">{cert.pool_id || '-'}</Cell>
                  <Cell column="banking_balance">{cert.banking_balance?.toFixed(2) ?? '-'}</Cell>
                  <Cell column="borrowing_amount">{cert.borrowing_amount?.toFixed(2) ?? '-'}</Cell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip label={cert.ops_connected ? 'Yes' : 'No'} size="small" sx={{ bgcolor: cert.ops_connected ? '#4ade8020' : '#6b728020', color: cert.ops_connected ? '#4ade80' : '#6b7280', fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip label={cert.ops_exception_applied ? 'Yes' : 'No'} size="small" sx={{ bgcolor: cert.ops_exception_applied ? '#f59e0b20' : '#6b728020', color: cert.ops_exception_applied ? '#f59e0b' : '#6b7280', fontSize: '0.7rem' }} />
                  </TableCell>
                  <Cell column="shore_power_mwh">{cert.shore_power_mwh?.toFixed(2) ?? '-'}</Cell>
                  <Cell column="verifier_name">{cert.verifier_name || '-'}</Cell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip label={cert.verification_status} size="small" sx={{ bgcolor: cert.verification_status === 'verified' ? '#4ade8020' : '#f59e0b20', color: cert.verification_status === 'verified' ? '#4ade80' : '#f59e0b', fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell sx={{ borderColor: 'divider' }}>
                    <Chip label={cert.document_of_compliance_issued ? 'Yes' : 'No'} size="small" sx={{ bgcolor: cert.document_of_compliance_issued ? '#4ade8020' : '#6b728020', color: cert.document_of_compliance_issued ? '#4ade80' : '#6b7280', fontSize: '0.7rem' }} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {totalCount > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ color: 'grey.500', fontSize: '0.875rem' }}>
            Showing {startItem}-{endItem} of {totalCount} certificates
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: 'grey.500', fontSize: '0.875rem' }}>Per page:</Typography>
              <Select value={perPage} onChange={(e) => handlePerPageChange(e.target.value as number)} size="small" variant="standard" disableUnderline disabled={isPending} sx={{ color: 'white', '.MuiSelect-select': { py: 0.5, px: 1 }, '.MuiSvgIcon-root': { color: 'grey.400' } }} MenuProps={{ slotProps: { paper: { sx: { bgcolor: 'background.paper' } } } }}>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={15}>15</MenuItem>
              </Select>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button size="small" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isPending} sx={{ color: 'grey.400', minWidth: 'auto', '&:disabled': { color: 'grey.700' } }}>&larr;</Button>
              {(() => {
                const maxVisible = 3
                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
                const endPage = Math.min(totalPages, startPage + maxVisible - 1)
                if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1)
                return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
                  <Button key={page} size="small" onClick={() => handlePageChange(page)} disabled={isPending} sx={{ minWidth: 36, bgcolor: page === currentPage ? '#22d3ee20' : 'transparent', color: page === currentPage ? '#22d3ee' : 'grey.400', border: page === currentPage ? '1px solid #22d3ee40' : 'none', '&:hover': { bgcolor: '#22d3ee10' } }}>{page}</Button>
                ))
              })()}
              <Button size="small" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isPending} sx={{ color: 'grey.400', minWidth: 'auto', '&:disabled': { color: 'grey.700' } }}>&rarr;</Button>
              <Typography sx={{ color: 'grey.500', ml: 1, fontSize: '0.875rem' }}>Page {currentPage} of {totalPages}</Typography>
            </Box>
          </Box>
        </Box>
      )}

      <DeleteConfirmationDialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setSelectedCertificate(null) }} onConfirm={handleDeleteConfirm} certificateId={selectedCertificate?.certificate_id || ''} isDeleting={isDeleting} />
      {selectedCertificate && (
        <EditFuelEuCertificateModal open={editModalOpen} onClose={() => { setEditModalOpen(false); setSelectedCertificate(null) }} onSave={handleSave} certificate={selectedCertificate} isSaving={isSaving} />
      )}
    </Box>
  )
}
