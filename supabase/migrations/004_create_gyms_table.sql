-- Create gyms table for multi-tenant support
-- Platform Admin creates gyms manually
CREATE TABLE IF NOT EXISTS gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE, -- URL-friendly identifier (e.g., 'crossfit-larvik')
  name TEXT NOT NULL, -- Display name
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_gyms_slug ON gyms(slug);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_gyms_updated_at
  BEFORE UPDATE ON gyms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

