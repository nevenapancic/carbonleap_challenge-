import { z } from 'zod';

export const HbeTypeEnum = z.enum(['HBE-G', 'HBE-C', 'HBE-IXB', 'HBE-O']);

export const TransportSectorEnum = z.enum([
  'road',
  'maritime',
  'aviation',
  'inland_waterway',
]);

export const VerificationStatusEnum = z.enum(['verified', 'pending']);

export const SustainabilitySchemeEnum = z.enum([
  'ISCC-EU',
  'ISCC-CORSIA',
  'REDcert',
  'RSB-EU',
  'KZR INiG',
  '2BSvs',
  'Other',
]);

export const HbeCertificateSchema = z.object({
  certificate_id: z.string().min(1),
  hbe_type: HbeTypeEnum,
  energy_delivered_gj: z.coerce.number().positive(),
  hbes_issued: z.coerce.number().positive(),
  double_counting: z.coerce.boolean(),
  multiplier: z.coerce.number(),
  feedstock: z.string().min(1),
  nta8003_code: z.string().min(1),
  delivery_date: z.string().min(1),
  booking_date: z.string().min(1),
  transport_sector: TransportSectorEnum,
  supplier_name: z.string().min(1),
  rev_account_id: z.string().min(1),
  verification_status: VerificationStatusEnum,
  ghg_reduction_percentage: z.coerce.number().min(60).max(100),
  sustainability_scheme: SustainabilitySchemeEnum,
  production_country: z.string().min(1),
  pos_number: z.string().min(1),
});

export type HbeCertificate = z.infer<typeof HbeCertificateSchema>;

export function validateHbeRow(row: Record<string, unknown>) {
  return HbeCertificateSchema.safeParse(row);
}

export function validateHbeRows(rows: Record<string, unknown>[]) {
  const results = rows.map((row, index) => ({
    index,
    result: validateHbeRow(row),
  }));

  const valid = results.filter((r) => r.result.success);
  const invalid = results.filter((r) => !r.result.success);

  return { valid, invalid, total: rows.length };
}
