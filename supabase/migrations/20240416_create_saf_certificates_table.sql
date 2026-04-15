CREATE TABLE IF NOT EXISTS saf_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    certificate_id VARCHAR(50) NOT NULL,
    batch_id VARCHAR(50),
    pos_number VARCHAR(50) NOT NULL,

    volume_liters DECIMAL(14,2) NOT NULL,
    volume_mt DECIMAL(12,4) NOT NULL,
    energy_content_mj DECIMAL(14,2),
    blend_percentage DECIMAL(5,2) CHECK (blend_percentage >= 0 AND blend_percentage <= 100),

    ghg_reduction_percentage DECIMAL(5,2) NOT NULL CHECK (ghg_reduction_percentage >= 0 AND ghg_reduction_percentage <= 100),
    core_lca_value DECIMAL(8,2),
    lifecycle_emissions_gco2e_mj DECIMAL(8,2),

    feedstock_type VARCHAR(100) NOT NULL,
    feedstock_country VARCHAR(50) NOT NULL,

    production_pathway VARCHAR(50) NOT NULL CHECK (production_pathway IN ('HEFA', 'FT', 'ATJ', 'SIP', 'PtL', 'CHJ', 'HC-HEFA', 'Co-processing', 'Other')),
    astm_pathway VARCHAR(20),

    producer_name VARCHAR(100) NOT NULL,
    production_facility VARCHAR(150),
    production_country VARCHAR(50) NOT NULL,

    certification_scheme VARCHAR(30) NOT NULL CHECK (certification_scheme IN ('ISCC-EU', 'ISCC-CORSIA', 'ISCC-PLUS', 'RSB-CORSIA', 'RSB-EU-RED', 'RSB-Global', 'REDcert', '2BSvs', 'Other')),
    certifying_body VARCHAR(100),
    verification_status VARCHAR(20) NOT NULL CHECK (verification_status IN ('verified', 'pending', 'under_review')),

    corsia_eligible BOOLEAN NOT NULL DEFAULT false,
    eu_red_compliant BOOLEAN NOT NULL DEFAULT false,

    issuance_date DATE NOT NULL,
    expiration_date DATE,
    delivery_date DATE NOT NULL,

    airline_name VARCHAR(100),
    destination_airport VARCHAR(10),

    certificate_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (certificate_status IN ('active', 'retired', 'expired', 'cancelled')),
    retirement_date DATE,
    retirement_beneficiary VARCHAR(150),

    chain_of_custody_type VARCHAR(20) CHECK (chain_of_custody_type IN ('mass_balance', 'segregation', 'book_and_claim')),
    supplier_name VARCHAR(100),

    sustainability_tier VARCHAR(1) CHECK (sustainability_tier IN ('A', 'B', 'C')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saf_certificates_company_id ON saf_certificates(company_id);
CREATE INDEX IF NOT EXISTS idx_saf_certificates_source_id ON saf_certificates(source_id);
CREATE INDEX IF NOT EXISTS idx_saf_certificates_upload_id ON saf_certificates(upload_id);
CREATE INDEX IF NOT EXISTS idx_saf_certificates_certification_scheme ON saf_certificates(certification_scheme);
CREATE INDEX IF NOT EXISTS idx_saf_certificates_production_pathway ON saf_certificates(production_pathway);
CREATE INDEX IF NOT EXISTS idx_saf_certificates_delivery_date ON saf_certificates(delivery_date);
CREATE INDEX IF NOT EXISTS idx_saf_certificates_company_source ON saf_certificates(company_id, source_id);
CREATE INDEX IF NOT EXISTS idx_saf_certificates_corsia_eligible ON saf_certificates(corsia_eligible);
CREATE INDEX IF NOT EXISTS idx_saf_certificates_status ON saf_certificates(certificate_status);

ALTER TABLE saf_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company SAF certificates"
    ON saf_certificates FOR SELECT
    USING (company_id IN (
        SELECT id FROM companies WHERE email = auth.jwt()->>'email'
    ));

CREATE POLICY "Users can insert own company SAF certificates"
    ON saf_certificates FOR INSERT
    WITH CHECK (company_id IN (
        SELECT id FROM companies WHERE email = auth.jwt()->>'email'
    ));

CREATE POLICY "Users can delete own company SAF certificates"
    ON saf_certificates FOR DELETE
    USING (company_id IN (
        SELECT id FROM companies WHERE email = auth.jwt()->>'email'
    ));

CREATE POLICY "Users can update own company SAF certificates"
    ON saf_certificates FOR UPDATE
    USING (company_id IN (
        SELECT id FROM companies WHERE email = auth.jwt()->>'email'
    ));
