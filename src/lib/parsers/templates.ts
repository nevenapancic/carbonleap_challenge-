import * as XLSX from 'xlsx'

export type CertificateType = 'hbe' | 'saf' | 'fueleu'

type TemplateField = {
  name: string
  example: string
  required: boolean
  description: string
}

const hbeFields: TemplateField[] = [
  { name: 'certificate_id', example: 'HBE-2024-001', required: true, description: 'Unique certificate identifier' },
  { name: 'hbe_type', example: 'HBE-G', required: true, description: 'Type: HBE-G, HBE-C, HBE-IXB, or HBE-O' },
  { name: 'energy_delivered_gj', example: '1250.5', required: true, description: 'Energy delivered in GJ' },
  { name: 'hbes_issued', example: '1250', required: true, description: 'Number of HBEs issued' },
  { name: 'double_counting', example: 'true', required: true, description: 'Boolean: true/false' },
  { name: 'multiplier', example: '2', required: true, description: 'Multiplier value' },
  { name: 'feedstock', example: 'Used cooking oil', required: true, description: 'Feedstock type' },
  { name: 'nta8003_code', example: '571', required: true, description: 'NTA 8003 code' },
  { name: 'delivery_date', example: '15/03/2024', required: true, description: 'Date format: DD/MM/YYYY' },
  { name: 'booking_date', example: '20/03/2024', required: true, description: 'Date format: DD/MM/YYYY' },
  { name: 'transport_sector', example: 'road', required: true, description: 'Sector: road, maritime, aviation, inland_waterway' },
  { name: 'supplier_name', example: 'Green Energy BV', required: true, description: 'Supplier name' },
  { name: 'rev_account_id', example: 'REV-NL-12345', required: true, description: 'REV account identifier' },
  { name: 'verification_status', example: 'verified', required: true, description: 'Status: verified or pending' },
  { name: 'ghg_reduction_percentage', example: '85', required: true, description: 'GHG reduction % (60-100)' },
  { name: 'sustainability_scheme', example: 'ISCC-EU', required: true, description: 'Scheme: ISCC-EU, REDcert, RSB-EU, etc.' },
  { name: 'production_country', example: 'Netherlands', required: true, description: 'Country of production' },
  { name: 'pos_number', example: 'POS-2024-NL-001', required: true, description: 'Proof of Sustainability number' },
]

const safFields: TemplateField[] = [
  { name: 'certificate_id', example: 'SAF-2024-001', required: true, description: 'Unique certificate identifier' },
  { name: 'batch_id', example: 'BATCH-001', required: false, description: 'Batch identifier' },
  { name: 'pos_number', example: 'POS-2024-SAF-001', required: true, description: 'Proof of Sustainability number' },
  { name: 'volume_liters', example: '50000', required: true, description: 'Volume in liters' },
  { name: 'volume_mt', example: '40', required: true, description: 'Volume in metric tons' },
  { name: 'energy_content_mj', example: '1720000', required: false, description: 'Energy content in MJ' },
  { name: 'blend_percentage', example: '50', required: false, description: 'Blend percentage (0-100)' },
  { name: 'ghg_reduction_percentage', example: '80', required: true, description: 'GHG reduction percentage' },
  { name: 'core_lca_value', example: '21.5', required: false, description: 'Core LCA value' },
  { name: 'lifecycle_emissions_gco2e_mj', example: '18.2', required: false, description: 'Lifecycle emissions gCO2e/MJ' },
  { name: 'feedstock_type', example: 'Used cooking oil', required: true, description: 'Type of feedstock' },
  { name: 'feedstock_country', example: 'Netherlands', required: true, description: 'Country of feedstock origin' },
  { name: 'production_pathway', example: 'HEFA', required: true, description: 'Pathway: HEFA, FT, ATJ, SIP, PtL, etc.' },
  { name: 'astm_pathway', example: 'D7566 Annex 2', required: false, description: 'ASTM pathway reference' },
  { name: 'producer_name', example: 'SkyNRG', required: true, description: 'Producer name' },
  { name: 'production_facility', example: 'Rotterdam Refinery', required: false, description: 'Production facility' },
  { name: 'production_country', example: 'Netherlands', required: true, description: 'Country of production' },
  { name: 'certification_scheme', example: 'ISCC-CORSIA', required: true, description: 'Scheme: ISCC-EU, ISCC-CORSIA, RSB-CORSIA, etc.' },
  { name: 'certifying_body', example: 'Control Union', required: false, description: 'Certifying body name' },
  { name: 'verification_status', example: 'verified', required: true, description: 'Status: verified, pending, under_review' },
  { name: 'corsia_eligible', example: 'true', required: true, description: 'CORSIA eligible: true/false' },
  { name: 'eu_red_compliant', example: 'true', required: true, description: 'EU RED compliant: true/false' },
  { name: 'issuance_date', example: '01/01/2024', required: true, description: 'Date format: DD/MM/YYYY' },
  { name: 'expiration_date', example: '01/01/2025', required: false, description: 'Date format: DD/MM/YYYY' },
  { name: 'delivery_date', example: '15/01/2024', required: true, description: 'Date format: DD/MM/YYYY' },
  { name: 'airline_name', example: 'KLM', required: false, description: 'Airline name' },
  { name: 'destination_airport', example: 'AMS', required: false, description: 'Destination airport code' },
  { name: 'certificate_status', example: 'active', required: false, description: 'Status: active, retired, expired, cancelled' },
  { name: 'retirement_date', example: '', required: false, description: 'Date format: DD/MM/YYYY' },
  { name: 'retirement_beneficiary', example: '', required: false, description: 'Beneficiary of retirement' },
  { name: 'chain_of_custody_type', example: 'mass_balance', required: false, description: 'Type: mass_balance, segregation, book_and_claim' },
  { name: 'supplier_name', example: 'SkyNRG', required: false, description: 'Supplier name' },
  { name: 'sustainability_tier', example: 'A', required: false, description: 'Tier: A, B, or C' },
]

const fueleuFields: TemplateField[] = [
  { name: 'certificate_id', example: 'FUELEU-2024-001', required: true, description: 'Unique certificate identifier' },
  { name: 'reporting_period', example: '2024', required: true, description: 'Reporting year (2020-2100)' },
  { name: 'imo_number', example: '9876543', required: true, description: 'IMO ship number' },
  { name: 'ship_name', example: 'MV Green Horizon', required: true, description: 'Ship name' },
  { name: 'ship_type', example: 'Container ship', required: true, description: 'Type of ship' },
  { name: 'flag_state', example: 'Netherlands', required: true, description: 'Flag state' },
  { name: 'gross_tonnage', example: '45000', required: true, description: 'Gross tonnage' },
  { name: 'shipowner_company', example: 'Maersk', required: true, description: 'Ship owner company' },
  { name: 'voyage_id', example: 'VOY-2024-001', required: false, description: 'Voyage identifier' },
  { name: 'port_of_departure', example: 'Rotterdam', required: true, description: 'Departure port' },
  { name: 'port_of_arrival', example: 'Hamburg', required: true, description: 'Arrival port' },
  { name: 'departure_date', example: '01/03/2024', required: true, description: 'Date format: DD/MM/YYYY' },
  { name: 'arrival_date', example: '02/03/2024', required: true, description: 'Date format: DD/MM/YYYY' },
  { name: 'voyage_type', example: 'intra_eu', required: true, description: 'Type: intra_eu, eu_to_third_country, third_country_to_eu, outermost_region' },
  { name: 'distance_nm', example: '250', required: false, description: 'Distance in nautical miles' },
  { name: 'time_at_sea_hours', example: '18', required: false, description: 'Time at sea in hours' },
  { name: 'time_at_berth_hours', example: '6', required: false, description: 'Time at berth in hours' },
  { name: 'fuel_type', example: 'VLSFO', required: true, description: 'Fuel type: HFO, VLSFO, LNG, Methanol, etc.' },
  { name: 'fuel_category', example: 'fossil', required: true, description: 'Category: fossil, biofuel, rfnbo, recycled_carbon_fuel, low_carbon' },
  { name: 'fuel_consumption_sea_mt', example: '45', required: false, description: 'Fuel consumption at sea (MT)' },
  { name: 'fuel_consumption_berth_mt', example: '5', required: false, description: 'Fuel consumption at berth (MT)' },
  { name: 'total_fuel_consumption_mt', example: '50', required: true, description: 'Total fuel consumption (MT)' },
  { name: 'lower_calorific_value_mj_kg', example: '42.7', required: false, description: 'Lower calorific value MJ/kg' },
  { name: 'energy_consumption_mj', example: '2135000', required: false, description: 'Energy consumption in MJ' },
  { name: 'wtt_emission_factor', example: '12.5', required: false, description: 'Well-to-tank emission factor' },
  { name: 'ttw_emission_factor', example: '72.3', required: false, description: 'Tank-to-wake emission factor' },
  { name: 'wtw_emission_factor', example: '84.8', required: true, description: 'Well-to-wake emission factor' },
  { name: 'ghg_intensity_gco2eq_mj', example: '91.2', required: true, description: 'GHG intensity gCO2eq/MJ' },
  { name: 'total_co2eq_emissions_mt', example: '158', required: false, description: 'Total CO2eq emissions (MT)' },
  { name: 'methane_slip_gch4_kwh', example: '0', required: false, description: 'Methane slip gCH4/kWh' },
  { name: 'n2o_emissions_gn2o_kwh', example: '0', required: false, description: 'N2O emissions gN2O/kWh' },
  { name: 'target_ghg_intensity', example: '89.34', required: true, description: 'Target GHG intensity' },
  { name: 'compliance_balance', example: '-1.86', required: false, description: 'Compliance balance' },
  { name: 'compliance_status', example: 'non_compliant', required: true, description: 'Status: compliant, non_compliant, pending, banked, pooled' },
  { name: 'rfnbo_subtarget_met', example: 'false', required: false, description: 'RFNBO subtarget met: true/false' },
  { name: 'certification_scheme', example: 'ISCC-EU', required: false, description: 'Certification scheme' },
  { name: 'pos_number', example: 'POS-2024-MAR-001', required: false, description: 'Proof of Sustainability number' },
  { name: 'feedstock_type', example: '', required: false, description: 'Feedstock type (for biofuels)' },
  { name: 'e_value_gco2eq_mj', example: '', required: false, description: 'E-value gCO2eq/MJ' },
  { name: 'multiplier', example: '1', required: false, description: 'Multiplier (default 1.0)' },
  { name: 'pool_id', example: '', required: false, description: 'Pool identifier' },
  { name: 'banking_balance', example: '', required: false, description: 'Banking balance' },
  { name: 'borrowing_amount', example: '', required: false, description: 'Borrowing amount' },
  { name: 'ops_connected', example: 'false', required: false, description: 'OPS connected: true/false' },
  { name: 'ops_exception_applied', example: 'false', required: false, description: 'OPS exception: true/false' },
  { name: 'shore_power_mwh', example: '', required: false, description: 'Shore power MWh' },
  { name: 'verifier_name', example: 'DNV GL', required: false, description: 'Verifier name' },
  { name: 'verification_status', example: 'verified', required: true, description: 'Status: verified, pending, under_review, rejected' },
  { name: 'document_of_compliance_issued', example: 'true', required: false, description: 'DoC issued: true/false' },
]

function getFieldsForType(type: CertificateType): TemplateField[] {
  switch (type) {
    case 'hbe':
      return hbeFields
    case 'saf':
      return safFields
    case 'fueleu':
      return fueleuFields
  }
}

export function generateCSVTemplate(type: CertificateType): string {
  const fields = getFieldsForType(type)
  const headers = fields.map((f) => f.name).join(',')
  const example = fields.map((f) => f.example).join(',')
  return `${headers}\n${example}`
}

export function generateJSONTemplate(type: CertificateType): string {
  const fields = getFieldsForType(type)
  const exampleRow: Record<string, string> = {}
  fields.forEach((f) => {
    exampleRow[f.name] = f.example
  })
  return JSON.stringify([exampleRow], null, 2)
}

export function generateExcelTemplate(type: CertificateType): ArrayBuffer {
  const fields = getFieldsForType(type)

  // Create workbook with two sheets: Data and Instructions
  const workbook = XLSX.utils.book_new()

  // Data sheet with headers and example row
  const dataHeaders = fields.map((f) => f.name)
  const dataExample = fields.map((f) => f.example)
  const dataSheet = XLSX.utils.aoa_to_sheet([dataHeaders, dataExample])

  // Set column widths
  dataSheet['!cols'] = fields.map(() => ({ wch: 20 }))

  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data')

  // Instructions sheet
  const instructionRows = [
    ['Field Name', 'Required', 'Description', 'Example'],
    ...fields.map((f) => [f.name, f.required ? 'Yes' : 'No', f.description, f.example]),
  ]
  const instructionSheet = XLSX.utils.aoa_to_sheet(instructionRows)
  instructionSheet['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 50 }, { wch: 25 }]

  XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instructions')

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  return buffer
}

export function getTemplateFilename(type: CertificateType, format: 'csv' | 'json' | 'xlsx'): string {
  const typeNames: Record<CertificateType, string> = {
    hbe: 'hbe_certificates',
    saf: 'saf_certificates',
    fueleu: 'fueleu_maritime_certificates',
  }
  return `${typeNames[type]}_template.${format}`
}
