/** @format */

export type Company = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type Source = {
  id: string;
  name: string;
  unit_label: string;
  methodology_description: string | null;
  registry_type: string | null;
  color: string | null;
};

export type CompanySource = {
  company_id: string;
  source_id: string;
};

export type UploadStatus = 'processing' | 'done' | 'failed';

export type Upload = {
  id: string;
  company_id: string;
  source_id: string;
  filename: string | null;
  status: UploadStatus;
  uploaded_at: string;
};

export type Certificate = {
  id: string;
  upload_id: string;
  source_id: string;
  raw_data: Record<string, unknown>;
  created_at: string;
};

export type HbeType = 'HBE-G' | 'HBE-C' | 'HBE-IXB' | 'HBE-O';

export type TransportSector =
  | 'road'
  | 'maritime'
  | 'aviation'
  | 'inland_waterway';

export type VerificationStatus = 'verified' | 'pending';

export type SustainabilityScheme =
  | 'ISCC-EU'
  | 'ISCC-CORSIA'
  | 'REDcert'
  | 'RSB-EU'
  | 'KZR INiG'
  | '2BSvs'
  | 'Other';

export type HbeCertificateData = {
  certificate_id: string;
  hbe_type: HbeType;
  energy_delivered_gj: number;
  hbes_issued: number;
  double_counting: boolean;
  multiplier: number;
  feedstock: string;
  nta8003_code: string; // NTA 8003 Dutch biomass classification (e.g., 572 = UCO, 131 = waste wood)
  delivery_date: string;
  booking_date: string;
  transport_sector: TransportSector;
  supplier_name: string;
  rev_account_id: string;
  verification_status: VerificationStatus;
  // New fields based on real NEa registry requirements
  ghg_reduction_percentage: number; // Must be ≥60% (or ≥65% for post-2021 installations)
  sustainability_scheme: SustainabilityScheme; // EU-recognized certification scheme
  production_country: string; // Country where biofuel was produced
  pos_number: string; // Proof of Sustainability document number
};
