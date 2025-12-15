-- Create templates table for gym-scoped templates
-- Gym Admin and Coach can CRUD templates for their gym
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false, -- Mark demo templates (read-only, can duplicate)
  blocks JSONB NOT NULL, -- Array of blocks with steps
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on gym_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_templates_gym_id ON templates(gym_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_demo ON templates(is_demo);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

