'use server'

import { createClient } from '@/lib/supabase/server'
import type { HbeCertificateData } from '@/lib/types/database'

export type PaginatedCertificatesResult = {
  certificates: (HbeCertificateData & { id: string })[]
  totalCount: number
  totalPages: number
}

export async function getPaginatedCertificates(
  sourceId: string,
  companyId: string,
  page: number,
  perPage: number
): Promise<PaginatedCertificatesResult> {
  const supabase = await createClient()

  // Get upload IDs for this company and source
  const { data: uploads } = await supabase
    .from('uploads')
    .select('id')
    .eq('company_id', companyId)
    .eq('source_id', sourceId)

  if (!uploads || uploads.length === 0) {
    return { certificates: [], totalCount: 0, totalPages: 0 }
  }

  const uploadIds = uploads.map(u => u.id)

  const { data: certs, count } = await supabase
    .from('certificates')
    .select('id, raw_data', { count: 'exact' })
    .eq('source_id', sourceId)
    .in('upload_id', uploadIds)
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  const certificates = certs
    ? certs.map((cert) => ({
        id: cert.id,
        ...(cert.raw_data as HbeCertificateData),
      }))
    : []

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / perPage)

  return { certificates, totalCount, totalPages }
}
