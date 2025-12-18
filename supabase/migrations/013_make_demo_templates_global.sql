-- Make demo templates global by setting gym_id to NULL
-- Demo templates should be visible to all gyms

-- First, allow NULL in gym_id column
ALTER TABLE templates
  ALTER COLUMN gym_id DROP NOT NULL;

-- Update existing demo templates to have gym_id = NULL
UPDATE templates
SET gym_id = NULL
WHERE is_demo = true AND gym_id IS NOT NULL;

-- Add comment explaining the NULL gym_id for demo templates
COMMENT ON COLUMN templates.gym_id IS 'Gym ID for custom templates. NULL for global demo templates.';

