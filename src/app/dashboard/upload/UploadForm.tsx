'use client'

import { useState } from 'react'
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
import type { Source } from '@/lib/types/database'
import { uploadHbeCertificates, uploadSafCertificates } from './actions'

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

export default function UploadForm({ sources }: Props) {
  const router = useRouter()
  const [selectedSource, setSelectedSource] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' })

  const selectedSourceData = sources.find((s) => s.id === selectedSource)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !selectedSource || !selectedSourceData) return

    setUploadState({ status: 'uploading' })

    const formData = new FormData()
    formData.append('file', file)
    formData.append('sourceId', selectedSource)

    // Determine which upload function to use based on source name or registry_type
    const isSafSource = selectedSourceData.name.toLowerCase().includes('saf') ||
                        selectedSourceData.registry_type?.toLowerCase().includes('saf')

    const result = isSafSource
      ? await uploadSafCertificates(formData)
      : await uploadHbeCertificates(formData)

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

  const getSourceColor = (color: string | null) => {
    const colors: Record<string, string> = {
      teal: '#0d9488',
      coral: '#f97316',
      amber: '#f59e0b',
    }
    return colors[color || ''] || '#6b7280'
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
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2">
                {selectedSourceData.methodology_description}
              </Typography>
            </Alert>
          )}

          <Box sx={{ mt: 3, mb: 3 }}>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploadState.status === 'uploading'}
              style={{ display: 'none' }}
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button
                variant="outlined"
                component="span"
                disabled={uploadState.status === 'uploading'}
              >
                Choose CSV File
              </Button>
            </label>
            {file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {file.name}
              </Typography>
            )}
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!file || !selectedSource || uploadState.status === 'uploading'}
            sx={{ mt: 2 }}
          >
            {uploadState.status === 'uploading' ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Upload'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
