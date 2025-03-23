-- Enable storage policies for authenticated users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow authenticated users to upload files'
    ) THEN
        CREATE POLICY "Allow authenticated users to upload files"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'accidents' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow users to update their own files'
    ) THEN
        CREATE POLICY "Allow users to update their own files"
        ON storage.objects FOR UPDATE
        USING (
            bucket_id = 'accidents'
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow users to delete their own files'
    ) THEN
        CREATE POLICY "Allow users to delete their own files"
        ON storage.objects FOR DELETE
        USING (
            bucket_id = 'accidents'
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow public read access to all files'
    ) THEN
        CREATE POLICY "Allow public read access to all files"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'accidents');
    END IF;
END $$;

-- Grant necessary permissions to authenticated users
DO $$ 
BEGIN
    EXECUTE 'GRANT ALL ON storage.objects TO authenticated';
    EXECUTE 'GRANT ALL ON storage.buckets TO authenticated';
EXCEPTION 
    WHEN OTHERS THEN NULL;
END $$;