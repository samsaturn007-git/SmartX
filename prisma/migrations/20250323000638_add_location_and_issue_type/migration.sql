-- Add new columns to Post table
ALTER TABLE "Post" 
ADD COLUMN "issue_type" TEXT NOT NULL DEFAULT 'environmental_hazard',
ADD COLUMN "latitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "longitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "location" TEXT NOT NULL DEFAULT '';

-- Remove default values after adding columns
ALTER TABLE "Post" 
ALTER COLUMN "issue_type" DROP DEFAULT,
ALTER COLUMN "latitude" DROP DEFAULT,
ALTER COLUMN "longitude" DROP DEFAULT,
ALTER COLUMN "location" DROP DEFAULT;