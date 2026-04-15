ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificates');

CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');
