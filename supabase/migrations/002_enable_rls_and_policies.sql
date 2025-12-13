-- Enable Row Level Security on sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read and write sessions
CREATE POLICY "Authenticated users can read sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sessions"
  ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sessions"
  ON sessions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sessions"
  ON sessions
  FOR DELETE
  TO authenticated
  USING (true);

-- Policy: Anonymous users can read sessions (for display side)
CREATE POLICY "Anonymous users can read sessions"
  ON sessions
  FOR SELECT
  TO anon
  USING (true);

-- Note: Anonymous users cannot insert, update, or delete sessions
-- This ensures that only authenticated coaches can control sessions
-- while display screens can read the current session state

