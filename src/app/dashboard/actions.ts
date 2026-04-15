'use server'

import { createClient } from '@/lib/supabase/server'
import type { HbeCertificateData, SafCertificateData } from '@/lib/types/database'

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

// SAF Certificates Pagination
export type PaginatedSafCertificatesResult = {
  certificates: (SafCertificateData & { id: string })[]
  totalCount: number
  totalPages: number
}

function formatDateForDisplayNullable(dateStr: string | null): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export async function getPaginatedSafCertificates(
  sourceId: string,
  companyId: string,
  page: number,
  perPage: number
): Promise<PaginatedSafCertificatesResult> {
  const supabase = await createClient()

  const { data: certs, count } = await supabase
    .from('saf_certificates')
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
    batch_id: cert.batch_id,
    pos_number: cert.pos_number,
    volume_liters: Number(cert.volume_liters),
    volume_mt: Number(cert.volume_mt),
    energy_content_mj: cert.energy_content_mj ? Number(cert.energy_content_mj) : null,
    blend_percentage: cert.blend_percentage ? Number(cert.blend_percentage) : null,
    ghg_reduction_percentage: Number(cert.ghg_reduction_percentage),
    core_lca_value: cert.core_lca_value ? Number(cert.core_lca_value) : null,
    lifecycle_emissions_gco2e_mj: cert.lifecycle_emissions_gco2e_mj ? Number(cert.lifecycle_emissions_gco2e_mj) : null,
    feedstock_type: cert.feedstock_type,
    feedstock_country: cert.feedstock_country,
    production_pathway: cert.production_pathway,
    astm_pathway: cert.astm_pathway,
    producer_name: cert.producer_name,
    production_facility: cert.production_facility,
    production_country: cert.production_country,
    certification_scheme: cert.certification_scheme,
    certifying_body: cert.certifying_body,
    verification_status: cert.verification_status,
    corsia_eligible: cert.corsia_eligible,
    eu_red_compliant: cert.eu_red_compliant,
    issuance_date: formatDateForDisplay(cert.issuance_date),
    expiration_date: formatDateForDisplayNullable(cert.expiration_date),
    delivery_date: formatDateForDisplay(cert.delivery_date),
    airline_name: cert.airline_name,
    destination_airport: cert.destination_airport,
    certificate_status: cert.certificate_status,
    retirement_date: formatDateForDisplayNullable(cert.retirement_date),
    retirement_beneficiary: cert.retirement_beneficiary,
    chain_of_custody_type: cert.chain_of_custody_type,
    supplier_name: cert.supplier_name,
    sustainability_tier: cert.sustainability_tier,
  }))

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / perPage)

  return { certificates, totalCount, totalPages }
}
