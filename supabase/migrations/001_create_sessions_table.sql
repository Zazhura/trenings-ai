-- Create sessions table for training session state management
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_slug TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'paused', 'stopped', 'ended')),
  current_block_index INTEGER NOT NULL DEFAULT 0,
  current_step_index INTEGER NOT NULL DEFAULT 0,
  step_end_time TIMESTAMPTZ,
  remaining_ms INTEGER,
  state_version INTEGER NOT NULL DEFAULT 1,
  template_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on gym_slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_gym_slug ON sessions(gym_slug);

-- Create index on status for filtering active sessions
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

