'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  parseCSV,
  parseJSON,
  parseExcel,
  detectFileFormat,
  normalizeHeaders,
  transformBooleanField,
  transformEmptyToNull,
  type ParseResult,
} from '@/lib/parsers/fileParser'
import { validateHbeRows, type HbeCertificate } from '@/lib/validation/hbe'
import { validateSafRows, type SafCertificate } from '@/lib/validation/saf'
import { validateFuelEuRows, type FuelEuMaritimeCertificate } from '@/lib/validation/fueleu'

async function parseFileContent(file: File): Promise<ParseResult> {
  const format = detectFileFormat(file.name)

  if (format === 'unknown') {
    return { success: false, error: 'Unsupported file format. Please upload CSV, JSON, or Excel files.' }
  }

  if (format === 'csv') {
    const content = await file.text()
    return parseCSV(content)
  } else if (format === 'json') {
    const content = await file.text()
    return parseJSON(content)
  } else {
    const buffer = await file.arrayBuffer()
    return parseExcel(buffer)
  }
}

function getContentType(filename: string): string {
  const format = detectFileFormat(filename)
  switch (format) {
    case 'csv':
      return 'text/csv'
    case 'json':
      return 'application/json'
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    default:
      return 'application/octet-stream'
  }
}

type UploadResult = {
  success: true
  uploadId: string
  validCount: number
  invalidCount: number
  errors: { row: number; message: string }[]
} | {
  success: false
  error: string
}

function parseDateToISO(dateStr: string): string {
  const parts = dateStr.split('/')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
}

export async function uploadHbeCertificates(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  const sourceId = formData.get('sourceId') as string
  if (!sourceId) {
    return { success: false, error: 'No source selected' }
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!company) {
    return { success: false, error: 'Company not found' }
  }

  await supabase
    .from('company_sources')
    .upsert(
      { company_id: company.id, source_id: sourceId },
      { onConflict: 'company_id,source_id' }
    )

  const parseResult = await parseFileContent(file)

  if (!parseResult.success) {
    return { success: false, error: parseResult.error }
  }

  const normalizedRows = parseResult.data.map((row) => {
    const normalized = normalizeHeaders(row)
    if ('double_counting' in normalized) {
      normalized.double_counting = String(transformBooleanField(normalized.double_counting))
    }
    return transformEmptyToNull(normalized)
  })

  const validation = validateHbeRows(normalizedRows)

  const timestamp = Date.now()
  const filePath = `${company.id}/${timestamp}_${file.name}`

  const fileBuffer = await file.arrayBuffer()
  const { error: storageError } = await supabase.storage
    .from('certificates')
    .upload(filePath, fileBuffer, {
      contentType: getContentType(file.name),
      upsert: false,
    })

  const fileUrl = storageError ? null : filePath

  const { data: upload, error: uploadError } = await supabase
    .from('uploads')
    .insert({
      company_id: company.id,
      source_id: sourceId,
      filename: file.name,
      file_url: fileUrl,
      status: 'done',
    })
    .select('id')
    .single()

  if (uploadError || !upload) {
    return { success: false, error: uploadError?.message || 'Failed to create upload record' }
  }

  const validCertificates = validation.valid.map((v) => {
    const data = v.result.success ? v.result.data as HbeCertificate : null
    if (!data) return null
    return {
      upload_id: upload.id,
      company_id: company.id,
      source_id: sourceId,
      certificate_id: data.certificate_id,
      hbe_type: data.hbe_type,
      energy_delivered_gj: data.energy_delivered_gj,
      hbes_issued: data.hbes_issued,
      double_counting: data.double_counting,
      multiplier: data.multiplier,
      feedstock: data.feedstock,
      nta8003_code: data.nta8003_code,
      delivery_date: parseDateToISO(data.delivery_date),
      booking_date: parseDateToISO(data.booking_date),
      transport_sector: data.transport_sector,
      supplier_name: data.supplier_name,
      rev_account_id: data.rev_account_id,
      verification_status: data.verification_status,
      ghg_reduction_percentage: data.ghg_reduction_percentage,
      sustainability_scheme: data.sustainability_scheme,
      production_country: data.production_country,
      pos_number: data.pos_number,
    }
  }).filter(Boolean)

  if (validCertificates.length > 0) {
    const { error: certError } = await supabase
      .from('hbe_certificates')
      .insert(validCertificates)

    if (certError) {
      await supabase
        .from('uploads')
        .update({ status: 'failed' })
        .eq('id', upload.id)

      return { success: false, error: certError.message }
    }
  }

  revalidatePath('/dashboard')

  const errors = validation.invalid.map((inv) => ({
    row: inv.index + 2,
    message: !inv.result.success
      ? inv.result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      : 'Unknown error',
  }))

  return {
    success: true,
    uploadId: upload.id,
    validCount: validation.valid.length,
    invalidCount: validation.invalid.length,
    errors,
  }
}

export async function uploadSafCertificates(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  const sourceId = formData.get('sourceId') as string
  if (!sourceId) {
    return { success: false, error: 'No source selected' }
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!company) {
    return { success: false, error: 'Company not found' }
  }

  await supabase
    .from('company_sources')
    .upsert(
      { company_id: company.id, source_id: sourceId },
      { onConflict: 'company_id,source_id' }
    )

  const parseResult = await parseFileContent(file)

  if (!parseResult.success) {
    return { success: false, error: parseResult.error }
  }

  const normalizedRows = parseResult.data.map((row) => {
    const normalized = normalizeHeaders(row)
    if ('corsia_eligible' in normalized) {
      normalized.corsia_eligible = String(transformBooleanField(normalized.corsia_eligible))
    }
    if ('eu_red_compliant' in normalized) {
      normalized.eu_red_compliant = String(transformBooleanField(normalized.eu_red_compliant))
    }
    return transformEmptyToNull(normalized)
  })

  const validation = validateSafRows(normalizedRows)

  const timestamp = Date.now()
  const filePath = `${company.id}/${timestamp}_${file.name}`

  const fileBuffer = await file.arrayBuffer()
  const { error: storageError } = await supabase.storage
    .from('certificates')
    .upload(filePath, fileBuffer, {
      contentType: getContentType(file.name),
      upsert: false,
    })

  const fileUrl = storageError ? null : filePath

  const { data: upload, error: uploadError } = await supabase
    .from('uploads')
    .insert({
      company_id: company.id,
      source_id: sourceId,
      filename: file.name,
      file_url: fileUrl,
      status: 'done',
    })
    .select('id')
    .single()

  if (uploadError || !upload) {
    return { success: false, error: uploadError?.message || 'Failed to create upload record' }
  }

  const validCertificates = validation.valid.map((v) => {
    const data = v.result.success ? v.result.data as SafCertificate : null
    if (!data) return null
    return {
      upload_id: upload.id,
      company_id: company.id,
      source_id: sourceId,
      certificate_id: data.certificate_id,
      batch_id: data.batch_id || null,
      pos_number: data.pos_number,
      volume_liters: data.volume_liters,
      volume_mt: data.volume_mt,
      energy_content_mj: data.energy_content_mj || null,
      blend_percentage: data.blend_percentage || null,
      ghg_reduction_percentage: data.ghg_reduction_percentage,
      core_lca_value: data.core_lca_value || null,
      lifecycle_emissions_gco2e_mj: data.lifecycle_emissions_gco2e_mj || null,
      feedstock_type: data.feedstock_type,
      feedstock_country: data.feedstock_country,
      production_pathway: data.production_pathway,
      astm_pathway: data.astm_pathway || null,
      producer_name: data.producer_name,
      production_facility: data.production_facility || null,
      production_country: data.production_country,
      certification_scheme: data.certification_scheme,
      certifying_body: data.certifying_body || null,
      verification_status: data.verification_status,
      corsia_eligible: data.corsia_eligible,
      eu_red_compliant: data.eu_red_compliant,
      issuance_date: parseDateToISO(data.issuance_date),
      expiration_date: data.expiration_date ? parseDateToISO(data.expiration_date) : null,
      delivery_date: parseDateToISO(data.delivery_date),
      airline_name: data.airline_name || null,
      destination_airport: data.destination_airport || null,
      certificate_status: data.certificate_status || 'active',
      retirement_date: data.retirement_date ? parseDateToISO(data.retirement_date) : null,
      retirement_beneficiary: data.retirement_beneficiary || null,
      chain_of_custody_type: data.chain_of_custody_type || null,
      supplier_name: data.supplier_name || null,
      sustainability_tier: data.sustainability_tier || null,
    }
  }).filter(Boolean)

  if (validCertificates.length > 0) {
    const { error: certError } = await supabase
      .from('saf_certificates')
      .insert(validCertificates)

    if (certError) {
      await supabase
        .from('uploads')
        .update({ status: 'failed' })
        .eq('id', upload.id)

      return { success: false, error: certError.message }
    }
  }

  revalidatePath('/dashboard')

  const errors = validation.invalid.map((inv) => ({
    row: inv.index + 2,
    message: !inv.result.success
      ? inv.result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      : 'Unknown error',
  }))

  return {
    success: true,
    uploadId: upload.id,
    validCount: validation.valid.length,
    invalidCount: validation.invalid.length,
    errors,
  }
}

export async function uploadFuelEuCertificates(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  const sourceId = formData.get('sourceId') as string
  if (!sourceId) {
    return { success: false, error: 'No source selected' }
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!company) {
    return { success: false, error: 'Company not found' }
  }

  await supabase
    .from('company_sources')
    .upsert(
      { company_id: company.id, source_id: sourceId },
      { onConflict: 'company_id,source_id' }
    )

  const parseResult = await parseFileContent(file)

  if (!parseResult.success) {
    return { success: false, error: parseResult.error }
  }

  const normalizedRows = parseResult.data.map((row) => {
    const normalized = normalizeHeaders(row)
    if ('rfnbo_subtarget_met' in normalized) {
      normalized.rfnbo_subtarget_met = String(transformBooleanField(normalized.rfnbo_subtarget_met))
    }
    if ('ops_connected' in normalized) {
      normalized.ops_connected = String(transformBooleanField(normalized.ops_connected))
    }
    if ('ops_exception_applied' in normalized) {
      normalized.ops_exception_applied = String(transformBooleanField(normalized.ops_exception_applied))
    }
    if ('document_of_compliance_issued' in normalized) {
      normalized.document_of_compliance_issued = String(transformBooleanField(normalized.document_of_compliance_issued))
    }
    return transformEmptyToNull(normalized)
  })

  const validation = validateFuelEuRows(normalizedRows)

  const timestamp = Date.now()
  const filePath = `${company.id}/${timestamp}_${file.name}`

  const fileBuffer = await file.arrayBuffer()
  const { error: storageError } = await supabase.storage
    .from('certificates')
    .upload(filePath, fileBuffer, {
      contentType: getContentType(file.name),
      upsert: false,
    })

  const fileUrl = storageError ? null : filePath

  const { data: upload, error: uploadError } = await supabase
    .from('uploads')
    .insert({
      company_id: company.id,
      source_id: sourceId,
      filename: file.name,
      file_url: fileUrl,
      status: 'done',
    })
    .select('id')
    .single()

  if (uploadError || !upload) {
    return { success: false, error: uploadError?.message || 'Failed to create upload record' }
  }

  const validFuelEuCerts = validation.valid.map((v) => {
    const data = v.result.success ? v.result.data as FuelEuMaritimeCertificate : null
    if (!data) return null
    return {
      upload_id: upload.id,
      company_id: company.id,
      source_id: sourceId,
      certificate_id: data.certificate_id,
      reporting_period: data.reporting_period,
      imo_number: data.imo_number,
      ship_name: data.ship_name,
      ship_type: data.ship_type,
      flag_state: data.flag_state,
      gross_tonnage: data.gross_tonnage,
      shipowner_company: data.shipowner_company,
      voyage_id: data.voyage_id || null,
      port_of_departure: data.port_of_departure,
      port_of_arrival: data.port_of_arrival,
      departure_date: parseDateToISO(data.departure_date),
      arrival_date: parseDateToISO(data.arrival_date),
      voyage_type: data.voyage_type,
      distance_nm: data.distance_nm || null,
      time_at_sea_hours: data.time_at_sea_hours || null,
      time_at_berth_hours: data.time_at_berth_hours || null,
      fuel_type: data.fuel_type,
      fuel_category: data.fuel_category,
      fuel_consumption_sea_mt: data.fuel_consumption_sea_mt || null,
      fuel_consumption_berth_mt: data.fuel_consumption_berth_mt || null,
      total_fuel_consumption_mt: data.total_fuel_consumption_mt,
      lower_calorific_value_mj_kg: data.lower_calorific_value_mj_kg || null,
      energy_consumption_mj: data.energy_consumption_mj || null,
      wtt_emission_factor: data.wtt_emission_factor || null,
      ttw_emission_factor: data.ttw_emission_factor || null,
      wtw_emission_factor: data.wtw_emission_factor,
      ghg_intensity_gco2eq_mj: data.ghg_intensity_gco2eq_mj,
      total_co2eq_emissions_mt: data.total_co2eq_emissions_mt || null,
      methane_slip_gch4_kwh: data.methane_slip_gch4_kwh || null,
      n2o_emissions_gn2o_kwh: data.n2o_emissions_gn2o_kwh || null,
      target_ghg_intensity: data.target_ghg_intensity,
      compliance_balance: data.compliance_balance || null,
      compliance_status: data.compliance_status,
      rfnbo_subtarget_met: data.rfnbo_subtarget_met,
      certification_scheme: data.certification_scheme || null,
      pos_number: data.pos_number || null,
      feedstock_type: data.feedstock_type || null,
      e_value_gco2eq_mj: data.e_value_gco2eq_mj || null,
      multiplier: data.multiplier || 1.0,
      pool_id: data.pool_id || null,
      banking_balance: data.banking_balance || null,
      borrowing_amount: data.borrowing_amount || null,
      ops_connected: data.ops_connected,
      ops_exception_applied: data.ops_exception_applied,
      shore_power_mwh: data.shore_power_mwh || null,
      verifier_name: data.verifier_name || null,
      verification_status: data.verification_status,
      document_of_compliance_issued: data.document_of_compliance_issued,
    }
  }).filter(Boolean)

  if (validFuelEuCerts.length > 0) {
    const { error: certError } = await supabase
      .from('fueleu_maritime_certificates')
      .insert(validFuelEuCerts)

    if (certError) {
      await supabase
        .from('uploads')
        .update({ status: 'failed' })
        .eq('id', upload.id)

      return { success: false, error: certError.message }
    }
  }

  revalidatePath('/dashboard')

  const fuelEuErrors = validation.invalid.map((inv) => ({
    row: inv.index + 2,
    message: !inv.result.success
      ? inv.result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      : 'Unknown error',
  }))

  return {
    success: true,
    uploadId: upload.id,
    validCount: validation.valid.length,
    invalidCount: validation.invalid.length,
    errors: fuelEuErrors,
  }
}
