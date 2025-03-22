-- Enable storage policies for authenticated users
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'accidents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'accidents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'accidents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow public read access to all files"
ON storage.objects FOR SELECT
USING (bucket_id = 'accidents');

-- Grant necessary permissions to authenticated users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;