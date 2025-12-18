-- Add gym-specific exercise tracking
-- This allows each gym to have their own "most used" exercises without duplicating the exercise base

-- Add created_by_gym_id to exercises (for tracking which gym created custom exercises)
ALTER TABLE exercises 
  ADD COLUMN IF NOT EXISTS created_by_gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL;

-- Add search_text column for faster searching
-- This combines name and aliases into a single searchable text field
-- Using a trigger instead of generated column for better compatibility
ALTER TABLE exercises 
  ADD COLUMN IF NOT EXISTS search_text TEXT;

-- Create function to update search_text
CREATE OR REPLACE FUNCTION update_exercise_search_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := LOWER(
    COALESCE(NEW.name, '') || ' ' || 
    COALESCE(array_to_string(NEW.aliases, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search_text
CREATE TRIGGER update_exercise_search_text_trigger
  BEFORE INSERT OR UPDATE OF name, aliases ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_exercise_search_text();

-- Update existing rows
UPDATE exercises 
SET search_text = LOWER(
  COALESCE(name, '') || ' ' || 
  COALESCE(array_to_string(aliases, ' '), '')
)
WHERE search_text IS NULL;

-- Enable pg_trgm extension if not already enabled (for trigram search)
-- Must be done BEFORE creating the index
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create index on search_text for fast text search
CREATE INDEX IF NOT EXISTS idx_exercises_search_text ON exercises USING GIN(search_text gin_trgm_ops);

-- Create gym_exercises junction table
CREATE TABLE IF NOT EXISTS gym_exercises (
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  used_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (gym_id, exercise_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_gym_exercises_gym_id ON gym_exercises(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_exercises_exercise_id ON gym_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_gym_exercises_used_count ON gym_exercises(gym_id, used_count DESC);
CREATE INDEX IF NOT EXISTS idx_gym_exercises_last_used_at ON gym_exercises(gym_id, last_used_at DESC NULLS LAST);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_gym_exercises_updated_at
  BEFORE UPDATE ON gym_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create RPC function to increment gym exercise usage
CREATE OR REPLACE FUNCTION increment_gym_exercise_use(
  p_gym_id UUID,
  p_exercise_id UUID
)
RETURNS TABLE (
  used_count INTEGER,
  last_used_at TIMESTAMPTZ
) AS $$
BEGIN
  INSERT INTO gym_exercises (gym_id, exercise_id, is_enabled, used_count, last_used_at)
  VALUES (p_gym_id, p_exercise_id, true, 1, NOW())
  ON CONFLICT (gym_id, exercise_id)
  DO UPDATE SET
    used_count = gym_exercises.used_count + 1,
    last_used_at = NOW(),
    updated_at = NOW()
  RETURNING gym_exercises.used_count, gym_exercises.last_used_at;
END;
$$ LANGUAGE plpgsql;

