'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { parseCSV, normalizeHeaders, transformBooleanField } from '@/lib/csv/parser'
import { validateHbeRows, type HbeCertificate } from '@/lib/validation/hbe'
import { validateSafRows, type SafCertificate } from '@/lib/validation/saf'

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

  const content = await file.text()
  const parseResult = parseCSV(content)

  if (!parseResult.success) {
    return { success: false, error: parseResult.error }
  }

  const normalizedRows = parseResult.data.map((row) => {
    const normalized = normalizeHeaders(row)
    if ('double_counting' in normalized) {
      normalized.double_counting = String(transformBooleanField(normalized.double_counting))
    }
    return normalized
  })

  const validation = validateHbeRows(normalizedRows)

  const timestamp = Date.now()
  const filePath = `${company.id}/${timestamp}_${file.name}`

  const fileBuffer = await file.arrayBuffer()
  const { error: storageError } = await supabase.storage
    .from('certificates')
    .upload(filePath, fileBuffer, {
      contentType: 'text/csv',
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

  const content = await file.text()
  const parseResult = parseCSV(content)

  if (!parseResult.success) {
    return { success: false, error: parseResult.error }
  }

  const normalizedRows = parseResult.data.map((row) => {
    const normalized = normalizeHeaders(row)
    // Transform boolean fields
    if ('corsia_eligible' in normalized) {
      normalized.corsia_eligible = String(transformBooleanField(normalized.corsia_eligible))
    }
    if ('eu_red_compliant' in normalized) {
      normalized.eu_red_compliant = String(transformBooleanField(normalized.eu_red_compliant))
    }
    return normalized
  })

  const validation = validateSafRows(normalizedRows)

  const timestamp = Date.now()
  const filePath = `${company.id}/${timestamp}_${file.name}`

  const fileBuffer = await file.arrayBuffer()
  const { error: storageError } = await supabase.storage
    .from('certificates')
    .upload(filePath, fileBuffer, {
      contentType: 'text/csv',
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
