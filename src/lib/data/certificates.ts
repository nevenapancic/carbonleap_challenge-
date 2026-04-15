import { createClient } from '@/lib/supabase/server'
import type { HbeCertificateData } from '@/lib/types/database'

export type HbeCertificateWithId = HbeCertificateData & { id: string }

function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export async function getHbeCertificates(sourceId: string, companyId: string, limit?: number): Promise<HbeCertificateWithId[]> {
  const supabase = await createClient()

  let query = supabase
    .from('hbe_certificates')
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
}

export type HbeStats = {
  totalCertificates: number
  totalEnergyGj: number
  totalHbesIssued: number
  latestDeliveryDate: string | null
}

export async function getHbeStats(sourceId: string, companyId: string): Promise<HbeStats> {
  const supabase = await createClient()

  const { data, count } = await supabase
    .from('hbe_certificates')
    .select('energy_delivered_gj, hbes_issued, delivery_date', { count: 'exact' })
    .eq('company_id', companyId)
    .eq('source_id', sourceId)

  if (!data || data.length === 0) {
    return {
      totalCertificates: 0,
      totalEnergyGj: 0,
      totalHbesIssued: 0,
      latestDeliveryDate: null,
    }
  }

  let totalEnergyGj = 0
  let totalHbesIssued = 0
  let latestDate: Date | null = null

  for (const cert of data) {
    totalEnergyGj += Number(cert.energy_delivered_gj) || 0
    totalHbesIssued += cert.hbes_issued || 0

    if (cert.delivery_date) {
      const date = new Date(cert.delivery_date)
      if (!latestDate || date > latestDate) {
        latestDate = date
      }
    }
  }

  return {
    totalCertificates: count || data.length,
    totalEnergyGj: Math.round(totalEnergyGj * 10) / 10,
    totalHbesIssued: Math.round(totalHbesIssued),
    latestDeliveryDate: latestDate ? latestDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null,
  }
}
