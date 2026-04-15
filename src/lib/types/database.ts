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
