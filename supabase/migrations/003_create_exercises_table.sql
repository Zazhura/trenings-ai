-- Create exercises table for global exercise library
-- Platform Admin only can write, all authenticated users can read
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Primary name (English)
  aliases TEXT[] DEFAULT '{}', -- Array of alternative names (Norwegian + English)
  category TEXT, -- e.g., 'strength', 'cardio', 'mobility'
  equipment TEXT, -- e.g., 'bodyweight', 'barbell', 'dumbbell'
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  motion_asset_url TEXT, -- URL to animated WebP (16:9 aspect ratio)
  video_asset_url TEXT, -- Optional URL to MP4 video (H.264, muted/loop)
  poster_url TEXT, -- Optional poster/still image for list views
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);
CREATE INDEX IF NOT EXISTS idx_exercises_status ON exercises(status);
CREATE INDEX IF NOT EXISTS idx_exercises_aliases ON exercises USING GIN(aliases);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

