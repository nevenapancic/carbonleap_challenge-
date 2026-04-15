CREATE INDEX IF NOT EXISTS idx_certificates_raw_data
ON certificates USING GIN (raw_data);

CREATE INDEX IF NOT EXISTS idx_certificates_source_id
ON certificates (source_id);

CREATE INDEX IF NOT EXISTS idx_certificates_upload_id
ON certificates (upload_id);

CREATE INDEX IF NOT EXISTS idx_certificates_source_upload
ON certificates (source_id, upload_id);

CREATE OR REPLACE VIEW hbe_certificates_view AS
SELECT
  c.id,
  c.upload_id,
  c.source_id,
  c.created_at,
  c.raw_data->>'certificate_id' AS certificate_id,
  c.raw_data->>'hbe_type' AS hbe_type,
  (c.raw_data->>'energy_delivered_gj')::numeric AS energy_delivered_gj,
  (c.raw_data->>'hbes_issued')::integer AS hbes_issued,
  (c.raw_data->>'double_counting')::boolean AS double_counting,
  (c.raw_data->>'multiplier')::numeric AS multiplier,
  c.raw_data->>'feedstock' AS feedstock,
  c.raw_data->>'nta8003_code' AS nta8003_code,
  c.raw_data->>'delivery_date' AS delivery_date,
  c.raw_data->>'booking_date' AS booking_date,
  c.raw_data->>'transport_sector' AS transport_sector,
  c.raw_data->>'supplier_name' AS supplier_name,
  c.raw_data->>'rev_account_id' AS rev_account_id,
  c.raw_data->>'verification_status' AS verification_status,
  (c.raw_data->>'ghg_reduction_percentage')::numeric AS ghg_reduction_percentage,
  c.raw_data->>'sustainability_scheme' AS sustainability_scheme,
  c.raw_data->>'production_country' AS production_country,
  c.raw_data->>'pos_number' AS pos_number
FROM certificates c;
