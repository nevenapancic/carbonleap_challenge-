'use client'

import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

type Props = {
  currentPage: number
  totalPages: number
  perPage: number
  totalCount: number
}

export default function PaginationControls({ currentPage, totalPages, perPage, totalCount }: Props) {
  const router = useRouter()

  const handlePageChange = (page: number) => {
    router.push(`/dashboard?page=${page}&perPage=${perPage}`)
  }

  const handlePerPageChange = (newPerPage: number) => {
    router.push(`/dashboard?page=1&perPage=${newPerPage}`)
  }

  if (totalCount === 0) return null

  const startItem = (currentPage - 1) * perPage + 1
  const endItem = Math.min(currentPage * perPage, totalCount)

  return (
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
            sx={{
              color: 'white',
              '.MuiSelect-select': { py: 0.5, px: 1 },
              '.MuiSvgIcon-root': { color: 'grey.400' },
            }}
            MenuProps={{
              PaperProps: {
                sx: { bgcolor: 'background.paper' }
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
            disabled={currentPage === 1}
            sx={{ color: 'grey.400', minWidth: 'auto', '&:disabled': { color: 'grey.700' } }}
          >
            ←
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              size="small"
              onClick={() => handlePageChange(page)}
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
          ))}

          <Button
            size="small"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            sx={{ color: 'grey.400', minWidth: 'auto', '&:disabled': { color: 'grey.700' } }}
          >
            →
          </Button>

          <Typography sx={{ color: 'grey.500', ml: 1, fontSize: '0.875rem' }}>
            Page {currentPage} of {totalPages}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
