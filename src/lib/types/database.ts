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
  file_url: string | null;
  status: UploadStatus;
  uploaded_at: string;
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
  nta8003_code: string;
  delivery_date: string;
  booking_date: string;
  transport_sector: TransportSector;
  supplier_name: string;
  rev_account_id: string;
  verification_status: VerificationStatus;
  ghg_reduction_percentage: number;
  sustainability_scheme: SustainabilityScheme;
  production_country: string;
  pos_number: string;
};

// SAF Certificate Types
export type SafProductionPathway =
  | 'HEFA'
  | 'FT'
  | 'ATJ'
  | 'SIP'
  | 'PtL'
  | 'CHJ'
  | 'HC-HEFA'
  | 'Co-processing'
  | 'Other';

export type SafCertificationScheme =
  | 'ISCC-EU'
  | 'ISCC-CORSIA'
  | 'ISCC-PLUS'
  | 'RSB-CORSIA'
  | 'RSB-EU-RED'
  | 'RSB-Global'
  | 'REDcert'
  | '2BSvs'
  | 'Other';

export type SafVerificationStatus = 'verified' | 'pending' | 'under_review';

export type SafCertificateStatus = 'active' | 'retired' | 'expired' | 'cancelled';

export type SafChainOfCustodyType = 'mass_balance' | 'segregation' | 'book_and_claim';

export type SafSustainabilityTier = 'A' | 'B' | 'C';

export type SafCertificateData = {
  // Certificate Identification
  certificate_id: string;
  batch_id: string | null;
  pos_number: string;

  // Volume & Quantity
  volume_liters: number;
  volume_mt: number;
  energy_content_mj: number | null;
  blend_percentage: number | null;

  // GHG & Emissions Data
  ghg_reduction_percentage: number;
  core_lca_value: number | null;
  lifecycle_emissions_gco2e_mj: number | null;

  // Feedstock Information
  feedstock_type: string;
  feedstock_country: string;

  // Production Pathway & Process
  production_pathway: SafProductionPathway;
  astm_pathway: string | null;

  // Producer/Facility Information
  producer_name: string;
  production_facility: string | null;
  production_country: string;

  // Certification & Verification
  certification_scheme: SafCertificationScheme;
  certifying_body: string | null;
  verification_status: SafVerificationStatus;

  // Regulatory Compliance
  corsia_eligible: boolean;
  eu_red_compliant: boolean;

  // Dates
  issuance_date: string;
  expiration_date: string | null;
  delivery_date: string;

  // Aviation/Operator Information
  airline_name: string | null;
  destination_airport: string | null;

  // Ownership & Status
  certificate_status: SafCertificateStatus;
  retirement_date: string | null;
  retirement_beneficiary: string | null;

  // Chain of Custody
  chain_of_custody_type: SafChainOfCustodyType | null;
  supplier_name: string | null;

  // Sustainability Tier
  sustainability_tier: SafSustainabilityTier | null;
};
