'use server'

import { createClient } from '@/lib/supabase/server'
import type { HbeCertificateData } from '@/lib/types/database'

export type PaginatedCertificatesResult = {
  certificates: (HbeCertificateData & { id: string })[]
  totalCount: number
  totalPages: number
}

function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export async function getPaginatedCertificates(
  sourceId: string,
  companyId: string,
  page: number,
  perPage: number
): Promise<PaginatedCertificatesResult> {
  const supabase = await createClient()

  const { data: certs, count } = await supabase
    .from('hbe_certificates')
    .select('*', { count: 'exact' })
    .eq('company_id', companyId)
    .eq('source_id', sourceId)
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (!certs) {
    return { certificates: [], totalCount: 0, totalPages: 0 }
  }

  const certificates = certs.map((cert) => ({
    id: cert.id,
    certificate_id: cert.certificate_id,
    hbe_type: cert.hbe_type,
    energy_delivered_gj: Number(cert.energy_delivered_gj),
    hbes_issued: cert.hbes_issued,
    double_counting: cert.double_counting,
    multiplier: Number(cert.multiplier),
    feedstock: cert.feedstock,
    nta8003_code: cert.nta8003_code,
    delivery_date: formatDateForDisplay(cert.delivery_date),
    booking_date: formatDateForDisplay(cert.booking_date),
    transport_sector: cert.transport_sector,
    supplier_name: cert.supplier_name,
    rev_account_id: cert.rev_account_id,
    verification_status: cert.verification_status,
    ghg_reduction_percentage: Number(cert.ghg_reduction_percentage),
    sustainability_scheme: cert.sustainability_scheme,
    production_country: cert.production_country,
    pos_number: cert.pos_number,
  }))

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / perPage)

  return { certificates, totalCount, totalPages }
}
