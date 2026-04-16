import { createClient } from '@/lib/supabase/server'
import type { FuelEuMaritimeCertificateData } from '@/lib/types/database'

export type FuelEuCertificateWithId = FuelEuMaritimeCertificateData & { id: string }

function formatDateForDisplay(dateStr: string | null): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export async function getFuelEuCertificates(sourceId: string, companyId: string, limit?: number): Promise<FuelEuCertificateWithId[]> {
  const supabase = await createClient()

  let query = supabase
    .from('fueleu_maritime_certificates')
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
    reporting_period: cert.reporting_period,
    imo_number: cert.imo_number,
    ship_name: cert.ship_name,
    ship_type: cert.ship_type,
    flag_state: cert.flag_state,
    gross_tonnage: Number(cert.gross_tonnage),
    shipowner_company: cert.shipowner_company,
    voyage_id: cert.voyage_id,
    port_of_departure: cert.port_of_departure,
    port_of_arrival: cert.port_of_arrival,
    departure_date: formatDateForDisplay(cert.departure_date) || '',
    arrival_date: formatDateForDisplay(cert.arrival_date) || '',
    voyage_type: cert.voyage_type,
    distance_nm: cert.distance_nm ? Number(cert.distance_nm) : null,
    time_at_sea_hours: cert.time_at_sea_hours ? Number(cert.time_at_sea_hours) : null,
    time_at_berth_hours: cert.time_at_berth_hours ? Number(cert.time_at_berth_hours) : null,
    fuel_type: cert.fuel_type,
    fuel_category: cert.fuel_category,
    fuel_consumption_sea_mt: cert.fuel_consumption_sea_mt ? Number(cert.fuel_consumption_sea_mt) : null,
    fuel_consumption_berth_mt: cert.fuel_consumption_berth_mt ? Number(cert.fuel_consumption_berth_mt) : null,
    total_fuel_consumption_mt: Number(cert.total_fuel_consumption_mt),
    lower_calorific_value_mj_kg: cert.lower_calorific_value_mj_kg ? Number(cert.lower_calorific_value_mj_kg) : null,
    energy_consumption_mj: cert.energy_consumption_mj ? Number(cert.energy_consumption_mj) : null,
    wtt_emission_factor: cert.wtt_emission_factor ? Number(cert.wtt_emission_factor) : null,
    ttw_emission_factor: cert.ttw_emission_factor ? Number(cert.ttw_emission_factor) : null,
    wtw_emission_factor: Number(cert.wtw_emission_factor),
    ghg_intensity_gco2eq_mj: Number(cert.ghg_intensity_gco2eq_mj),
    total_co2eq_emissions_mt: cert.total_co2eq_emissions_mt ? Number(cert.total_co2eq_emissions_mt) : null,
    methane_slip_gch4_kwh: cert.methane_slip_gch4_kwh ? Number(cert.methane_slip_gch4_kwh) : null,
    n2o_emissions_gn2o_kwh: cert.n2o_emissions_gn2o_kwh ? Number(cert.n2o_emissions_gn2o_kwh) : null,
    target_ghg_intensity: Number(cert.target_ghg_intensity),
    compliance_balance: cert.compliance_balance ? Number(cert.compliance_balance) : null,
    compliance_status: cert.compliance_status,
    rfnbo_subtarget_met: cert.rfnbo_subtarget_met,
    certification_scheme: cert.certification_scheme,
    pos_number: cert.pos_number,
    feedstock_type: cert.feedstock_type,
    e_value_gco2eq_mj: cert.e_value_gco2eq_mj ? Number(cert.e_value_gco2eq_mj) : null,
    multiplier: Number(cert.multiplier) || 1.0,
    pool_id: cert.pool_id,
    banking_balance: cert.banking_balance ? Number(cert.banking_balance) : null,
    borrowing_amount: cert.borrowing_amount ? Number(cert.borrowing_amount) : null,
    ops_connected: cert.ops_connected,
    ops_exception_applied: cert.ops_exception_applied,
    shore_power_mwh: cert.shore_power_mwh ? Number(cert.shore_power_mwh) : null,
    verifier_name: cert.verifier_name,
    verification_status: cert.verification_status,
    document_of_compliance_issued: cert.document_of_compliance_issued,
  }))
}

export type FuelEuStats = {
  totalCertificates: number
  totalFuelConsumptionMt: number
  avgGhgIntensity: number
  compliantCount: number
  uniqueVessels: number
  latestReportingPeriod: number | null
}

export async function getFuelEuStats(sourceId: string, companyId: string): Promise<FuelEuStats> {
  const supabase = await createClient()

  const { data, count } = await supabase
    .from('fueleu_maritime_certificates')
    .select('total_fuel_consumption_mt, ghg_intensity_gco2eq_mj, compliance_status, imo_number, reporting_period', { count: 'exact' })
    .eq('company_id', companyId)
    .eq('source_id', sourceId)

  if (!data || data.length === 0) {
    return {
      totalCertificates: 0,
      totalFuelConsumptionMt: 0,
      avgGhgIntensity: 0,
      compliantCount: 0,
      uniqueVessels: 0,
      latestReportingPeriod: null,
    }
  }

  let totalFuelConsumptionMt = 0
  let totalGhgIntensity = 0
  let compliantCount = 0
  const uniqueImos = new Set<string>()
  let latestPeriod: number | null = null

  for (const cert of data) {
    totalFuelConsumptionMt += Number(cert.total_fuel_consumption_mt) || 0
    totalGhgIntensity += Number(cert.ghg_intensity_gco2eq_mj) || 0
    if (cert.compliance_status === 'compliant') compliantCount++
    uniqueImos.add(cert.imo_number)
    if (cert.reporting_period && (!latestPeriod || cert.reporting_period > latestPeriod)) {
      latestPeriod = cert.reporting_period
    }
  }

  return {
    totalCertificates: count || data.length,
    totalFuelConsumptionMt: Math.round(totalFuelConsumptionMt * 100) / 100,
    avgGhgIntensity: Math.round((totalGhgIntensity / data.length) * 100) / 100,
    compliantCount,
    uniqueVessels: uniqueImos.size,
    latestReportingPeriod: latestPeriod,
  }
}
