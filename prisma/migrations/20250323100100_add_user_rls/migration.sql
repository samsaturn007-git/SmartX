-- Enable RLS on User table
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all users
CREATE POLICY "Allow authenticated users to read all users"
ON "public"."User"
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow users to update their own records
CREATE POLICY "Allow users to update their own records"
ON "public"."User"
FOR UPDATE
USING (auth.uid()::uuid = id);

-- Allow service role to manage all records
CREATE POLICY "Allow service role full access"
ON "public"."User"
FOR ALL
USING (auth.role() = 'service_role');

-- Allow users to insert their own records
CREATE POLICY "Allow users to insert their own records"
ON "public"."User"
FOR INSERT
WITH CHECK (auth.uid()::uuid = id);

-- Grant necessary permissions
GRANT ALL ON "public"."User" TO authenticated;
GRANT ALL ON "public"."User" TO service_role;