-- Enable Row Level Security on all new tables
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- EXERCISES TABLE POLICIES
-- ============================================
-- Platform Admin: Full CRUD
-- All authenticated users: Read-only
-- Anonymous: Read-only (for display)

-- Platform Admin can do everything
CREATE POLICY "Platform admin can manage exercises"
  ON exercises
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'platform_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'platform_admin'
    )
  );

-- Authenticated users can read active exercises
CREATE POLICY "Authenticated users can read exercises"
  ON exercises
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Anonymous users can read active exercises (for display)
CREATE POLICY "Anonymous users can read active exercises"
  ON exercises
  FOR SELECT
  TO anon
  USING (status = 'active');

-- ============================================
-- GYMS TABLE POLICIES
-- ============================================
-- Platform Admin: Full CRUD
-- Gym Admin: Read own gym
-- Coach: Read own gym
-- Anonymous: Read all (for display URLs)

-- Platform Admin can do everything
CREATE POLICY "Platform admin can manage gyms"
  ON gyms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'platform_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'platform_admin'
    )
  );

-- Gym Admin and Coach can read their gym
CREATE POLICY "Gym users can read their gym"
  ON gyms
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT gym_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('gym_admin', 'coach')
    )
  );

-- Anonymous can read all gyms (for display URLs)
CREATE POLICY "Anonymous users can read gyms"
  ON gyms
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- USER_ROLES TABLE POLICIES
-- ============================================
-- Platform Admin: Full CRUD
-- Gym Admin: Read own gym roles, invite coaches (insert coach roles for own gym)
-- Coach: Read own gym roles
-- Anonymous: No access

-- Platform Admin can do everything
CREATE POLICY "Platform admin can manage user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'platform_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'platform_admin'
    )
  );

-- Gym Admin can read roles for their gym
CREATE POLICY "Gym admin can read gym roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    gym_id IN (
      SELECT gym_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'gym_admin'
    )
  );

-- Gym Admin can invite coaches (insert coach role for their gym)
CREATE POLICY "Gym admin can invite coaches"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    role = 'coach'
    AND gym_id IN (
      SELECT gym_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'gym_admin'
    )
  );

-- Coach can read roles for their gym
CREATE POLICY "Coach can read gym roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    gym_id IN (
      SELECT gym_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'coach'
    )
  );

-- Users can read their own roles
CREATE POLICY "Users can read own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- TEMPLATES TABLE POLICIES
-- ============================================
-- Platform Admin: Read all (for support/debugging)
-- Gym Admin: Full CRUD for own gym
-- Coach: Full CRUD for own gym
-- Anonymous: Read all (for display)

-- Platform Admin can read all templates (for support)
CREATE POLICY "Platform admin can read all templates"
  ON templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'platform_admin'
    )
  );

-- Gym Admin can manage templates for their gym
CREATE POLICY "Gym admin can manage gym templates"
  ON templates
  FOR ALL
  TO authenticated
  USING (
    gym_id IN (
      SELECT gym_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'gym_admin'
    )
  )
  WITH CHECK (
    gym_id IN (
      SELECT gym_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'gym_admin'
    )
  );

-- Coach can manage templates for their gym
CREATE POLICY "Coach can manage gym templates"
  ON templates
  FOR ALL
  TO authenticated
  USING (
    gym_id IN (
      SELECT gym_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'coach'
    )
  )
  WITH CHECK (
    gym_id IN (
      SELECT gym_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'coach'
    )
  );

-- Anonymous can read all templates (for display)
CREATE POLICY "Anonymous users can read templates"
  ON templates
  FOR SELECT
  TO anon
  USING (true);

