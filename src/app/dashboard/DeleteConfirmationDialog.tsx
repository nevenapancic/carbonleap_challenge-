'use client'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  certificateId: string
  isDeleting: boolean
}

export default function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  certificateId,
  isDeleting,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            minWidth: 400,
          },
        },
      }}
    >
      <DialogTitle sx={{ color: 'white' }}>Delete Certificate</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: 'grey.300' }}>
          Are you sure you want to delete certificate{' '}
          <Typography component="span" sx={{ color: 'white', fontWeight: 600 }}>
            {certificateId}
          </Typography>
          ?
        </Typography>
        <Typography sx={{ color: 'grey.500', mt: 1, fontSize: '0.875rem' }}>
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={isDeleting}
          sx={{ color: 'grey.400' }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isDeleting}
          variant="contained"
          sx={{
            bgcolor: '#ef4444',
            '&:hover': { bgcolor: '#dc2626' },
          }}
        >
          {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
