-- Create user_roles table to manage user roles per gym
-- Links Supabase auth.users to gyms with roles (platform_admin, gym_admin, coach)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE, -- NULL for platform_admin
  role TEXT NOT NULL CHECK (role IN ('platform_admin', 'gym_admin', 'coach')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure platform_admin has no gym_id
  CONSTRAINT platform_admin_no_gym CHECK (
    (role = 'platform_admin' AND gym_id IS NULL) OR
    (role != 'platform_admin')
  ),
  -- Ensure one role per user per gym (or one platform_admin per user)
  CONSTRAINT unique_user_gym_role UNIQUE (user_id, gym_id, role)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_gym_id ON user_roles(gym_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

