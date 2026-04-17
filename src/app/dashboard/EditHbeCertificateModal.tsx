'use client'

import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import type { HbeCertificateData } from '@/lib/types/database'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<HbeCertificateData>) => void
  certificate: HbeCertificateData & { id: string }
  isSaving: boolean
}

const hbeTypes = [
  { value: 'HBE-G', label: 'HBE-G (Gasoline)' },
  { value: 'HBE-C', label: 'HBE-C (Conventional)' },
  { value: 'HBE-IXB', label: 'HBE-IXB (Annex IX-B)' },
  { value: 'HBE-O', label: 'HBE-O (Other)' },
]

const transportSectors = [
  { value: 'road', label: 'Road' },
  { value: 'maritime', label: 'Maritime' },
  { value: 'aviation', label: 'Aviation' },
  { value: 'inland_waterway', label: 'Inland Waterway' },
]

const verificationStatuses = [
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
]

const sustainabilitySchemes = [
  { value: 'ISCC-EU', label: 'ISCC-EU' },
  { value: 'ISCC-CORSIA', label: 'ISCC-CORSIA' },
  { value: 'REDcert', label: 'REDcert' },
  { value: 'RSB-EU', label: 'RSB-EU' },
  { value: 'KZR INiG', label: 'KZR INiG' },
  { value: '2BSvs', label: '2BSvs' },
  { value: 'Other', label: 'Other' },
]

export default function EditHbeCertificateModal({
  open,
  onClose,
  onSave,
  certificate,
  isSaving,
}: Props) {
  const [formData, setFormData] = useState({
    certificate_id: certificate.certificate_id,
    hbe_type: certificate.hbe_type,
    energy_delivered_gj: certificate.energy_delivered_gj,
    hbes_issued: certificate.hbes_issued,
    double_counting: certificate.double_counting,
    multiplier: certificate.multiplier,
    feedstock: certificate.feedstock,
    nta8003_code: certificate.nta8003_code,
    transport_sector: certificate.transport_sector,
    supplier_name: certificate.supplier_name,
    rev_account_id: certificate.rev_account_id,
    verification_status: certificate.verification_status,
    ghg_reduction_percentage: certificate.ghg_reduction_percentage,
    sustainability_scheme: certificate.sustainability_scheme,
    production_country: certificate.production_country,
    pos_number: certificate.pos_number,
  })

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    onSave(formData)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          },
        },
      }}
    >
      <DialogTitle sx={{ color: 'white' }}>
        Edit Certificate: {certificate.certificate_id}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ color: '#4ade80', fontWeight: 600, mb: 2 }}>
            Certificate Details
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            <TextField
              label="Certificate ID"
              value={formData.certificate_id}
              onChange={(e) => handleChange('certificate_id', e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label="HBE Type"
              select
              value={formData.hbe_type}
              onChange={(e) => handleChange('hbe_type', e.target.value)}
              size="small"
              fullWidth
            >
              {hbeTypes.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Energy Delivered (GJ)"
              type="number"
              value={formData.energy_delivered_gj}
              onChange={(e) => handleChange('energy_delivered_gj', Number(e.target.value))}
              size="small"
              fullWidth
            />
            <TextField
              label="HBEs Issued"
              type="number"
              value={formData.hbes_issued}
              onChange={(e) => handleChange('hbes_issued', Number(e.target.value))}
              size="small"
              fullWidth
            />
            <TextField
              label="Multiplier"
              type="number"
              value={formData.multiplier}
              onChange={(e) => handleChange('multiplier', Number(e.target.value))}
              size="small"
              fullWidth
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.double_counting}
                    onChange={(e) => handleChange('double_counting', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#4ade80' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#4ade80' },
                    }}
                  />
                }
                label="Double Counting"
                sx={{ color: 'grey.300' }}
              />
            </Box>
          </Box>

          <Typography sx={{ color: '#4ade80', fontWeight: 600, mb: 2 }}>
            Feedstock & Production
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            <TextField
              label="Feedstock"
              value={formData.feedstock}
              onChange={(e) => handleChange('feedstock', e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label="NTA8003 Code"
              value={formData.nta8003_code}
              onChange={(e) => handleChange('nta8003_code', e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label="Production Country"
              value={formData.production_country}
              onChange={(e) => handleChange('production_country', e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label="POS Number"
              value={formData.pos_number}
              onChange={(e) => handleChange('pos_number', e.target.value)}
              size="small"
              fullWidth
            />
          </Box>

          <Typography sx={{ color: '#4ade80', fontWeight: 600, mb: 2 }}>
            Transport & Supplier
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            <TextField
              label="Transport Sector"
              select
              value={formData.transport_sector}
              onChange={(e) => handleChange('transport_sector', e.target.value)}
              size="small"
              fullWidth
            >
              {transportSectors.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Supplier Name"
              value={formData.supplier_name}
              onChange={(e) => handleChange('supplier_name', e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label="REV Account ID"
              value={formData.rev_account_id}
              onChange={(e) => handleChange('rev_account_id', e.target.value)}
              size="small"
              fullWidth
            />
          </Box>

          <Typography sx={{ color: '#4ade80', fontWeight: 600, mb: 2 }}>
            Sustainability & Verification
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            <TextField
              label="GHG Reduction (%)"
              type="number"
              value={formData.ghg_reduction_percentage}
              onChange={(e) => handleChange('ghg_reduction_percentage', Number(e.target.value))}
              size="small"
              fullWidth
            />
            <TextField
              label="Sustainability Scheme"
              select
              value={formData.sustainability_scheme}
              onChange={(e) => handleChange('sustainability_scheme', e.target.value)}
              size="small"
              fullWidth
            >
              {sustainabilitySchemes.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Verification Status"
              select
              value={formData.verification_status}
              onChange={(e) => handleChange('verification_status', e.target.value)}
              size="small"
              fullWidth
            >
              {verificationStatuses.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSaving} sx={{ color: 'grey.400' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSaving}
          variant="contained"
          sx={{
            bgcolor: '#4ade80',
            color: 'black',
            '&:hover': { bgcolor: '#22c55e' },
          }}
        >
          {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
