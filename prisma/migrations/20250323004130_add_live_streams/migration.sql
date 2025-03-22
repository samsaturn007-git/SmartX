-- Add live stream support
ALTER TABLE "public"."Post"
ADD COLUMN "is_live" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stream_id" TEXT,
ADD COLUMN "stream_url" TEXT,
ADD COLUMN "started_at" TIMESTAMP WITH TIME ZONE;

-- Create live viewers table
CREATE TABLE "public"."LiveViewer" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "LiveViewer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LiveViewer_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE CASCADE,
    CONSTRAINT "LiveViewer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Add index for faster viewer counts
CREATE INDEX "LiveViewer_post_id_idx" ON "public"."LiveViewer"("post_id");

-- Add RLS policies for live viewers
ALTER TABLE "public"."LiveViewer" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
    ON "public"."LiveViewer"
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users only"
    ON "public"."LiveViewer"
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for own records"
    ON "public"."LiveViewer"
    FOR DELETE
    USING (auth.uid() = user_id);