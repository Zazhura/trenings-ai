-- Fix infinite recursion in user_roles RLS policies
-- The issue is that policies reference user_roles itself, creating circular dependencies

-- Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "Gym admin can read gym roles" ON user_roles;
DROP POLICY IF EXISTS "Coach can read gym roles" ON user_roles;
DROP POLICY IF EXISTS "Gym admin can read gym roles v2" ON user_roles;

-- Keep "Users can read own roles" - this is the base policy that should work
-- It's already defined in 008_enable_rls_multi_tenant.sql

-- Create a simpler policy for gym_admin and coach to read their own gym's roles
-- This uses a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION get_user_gym_ids(user_uuid UUID)
RETURNS TABLE(gym_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT ur.gym_id
  FROM user_roles ur
  WHERE ur.user_id = user_uuid
    AND ur.role IN ('gym_admin', 'coach')
    AND ur.gym_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_gym_ids(UUID) TO authenticated;

-- Recreate policies without recursion
-- Gym Admin can read roles for their gym (using the function)
CREATE POLICY "Gym admin can read gym roles v2"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM get_user_gym_ids(auth.uid()) g
      WHERE g.gym_id = user_roles.gym_id
    )
    AND role IN ('gym_admin', 'coach')
  );

-- Note: "Users can read own roles" policy already exists and should handle
-- the basic case of users reading their own roles without recursion

