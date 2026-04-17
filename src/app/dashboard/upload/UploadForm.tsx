'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import CloseIcon from '@mui/icons-material/Close'
import TableChartIcon from '@mui/icons-material/TableChart'
import DataObjectIcon from '@mui/icons-material/DataObject'
import GridOnIcon from '@mui/icons-material/GridOn'
import type { Source } from '@/lib/types/database'
import { uploadHbeCertificates, uploadSafCertificates, uploadFuelEuCertificates } from './actions'
import { generateCSVTemplate, generateJSONTemplate, generateExcelTemplate, getTemplateFilename, type CertificateType } from '@/lib/parsers/templates'
import { detectFileFormat } from '@/lib/parsers/fileParser'

type Props = {
  sources: Source[]
}

type UploadState = {
  status: 'idle' | 'uploading' | 'success' | 'error'
  message?: string
  validCount?: number
  invalidCount?: number
  errors?: { row: number; message: string }[]
}

const ACCEPTED_FORMATS = '.csv,.json,.xlsx,.xls'

export default function UploadForm({ sources }: Props) {
  const router = useRouter()
  const [selectedSource, setSelectedSource] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' })
  const [isDragOver, setIsDragOver] = useState(false)

  const selectedSourceData = sources.find((s) => s.id === selectedSource)

  const getCertificateType = (): CertificateType | null => {
    if (!selectedSourceData) return null
    const sourceName = selectedSourceData.name.toLowerCase()
    const registryType = selectedSourceData.registry_type?.toLowerCase() || ''

    if (sourceName.includes('fueleu') || registryType.includes('fueleu') ||
        sourceName.includes('maritime') || registryType.includes('maritime')) {
      return 'fueleu'
    }
    if (sourceName.includes('saf') || registryType.includes('saf')) {
      return 'saf'
    }
    return 'hbe'
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const format = detectFileFormat(droppedFile.name)
      if (format === 'unknown') {
        setUploadState({ status: 'error', message: 'Unsupported file format. Please upload CSV, JSON, or Excel files.' })
        return
      }
      setFile(droppedFile)
      setUploadState({ status: 'idle' })
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const format = detectFileFormat(selectedFile.name)
      if (format === 'unknown') {
        setUploadState({ status: 'error', message: 'Unsupported file format. Please upload CSV, JSON, or Excel files.' })
        return
      }
      setFile(selectedFile)
      setUploadState({ status: 'idle' })
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setUploadState({ status: 'idle' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !selectedSource || !selectedSourceData) return

    setUploadState({ status: 'uploading' })

    const formData = new FormData()
    formData.append('file', file)
    formData.append('sourceId', selectedSource)

    const certType = getCertificateType()

    let result
    if (certType === 'fueleu') {
      result = await uploadFuelEuCertificates(formData)
    } else if (certType === 'saf') {
      result = await uploadSafCertificates(formData)
    } else {
      result = await uploadHbeCertificates(formData)
    }

    if (result.success) {
      // Only import if ALL rows are valid
      if (result.invalidCount === 0 && result.validCount > 0) {
        setUploadState({
          status: 'success',
          validCount: result.validCount,
          invalidCount: 0,
          errors: [],
        })
        setTimeout(() => router.push('/dashboard'), 2000)
      } else {
        // Has errors - nothing was imported, show validation errors
        setUploadState({
          status: 'error',
          message: result.invalidCount > 0
            ? `Found ${result.invalidCount} row${result.invalidCount > 1 ? 's' : ''} with errors. Nothing was imported - fix the issues and try again.`
            : 'No valid certificates found in your file.',
          validCount: 0,
          invalidCount: result.invalidCount,
          errors: result.errors,
        })
      }
    } else {
      setUploadState({ status: 'error', message: result.error })
    }
  }

  // Field name mapping for cleaner display
  const fieldNameMap: Record<string, string> = {
    'certificate_id': 'Certificate ID',
    'imo_number': 'IMO Number',
    'ship_name': 'Ship Name',
    'ship_type': 'Ship Type',
    'flag_state': 'Flag State',
    'gross_tonnage': 'Gross Tonnage',
    'shipowner_company': 'Ship Owner',
    'port_of_departure': 'Departure Port',
    'port_of_arrival': 'Arrival Port',
    'departure_date': 'Departure Date',
    'arrival_date': 'Arrival Date',
    'voyage_type': 'Voyage Type',
    'fuel_type': 'Fuel Type',
    'fuel_category': 'Fuel Category',
    'total_fuel_consumption_mt': 'Fuel Consumption',
    'wtw_emission_factor': 'WTW Factor',
    'ghg_intensity_gco2eq_mj': 'GHG Intensity',
    'target_ghg_intensity': 'Target GHG',
    'compliance_status': 'Compliance',
    'verification_status': 'Verification',
    'reporting_period': 'Period',
    'hbe_type': 'HBE Type',
    'energy_delivered_gj': 'Energy',
    'hbes_issued': 'HBEs',
    'double_counting': 'Double Counting',
    'multiplier': 'Multiplier',
    'feedstock': 'Feedstock',
    'nta8003_code': 'NTA Code',
    'delivery_date': 'Delivery Date',
    'booking_date': 'Booking Date',
    'transport_sector': 'Sector',
    'supplier_name': 'Supplier',
    'rev_account_id': 'REV Account',
    'ghg_reduction_percentage': 'GHG Reduction',
    'sustainability_scheme': 'Scheme',
    'production_country': 'Country',
    'pos_number': 'PoS Number',
    'volume_liters': 'Volume (L)',
    'volume_mt': 'Volume (MT)',
    'production_pathway': 'Pathway',
    'producer_name': 'Producer',
    'certification_scheme': 'Certification',
    'corsia_eligible': 'CORSIA',
    'eu_red_compliant': 'EU RED',
    'issuance_date': 'Issue Date',
    'feedstock_type': 'Feedstock',
    'feedstock_country': 'Feedstock Country',
  }

  // Extract field issues with descriptions from error message
  const extractFieldIssues = (message: string): { field: string; issue: string }[] => {
    const issues: { field: string; issue: string }[] = []

    // Split by comma to get individual field errors
    const parts = message.split(/,\s*(?=[a-z_]+:|[A-Z])/)

    parts.forEach(part => {
      // Match "field_name: error description"
      const colonMatch = part.match(/^([a-z_]+):\s*(.+)/i)
      if (colonMatch) {
        const fieldKey = colonMatch[1].toLowerCase()
        const friendlyName = fieldNameMap[fieldKey] || colonMatch[1]
        let issueDesc = colonMatch[2].trim()

        // Skip if it's just "option" or similar noise
        if (friendlyName.toLowerCase() === 'option') return

        // Make the issue description user-friendly
        if (issueDesc.includes('Required')) {
          issueDesc = 'missing'
        } else if (issueDesc.includes('expected one of')) {
          // Extract valid options
          const optionsMatch = issueDesc.match(/expected one of (.+)/)
          if (optionsMatch) {
            const options = optionsMatch[1].replace(/"/g, '').replace(/\|/g, ', ')
            issueDesc = `invalid (use: ${options.substring(0, 50)}${options.length > 50 ? '...' : ''})`
          } else {
            issueDesc = 'invalid option'
          }
        } else if (issueDesc.includes('expected number')) {
          issueDesc = 'should be a number'
        } else if (issueDesc.includes('expected string')) {
          issueDesc = 'missing'
        } else {
          issueDesc = 'invalid'
        }

        issues.push({ field: friendlyName, issue: issueDesc })
      }
    })

    return issues.slice(0, 4) // Max 4 issues per row
  }

  // Analyze errors to provide helpful feedback
  const analyzeErrors = () => {
    if (!uploadState.errors || uploadState.errors.length === 0) return null

    const totalRows = uploadState.errors.length
    const certType = getCertificateType()

    // If 5 or fewer errors, show them individually
    if (totalRows <= 5) {
      return {
        type: 'row_errors',
        rows: uploadState.errors.map(err => ({
          row: err.row,
          issues: extractFieldIssues(err.message)
        }))
      }
    }

    // More than 5 errors = likely wrong file format
    let fileType = 'the selected source'
    if (certType === 'fueleu') fileType = 'a FuelEU Maritime file'
    else if (certType === 'hbe') fileType = 'an HBE file'
    else if (certType === 'saf') fileType = 'a SAF file'

    return {
      type: 'wrong_format',
      suggestion: `This doesn't look like ${fileType}.`
    }
  }

  const downloadTemplate = (format: 'csv' | 'json' | 'xlsx') => {
    const certType = getCertificateType()
    if (!certType) return

    const filename = getTemplateFilename(certType, format)
    let content: string | ArrayBuffer
    let mimeType: string

    if (format === 'csv') {
      content = generateCSVTemplate(certType)
      mimeType = 'text/csv'
    } else if (format === 'json') {
      content = generateJSONTemplate(certType)
      mimeType = 'application/json'
    } else {
      content = generateExcelTemplate(certType)
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getSourceColor = (color: string | null) => {
    const colors: Record<string, string> = {
      teal: '#0d9488',
      coral: '#f97316',
      amber: '#f59e0b',
      blue: '#3b82f6',
      cyan: '#22d3ee',
    }
    return colors[color || ''] || '#6b7280'
  }

  const getFileIcon = () => {
    if (!file) return null
    const format = detectFileFormat(file.name)
    switch (format) {
      case 'csv':
        return <TableChartIcon sx={{ fontSize: 40, color: '#4ade80' }} />
      case 'json':
        return <DataObjectIcon sx={{ fontSize: 40, color: '#60a5fa' }} />
      case 'xlsx':
        return <GridOnIcon sx={{ fontSize: 40, color: '#22c55e' }} />
      default:
        return <InsertDriveFileIcon sx={{ fontSize: 40, color: 'grey.500' }} />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Upload Certificates
        </Typography>

        {/* Full Success - All rows valid */}
        {uploadState.status === 'success' && uploadState.invalidCount === 0 && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Successfully imported {uploadState.validCount} certificates. Redirecting to dashboard...
          </Alert>
        )}

        {/* Partial Success - Some valid, some invalid */}
        {uploadState.status === 'success' && uploadState.invalidCount! > 0 && (
          <Box sx={{ mb: 3 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Partial Upload Complete
              </Typography>
              <Typography variant="body2">
                {uploadState.validCount} certificates imported successfully, but {uploadState.invalidCount} rows had issues.
              </Typography>
            </Alert>
            <Button
              variant="contained"
              onClick={() => router.push('/dashboard')}
              sx={{ mr: 2 }}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setFile(null)
                setUploadState({ status: 'idle' })
              }}
            >
              Upload Another File
            </Button>
          </Box>
        )}

        {/* Error Display - Combined */}
        {(uploadState.status === 'error' || (uploadState.errors && uploadState.errors.length > 0)) && (() => {
          const analysis = analyzeErrors()

          // Wrong file format (more than 5 errors)
          if (analysis?.type === 'wrong_format') {
            return (
              <Box
                sx={{
                  mb: 3,
                  p: 3,
                  borderRadius: 2,
                  bgcolor: '#fef3c7',
                  border: '1px solid #f59e0b',
                }}
              >
                <Typography variant="subtitle1" sx={{ color: '#92400e', fontWeight: 600, mb: 1 }}>
                  Wrong file format?
                </Typography>
                <Typography variant="body2" sx={{ color: '#78350f', mb: 2 }}>
                  {analysis.suggestion}
                </Typography>
                <Typography variant="body2" sx={{ color: '#78350f', mb: 2 }}>
                  Download a template below and try again.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setFile(null)
                    setUploadState({ status: 'idle' })
                  }}
                  sx={{
                    borderColor: '#92400e',
                    color: '#92400e',
                    '&:hover': { borderColor: '#78350f', bgcolor: '#fef3c720' }
                  }}
                >
                  Try Again
                </Button>
              </Box>
            )
          }

          // Individual row errors (5 or fewer)
          if (analysis?.type === 'row_errors') {
            return (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#1e1e1e',
                  border: '1px solid',
                  borderColor: 'grey.800',
                }}
              >
                <Typography variant="subtitle2" sx={{ color: 'grey.400', mb: 2 }}>
                  Issues found in {analysis.rows.length} row{analysis.rows.length > 1 ? 's' : ''}:
                </Typography>

                {analysis.rows.map(({ row, issues }) => (
                  <Box
                    key={row}
                    sx={{
                      mb: 2,
                      pb: 2,
                      borderBottom: '1px solid',
                      borderColor: 'grey.800',
                      '&:last-child': { borderBottom: 'none', mb: 0, pb: 0 }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#f59e0b',
                        fontWeight: 600,
                        mb: 1
                      }}
                    >
                      Row {row}
                    </Typography>
                    <Box sx={{ pl: 1 }}>
                      {issues.map((item, i) => (
                        <Typography
                          key={i}
                          variant="body2"
                          sx={{ color: 'grey.400', fontSize: '0.85rem', mb: 0.5 }}
                        >
                          <Box component="span" sx={{ color: '#fca5a5', fontWeight: 500 }}>
                            {item.field}
                          </Box>
                          {' '}- {item.issue}
                        </Typography>
                      ))}
                      {issues.length === 0 && (
                        <Typography variant="body2" sx={{ color: 'grey.500', fontSize: '0.85rem' }}>
                          Invalid data format
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )
          }

          // Generic error (e.g., file read error)
          if (uploadState.status === 'error' && uploadState.message) {
            return (
              <Alert severity="error" sx={{ mb: 3 }}>
                {uploadState.message}
              </Alert>
            )
          }

          return null
        })()}

        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="source-label">Source</InputLabel>
            <Select
              labelId="source-label"
              value={selectedSource}
              label="Source"
              onChange={(e) => setSelectedSource(e.target.value)}
              disabled={uploadState.status === 'uploading'}
            >
              {sources.map((source) => (
                <MenuItem key={source.id} value={source.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {source.name}
                    <Chip
                      label={source.unit_label}
                      size="small"
                      sx={{
                        bgcolor: getSourceColor(source.color),
                        color: 'white',
                        height: 20,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedSourceData && (
            <>
              {/* Template Downloads */}
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="body2" sx={{ color: 'grey.500', mb: 1 }}>
                  Download template:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Download CSV template">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<TableChartIcon />}
                      onClick={() => downloadTemplate('csv')}
                      sx={{ textTransform: 'none' }}
                    >
                      CSV
                    </Button>
                  </Tooltip>
                  <Tooltip title="Download JSON template">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DataObjectIcon />}
                      onClick={() => downloadTemplate('json')}
                      sx={{ textTransform: 'none' }}
                    >
                      JSON
                    </Button>
                  </Tooltip>
                  <Tooltip title="Download Excel template with instructions">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<GridOnIcon />}
                      onClick={() => downloadTemplate('xlsx')}
                      sx={{ textTransform: 'none' }}
                    >
                      Excel
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
            </>
          )}

          {/* Drag & Drop Zone */}
          <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              mt: 2,
              mb: 3,
              p: 4,
              border: '2px dashed',
              borderColor: isDragOver ? 'primary.main' : file ? 'success.main' : 'grey.600',
              borderRadius: 2,
              bgcolor: isDragOver ? 'action.hover' : file ? 'success.main' + '10' : 'transparent',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              textAlign: 'center',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
            onClick={() => !file && document.getElementById('file-upload')?.click()}
          >
            <input
              type="file"
              accept={ACCEPTED_FORMATS}
              onChange={handleFileSelect}
              disabled={uploadState.status === 'uploading'}
              style={{ display: 'none' }}
              id="file-upload"
            />

            {file ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                {getFileIcon()}
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                    {file.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                    {formatFileSize(file.size)} - {detectFileFormat(file.name).toUpperCase()}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFile()
                  }}
                  sx={{ color: 'grey.400', '&:hover': { color: 'error.main' } }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            ) : (
              <>
                <CloudUploadIcon sx={{ fontSize: 48, color: isDragOver ? 'primary.main' : 'grey.500', mb: 1 }} />
                <Typography variant="body1" sx={{ color: 'grey.300', mb: 0.5 }}>
                  Drag & drop your file here
                </Typography>
                <Typography variant="body2" sx={{ color: 'grey.500', mb: 2 }}>
                  or click to browse
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <Chip label="CSV" size="small" sx={{ bgcolor: 'grey.800' }} />
                  <Chip label="JSON" size="small" sx={{ bgcolor: 'grey.800' }} />
                  <Chip label="Excel" size="small" sx={{ bgcolor: 'grey.800' }} />
                </Box>
              </>
            )}
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={!file || !selectedSource || uploadState.status === 'uploading'}
            sx={{ mt: 2 }}
          >
            {uploadState.status === 'uploading' ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Upload Certificates'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
