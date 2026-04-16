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
import type { FuelEuMaritimeCertificateData } from '@/lib/types/database'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<FuelEuMaritimeCertificateData>) => void
  certificate: FuelEuMaritimeCertificateData & { id: string }
  isSaving: boolean
}

const voyageTypes = [
  { value: 'intra_eu', label: 'Intra-EU' },
  { value: 'eu_to_third_country', label: 'EU to Third Country' },
  { value: 'third_country_to_eu', label: 'Third Country to EU' },
  { value: 'outermost_region', label: 'Outermost Region' },
]

const fuelCategories = [
  { value: 'fossil', label: 'Fossil' },
  { value: 'biofuel', label: 'Biofuel' },
  { value: 'rfnbo', label: 'RFNBO' },
  { value: 'recycled_carbon_fuel', label: 'Recycled Carbon Fuel' },
  { value: 'low_carbon', label: 'Low Carbon' },
]

const complianceStatuses = [
  { value: 'compliant', label: 'Compliant' },
  { value: 'non_compliant', label: 'Non-Compliant' },
  { value: 'pending', label: 'Pending' },
  { value: 'banked', label: 'Banked' },
  { value: 'pooled', label: 'Pooled' },
]

const verificationStatuses = [
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'rejected', label: 'Rejected' },
]

const certificationSchemes = [
  { value: 'ISCC-EU', label: 'ISCC-EU' },
  { value: 'RSB-EU-RED', label: 'RSB-EU-RED' },
  { value: 'REDcert', label: 'REDcert' },
  { value: '2BSvs', label: '2BSvs' },
  { value: 'KZR-INiG', label: 'KZR-INiG' },
  { value: 'None', label: 'None' },
  { value: 'Other', label: 'Other' },
]

export default function EditFuelEuCertificateModal({
  open,
  onClose,
  onSave,
  certificate,
  isSaving,
}: Props) {
  const [formData, setFormData] = useState({
    certificate_id: certificate.certificate_id,
    reporting_period: certificate.reporting_period,
    imo_number: certificate.imo_number,
    ship_name: certificate.ship_name,
    ship_type: certificate.ship_type,
    flag_state: certificate.flag_state,
    gross_tonnage: certificate.gross_tonnage,
    shipowner_company: certificate.shipowner_company,
    voyage_id: certificate.voyage_id || '',
    port_of_departure: certificate.port_of_departure,
    port_of_arrival: certificate.port_of_arrival,
    voyage_type: certificate.voyage_type,
    distance_nm: certificate.distance_nm || '',
    time_at_sea_hours: certificate.time_at_sea_hours || '',
    time_at_berth_hours: certificate.time_at_berth_hours || '',
    fuel_type: certificate.fuel_type,
    fuel_category: certificate.fuel_category,
    fuel_consumption_sea_mt: certificate.fuel_consumption_sea_mt || '',
    fuel_consumption_berth_mt: certificate.fuel_consumption_berth_mt || '',
    total_fuel_consumption_mt: certificate.total_fuel_consumption_mt,
    lower_calorific_value_mj_kg: certificate.lower_calorific_value_mj_kg || '',
    energy_consumption_mj: certificate.energy_consumption_mj || '',
    wtt_emission_factor: certificate.wtt_emission_factor || '',
    ttw_emission_factor: certificate.ttw_emission_factor || '',
    wtw_emission_factor: certificate.wtw_emission_factor,
    ghg_intensity_gco2eq_mj: certificate.ghg_intensity_gco2eq_mj,
    total_co2eq_emissions_mt: certificate.total_co2eq_emissions_mt || '',
    methane_slip_gch4_kwh: certificate.methane_slip_gch4_kwh || '',
    n2o_emissions_gn2o_kwh: certificate.n2o_emissions_gn2o_kwh || '',
    target_ghg_intensity: certificate.target_ghg_intensity,
    compliance_balance: certificate.compliance_balance || '',
    compliance_status: certificate.compliance_status,
    rfnbo_subtarget_met: certificate.rfnbo_subtarget_met,
    certification_scheme: certificate.certification_scheme || 'None',
    pos_number: certificate.pos_number || '',
    feedstock_type: certificate.feedstock_type || '',
    e_value_gco2eq_mj: certificate.e_value_gco2eq_mj || '',
    multiplier: certificate.multiplier || 1.0,
    pool_id: certificate.pool_id || '',
    banking_balance: certificate.banking_balance || '',
    borrowing_amount: certificate.borrowing_amount || '',
    ops_connected: certificate.ops_connected,
    ops_exception_applied: certificate.ops_exception_applied,
    shore_power_mwh: certificate.shore_power_mwh || '',
    verifier_name: certificate.verifier_name || '',
    verification_status: certificate.verification_status,
    document_of_compliance_issued: certificate.document_of_compliance_issued,
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
    onSave(dataToSave as Partial<FuelEuMaritimeCertificateData>)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ color: 'white' }}>
        Edit Certificate: {certificate.certificate_id}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ color: '#22d3ee', fontWeight: 600, mb: 2 }}>
            Ship Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Certificate ID" value={formData.certificate_id} onChange={(e) => handleChange('certificate_id', e.target.value)} size="small" fullWidth />
            <TextField label="Reporting Period" type="number" value={formData.reporting_period} onChange={(e) => handleChange('reporting_period', Number(e.target.value))} size="small" fullWidth />
            <TextField label="IMO Number" value={formData.imo_number} onChange={(e) => handleChange('imo_number', e.target.value)} size="small" fullWidth />
            <TextField label="Ship Name" value={formData.ship_name} onChange={(e) => handleChange('ship_name', e.target.value)} size="small" fullWidth />
            <TextField label="Ship Type" value={formData.ship_type} onChange={(e) => handleChange('ship_type', e.target.value)} size="small" fullWidth />
            <TextField label="Flag State" value={formData.flag_state} onChange={(e) => handleChange('flag_state', e.target.value)} size="small" fullWidth />
            <TextField label="Gross Tonnage" type="number" value={formData.gross_tonnage} onChange={(e) => handleChange('gross_tonnage', Number(e.target.value))} size="small" fullWidth />
            <TextField label="Shipowner Company" value={formData.shipowner_company} onChange={(e) => handleChange('shipowner_company', e.target.value)} size="small" fullWidth />
          </Box>

          <Typography sx={{ color: '#22d3ee', fontWeight: 600, mb: 2 }}>
            Voyage Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Voyage ID" value={formData.voyage_id} onChange={(e) => handleChange('voyage_id', e.target.value)} size="small" fullWidth />
            <TextField label="Voyage Type" select value={formData.voyage_type} onChange={(e) => handleChange('voyage_type', e.target.value)} size="small" fullWidth>
              {voyageTypes.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
            </TextField>
            <TextField label="Port of Departure" value={formData.port_of_departure} onChange={(e) => handleChange('port_of_departure', e.target.value)} size="small" fullWidth />
            <TextField label="Port of Arrival" value={formData.port_of_arrival} onChange={(e) => handleChange('port_of_arrival', e.target.value)} size="small" fullWidth />
            <TextField label="Distance (NM)" type="number" value={formData.distance_nm} onChange={(e) => handleChange('distance_nm', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
            <TextField label="Time at Sea (Hours)" type="number" value={formData.time_at_sea_hours} onChange={(e) => handleChange('time_at_sea_hours', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
            <TextField label="Time at Berth (Hours)" type="number" value={formData.time_at_berth_hours} onChange={(e) => handleChange('time_at_berth_hours', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
          </Box>

          <Typography sx={{ color: '#22d3ee', fontWeight: 600, mb: 2 }}>
            Fuel Data
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Fuel Type" value={formData.fuel_type} onChange={(e) => handleChange('fuel_type', e.target.value)} size="small" fullWidth />
            <TextField label="Fuel Category" select value={formData.fuel_category} onChange={(e) => handleChange('fuel_category', e.target.value)} size="small" fullWidth>
              {fuelCategories.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
            </TextField>
            <TextField label="Fuel Consumption Sea (MT)" type="number" value={formData.fuel_consumption_sea_mt} onChange={(e) => handleChange('fuel_consumption_sea_mt', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
            <TextField label="Fuel Consumption Berth (MT)" type="number" value={formData.fuel_consumption_berth_mt} onChange={(e) => handleChange('fuel_consumption_berth_mt', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
            <TextField label="Total Fuel Consumption (MT)" type="number" value={formData.total_fuel_consumption_mt} onChange={(e) => handleChange('total_fuel_consumption_mt', Number(e.target.value))} size="small" fullWidth />
            <TextField label="Lower Calorific Value (MJ/kg)" type="number" value={formData.lower_calorific_value_mj_kg} onChange={(e) => handleChange('lower_calorific_value_mj_kg', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
            <TextField label="Energy Consumption (MJ)" type="number" value={formData.energy_consumption_mj} onChange={(e) => handleChange('energy_consumption_mj', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
          </Box>

          <Typography sx={{ color: '#22d3ee', fontWeight: 600, mb: 2 }}>
            Emissions Data
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="WTT Emission Factor" type="number" value={formData.wtt_emission_factor} onChange={(e) => handleChange('wtt_emission_factor', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
            <TextField label="TTW Emission Factor" type="number" value={formData.ttw_emission_factor} onChange={(e) => handleChange('ttw_emission_factor', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
            <TextField label="WTW Emission Factor" type="number" value={formData.wtw_emission_factor} onChange={(e) => handleChange('wtw_emission_factor', Number(e.target.value))} size="small" fullWidth />
            <TextField label="GHG Intensity (gCO2eq/MJ)" type="number" value={formData.ghg_intensity_gco2eq_mj} onChange={(e) => handleChange('ghg_intensity_gco2eq_mj', Number(e.target.value))} size="small" fullWidth />
            <TextField label="Total CO2eq Emissions (MT)" type="number" value={formData.total_co2eq_emissions_mt} onChange={(e) => handleChange('total_co2eq_emissions_mt', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
            <TextField label="Methane Slip (gCH4/kWh)" type="number" value={formData.methane_slip_gch4_kwh} onChange={(e) => handleChange('methane_slip_gch4_kwh', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
            <TextField label="N2O Emissions (gN2O/kWh)" type="number" value={formData.n2o_emissions_gn2o_kwh} onChange={(e) => handleChange('n2o_emissions_gn2o_kwh', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
          </Box>

          <Typography sx={{ color: '#22d3ee', fontWeight: 600, mb: 2 }}>
            Compliance
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Target GHG Intensity" type="number" value={formData.target_ghg_intensity} onChange={(e) => handleChange('target_ghg_intensity', Number(e.target.value))} size="small" fullWidth />
            <TextField label="Compliance Balance" type="number" value={formData.compliance_balance} onChange={(e) => handleChange('compliance_balance', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
            <TextField label="Compliance Status" select value={formData.compliance_status} onChange={(e) => handleChange('compliance_status', e.target.value)} size="small" fullWidth>
              {complianceStatuses.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
            </TextField>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={<Switch checked={formData.rfnbo_subtarget_met} onChange={(e) => handleChange('rfnbo_subtarget_met', e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#22d3ee' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#22d3ee' } }} />}
                label="RFNBO Subtarget Met"
                sx={{ color: 'grey.300' }}
              />
            </Box>
          </Box>

          <Typography sx={{ color: '#22d3ee', fontWeight: 600, mb: 2 }}>
            Certification & Feedstock
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Certification Scheme" select value={formData.certification_scheme} onChange={(e) => handleChange('certification_scheme', e.target.value)} size="small" fullWidth>
              {certificationSchemes.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
            </TextField>
            <TextField label="POS Number" value={formData.pos_number} onChange={(e) => handleChange('pos_number', e.target.value)} size="small" fullWidth />
            <TextField label="Feedstock Type" value={formData.feedstock_type} onChange={(e) => handleChange('feedstock_type', e.target.value)} size="small" fullWidth />
            <TextField label="E-Value (gCO2eq/MJ)" type="number" value={formData.e_value_gco2eq_mj} onChange={(e) => handleChange('e_value_gco2eq_mj', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
            <TextField label="Multiplier" type="number" value={formData.multiplier} onChange={(e) => handleChange('multiplier', Number(e.target.value))} size="small" fullWidth />
          </Box>

          <Typography sx={{ color: '#22d3ee', fontWeight: 600, mb: 2 }}>
            Pooling & Banking
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Pool ID" value={formData.pool_id} onChange={(e) => handleChange('pool_id', e.target.value)} size="small" fullWidth />
            <TextField label="Banking Balance" type="number" value={formData.banking_balance} onChange={(e) => handleChange('banking_balance', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
            <TextField label="Borrowing Amount" type="number" value={formData.borrowing_amount} onChange={(e) => handleChange('borrowing_amount', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
          </Box>

          <Typography sx={{ color: '#22d3ee', fontWeight: 600, mb: 2 }}>
            Shore Power (OPS)
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={<Switch checked={formData.ops_connected} onChange={(e) => handleChange('ops_connected', e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#22d3ee' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#22d3ee' } }} />}
                label="OPS Connected"
                sx={{ color: 'grey.300' }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={<Switch checked={formData.ops_exception_applied} onChange={(e) => handleChange('ops_exception_applied', e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#22d3ee' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#22d3ee' } }} />}
                label="OPS Exception Applied"
                sx={{ color: 'grey.300' }}
              />
            </Box>
            <TextField label="Shore Power (MWh)" type="number" value={formData.shore_power_mwh} onChange={(e) => handleChange('shore_power_mwh', e.target.value ? Number(e.target.value) : '')} size="small" fullWidth />
          </Box>

          <Typography sx={{ color: '#22d3ee', fontWeight: 600, mb: 2 }}>
            Verification
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField label="Verifier Name" value={formData.verifier_name} onChange={(e) => handleChange('verifier_name', e.target.value)} size="small" fullWidth />
            <TextField label="Verification Status" select value={formData.verification_status} onChange={(e) => handleChange('verification_status', e.target.value)} size="small" fullWidth>
              {verificationStatuses.map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
            </TextField>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={<Switch checked={formData.document_of_compliance_issued} onChange={(e) => handleChange('document_of_compliance_issued', e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#22d3ee' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#22d3ee' } }} />}
                label="Document of Compliance Issued"
                sx={{ color: 'grey.300' }}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSaving} sx={{ color: 'grey.400' }}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSaving} variant="contained" sx={{ bgcolor: '#22d3ee', '&:hover': { bgcolor: '#06b6d4' } }}>
          {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
