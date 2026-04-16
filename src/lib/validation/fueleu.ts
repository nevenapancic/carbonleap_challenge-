import { z } from 'zod';

export const FuelEuFuelTypeEnum = z.enum([
  'HFO',
  'VLSFO',
  'LFO',
  'MGO',
  'MDO',
  'LNG',
  'Methanol',
  'Ethanol',
  'Ammonia',
  'Hydrogen',
  'Biodiesel',
  'Bio-LNG',
  'Bio-Methanol',
  'E-Methanol',
  'E-LNG',
  'E-Ammonia',
  'E-Hydrogen',
  'Other',
]);

export const FuelEuFuelCategoryEnum = z.enum([
  'fossil',
  'biofuel',
  'rfnbo',
  'recycled_carbon_fuel',
  'low_carbon',
]);

export const FuelEuVoyageTypeEnum = z.enum([
  'intra_eu',
  'eu_to_third_country',
  'third_country_to_eu',
  'outermost_region',
]);

export const FuelEuComplianceStatusEnum = z.enum([
  'compliant',
  'non_compliant',
  'pending',
  'banked',
  'pooled',
]);

export const FuelEuCertificationSchemeEnum = z.enum([
  'ISCC-EU',
  'RSB-EU-RED',
  'REDcert',
  '2BSvs',
  'KZR-INiG',
  'None',
  'Other',
]);

export const FuelEuVerificationStatusEnum = z.enum([
  'verified',
  'pending',
  'under_review',
  'rejected',
]);

export const FuelEuMaritimeCertificateSchema = z.object({
  certificate_id: z.string().min(1),
  reporting_period: z.coerce.number().int().min(2020).max(2100),

  imo_number: z.string().min(1),
  ship_name: z.string().min(1),
  ship_type: z.string().min(1),
  flag_state: z.string().min(1),
  gross_tonnage: z.coerce.number().positive(),
  shipowner_company: z.string().min(1),

  voyage_id: z.string().optional().nullable(),
  port_of_departure: z.string().min(1),
  port_of_arrival: z.string().min(1),
  departure_date: z.string().min(1),
  arrival_date: z.string().min(1),
  voyage_type: FuelEuVoyageTypeEnum,
  distance_nm: z.coerce.number().positive().optional().nullable(),
  time_at_sea_hours: z.coerce.number().min(0).optional().nullable(),
  time_at_berth_hours: z.coerce.number().min(0).optional().nullable(),

  fuel_type: FuelEuFuelTypeEnum,
  fuel_category: FuelEuFuelCategoryEnum,
  fuel_consumption_sea_mt: z.coerce.number().min(0).optional().nullable(),
  fuel_consumption_berth_mt: z.coerce.number().min(0).optional().nullable(),
  total_fuel_consumption_mt: z.coerce.number().min(0),
  lower_calorific_value_mj_kg: z.coerce.number().positive().optional().nullable(),
  energy_consumption_mj: z.coerce.number().min(0).optional().nullable(),

  wtt_emission_factor: z.coerce.number().optional().nullable(),
  ttw_emission_factor: z.coerce.number().optional().nullable(),
  wtw_emission_factor: z.coerce.number(),
  ghg_intensity_gco2eq_mj: z.coerce.number(),
  total_co2eq_emissions_mt: z.coerce.number().min(0).optional().nullable(),
  methane_slip_gch4_kwh: z.coerce.number().min(0).optional().nullable(),
  n2o_emissions_gn2o_kwh: z.coerce.number().min(0).optional().nullable(),

  target_ghg_intensity: z.coerce.number(),
  compliance_balance: z.coerce.number().optional().nullable(),
  compliance_status: FuelEuComplianceStatusEnum,
  rfnbo_subtarget_met: z.coerce.boolean().default(false),

  certification_scheme: FuelEuCertificationSchemeEnum.optional().nullable(),
  pos_number: z.string().optional().nullable(),
  feedstock_type: z.string().optional().nullable(),
  e_value_gco2eq_mj: z.coerce.number().optional().nullable(),
  multiplier: z.coerce.number().default(1.0),

  pool_id: z.string().optional().nullable(),
  banking_balance: z.coerce.number().optional().nullable(),
  borrowing_amount: z.coerce.number().optional().nullable(),

  ops_connected: z.coerce.boolean().default(false),
  ops_exception_applied: z.coerce.boolean().default(false),
  shore_power_mwh: z.coerce.number().min(0).optional().nullable(),

  verifier_name: z.string().optional().nullable(),
  verification_status: FuelEuVerificationStatusEnum,
  document_of_compliance_issued: z.coerce.boolean().default(false),
});

export type FuelEuMaritimeCertificate = z.infer<typeof FuelEuMaritimeCertificateSchema>;

export function validateFuelEuRow(row: Record<string, unknown>) {
  return FuelEuMaritimeCertificateSchema.safeParse(row);
}

export function validateFuelEuRows(rows: Record<string, unknown>[]) {
  const results = rows.map((row, index) => ({
    index,
    result: validateFuelEuRow(row),
  }));

  const valid = results.filter((r) => r.result.success);
  const invalid = results.filter((r) => !r.result.success);

  return { valid, invalid, total: rows.length };
}
