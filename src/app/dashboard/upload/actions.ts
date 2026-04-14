'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { parseCSV, normalizeHeaders, transformBooleanField } from '@/lib/csv/parser'
import { validateHbeRows } from '@/lib/validation/hbe'

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

  const { data: upload, error: uploadError } = await supabase
    .from('uploads')
    .insert({
      company_id: company.id,
      source_id: sourceId,
      filename: file.name,
      status: 'processing',
    })
    .select('id')
    .single()

  if (uploadError || !upload) {
    return { success: false, error: uploadError?.message || 'Failed to create upload record' }
  }

  const validCertificates = validation.valid.map((v) => ({
    upload_id: upload.id,
    source_id: sourceId,
    raw_data: v.result.success ? v.result.data : {},
  }))

  if (validCertificates.length > 0) {
    const { error: certError } = await supabase
      .from('certificates')
      .insert(validCertificates)

    if (certError) {
      await supabase
        .from('uploads')
        .update({ status: 'failed' })
        .eq('id', upload.id)

      return { success: false, error: certError.message }
    }
  }

  const finalStatus = validation.invalid.length === 0 ? 'done' : 'done'
  await supabase
    .from('uploads')
    .update({ status: finalStatus })
    .eq('id', upload.id)

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
