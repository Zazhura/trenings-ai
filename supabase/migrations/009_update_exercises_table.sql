-- Update exercises table to match requirements
-- Add description, change equipment to array, add video_url and media_svg_url

-- Add new columns
ALTER TABLE exercises 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS media_svg_url TEXT;

-- Change equipment from TEXT to TEXT[]
-- Check if equipment column exists and is not already an array type
DO $$
BEGIN
  -- Check if equipment column exists and is TEXT (not TEXT[])
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exercises' 
    AND column_name = 'equipment' 
    AND data_type = 'text'
  ) THEN
    -- Convert existing TEXT values to arrays
    UPDATE exercises 
    SET equipment = CASE 
      WHEN equipment::text IS NULL THEN '{}'
      WHEN equipment::text = '' THEN '{}'
      ELSE ARRAY[equipment::text]
    END::text[]
    WHERE equipment IS NOT NULL;
    
    -- Drop old TEXT column and recreate as array
    ALTER TABLE exercises DROP COLUMN equipment;
    ALTER TABLE exercises ADD COLUMN equipment TEXT[] DEFAULT '{}';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exercises' 
    AND column_name = 'equipment'
  ) THEN
    -- Column doesn't exist, create it as array
    ALTER TABLE exercises ADD COLUMN equipment TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Rename video_asset_url to video_url if it exists and video_url is null
UPDATE exercises 
SET video_url = video_asset_url 
WHERE video_asset_url IS NOT NULL AND video_url IS NULL;

-- Drop old video_asset_url column (keep for now for backward compatibility, can be removed later)
-- ALTER TABLE exercises DROP COLUMN IF EXISTS video_asset_url;

