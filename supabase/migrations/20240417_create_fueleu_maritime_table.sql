CREATE TABLE IF NOT EXISTS fueleu_maritime_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    certificate_id VARCHAR(50) NOT NULL,
    reporting_period INTEGER NOT NULL,

    imo_number VARCHAR(10) NOT NULL,
    ship_name VARCHAR(100) NOT NULL,
    ship_type VARCHAR(50) NOT NULL,
    flag_state VARCHAR(50) NOT NULL,
    gross_tonnage DECIMAL(10,2) NOT NULL,
    shipowner_company VARCHAR(150) NOT NULL,

    voyage_id VARCHAR(50),
    port_of_departure VARCHAR(100) NOT NULL,
    port_of_arrival VARCHAR(100) NOT NULL,
    departure_date DATE NOT NULL,
    arrival_date DATE NOT NULL,
    voyage_type VARCHAR(30) NOT NULL CHECK (voyage_type IN ('intra_eu', 'eu_to_third_country', 'third_country_to_eu', 'outermost_region')),
    distance_nm DECIMAL(10,2),
    time_at_sea_hours DECIMAL(8,2),
    time_at_berth_hours DECIMAL(8,2),

    fuel_type VARCHAR(50) NOT NULL CHECK (fuel_type IN ('HFO', 'VLSFO', 'LFO', 'MGO', 'MDO', 'LNG', 'Methanol', 'Ethanol', 'Ammonia', 'Hydrogen', 'Biodiesel', 'Bio-LNG', 'Bio-Methanol', 'E-Methanol', 'E-LNG', 'E-Ammonia', 'E-Hydrogen', 'Other')),
    fuel_category VARCHAR(30) NOT NULL CHECK (fuel_category IN ('fossil', 'biofuel', 'rfnbo', 'recycled_carbon_fuel', 'low_carbon')),
    fuel_consumption_sea_mt DECIMAL(12,4),
    fuel_consumption_berth_mt DECIMAL(12,4),
    total_fuel_consumption_mt DECIMAL(12,4) NOT NULL,
    lower_calorific_value_mj_kg DECIMAL(8,4),
    energy_consumption_mj DECIMAL(14,2),

    wtt_emission_factor DECIMAL(8,4),
    ttw_emission_factor DECIMAL(8,4),
    wtw_emission_factor DECIMAL(8,4) NOT NULL,
    ghg_intensity_gco2eq_mj DECIMAL(8,4) NOT NULL,
    total_co2eq_emissions_mt DECIMAL(12,4),
    methane_slip_gch4_kwh DECIMAL(8,4),
    n2o_emissions_gn2o_kwh DECIMAL(8,4),

    target_ghg_intensity DECIMAL(8,4) NOT NULL,
    compliance_balance DECIMAL(14,4),
    compliance_status VARCHAR(20) NOT NULL CHECK (compliance_status IN ('compliant', 'non_compliant', 'pending', 'banked', 'pooled')),
    rfnbo_subtarget_met BOOLEAN DEFAULT false,

    certification_scheme VARCHAR(30) CHECK (certification_scheme IN ('ISCC-EU', 'RSB-EU-RED', 'REDcert', '2BSvs', 'KZR-INiG', 'None', 'Other')),
    pos_number VARCHAR(50),
    feedstock_type VARCHAR(100),
    e_value_gco2eq_mj DECIMAL(8,4),
    multiplier DECIMAL(4,2) DEFAULT 1.0,

    pool_id VARCHAR(50),
    banking_balance DECIMAL(14,4),
    borrowing_amount DECIMAL(14,4),

    ops_connected BOOLEAN DEFAULT false,
    ops_exception_applied BOOLEAN DEFAULT false,
    shore_power_mwh DECIMAL(10,4),

    verifier_name VARCHAR(100),
    verification_status VARCHAR(20) NOT NULL CHECK (verification_status IN ('verified', 'pending', 'under_review', 'rejected')),
    document_of_compliance_issued BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fueleu_certificates_company_id ON fueleu_maritime_certificates(company_id);
CREATE INDEX IF NOT EXISTS idx_fueleu_certificates_source_id ON fueleu_maritime_certificates(source_id);
CREATE INDEX IF NOT EXISTS idx_fueleu_certificates_upload_id ON fueleu_maritime_certificates(upload_id);
CREATE INDEX IF NOT EXISTS idx_fueleu_certificates_imo_number ON fueleu_maritime_certificates(imo_number);
CREATE INDEX IF NOT EXISTS idx_fueleu_certificates_reporting_period ON fueleu_maritime_certificates(reporting_period);
CREATE INDEX IF NOT EXISTS idx_fueleu_certificates_fuel_type ON fueleu_maritime_certificates(fuel_type);
CREATE INDEX IF NOT EXISTS idx_fueleu_certificates_compliance_status ON fueleu_maritime_certificates(compliance_status);
CREATE INDEX IF NOT EXISTS idx_fueleu_certificates_company_source ON fueleu_maritime_certificates(company_id, source_id);

ALTER TABLE fueleu_maritime_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company FuelEU certificates"
    ON fueleu_maritime_certificates FOR SELECT
    USING (company_id IN (
        SELECT id FROM companies WHERE email = auth.jwt()->>'email'
    ));

CREATE POLICY "Users can insert own company FuelEU certificates"
    ON fueleu_maritime_certificates FOR INSERT
    WITH CHECK (company_id IN (
        SELECT id FROM companies WHERE email = auth.jwt()->>'email'
    ));

CREATE POLICY "Users can delete own company FuelEU certificates"
    ON fueleu_maritime_certificates FOR DELETE
    USING (company_id IN (
        SELECT id FROM companies WHERE email = auth.jwt()->>'email'
    ));

CREATE POLICY "Users can update own company FuelEU certificates"
    ON fueleu_maritime_certificates FOR UPDATE
    USING (company_id IN (
        SELECT id FROM companies WHERE email = auth.jwt()->>'email'
    ));
