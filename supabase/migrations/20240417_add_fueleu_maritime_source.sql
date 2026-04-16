INSERT INTO sources (id, name, unit_label, methodology_description, registry_type, color)
SELECT gen_random_uuid(), 'FuelEU Maritime', 'gCO2eq/MJ', 'EU Maritime fuel regulation compliance tracking with GHG intensity monitoring, well-to-wake emissions, and pooling/banking mechanisms', 'fueleu', 'cyan'
WHERE NOT EXISTS (SELECT 1 FROM sources WHERE name = 'FuelEU Maritime');
