/** @format */

'use client';

import {
  useState,
  useTransition,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import type { SafCertificateData } from '@/lib/types/database';
import {
  getPaginatedSafCertificates,
  deleteSafCertificate,
  updateSafCertificate,
} from './actions';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import EditSafCertificateModal from './EditSafCertificateModal';

const pathwayLabels: Record<string, { label: string; color: string }> = {
  HEFA: { label: 'HEFA', color: '#4ade80' },
  FT: { label: 'Fischer-Tropsch', color: '#60a5fa' },
  ATJ: { label: 'Alcohol-to-Jet', color: '#a78bfa' },
  SIP: { label: 'SIP', color: '#fbbf24' },
  PtL: { label: 'Power-to-Liquid', color: '#f472b6' },
  CHJ: { label: 'CHJ', color: '#34d399' },
  'HC-HEFA': { label: 'HC-HEFA', color: '#22d3ee' },
  'Co-processing': { label: 'Co-processing', color: '#fb923c' },
  Other: { label: 'Other', color: '#6b7280' },
};

const certSchemeLabels: Record<string, { label: string; color: string }> = {
  'ISCC-EU': { label: 'ISCC-EU', color: '#3b82f6' },
  'ISCC-CORSIA': { label: 'ISCC-CORSIA', color: '#8b5cf6' },
  'ISCC-PLUS': { label: 'ISCC-PLUS', color: '#6366f1' },
  'RSB-CORSIA': { label: 'RSB-CORSIA', color: '#14b8a6' },
  'RSB-EU-RED': { label: 'RSB-EU-RED', color: '#10b981' },
  'RSB-Global': { label: 'RSB-Global', color: '#059669' },
  REDcert: { label: 'REDcert', color: '#f59e0b' },
  '2BSvs': { label: '2BSvs', color: '#ef4444' },
  Other: { label: 'Other', color: '#6b7280' },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: '#4ade80' },
  retired: { label: 'Retired', color: '#6b7280' },
  expired: { label: 'Expired', color: '#ef4444' },
  cancelled: { label: 'Cancelled', color: '#f59e0b' },
};

const optionalColumns = [
  'batch_id',
  'energy_content_mj',
  'blend_percentage',
  'core_lca_value',
  'lifecycle_emissions_gco2e_mj',
  'astm_pathway',
  'production_facility',
  'certifying_body',
  'expiration_date',
  'airline_name',
  'destination_airport',
  'retirement_date',
  'retirement_beneficiary',
  'chain_of_custody_type',
  'supplier_name',
  'sustainability_tier',
] as const;

type Props = {
  sourceId: string;
  companyId: string;
  initialCertificates: (SafCertificateData & { id: string })[];
  initialTotalCount: number;
  initialTotalPages: number;
};

export default function SafCertificatesTable({
  sourceId,
  companyId,
  initialCertificates,
  initialTotalCount,
  initialTotalPages,
}: Props) {
  const [certificates, setCertificates] = useState(initialCertificates);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isPending, startTransition] = useTransition();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<
    (SafCertificateData & { id: string }) | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  }, []);

  useEffect(() => {
    fetchPage(1, perPage, sortColumn, sortDirection, searchQuery);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const visibleOptionalColumns = useMemo(() => {
    const visible = new Set<string>();
    for (const cert of certificates) {
      for (const col of optionalColumns) {
        const value = cert[col as keyof typeof cert];
        if (value !== null && value !== undefined && value !== '') {
          visible.add(col);
        }
      }
    }
    return visible;
  }, [certificates]);

  const isColumnVisible = (col: string) => {
    if (!optionalColumns.includes(col as (typeof optionalColumns)[number]))
      return true;
    return visibleOptionalColumns.has(col);
  };

  const handleSort = (column: string) => {
    const newDirection =
      sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    fetchPage(1, perPage, column, newDirection, searchQuery);
  };

  const SortableHeader = ({
    column,
    label,
  }: {
    column: string;
    label: string;
  }) => {
    if (!isColumnVisible(column)) return null;
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
                color:
                  sortColumn === column && sortDirection === 'asc'
                    ? '#60a5fa'
                    : 'grey.700',
                mb: -0.5,
              }}
            />
            <ArrowDownwardIcon
              sx={{
                fontSize: 12,
                color:
                  sortColumn === column && sortDirection === 'desc'
                    ? '#60a5fa'
                    : 'grey.700',
                mt: -0.5,
              }}
            />
          </Box>
        </Box>
      </TableCell>
    );
  };

  const fetchPage = (
    page: number,
    itemsPerPage: number,
    sortCol?: string | null,
    sortDir?: 'asc' | 'desc',
    search?: string,
  ) => {
    const col = sortCol !== undefined ? sortCol : sortColumn;
    const dir = sortDir !== undefined ? sortDir : sortDirection;
    const searchTerm = search !== undefined ? search : searchQuery;
    startTransition(async () => {
      const result = await getPaginatedSafCertificates(
        sourceId,
        companyId,
        page,
        itemsPerPage,
        col,
        dir,
        searchTerm,
      );
      setCertificates(result.certificates);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      setCurrentPage(page);
      setPerPage(itemsPerPage);
    });
  };

  const handlePageChange = (page: number) => fetchPage(page, perPage);
  const handlePerPageChange = (newPerPage: number) => fetchPage(1, newPerPage);

  const handleEditClick = (cert: SafCertificateData & { id: string }) => {
    setSelectedCertificate(cert);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (cert: SafCertificateData & { id: string }) => {
    setSelectedCertificate(cert);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCertificate) return;
    setIsDeleting(true);
    const result = await deleteSafCertificate(selectedCertificate.id);
    setIsDeleting(false);
    if (result.success) {
      setDeleteDialogOpen(false);
      setSelectedCertificate(null);
      fetchPage(currentPage, perPage);
    }
  };

  const handleSave = async (data: Partial<SafCertificateData>) => {
    if (!selectedCertificate) return;
    setIsSaving(true);
    const result = await updateSafCertificate(selectedCertificate.id, data);
    setIsSaving(false);
    if (result.success) {
      setEditModalOpen(false);
      setSelectedCertificate(null);
      fetchPage(currentPage, perPage);
    }
  };

  if (
    certificates.length === 0 &&
    !isPending &&
    !searchQuery &&
    initialTotalCount === 0
  )
    return null;

  const hasNoResults = certificates.length === 0 && !isPending;
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalCount);
  const cellSx = {
    color: 'text.secondary',
    borderColor: 'divider',
    whiteSpace: 'nowrap',
    fontSize: '0.8rem',
  };

  const Cell = ({
    column,
    children,
  }: {
    column: string;
    children: React.ReactNode;
  }) => {
    if (!isColumnVisible(column)) return null;
    return <TableCell sx={cellSx}>{children}</TableCell>;
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Search Input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          size='small'
          placeholder='Search certificates...'
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          sx={{
            width: 250,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
              '& fieldset': { borderColor: 'divider' },
              '&:hover fieldset': { borderColor: 'grey.600' },
              '&.Mui-focused fieldset': { borderColor: '#60a5fa' },
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
                <InputAdornment position='start'>
                  <SearchIcon sx={{ color: 'grey.500', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position='end'>
                  <IconButton
                    size='small'
                    onClick={clearSearch}
                    sx={{ color: 'grey.500' }}
                  >
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
          <CircularProgress sx={{ color: '#60a5fa' }} />
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
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'grey.800',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb:hover': { bgcolor: 'grey.700' },
          }}
        >
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    color: 'text.secondary',
                    borderColor: 'divider',
                    whiteSpace: 'nowrap',
                    width: 80,
                    position: 'sticky',
                    left: 0,
                    bgcolor: 'background.paper',
                    zIndex: 1,
                  }}
                >
                  Actions
                </TableCell>
                <SortableHeader
                  column='certificate_id'
                  label='Certificate ID'
                />
                <SortableHeader column='batch_id' label='Batch ID' />
                <SortableHeader column='pos_number' label='PoS Number' />
                <SortableHeader column='volume_liters' label='Volume (L)' />
                <SortableHeader column='volume_mt' label='Volume (MT)' />
                <SortableHeader
                  column='energy_content_mj'
                  label='Energy (MJ)'
                />
                <SortableHeader column='blend_percentage' label='Blend %' />
                <SortableHeader
                  column='ghg_reduction_percentage'
                  label='GHG Reduction'
                />
                <SortableHeader column='core_lca_value' label='Core LCA' />
                <SortableHeader
                  column='lifecycle_emissions_gco2e_mj'
                  label='Lifecycle Emissions'
                />
                <SortableHeader column='feedstock_type' label='Feedstock' />
                <SortableHeader
                  column='feedstock_country'
                  label='Feedstock Country'
                />
                <SortableHeader column='production_pathway' label='Pathway' />
                <SortableHeader column='astm_pathway' label='ASTM Pathway' />
                <SortableHeader column='producer_name' label='Producer' />
                <SortableHeader column='production_facility' label='Facility' />
                <SortableHeader
                  column='production_country'
                  label='Production Country'
                />
                <SortableHeader
                  column='certification_scheme'
                  label='Certification'
                />
                <SortableHeader
                  column='certifying_body'
                  label='Certifying Body'
                />
                <SortableHeader
                  column='verification_status'
                  label='Verification'
                />
                <SortableHeader column='corsia_eligible' label='CORSIA' />
                <SortableHeader column='eu_red_compliant' label='EU RED' />
                <SortableHeader column='issuance_date' label='Issuance Date' />
                <SortableHeader
                  column='expiration_date'
                  label='Expiration Date'
                />
                <SortableHeader column='delivery_date' label='Delivery Date' />
                <SortableHeader column='airline_name' label='Airline' />
                <SortableHeader
                  column='destination_airport'
                  label='Destination'
                />
                <SortableHeader column='certificate_status' label='Status' />
                <SortableHeader
                  column='retirement_date'
                  label='Retirement Date'
                />
                <SortableHeader
                  column='retirement_beneficiary'
                  label='Beneficiary'
                />
                <SortableHeader
                  column='chain_of_custody_type'
                  label='Chain of Custody'
                />
                <SortableHeader column='supplier_name' label='Supplier' />
                <SortableHeader column='sustainability_tier' label='Tier' />
              </TableRow>
            </TableHead>
            <TableBody>
              {certificates.map((cert) => {
                const pathwayInfo = pathwayLabels[cert.production_pathway] || {
                  label: cert.production_pathway,
                  color: '#6b7280',
                };
                const schemeInfo = certSchemeLabels[
                  cert.certification_scheme
                ] || { label: cert.certification_scheme, color: '#6b7280' };
                const statusInfo = statusLabels[cert.certificate_status] || {
                  label: cert.certificate_status,
                  color: '#6b7280',
                };
                return (
                  <TableRow key={cert.id}>
                    <TableCell
                      sx={{
                        borderColor: 'divider',
                        whiteSpace: 'nowrap',
                        position: 'sticky',
                        left: 0,
                        bgcolor: 'background.paper',
                        zIndex: 1,
                      }}
                    >
                      <IconButton
                        size='small'
                        onClick={() => handleEditClick(cert)}
                        sx={{
                          color: '#60a5fa',
                          '&:hover': { bgcolor: '#60a5fa20' },
                        }}
                      >
                        <EditIcon fontSize='small' />
                      </IconButton>
                      <IconButton
                        size='small'
                        onClick={() => handleDeleteClick(cert)}
                        sx={{
                          color: '#ef4444',
                          '&:hover': { bgcolor: '#ef444420' },
                        }}
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ ...cellSx, color: 'text.primary' }}>
                      {cert.certificate_id}
                    </TableCell>
                    <Cell column='batch_id'>{cert.batch_id || '-'}</Cell>
                    <TableCell
                      sx={{
                        ...cellSx,
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                      }}
                    >
                      {cert.pos_number}
                    </TableCell>
                    <TableCell sx={cellSx}>
                      {cert.volume_liters.toLocaleString()}
                    </TableCell>
                    <TableCell sx={cellSx}>
                      {cert.volume_mt.toFixed(2)}
                    </TableCell>
                    <Cell column='energy_content_mj'>
                      {cert.energy_content_mj?.toLocaleString() ?? '-'}
                    </Cell>
                    <Cell column='blend_percentage'>
                      {cert.blend_percentage != null
                        ? `${cert.blend_percentage}%`
                        : '-'}
                    </Cell>
                    <TableCell sx={{ borderColor: 'divider' }}>
                      <Chip
                        label={`${cert.ghg_reduction_percentage}%`}
                        size='small'
                        sx={{
                          bgcolor:
                            cert.ghg_reduction_percentage >= 65
                              ? '#4ade8020'
                              : '#f59e0b20',
                          color:
                            cert.ghg_reduction_percentage >= 65
                              ? '#4ade80'
                              : '#f59e0b',
                          fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                    <Cell column='core_lca_value'>
                      {cert.core_lca_value?.toFixed(2) ?? '-'}
                    </Cell>
                    <Cell column='lifecycle_emissions_gco2e_mj'>
                      {cert.lifecycle_emissions_gco2e_mj?.toFixed(2) ?? '-'}
                    </Cell>
                    <TableCell sx={cellSx}>{cert.feedstock_type}</TableCell>
                    <TableCell sx={cellSx}>{cert.feedstock_country}</TableCell>
                    <TableCell sx={{ borderColor: 'divider' }}>
                      <Chip
                        label={pathwayInfo.label}
                        size='small'
                        sx={{
                          bgcolor: `${pathwayInfo.color}20`,
                          color: pathwayInfo.color,
                          fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                    <Cell column='astm_pathway'>
                      {cert.astm_pathway || '-'}
                    </Cell>
                    <TableCell sx={cellSx}>{cert.producer_name}</TableCell>
                    <Cell column='production_facility'>
                      {cert.production_facility || '-'}
                    </Cell>
                    <TableCell sx={cellSx}>{cert.production_country}</TableCell>
                    <TableCell sx={{ borderColor: 'divider' }}>
                      <Chip
                        label={schemeInfo.label}
                        size='small'
                        sx={{
                          bgcolor: `${schemeInfo.color}20`,
                          color: schemeInfo.color,
                          fontSize: '0.65rem',
                        }}
                      />
                    </TableCell>
                    <Cell column='certifying_body'>
                      {cert.certifying_body || '-'}
                    </Cell>
                    <TableCell sx={{ borderColor: 'divider' }}>
                      <Chip
                        label={cert.verification_status}
                        size='small'
                        sx={{
                          bgcolor:
                            cert.verification_status === 'verified'
                              ? '#4ade8020'
                              : '#f59e0b20',
                          color:
                            cert.verification_status === 'verified'
                              ? '#4ade80'
                              : '#f59e0b',
                          fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: 'divider' }}>
                      <Chip
                        label={cert.corsia_eligible ? 'Yes' : 'No'}
                        size='small'
                        sx={{
                          bgcolor: cert.corsia_eligible
                            ? '#4ade8020'
                            : '#6b728020',
                          color: cert.corsia_eligible ? '#4ade80' : '#6b7280',
                          fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: 'divider' }}>
                      <Chip
                        label={cert.eu_red_compliant ? 'Yes' : 'No'}
                        size='small'
                        sx={{
                          bgcolor: cert.eu_red_compliant
                            ? '#4ade8020'
                            : '#6b728020',
                          color: cert.eu_red_compliant ? '#4ade80' : '#6b7280',
                          fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={cellSx}>{cert.issuance_date}</TableCell>
                    <Cell column='expiration_date'>
                      {cert.expiration_date || '-'}
                    </Cell>
                    <TableCell sx={cellSx}>{cert.delivery_date}</TableCell>
                    <Cell column='airline_name'>
                      {cert.airline_name || '-'}
                    </Cell>
                    <Cell column='destination_airport'>
                      {cert.destination_airport || '-'}
                    </Cell>
                    <TableCell sx={{ borderColor: 'divider' }}>
                      <Chip
                        label={statusInfo.label}
                        size='small'
                        sx={{
                          bgcolor: `${statusInfo.color}20`,
                          color: statusInfo.color,
                          fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                    <Cell column='retirement_date'>
                      {cert.retirement_date || '-'}
                    </Cell>
                    <Cell column='retirement_beneficiary'>
                      {cert.retirement_beneficiary || '-'}
                    </Cell>
                    <Cell column='chain_of_custody_type'>
                      {cert.chain_of_custody_type || '-'}
                    </Cell>
                    <Cell column='supplier_name'>
                      {cert.supplier_name || '-'}
                    </Cell>
                    {isColumnVisible('sustainability_tier') ? (
                      <TableCell sx={{ borderColor: 'divider' }}>
                        {cert.sustainability_tier ? (
                          <Chip
                            label={`Tier ${cert.sustainability_tier}`}
                            size='small'
                            sx={{
                              bgcolor:
                                cert.sustainability_tier === 'A'
                                  ? '#4ade8020'
                                  : cert.sustainability_tier === 'B'
                                    ? '#f59e0b20'
                                    : '#6b728020',
                              color:
                                cert.sustainability_tier === 'A'
                                  ? '#4ade80'
                                  : cert.sustainability_tier === 'B'
                                    ? '#f59e0b'
                                    : '#6b7280',
                              fontSize: '0.7rem',
                            }}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
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
                size='small'
                variant='standard'
                disableUnderline
                disabled={isPending}
                sx={{
                  color: 'text.primary',
                  '.MuiSelect-select': { py: 0.5, px: 1 },
                  '.MuiSvgIcon-root': { color: 'text.secondary' },
                }}
                MenuProps={{
                  slotProps: { paper: { sx: { bgcolor: 'background.paper' } } },
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={15}>15</MenuItem>
              </Select>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size='small'
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isPending}
                sx={{
                  color: 'grey.400',
                  minWidth: 'auto',
                  '&:disabled': { color: 'grey.700' },
                }}
              >
                &larr;
              </Button>
              {(() => {
                const maxVisible = 3;
                let startPage = Math.max(
                  1,
                  currentPage - Math.floor(maxVisible / 2),
                );
                const endPage = Math.min(
                  totalPages,
                  startPage + maxVisible - 1,
                );
                if (endPage - startPage + 1 < maxVisible)
                  startPage = Math.max(1, endPage - maxVisible + 1);
                return Array.from(
                  { length: endPage - startPage + 1 },
                  (_, i) => startPage + i,
                ).map((page) => (
                  <Button
                    key={page}
                    size='small'
                    onClick={() => handlePageChange(page)}
                    disabled={isPending}
                    sx={{
                      minWidth: 36,
                      bgcolor:
                        page === currentPage ? '#60a5fa20' : 'transparent',
                      color: page === currentPage ? '#60a5fa' : 'grey.400',
                      border:
                        page === currentPage ? '1px solid #60a5fa40' : 'none',
                      '&:hover': { bgcolor: '#60a5fa10' },
                    }}
                  >
                    {page}
                  </Button>
                ));
              })()}
              <Button
                size='small'
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isPending}
                sx={{
                  color: 'grey.400',
                  minWidth: 'auto',
                  '&:disabled': { color: 'grey.700' },
                }}
              >
                &rarr;
              </Button>
              <Typography
                sx={{ color: 'grey.500', ml: 1, fontSize: '0.875rem' }}
              >
                Page {currentPage} of {totalPages}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedCertificate(null);
        }}
        onConfirm={handleDeleteConfirm}
        certificateId={selectedCertificate?.certificate_id || ''}
        isDeleting={isDeleting}
      />
      {selectedCertificate && (
        <EditSafCertificateModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedCertificate(null);
          }}
          onSave={handleSave}
          certificate={selectedCertificate}
          isSaving={isSaving}
        />
      )}
    </Box>
  );
}
