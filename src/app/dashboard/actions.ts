'use server'

import { createClient } from '@/lib/supabase/server'
import type { HbeCertificateData, SafCertificateData, FuelEuMaritimeCertificateData } from '@/lib/types/database'

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

export type PaginatedFuelEuCertificatesResult = {
  certificates: (FuelEuMaritimeCertificateData & { id: string })[]
  totalCount: number
  totalPages: number
}

export async function getPaginatedFuelEuCertificates(
  sourceId: string,
  companyId: string,
  page: number,
  perPage: number
): Promise<PaginatedFuelEuCertificatesResult> {
  const supabase = await createClient()

  const { data: certs, count } = await supabase
    .from('fueleu_maritime_certificates')
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
    departure_date: formatDateForDisplay(cert.departure_date),
    arrival_date: formatDateForDisplay(cert.arrival_date),
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

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / perPage)

  return { certificates, totalCount, totalPages }
}

type DeleteResult = {
  success: boolean
  error?: string
}

type UpdateResult = {
  success: boolean
  error?: string
}

export async function deleteHbeCertificate(id: string): Promise<DeleteResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('hbe_certificates')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updateHbeCertificate(id: string, data: Partial<HbeCertificateData>): Promise<UpdateResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('hbe_certificates')
    .update(data)
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteSafCertificate(id: string): Promise<DeleteResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('saf_certificates')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updateSafCertificate(id: string, data: Partial<SafCertificateData>): Promise<UpdateResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('saf_certificates')
    .update(data)
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteFuelEuCertificate(id: string): Promise<DeleteResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('fueleu_maritime_certificates')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updateFuelEuCertificate(id: string, data: Partial<FuelEuMaritimeCertificateData>): Promise<UpdateResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('fueleu_maritime_certificates')
    .update(data)
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
