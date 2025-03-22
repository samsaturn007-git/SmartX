-- First, create the storage.objects table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] DEFAULT string_to_array(name, '/'::text),
    version text,
    owner_id uuid REFERENCES auth.users(id),
    CONSTRAINT objects_pkey PRIMARY KEY (id),
    CONSTRAINT objects_buckets_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id) ON DELETE CASCADE
);

-- Create the accidents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('accidents', 'accidents', true, false, 52428800, '{image/jpeg,image/png,video/mp4}')
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow users to upload to own folder
DROP POLICY IF EXISTS "Allow users to upload to own folder" ON storage.objects;
CREATE POLICY "Allow users to upload to own folder" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'accidents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to view own files
DROP POLICY IF EXISTS "Allow users to view own files" ON storage.objects;
CREATE POLICY "Allow users to view own files" ON storage.objects
FOR SELECT USING (
    bucket_id = 'accidents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update own files
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
CREATE POLICY "Allow users to update own files" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'accidents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete own files
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE USING (
    bucket_id = 'accidents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to all files
DROP POLICY IF EXISTS "Allow public read access to all files" ON storage.objects;
CREATE POLICY "Allow public read access to all files" ON storage.objects
FOR SELECT USING (
    bucket_id = 'accidents'
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT USAGE ON SCHEMA storage TO anon, authenticated;