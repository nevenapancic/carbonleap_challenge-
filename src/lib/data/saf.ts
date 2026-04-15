import { createClient } from '@/lib/supabase/server'
import type { SafCertificateData } from '@/lib/types/database'

export type SafCertificateWithId = SafCertificateData & { id: string }

function formatDateForDisplay(dateStr: string | null): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export async function getSafCertificates(sourceId: string, companyId: string, limit?: number): Promise<SafCertificateWithId[]> {
  const supabase = await createClient()

  let query = supabase
    .from('saf_certificates')
    .select('*')
    .eq('company_id', companyId)
    .eq('source_id', sourceId)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data } = await query

  if (!data) return []

  return data.map((cert) => ({
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
    issuance_date: formatDateForDisplay(cert.issuance_date) || '',
    expiration_date: formatDateForDisplay(cert.expiration_date),
    delivery_date: formatDateForDisplay(cert.delivery_date) || '',
    airline_name: cert.airline_name,
    destination_airport: cert.destination_airport,
    certificate_status: cert.certificate_status,
    retirement_date: formatDateForDisplay(cert.retirement_date),
    retirement_beneficiary: cert.retirement_beneficiary,
    chain_of_custody_type: cert.chain_of_custody_type,
    supplier_name: cert.supplier_name,
    sustainability_tier: cert.sustainability_tier,
  }))
}

export type SafStats = {
  totalCertificates: number
  totalVolumeMt: number
  totalVolumeLiters: number
  avgGhgReduction: number
  corsiaEligibleCount: number
  latestDeliveryDate: string | null
}

export async function getSafStats(sourceId: string, companyId: string): Promise<SafStats> {
  const supabase = await createClient()

  const { data, count } = await supabase
    .from('saf_certificates')
    .select('volume_mt, volume_liters, ghg_reduction_percentage, corsia_eligible, delivery_date', { count: 'exact' })
    .eq('company_id', companyId)
    .eq('source_id', sourceId)

  if (!data || data.length === 0) {
    return {
      totalCertificates: 0,
      totalVolumeMt: 0,
      totalVolumeLiters: 0,
      avgGhgReduction: 0,
      corsiaEligibleCount: 0,
      latestDeliveryDate: null,
    }
  }

  let totalVolumeMt = 0
  let totalVolumeLiters = 0
  let totalGhgReduction = 0
  let corsiaEligibleCount = 0
  let latestDate: Date | null = null

  for (const cert of data) {
    totalVolumeMt += Number(cert.volume_mt) || 0
    totalVolumeLiters += Number(cert.volume_liters) || 0
    totalGhgReduction += Number(cert.ghg_reduction_percentage) || 0
    if (cert.corsia_eligible) corsiaEligibleCount++

    if (cert.delivery_date) {
      const date = new Date(cert.delivery_date)
      if (!latestDate || date > latestDate) {
        latestDate = date
      }
    }
  }

  return {
    totalCertificates: count || data.length,
    totalVolumeMt: Math.round(totalVolumeMt * 100) / 100,
    totalVolumeLiters: Math.round(totalVolumeLiters),
    avgGhgReduction: Math.round((totalGhgReduction / data.length) * 10) / 10,
    corsiaEligibleCount,
    latestDeliveryDate: latestDate ? latestDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null,
  }
}
