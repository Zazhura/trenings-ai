-- ============================================================================
-- REPAIR SCRIPT: Merge duplicate gym ID into canonical gym ID
-- ============================================================================
-- 
-- PROBLEM:
-- - Canonical gym: slug='crossfit-larvik', id=84ed63f3-c702-4767-929a-3c0af60bf667
-- - Duplicate gym: slug='Crossfit_Larvik', id=7c4312de-7707-4e6c-a145-9b04fddcb5cb
-- - user_roles peker på duplicate gym_id
-- - templates (TeamWood 1, Tester) peker på duplicate gym_id
-- - display resolver finner ingen running/paused sessions fordi de peker på duplicate
--
-- SOLUTION:
-- - Flytt alle referanser fra duplicate gym_id til canonical gym_id
-- - Oppdater templates, user_roles, sessions
-- - Oppdater sessions med gym_slug='Crossfit_Larvik' også
-- - Etter merge: coach start/session/display skal treffe canonical gym_id
--
-- SAFETY:
-- - Wrapped in transaction (BEGIN/COMMIT) - can rollback before commit
-- - Dry-run SELECTS før og etter endringer
-- - Does NOT delete duplicate gym by default (see STEP 2)
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 0: Define gym IDs and show current situation (DRY-RUN)
-- ============================================================================

DO $$
DECLARE
  canonical_gym_id UUID := '84ed63f3-c702-4767-929a-3c0af60bf667';
  duplicate_gym_id UUID := '7c4312de-7707-4e6c-a145-9b04fddcb5cb';
  canonical_slug TEXT := 'crossfit-larvik';
  duplicate_slug TEXT := 'Crossfit_Larvik';
  
  -- Counts before repair
  templates_duplicate_count INTEGER;
  templates_canonical_count INTEGER;
  user_roles_duplicate_count INTEGER;
  user_roles_canonical_count INTEGER;
  sessions_duplicate_count INTEGER;
  sessions_canonical_count INTEGER;
  sessions_duplicate_slug_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REPAIR SCRIPT: Merge duplicate gym IDs';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Canonical gym: slug=''%'', id=%', canonical_slug, canonical_gym_id;
  RAISE NOTICE 'Duplicate gym: slug=''%'', id=%', duplicate_slug, duplicate_gym_id;
  RAISE NOTICE '';
  
  -- Verify canonical gym exists
  IF NOT EXISTS (SELECT 1 FROM gyms WHERE id = canonical_gym_id) THEN
    RAISE EXCEPTION 'Canonical gym with id % not found!', canonical_gym_id;
  END IF;
  
  -- Verify duplicate gym exists
  IF NOT EXISTS (SELECT 1 FROM gyms WHERE id = duplicate_gym_id) THEN
    RAISE EXCEPTION 'Duplicate gym with id % not found!', duplicate_gym_id;
  END IF;
  
  RAISE NOTICE '--- DRY-RUN: Current situation (BEFORE repair) ---';
  RAISE NOTICE '';
  
  -- Count templates
  SELECT COUNT(*) INTO templates_duplicate_count
  FROM templates
  WHERE gym_id = duplicate_gym_id;
  
  SELECT COUNT(*) INTO templates_canonical_count
  FROM templates
  WHERE gym_id = canonical_gym_id;
  
  RAISE NOTICE 'Templates:';
  RAISE NOTICE '  - Duplicate gym_id (%): % rows', duplicate_gym_id, templates_duplicate_count;
  RAISE NOTICE '  - Canonical gym_id (%): % rows', canonical_gym_id, templates_canonical_count;
  
  -- Count user_roles
  SELECT COUNT(*) INTO user_roles_duplicate_count
  FROM user_roles
  WHERE gym_id = duplicate_gym_id;
  
  SELECT COUNT(*) INTO user_roles_canonical_count
  FROM user_roles
  WHERE gym_id = canonical_gym_id;
  
  RAISE NOTICE '';
  RAISE NOTICE 'User roles:';
  RAISE NOTICE '  - Duplicate gym_id (%): % rows', duplicate_gym_id, user_roles_duplicate_count;
  RAISE NOTICE '  - Canonical gym_id (%): % rows', canonical_gym_id, user_roles_canonical_count;
  
  -- Count sessions by gym_id
  SELECT COUNT(*) INTO sessions_duplicate_count
  FROM sessions
  WHERE gym_id = duplicate_gym_id;
  
  SELECT COUNT(*) INTO sessions_canonical_count
  FROM sessions
  WHERE gym_id = canonical_gym_id;
  
  -- Count sessions by gym_slug
  SELECT COUNT(*) INTO sessions_duplicate_slug_count
  FROM sessions
  WHERE gym_slug = duplicate_slug;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Sessions:';
  RAISE NOTICE '  - Duplicate gym_id (%): % rows', duplicate_gym_id, sessions_duplicate_count;
  RAISE NOTICE '  - Canonical gym_id (%): % rows', canonical_gym_id, sessions_canonical_count;
  RAISE NOTICE '  - gym_slug=''%'': % rows', duplicate_slug, sessions_duplicate_slug_count;
  
  -- Show sessions status breakdown for duplicate
  RAISE NOTICE '';
  RAISE NOTICE 'Sessions status breakdown (duplicate gym_id):';
  PERFORM * FROM (
    SELECT 
      status,
      COUNT(*) as count
    FROM sessions
    WHERE gym_id = duplicate_gym_id
    GROUP BY status
    ORDER BY status
  ) AS status_summary;
  
  -- Show sessions status breakdown for canonical
  RAISE NOTICE '';
  RAISE NOTICE 'Sessions status breakdown (canonical gym_id):';
  PERFORM * FROM (
    SELECT 
      status,
      COUNT(*) as count
    FROM sessions
    WHERE gym_id = canonical_gym_id
    GROUP BY status
    ORDER BY status
  ) AS status_summary;
  
  RAISE NOTICE '';
  RAISE NOTICE '--- Starting repair operations ---';
  
END $$;

-- ============================================================================
-- STEP 1: Update templates table
-- ============================================================================

DO $$
DECLARE
  canonical_gym_id UUID := '84ed63f3-c702-4767-929a-3c0af60bf667';
  duplicate_gym_id UUID := '7c4312de-7707-4e6c-a145-9b04fddcb5cb';
  updated_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- STEP 1: Updating templates ---';
  
  UPDATE templates
  SET gym_id = canonical_gym_id
  WHERE gym_id = duplicate_gym_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % templates from duplicate to canonical gym_id', updated_count;
  
END $$;

-- ============================================================================
-- STEP 2: Update user_roles table
-- ============================================================================

DO $$
DECLARE
  canonical_gym_id UUID := '84ed63f3-c702-4767-929a-3c0af60bf667';
  duplicate_gym_id UUID := '7c4312de-7707-4e6c-a145-9b04fddcb5cb';
  updated_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- STEP 2: Updating user_roles ---';
  
  UPDATE user_roles
  SET gym_id = canonical_gym_id
  WHERE gym_id = duplicate_gym_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % user_roles from duplicate to canonical gym_id', updated_count;
  
END $$;

-- ============================================================================
-- STEP 3: Update sessions table (by gym_id)
-- ============================================================================

DO $$
DECLARE
  canonical_gym_id UUID := '84ed63f3-c702-4767-929a-3c0af60bf667';
  duplicate_gym_id UUID := '7c4312de-7707-4e6c-a145-9b04fddcb5cb';
  canonical_slug TEXT := 'crossfit-larvik';
  updated_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- STEP 3: Updating sessions (by gym_id) ---';
  
  UPDATE sessions
  SET 
    gym_id = canonical_gym_id,
    gym_slug = canonical_slug
  WHERE gym_id = duplicate_gym_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % sessions from duplicate to canonical gym_id', updated_count;
  
END $$;

-- ============================================================================
-- STEP 4: Update sessions table (by gym_slug='Crossfit_Larvik')
-- ============================================================================

DO $$
DECLARE
  canonical_gym_id UUID := '84ed63f3-c702-4767-929a-3c0af60bf667';
  duplicate_slug TEXT := 'Crossfit_Larvik';
  canonical_slug TEXT := 'crossfit-larvik';
  updated_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- STEP 4: Updating sessions (by gym_slug=''%'') ---', duplicate_slug;
  
  -- Update sessions that have gym_slug='Crossfit_Larvik' to canonical
  -- Set gym_id if it's NULL, or update to canonical if it was set to duplicate
  UPDATE sessions
  SET 
    gym_slug = canonical_slug,
    gym_id = canonical_gym_id
  WHERE gym_slug = duplicate_slug;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % sessions with gym_slug=''%'' to canonical', updated_count, duplicate_slug;
  
END $$;

-- ============================================================================
-- STEP 5: Verify final situation (DRY-RUN AFTER)
-- ============================================================================

DO $$
DECLARE
  canonical_gym_id UUID := '84ed63f3-c702-4767-929a-3c0af60bf667';
  duplicate_gym_id UUID := '7c4312de-7707-4e6c-a145-9b04fddcb5cb';
  canonical_slug TEXT := 'crossfit-larvik';
  
  -- Counts after repair
  templates_left INTEGER;
  user_roles_left INTEGER;
  sessions_left INTEGER;
  sessions_canonical_count INTEGER;
  sessions_running_paused_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- VERIFICATION: Final situation (AFTER repair) ---';
  RAISE NOTICE '';
  
  -- Count remaining references to duplicate gym_id
  SELECT COUNT(*) INTO templates_left
  FROM templates
  WHERE gym_id = duplicate_gym_id;
  
  SELECT COUNT(*) INTO user_roles_left
  FROM user_roles
  WHERE gym_id = duplicate_gym_id;
  
  SELECT COUNT(*) INTO sessions_left
  FROM sessions
  WHERE gym_id = duplicate_gym_id;
  
  -- Count canonical gym_id references
  SELECT COUNT(*) INTO sessions_canonical_count
  FROM sessions
  WHERE gym_id = canonical_gym_id;
  
  -- Count running/paused sessions for canonical gym
  SELECT COUNT(*) INTO sessions_running_paused_count
  FROM sessions
  WHERE gym_id = canonical_gym_id
    AND status IN ('running', 'paused');
  
  RAISE NOTICE 'Remaining references to duplicate gym_id (%):', duplicate_gym_id;
  RAISE NOTICE '  - Templates: % rows (should be 0)', templates_left;
  RAISE NOTICE '  - User roles: % rows (should be 0)', user_roles_left;
  RAISE NOTICE '  - Sessions: % rows (should be 0)', sessions_left;
  RAISE NOTICE '';
  RAISE NOTICE 'Canonical gym_id (%):', canonical_gym_id;
  RAISE NOTICE '  - Total sessions: % rows', sessions_canonical_count;
  RAISE NOTICE '  - Running/paused sessions: % rows', sessions_running_paused_count;
  
  -- Verify no references remain
  IF templates_left > 0 OR user_roles_left > 0 OR sessions_left > 0 THEN
    RAISE WARNING 'Some references to duplicate gym_id still exist! Review manually.';
    RAISE WARNING '  Templates left: %, User roles left: %, Sessions left: %', 
      templates_left, user_roles_left, sessions_left;
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ REPAIR COMPLETE - All references moved to canonical gym_id';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Test: GET /api/display/crossfit-larvik/current-session';
    RAISE NOTICE '  2. Test: Coach start session should work correctly';
    RAISE NOTICE '  3. Optional: Run STEP 6 to delete duplicate gym (commented out)';
  END IF;
  
END $$;

-- ============================================================================
-- STEP 6: Optional - Delete duplicate gym
-- ============================================================================
-- 
-- WARNING: Only uncomment this AFTER:
-- 1. Verifying all references are moved (STEP 5 shows 0 rows for duplicate)
-- 2. Testing that display/coach endpoints work correctly
-- 3. Taking a database backup
--
-- ⚠️  DESTRUCTIVE OPERATION - USE WITH CAUTION ⚠️
-- ============================================================================

/*
DO $$
DECLARE
  duplicate_gym_id UUID := '7c4312de-7707-4e6c-a145-9b04fddcb5cb';
  duplicate_slug TEXT := 'Crossfit_Larvik';
  
  templates_left INTEGER;
  user_roles_left INTEGER;
  sessions_left INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- STEP 6: Deleting duplicate gym (DESTRUCTIVE) ---';
  
  -- Final check: verify no references remain
  SELECT COUNT(*) INTO templates_left FROM templates WHERE gym_id = duplicate_gym_id;
  SELECT COUNT(*) INTO user_roles_left FROM user_roles WHERE gym_id = duplicate_gym_id;
  SELECT COUNT(*) INTO sessions_left FROM sessions WHERE gym_id = duplicate_gym_id;
  
  IF templates_left > 0 OR user_roles_left > 0 OR sessions_left > 0 THEN
    RAISE EXCEPTION 'Cannot delete duplicate gym: still has references! Templates: %, User roles: %, Sessions: %', 
      templates_left, user_roles_left, sessions_left;
  END IF;
  
  DELETE FROM gyms WHERE id = duplicate_gym_id;
  RAISE NOTICE 'Deleted duplicate gym: slug=''%'', id=%', duplicate_slug, duplicate_gym_id;
  
END $$;
*/

-- ============================================================================
-- Final verification query (for manual inspection)
-- ============================================================================

-- Uncomment to see detailed results:
/*
SELECT 
  'templates' as table_name,
  COUNT(*) FILTER (WHERE gym_id = '7c4312de-7707-4e6c-a145-9b04fddcb5cb') as duplicate_count,
  COUNT(*) FILTER (WHERE gym_id = '84ed63f3-c702-4767-929a-3c0af60bf667') as canonical_count
FROM templates
UNION ALL
SELECT 
  'user_roles' as table_name,
  COUNT(*) FILTER (WHERE gym_id = '7c4312de-7707-4e6c-a145-9b04fddcb5cb') as duplicate_count,
  COUNT(*) FILTER (WHERE gym_id = '84ed63f3-c702-4767-929a-3c0af60bf667') as canonical_count
FROM user_roles
UNION ALL
SELECT 
  'sessions' as table_name,
  COUNT(*) FILTER (WHERE gym_id = '7c4312de-7707-4e6c-a145-9b04fddcb5cb') as duplicate_count,
  COUNT(*) FILTER (WHERE gym_id = '84ed63f3-c702-4767-929a-3c0af60bf667') as canonical_count
FROM sessions;
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

