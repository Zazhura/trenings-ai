-- Allow all authenticated users to read demo templates
-- This ensures demo templates are visible to all coaches/admins regardless of gym
-- Demo templates are read-only and can be duplicated to create custom templates

-- Drop policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Authenticated users can read demo templates" ON templates;

-- Create policy to allow all authenticated users to read demo templates
CREATE POLICY "Authenticated users can read demo templates"
  ON templates
  FOR SELECT
  TO authenticated
  USING (is_demo = true);

