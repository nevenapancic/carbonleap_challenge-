import { createClient } from '@/lib/supabase/server'
import type { HbeCertificateData } from '@/lib/types/database'

export type HbeCertificateWithId = HbeCertificateData & { id: string }

export async function getHbeCertificates(sourceId: string, limit?: number): Promise<HbeCertificateWithId[]> {
  const supabase = await createClient()

  let query = supabase
    .from('certificates')
    .select('id, raw_data')
    .eq('source_id', sourceId)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data } = await query

  if (!data) return []

  return data.map((cert) => ({
    id: cert.id,
    ...(cert.raw_data as HbeCertificateData),
  }))
}

export type HbeStats = {
  totalCertificates: number
  totalEnergyGj: number
  totalHbesIssued: number
  latestDeliveryDate: string | null
}

function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export async function getHbeStats(sourceId: string): Promise<HbeStats> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('certificates')
    .select('raw_data')
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
    const raw = cert.raw_data as HbeCertificateData
    totalEnergyGj += raw.energy_delivered_gj || 0
    totalHbesIssued += raw.hbes_issued || 0

    if (raw.delivery_date) {
      const date = parseDate(raw.delivery_date)
      if (date && (!latestDate || date > latestDate)) {
        latestDate = date
      }
    }
  }

  return {
    totalCertificates: data.length,
    totalEnergyGj: Math.round(totalEnergyGj * 10) / 10,
    totalHbesIssued: Math.round(totalHbesIssued),
    latestDeliveryDate: latestDate ? formatDate(latestDate) : null,
  }
}
