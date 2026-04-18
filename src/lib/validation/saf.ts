/** @format */

import { z } from 'zod';

export const SafProductionPathwayEnum = z.enum([
  'HEFA',
  'FT',
  'ATJ',
  'SIP',
  'PtL',
  'CHJ',
  'HC-HEFA',
  'Co-processing',
  'Other',
]);

export const SafCertificationSchemeEnum = z.enum([
  'ISCC-EU',
  'ISCC-CORSIA',
  'ISCC-PLUS',
  'RSB-CORSIA',
  'RSB-EU-RED',
  'RSB-Global',
  'REDcert',
  '2BSvs',
  'Other',
]);

export const SafVerificationStatusEnum = z.enum([
  'verified',
  'pending',
  'under_review',
]);

export const SafCertificateStatusEnum = z.enum([
  'active',
  'retired',
  'expired',
  'cancelled',
]);

export const SafChainOfCustodyTypeEnum = z.enum([
  'mass_balance',
  'segregation',
  'book_and_claim',
]);

export const SafSustainabilityTierEnum = z.enum(['A', 'B', 'C']);

export const SafCertificateSchema = z.object({
  certificate_id: z.string().min(1),
  batch_id: z.string().optional().nullable(),
  pos_number: z.string().min(1),

  volume_liters: z.coerce.number().positive(),
  volume_mt: z.coerce.number().positive(),
  energy_content_mj: z.coerce.number().positive().optional().nullable(),
  blend_percentage: z.coerce.number().min(0).max(100).optional().nullable(),

  ghg_reduction_percentage: z.coerce.number().min(0).max(100),
  core_lca_value: z.coerce.number().optional().nullable(),
  lifecycle_emissions_gco2e_mj: z.coerce.number().optional().nullable(),

  feedstock_type: z.string().min(1),
  feedstock_country: z.string().min(1),

  production_pathway: SafProductionPathwayEnum,
  astm_pathway: z.string().optional().nullable(),

  producer_name: z.string().min(1),
  production_facility: z.string().optional().nullable(),
  production_country: z.string().min(1),

  certification_scheme: SafCertificationSchemeEnum,
  certifying_body: z.string().optional().nullable(),
  verification_status: SafVerificationStatusEnum,

  corsia_eligible: z.coerce.boolean(),
  eu_red_compliant: z.coerce.boolean(),

  issuance_date: z.string().min(1),
  expiration_date: z.string().optional().nullable(),
  delivery_date: z.string().min(1),

  airline_name: z.string().optional().nullable(),
  destination_airport: z.string().optional().nullable(),

  certificate_status: SafCertificateStatusEnum.default('active'),
  retirement_date: z.string().optional().nullable(),
  retirement_beneficiary: z.string().optional().nullable(),

  chain_of_custody_type: SafChainOfCustodyTypeEnum.optional().nullable(),
  supplier_name: z.string().optional().nullable(),

  sustainability_tier: SafSustainabilityTierEnum.optional().nullable(),
});

export type SafCertificate = z.infer<typeof SafCertificateSchema>;

export function validateSafRow(row: Record<string, unknown>) {
  return SafCertificateSchema.safeParse(row);
}

export function validateSafRows(rows: Record<string, unknown>[]) {
  const results = rows.map((row, index) => ({
    index,
    result: validateSafRow(row),
  }));

  const valid = results.filter((r) => r.result.success);
  const invalid = results.filter((r) => !r.result.success);

  return { valid, invalid, total: rows.length };
}
