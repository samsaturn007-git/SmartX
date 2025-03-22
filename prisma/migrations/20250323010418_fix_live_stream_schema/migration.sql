-- Add live streaming columns to Post table
ALTER TABLE "public"."Post"
ADD COLUMN IF NOT EXISTS "is_live" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "stream_id" TEXT,
ADD COLUMN IF NOT EXISTS "stream_url" TEXT,
ADD COLUMN IF NOT EXISTS "started_at" TIMESTAMP WITH TIME ZONE;

-- Create LiveViewer table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."LiveViewer" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "LiveViewer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LiveViewer_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE CASCADE,
    CONSTRAINT "LiveViewer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Add index for faster viewer counts
CREATE INDEX IF NOT EXISTS "LiveViewer_post_id_idx" ON "public"."LiveViewer"("post_id");

-- Enable RLS on LiveViewer table
ALTER TABLE "public"."LiveViewer" ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for LiveViewer
CREATE POLICY IF NOT EXISTS "Enable read access for all users"
    ON "public"."LiveViewer"
    FOR SELECT
    USING (true);

CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only"
    ON "public"."LiveViewer"
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable delete for own records"
    ON "public"."LiveViewer"
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add RLS policies for Post table live streaming
CREATE POLICY IF NOT EXISTS "Enable live stream updates for own posts"
    ON "public"."Post"
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON "public"."LiveViewer" TO authenticated;
GRANT ALL ON "public"."Post" TO authenticated;