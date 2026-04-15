'use client'

import { useState } from 'react'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import DownloadIcon from '@mui/icons-material/Download'
import { getDownloadUrl } from './actions'

type Props = {
  fileUrl: string
  filename: string
}

export default function DownloadButton({ fileUrl, filename }: Props) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const signedUrl = await getDownloadUrl(fileUrl)
      if (signedUrl) {
        const link = document.createElement('a')
        link.href = signedUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <IconButton
      size="small"
      onClick={handleDownload}
      disabled={loading}
      sx={{ color: 'grey.400', '&:hover': { color: '#4ade80' } }}
    >
      {loading ? <CircularProgress size={18} sx={{ color: 'grey.400' }} /> : <DownloadIcon fontSize="small" />}
    </IconButton>
  )
}
