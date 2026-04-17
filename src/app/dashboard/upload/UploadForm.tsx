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
      setUploadState({
        status: 'success',
        validCount: result.validCount,
        invalidCount: result.invalidCount,
        errors: result.errors,
      })
      setTimeout(() => router.push('/dashboard'), 2000)
    } else {
      setUploadState({ status: 'error', message: result.error })
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

        {uploadState.status === 'success' && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Successfully imported {uploadState.validCount} certificates.
            {uploadState.invalidCount! > 0 && (
              <> {uploadState.invalidCount} rows had errors.</>
            )}
          </Alert>
        )}

        {uploadState.status === 'error' && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {uploadState.message}
          </Alert>
        )}

        {uploadState.errors && uploadState.errors.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Rows with errors (skipped):
            </Typography>
            {uploadState.errors.slice(0, 5).map((err) => (
              <Typography key={err.row} variant="body2">
                Row {err.row}: {err.message}
              </Typography>
            ))}
            {uploadState.errors.length > 5 && (
              <Typography variant="body2">
                ...and {uploadState.errors.length - 5} more
              </Typography>
            )}
          </Alert>
        )}

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
              <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                <Typography variant="body2">
                  {selectedSourceData.methodology_description}
                </Typography>
              </Alert>

              {/* Template Downloads */}
              <Box sx={{ mb: 3 }}>
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
