INSERT INTO sources (id, name, unit_label, methodology_description, registry_type, color)
SELECT
    gen_random_uuid(),
    'SAF',
    'MT',
    'Sustainable Aviation Fuel certificates representing verified SAF production and delivery. Certified under ICAO CORSIA, EU RED, or other recognized sustainability schemes (ISCC, RSB). Each certificate represents environmental attributes associated with one metric ton of neat SAF.',
    'saf',
    'blue'
WHERE NOT EXISTS (SELECT 1 FROM sources WHERE name = 'SAF');
