-- Add new columns to Post table in Supabase
ALTER TABLE "public"."Post"
ADD COLUMN IF NOT EXISTS "issue_type" TEXT NOT NULL DEFAULT 'environmental_hazard',
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "location" TEXT NOT NULL DEFAULT '';

-- Remove default values after adding columns
ALTER TABLE "public"."Post"
ALTER COLUMN "issue_type" DROP DEFAULT,
ALTER COLUMN "latitude" DROP DEFAULT,
ALTER COLUMN "longitude" DROP DEFAULT,
ALTER COLUMN "location" DROP DEFAULT;