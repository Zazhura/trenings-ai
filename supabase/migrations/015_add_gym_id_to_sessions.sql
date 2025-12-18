-- Migration 015: Add gym_id to sessions table
-- Adds gym_id column and populates it from gyms table based on gym_slug

-- Add gym_id column (nullable initially, will be populated)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;

-- Populate gym_id from gyms table based on gym_slug
UPDATE sessions s
SET gym_id = g.id
FROM gyms g
WHERE s.gym_slug = g.slug
  AND s.gym_id IS NULL;

-- Create index on gym_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_gym_id ON sessions(gym_id);

-- Add comment explaining the relationship
COMMENT ON COLUMN sessions.gym_id IS 'Gym ID reference. Populated from gyms table based on gym_slug.';

