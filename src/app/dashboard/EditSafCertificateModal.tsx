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
import type { SafCertificateData } from '@/lib/types/database'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<SafCertificateData>) => void
  certificate: SafCertificateData & { id: string }
  isSaving: boolean
}

const productionPathways = [
  { value: 'HEFA', label: 'HEFA' },
  { value: 'FT', label: 'Fischer-Tropsch (FT)' },
  { value: 'ATJ', label: 'Alcohol-to-Jet (ATJ)' },
  { value: 'SIP', label: 'SIP' },
  { value: 'PtL', label: 'Power-to-Liquid (PtL)' },
  { value: 'CHJ', label: 'CHJ' },
  { value: 'HC-HEFA', label: 'HC-HEFA' },
  { value: 'Co-processing', label: 'Co-processing' },
  { value: 'Other', label: 'Other' },
]

const certificationSchemes = [
  { value: 'ISCC-EU', label: 'ISCC-EU' },
  { value: 'ISCC-CORSIA', label: 'ISCC-CORSIA' },
  { value: 'ISCC-PLUS', label: 'ISCC-PLUS' },
  { value: 'RSB-CORSIA', label: 'RSB-CORSIA' },
  { value: 'RSB-EU-RED', label: 'RSB-EU-RED' },
  { value: 'RSB-Global', label: 'RSB-Global' },
  { value: 'REDcert', label: 'REDcert' },
  { value: '2BSvs', label: '2BSvs' },
  { value: 'Other', label: 'Other' },
]

const verificationStatuses = [
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
]

const certificateStatuses = [
  { value: 'active', label: 'Active' },
  { value: 'retired', label: 'Retired' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
]

const chainOfCustodyTypes = [
  { value: 'mass_balance', label: 'Mass Balance' },
  { value: 'segregation', label: 'Segregation' },
  { value: 'book_and_claim', label: 'Book and Claim' },
]

const sustainabilityTiers = [
  { value: 'A', label: 'Tier A' },
  { value: 'B', label: 'Tier B' },
  { value: 'C', label: 'Tier C' },
]

export default function EditSafCertificateModal({
  open,
  onClose,
  onSave,
  certificate,
  isSaving,
}: Props) {
  const [formData, setFormData] = useState({
    certificate_id: certificate.certificate_id,
    batch_id: certificate.batch_id || '',
    pos_number: certificate.pos_number,
    volume_liters: certificate.volume_liters,
    volume_mt: certificate.volume_mt,
    energy_content_mj: certificate.energy_content_mj || '',
    blend_percentage: certificate.blend_percentage || '',
    ghg_reduction_percentage: certificate.ghg_reduction_percentage,
    core_lca_value: certificate.core_lca_value || '',
    lifecycle_emissions_gco2e_mj: certificate.lifecycle_emissions_gco2e_mj || '',
    feedstock_type: certificate.feedstock_type,
    feedstock_country: certificate.feedstock_country,
    production_pathway: certificate.production_pathway,
    astm_pathway: certificate.astm_pathway || '',
    producer_name: certificate.producer_name,
    production_facility: certificate.production_facility || '',
    production_country: certificate.production_country,
    certification_scheme: certificate.certification_scheme,
    certifying_body: certificate.certifying_body || '',
    verification_status: certificate.verification_status,
    corsia_eligible: certificate.corsia_eligible,
    eu_red_compliant: certificate.eu_red_compliant,
    certificate_status: certificate.certificate_status || 'active',
    airline_name: certificate.airline_name || '',
    destination_airport: certificate.destination_airport || '',
    retirement_beneficiary: certificate.retirement_beneficiary || '',
    chain_of_custody_type: certificate.chain_of_custody_type || '',
    supplier_name: certificate.supplier_name || '',
    sustainability_tier: certificate.sustainability_tier || '',
  })

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    const dataToSave: Record<string, unknown> = { ...formData }
    Object.keys(dataToSave).forEach((key) => {
      if (dataToSave[key] === '') {
        dataToSave[key] = null
      }
    })
    onSave(dataToSave as Partial<SafCertificateData>)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            maxHeight: '90vh',
          },
        },
      }}
    >
      <DialogTitle sx={{ color: 'white' }}>
        Edit Certificate: {certificate.certificate_id}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ color: '#60a5fa', fontWeight: 600, mb: 2 }}>
            Certificate Identification
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Certificate ID" value={formData.certificate_id} onChange={(e) => handleChange('certificate_id', e.target.value)} size="small" fullWidth />
            <TextField label="Batch ID" value={formData.batch_id} onChange={(e) => handleChange('batch_id', e.target.value)} size="small" fullWidth />
            <TextField label="POS Number" value={formData.pos_number} onChange={(e) => handleChange('pos_number', e.target.value)} size="small" fullWidth />
          </Box>

          <Typography sx={{ color: '#60a5fa', fontWeight: 600, mb: 2 }}>
            Volume & Quantity
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Volume (Liters)" type="number" value={formData.volume_liters} onChange={(e) => handleChange('volume_liters', Number(e.target.value))} size="small" fullWidth />
            <TextField label="Volume (MT)" type="number" value={formData.volume_mt} onChange={(e) => handleChange('volume_mt', Number(e.target.value))} size="small" fullWidth />
            <TextField label="Energy Content (MJ)" type="number" value={formData.energy_content_mj} onChange={(e) => handleChange('energy_content_mj', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
            <TextField label="Blend Percentage (%)" type="number" value={formData.blend_percentage} onChange={(e) => handleChange('blend_percentage', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
          </Box>

          <Typography sx={{ color: '#60a5fa', fontWeight: 600, mb: 2 }}>
            GHG & Emissions Data
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="GHG Reduction (%)" type="number" value={formData.ghg_reduction_percentage} onChange={(e) => handleChange('ghg_reduction_percentage', Number(e.target.value))} size="small" fullWidth />
            <TextField label="Core LCA Value" type="number" value={formData.core_lca_value} onChange={(e) => handleChange('core_lca_value', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
            <TextField label="Lifecycle Emissions (gCO2e/MJ)" type="number" value={formData.lifecycle_emissions_gco2e_mj} onChange={(e) => handleChange('lifecycle_emissions_gco2e_mj', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
          </Box>

          <Typography sx={{ color: '#60a5fa', fontWeight: 600, mb: 2 }}>
            Feedstock Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Feedstock Type" value={formData.feedstock_type} onChange={(e) => handleChange('feedstock_type', e.target.value)} size="small" fullWidth />
            <TextField label="Feedstock Country" value={formData.feedstock_country} onChange={(e) => handleChange('feedstock_country', e.target.value)} size="small" fullWidth />
          </Box>

          <Typography sx={{ color: '#60a5fa', fontWeight: 600, mb: 2 }}>
            Production Pathway & Process
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Production Pathway" select value={formData.production_pathway} onChange={(e) => handleChange('production_pathway', e.target.value)} size="small" fullWidth>
              {productionPathways.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
            </TextField>
            <TextField label="ASTM Pathway" value={formData.astm_pathway} onChange={(e) => handleChange('astm_pathway', e.target.value)} size="small" fullWidth />
          </Box>

          <Typography sx={{ color: '#60a5fa', fontWeight: 600, mb: 2 }}>
            Producer/Facility Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Producer Name" value={formData.producer_name} onChange={(e) => handleChange('producer_name', e.target.value)} size="small" fullWidth />
            <TextField label="Production Facility" value={formData.production_facility} onChange={(e) => handleChange('production_facility', e.target.value)} size="small" fullWidth />
            <TextField label="Production Country" value={formData.production_country} onChange={(e) => handleChange('production_country', e.target.value)} size="small" fullWidth />
          </Box>

          <Typography sx={{ color: '#60a5fa', fontWeight: 600, mb: 2 }}>
            Certification & Verification
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Certification Scheme" select value={formData.certification_scheme} onChange={(e) => handleChange('certification_scheme', e.target.value)} size="small" fullWidth>
              {certificationSchemes.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
            </TextField>
            <TextField label="Certifying Body" value={formData.certifying_body} onChange={(e) => handleChange('certifying_body', e.target.value)} size="small" fullWidth />
            <TextField label="Verification Status" select value={formData.verification_status} onChange={(e) => handleChange('verification_status', e.target.value)} size="small" fullWidth>
              {verificationStatuses.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
            </TextField>
          </Box>

          <Typography sx={{ color: '#60a5fa', fontWeight: 600, mb: 2 }}>
            Regulatory Compliance
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={<Switch checked={formData.corsia_eligible} onChange={(e) => handleChange('corsia_eligible', e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#60a5fa' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#60a5fa' } }} />}
                label="CORSIA Eligible"
                sx={{ color: 'grey.300' }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={<Switch checked={formData.eu_red_compliant} onChange={(e) => handleChange('eu_red_compliant', e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#60a5fa' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#60a5fa' } }} />}
                label="EU RED Compliant"
                sx={{ color: 'grey.300' }}
              />
            </Box>
          </Box>

          <Typography sx={{ color: '#60a5fa', fontWeight: 600, mb: 2 }}>
            Aviation/Operator Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Airline Name" value={formData.airline_name} onChange={(e) => handleChange('airline_name', e.target.value)} size="small" fullWidth />
            <TextField label="Destination Airport" value={formData.destination_airport} onChange={(e) => handleChange('destination_airport', e.target.value)} size="small" fullWidth />
          </Box>

          <Typography sx={{ color: '#60a5fa', fontWeight: 600, mb: 2 }}>
            Ownership & Status
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Certificate Status" select value={formData.certificate_status} onChange={(e) => handleChange('certificate_status', e.target.value)} size="small" fullWidth>
              {certificateStatuses.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
            </TextField>
            <TextField label="Retirement Beneficiary" value={formData.retirement_beneficiary} onChange={(e) => handleChange('retirement_beneficiary', e.target.value)} size="small" fullWidth />
          </Box>

          <Typography sx={{ color: '#60a5fa', fontWeight: 600, mb: 2 }}>
            Chain of Custody & Supplier
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Chain of Custody Type" select value={formData.chain_of_custody_type} onChange={(e) => handleChange('chain_of_custody_type', e.target.value)} size="small" fullWidth>
              <MenuItem value="">None</MenuItem>
              {chainOfCustodyTypes.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
            </TextField>
            <TextField label="Supplier Name" value={formData.supplier_name} onChange={(e) => handleChange('supplier_name', e.target.value)} size="small" fullWidth />
            <TextField label="Sustainability Tier" select value={formData.sustainability_tier} onChange={(e) => handleChange('sustainability_tier', e.target.value)} size="small" fullWidth>
              <MenuItem value="">None</MenuItem>
              {sustainabilityTiers.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
            </TextField>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSaving} sx={{ color: 'grey.400' }}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSaving} variant="contained" sx={{ bgcolor: '#60a5fa', '&:hover': { bgcolor: '#3b82f6' } }}>
          {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
