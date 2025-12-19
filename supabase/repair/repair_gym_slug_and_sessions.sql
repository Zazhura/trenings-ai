-- ============================================================================
-- REPAIR SCRIPT: Fix gym slug duplication and sessions gym_id references
-- ============================================================================
-- 
-- PROBLEM:
-- - Duplicate gyms: 'crossfit-larvik' (canonical) and 'Crossfit_Larvik' (duplicate)
-- - Sessions with gym_slug='default-gym' have NULL gym_id
-- - Sessions with gym_slug='Crossfit_Larvik' reference duplicate gym
--
-- SOLUTION:
-- - Use 'crossfit-larvik' as canonical gym
-- - Update all affected sessions to reference canonical gym
-- - Optionally update other tables (commented out in STEP 2)
--
-- SAFETY:
-- - Wrapped in transaction (BEGIN/COMMIT) - can rollback before commit
-- - Validates canonical gym exists and is unique
-- - Does NOT delete duplicate gym by default (see STEP 2)
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 0: Show current situation
-- ============================================================================

DO $$
DECLARE
  canonical_gym_id UUID;
  duplicate_gym_id UUID;
  canonical_slug TEXT := 'crossfit-larvik';
  duplicate_slug TEXT := 'Crossfit_Larvik';
  default_slug TEXT := 'default-gym';
  sessions_to_fix_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REPAIR SCRIPT: Starting analysis...';
  RAISE NOTICE '========================================';
  
  -- Show current gyms situation
  RAISE NOTICE '';
  RAISE NOTICE '--- Current gyms ---';
  
  -- Check canonical gym exists
  SELECT id INTO canonical_gym_id
  FROM gyms
  WHERE slug = canonical_slug;
  
  IF canonical_gym_id IS NULL THEN
    RAISE EXCEPTION 'Canonical gym with slug ''%'' not found!', canonical_slug;
  END IF;
  
  -- Check for multiple canonical gyms (should not happen due to UNIQUE constraint, but verify)
  IF (SELECT COUNT(*) FROM gyms WHERE slug = canonical_slug) > 1 THEN
    RAISE EXCEPTION 'Multiple gyms found with canonical slug ''%''! This should not happen.', canonical_slug;
  END IF;
  
  -- Get duplicate gym id (may not exist)
  SELECT id INTO duplicate_gym_id
  FROM gyms
  WHERE slug = duplicate_slug;
  
  RAISE NOTICE 'Canonical gym: slug=''%'', id=%', canonical_slug, canonical_gym_id;
  IF duplicate_gym_id IS NOT NULL THEN
    RAISE NOTICE 'Duplicate gym: slug=''%'', id=%', duplicate_slug, duplicate_gym_id;
  ELSE
    RAISE NOTICE 'Duplicate gym: slug=''%'' NOT FOUND (may have been deleted already)', duplicate_slug;
  END IF;
  
  -- Show current sessions situation
  RAISE NOTICE '';
  RAISE NOTICE '--- Current sessions (before repair) ---';
  
  PERFORM * FROM (
    SELECT 
      gym_slug,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE gym_id IS NULL) as null_gym_id_count,
      COUNT(*) FILTER (WHERE gym_id IS NOT NULL) as set_gym_id_count
    FROM sessions
    WHERE gym_slug IN (canonical_slug, duplicate_slug, default_slug)
    GROUP BY gym_slug
    ORDER BY gym_slug
  ) AS summary;
  
  -- Count sessions that need fixing
  SELECT COUNT(*) INTO sessions_to_fix_count
  FROM sessions
  WHERE gym_slug IN (default_slug, duplicate_slug);
  
  RAISE NOTICE 'Sessions to fix: %', sessions_to_fix_count;
  
  -- Store IDs for use in UPDATE statements
  -- (Note: PostgreSQL variables in DO blocks are scoped, so we'll use them directly in UPDATE)
  
END $$;

-- ============================================================================
-- STEP 1: Fix sessions table
-- ============================================================================

DO $$
DECLARE
  canonical_gym_id UUID;
  duplicate_gym_id UUID;
  canonical_slug TEXT := 'crossfit-larvik';
  duplicate_slug TEXT := 'Crossfit_Larvik';
  default_slug TEXT := 'default-gym';
  updated_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- STEP 1: Updating sessions ---';
  
  -- Get canonical gym ID
  SELECT id INTO canonical_gym_id
  FROM gyms
  WHERE slug = canonical_slug;
  
  IF canonical_gym_id IS NULL THEN
    RAISE EXCEPTION 'Canonical gym with slug ''%'' not found!', canonical_slug;
  END IF;
  
  -- Update sessions: default-gym -> canonical
  UPDATE sessions
  SET 
    gym_slug = canonical_slug,
    gym_id = canonical_gym_id
  WHERE gym_slug = default_slug;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % sessions from ''%'' to canonical', updated_count, default_slug;
  
  -- Update sessions: Crossfit_Larvik -> canonical
  UPDATE sessions
  SET 
    gym_slug = canonical_slug,
    gym_id = canonical_gym_id
  WHERE gym_slug = duplicate_slug;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % sessions from ''%'' to canonical', updated_count, duplicate_slug;
  
END $$;

-- ============================================================================
-- STEP 2: Optional - Update other tables that reference gyms.id
-- ============================================================================
-- 
-- WARNING: Uncomment these sections ONLY if you want to migrate data from
-- duplicate gym to canonical gym in these tables as well.
-- 
-- This will:
-- - Update user_roles to point to canonical gym
-- - Update exercises.created_by_gym_id to point to canonical gym
-- - Update gym_exercises to point to canonical gym
-- - Update templates to point to canonical gym
--
-- ⚠️  REVIEW CAREFULLY BEFORE UNCOMMENTING ⚠️
-- ============================================================================

/*
DO $$
DECLARE
  canonical_gym_id UUID;
  duplicate_gym_id UUID;
  canonical_slug TEXT := 'crossfit-larvik';
  duplicate_slug TEXT := 'Crossfit_Larvik';
  updated_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- STEP 2: Updating other tables (OPTIONAL) ---';
  
  -- Get gym IDs
  SELECT id INTO canonical_gym_id FROM gyms WHERE slug = canonical_slug;
  SELECT id INTO duplicate_gym_id FROM gyms WHERE slug = duplicate_slug;
  
  IF canonical_gym_id IS NULL THEN
    RAISE EXCEPTION 'Canonical gym not found!';
  END IF;
  
  IF duplicate_gym_id IS NULL THEN
    RAISE NOTICE 'Duplicate gym not found, skipping other table updates';
    RETURN;
  END IF;
  
  -- Update user_roles
  UPDATE user_roles
  SET gym_id = canonical_gym_id
  WHERE gym_id = duplicate_gym_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % user_roles records', updated_count;
  
  -- Update exercises.created_by_gym_id
  UPDATE exercises
  SET created_by_gym_id = canonical_gym_id
  WHERE created_by_gym_id = duplicate_gym_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % exercises.created_by_gym_id records', updated_count;
  
  -- Update gym_exercises
  UPDATE gym_exercises
  SET gym_id = canonical_gym_id
  WHERE gym_id = duplicate_gym_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % gym_exercises records', updated_count;
  
  -- Update templates
  UPDATE templates
  SET gym_id = canonical_gym_id
  WHERE gym_id = duplicate_gym_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % templates records', updated_count;
  
END $$;
*/

-- ============================================================================
-- STEP 3: Optional - Delete duplicate gym
-- ============================================================================
-- 
-- WARNING: Only uncomment this AFTER:
-- 1. Verifying all sessions are fixed
-- 2. Verifying other tables are updated (if STEP 2 was executed)
-- 3. Taking a database backup
--
-- ⚠️  DESTRUCTIVE OPERATION - USE WITH CAUTION ⚠️
-- ============================================================================

/*
DO $$
DECLARE
  duplicate_gym_id UUID;
  duplicate_slug TEXT := 'Crossfit_Larvik';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- STEP 3: Deleting duplicate gym (DESTRUCTIVE) ---';
  
  SELECT id INTO duplicate_gym_id
  FROM gyms
  WHERE slug = duplicate_slug;
  
  IF duplicate_gym_id IS NULL THEN
    RAISE NOTICE 'Duplicate gym already deleted or not found';
    RETURN;
  END IF;
  
  -- Check if there are any remaining references (should be 0 if STEP 2 was executed)
  IF EXISTS (
    SELECT 1 FROM sessions WHERE gym_id = duplicate_gym_id
    UNION ALL
    SELECT 1 FROM user_roles WHERE gym_id = duplicate_gym_id
    UNION ALL
    SELECT 1 FROM exercises WHERE created_by_gym_id = duplicate_gym_id
    UNION ALL
    SELECT 1 FROM gym_exercises WHERE gym_id = duplicate_gym_id
    UNION ALL
    SELECT 1 FROM templates WHERE gym_id = duplicate_gym_id
  ) THEN
    RAISE EXCEPTION 'Cannot delete duplicate gym: still has references in other tables! Run STEP 2 first.';
  END IF;
  
  DELETE FROM gyms WHERE id = duplicate_gym_id;
  RAISE NOTICE 'Deleted duplicate gym: slug=''%'', id=%', duplicate_slug, duplicate_gym_id;
  
END $$;
*/

-- ============================================================================
-- STEP 4: Verify final situation
-- ============================================================================

DO $$
DECLARE
  canonical_slug TEXT := 'crossfit-larvik';
  duplicate_slug TEXT := 'Crossfit_Larvik';
  default_slug TEXT := 'default-gym';
  null_gym_id_count INTEGER;
  total_sessions_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- Final verification ---';
  
  -- Count sessions with NULL gym_id (should be 0 or very few)
  SELECT COUNT(*) INTO null_gym_id_count
  FROM sessions
  WHERE gym_slug IN (canonical_slug, duplicate_slug, default_slug)
    AND gym_id IS NULL;
  
  -- Count total sessions for canonical gym
  SELECT COUNT(*) INTO total_sessions_count
  FROM sessions
  WHERE gym_slug = canonical_slug;
  
  RAISE NOTICE 'Canonical gym sessions: %', total_sessions_count;
  RAISE NOTICE 'Sessions with NULL gym_id (should be 0): %', null_gym_id_count;
  
  -- Show breakdown by gym_slug
  RAISE NOTICE '';
  RAISE NOTICE 'Sessions breakdown by gym_slug:';
  PERFORM * FROM (
    SELECT 
      gym_slug,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE gym_id IS NULL) as null_gym_id_count
    FROM sessions
    WHERE gym_slug IN (canonical_slug, duplicate_slug, default_slug)
    GROUP BY gym_slug
    ORDER BY gym_slug
  ) AS summary;
  
  IF null_gym_id_count > 0 THEN
    RAISE WARNING 'Some sessions still have NULL gym_id! Review manually.';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ REPAIR COMPLETE - All sessions have gym_id set';
    RAISE NOTICE '========================================';
  END IF;
  
END $$;

-- ============================================================================
-- Final verification query (for manual inspection)
-- ============================================================================

-- Uncomment to see detailed results:
/*
SELECT 
  gym_slug,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE gym_id IS NULL) as null_gym_id_count,
  COUNT(*) FILTER (WHERE gym_id IS NOT NULL) as set_gym_id_count
FROM sessions
WHERE gym_slug IN ('crossfit-larvik', 'Crossfit_Larvik', 'default-gym')
GROUP BY gym_slug
ORDER BY gym_slug;
*/

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================
-- 
-- Review the output above before committing.
-- To rollback: ROLLBACK;
-- To commit: (already included below, but you can remove it to review first)
-- ============================================================================

COMMIT;

