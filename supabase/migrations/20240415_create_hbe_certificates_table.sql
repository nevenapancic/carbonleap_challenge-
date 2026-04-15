DROP TABLE IF EXISTS certificates;

CREATE TABLE IF NOT EXISTS hbe_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    certificate_id VARCHAR(50) NOT NULL,
    hbe_type VARCHAR(20) NOT NULL CHECK (hbe_type IN ('HBE-G', 'HBE-C', 'HBE-IXB', 'HBE-O')),
    energy_delivered_gj DECIMAL(12,2) NOT NULL,
    hbes_issued INTEGER NOT NULL,
    double_counting BOOLEAN NOT NULL DEFAULT false,
    multiplier DECIMAL(4,2) NOT NULL DEFAULT 1,
    feedstock VARCHAR(100) NOT NULL,
    nta8003_code VARCHAR(10) NOT NULL,
    delivery_date DATE NOT NULL,
    booking_date DATE NOT NULL,
    transport_sector VARCHAR(20) NOT NULL CHECK (transport_sector IN ('road', 'maritime', 'aviation', 'inland_waterway')),
    supplier_name VARCHAR(100) NOT NULL,
    rev_account_id VARCHAR(50) NOT NULL,
    verification_status VARCHAR(20) NOT NULL CHECK (verification_status IN ('verified', 'pending')),
    ghg_reduction_percentage DECIMAL(5,2) NOT NULL CHECK (ghg_reduction_percentage >= 60 AND ghg_reduction_percentage <= 100),
    sustainability_scheme VARCHAR(20) NOT NULL CHECK (sustainability_scheme IN ('ISCC-EU', 'ISCC-CORSIA', 'REDcert', 'RSB-EU', 'KZR INiG', '2BSvs', 'Other')),
    production_country VARCHAR(50) NOT NULL,
    pos_number VARCHAR(50) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hbe_certificates_company_id ON hbe_certificates(company_id);
CREATE INDEX IF NOT EXISTS idx_hbe_certificates_source_id ON hbe_certificates(source_id);
CREATE INDEX IF NOT EXISTS idx_hbe_certificates_upload_id ON hbe_certificates(upload_id);
CREATE INDEX IF NOT EXISTS idx_hbe_certificates_hbe_type ON hbe_certificates(hbe_type);
CREATE INDEX IF NOT EXISTS idx_hbe_certificates_delivery_date ON hbe_certificates(delivery_date);
CREATE INDEX IF NOT EXISTS idx_hbe_certificates_company_source ON hbe_certificates(company_id, source_id);

ALTER TABLE hbe_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company certificates"
    ON hbe_certificates FOR SELECT
    USING (company_id IN (
        SELECT id FROM companies WHERE email = auth.jwt()->>'email'
    ));

CREATE POLICY "Users can insert own company certificates"
    ON hbe_certificates FOR INSERT
    WITH CHECK (company_id IN (
        SELECT id FROM companies WHERE email = auth.jwt()->>'email'
    ));

CREATE POLICY "Users can delete own company certificates"
    ON hbe_certificates FOR DELETE
    USING (company_id IN (
        SELECT id FROM companies WHERE email = auth.jwt()->>'email'
    ));
