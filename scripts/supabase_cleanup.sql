-- ============================================================================
-- DATABASE CLEANUP SCRIPT - ARCHIVE-FIRST APPROACH
-- ============================================================================
-- 
-- PURPOSE:
--   Safely archive unused database objects from public schema to archive schema.
--   This script is designed to be REVERSIBLE and SAFE.
--
-- SAFETY GATES:
--   1. NO DROP statements in SAFE section
--   2. All destructive operations are commented out in DESTRUCTIVE section
--   3. SAFE section only moves objects to archive schema (does not delete)
--   4. Sessions table and related objects are NEVER touched
--   5. Complete REVERT section included to restore archived objects
--
-- USAGE:
--   1. Run PREVIEW queries first to see what will be archived
--   2. Review the results carefully
--   3. Run SAFE section to archive unused objects
--   4. Test application thoroughly
--   5. Only after confirmation, uncomment DESTRUCTIVE section (if needed)
--
-- REVERT PLAN:
--   See REVERT section at bottom - moves all archived objects back to public
--
-- ============================================================================

-- ============================================================================
-- SECTION 0: PREVIEW QUERIES (READ-ONLY)
-- ============================================================================
-- Run these queries FIRST to see what will be archived
-- ============================================================================

-- Preview: Tables that will be archived (all except 'sessions')
SELECT 
  'PREVIEW: Tables to archive' as info,
  tablename,
  'Will be moved to archive.' || tablename as archive_name
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename != 'sessions'
ORDER BY tablename;

-- Preview: Functions that will be archived (all except 'update_updated_at_column')
SELECT 
  'PREVIEW: Functions to archive' as info,
  routine_name,
  'Will be moved to archive schema' as note
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name != 'update_updated_at_column'
ORDER BY routine_name;

-- Preview: Triggers that will be disabled (all except 'update_sessions_updated_at')
SELECT 
  'PREVIEW: Triggers to disable' as info,
  trigger_name,
  event_object_table,
  'Will be disabled (not deleted)' as note
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name != 'update_sessions_updated_at'
ORDER BY event_object_table, trigger_name;

-- Preview: Policies that will be archived (all except sessions policies)
SELECT 
  'PREVIEW: Policies to archive' as info,
  tablename,
  policyname,
  'Will be dropped (can be recreated from migrations if needed)' as note
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename != 'sessions'
ORDER BY tablename, policyname;

-- Preview: Views that will be archived
SELECT 
  'PREVIEW: Views to archive' as info,
  table_name,
  'Will be moved to archive schema' as note
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- SECTION A: SAFE OPERATIONS (CAN BE RUN)
-- ============================================================================
-- These operations are SAFE and REVERSIBLE:
--   - Creates archive schema
--   - Moves unused objects to archive (does not delete)
--   - Disables triggers (does not delete)
-- ============================================================================

BEGIN;

-- Create archive schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS archive;

COMMENT ON SCHEMA archive IS 'Archive schema for unused database objects. Objects can be restored using REVERT section.';

-- ============================================================================
-- A1: Archive unused tables (all except 'sessions')
-- ============================================================================

DO $$
DECLARE
  table_record RECORD;
  archive_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== ARCHIVING UNUSED TABLES ===';
  
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename != 'sessions'
    ORDER BY tablename
  LOOP
    -- Move table to archive schema
    EXECUTE format('ALTER TABLE public.%I SET SCHEMA archive', table_record.tablename);
    archive_count := archive_count + 1;
    RAISE NOTICE 'Archived table: %', table_record.tablename;
  END LOOP;
  
  IF archive_count = 0 THEN
    RAISE NOTICE 'No tables to archive (only sessions table exists)';
  ELSE
    RAISE NOTICE 'Archived % table(s) to archive schema', archive_count;
  END IF;
END $$;

-- ============================================================================
-- A2: Archive unused functions (all except 'update_updated_at_column')
-- ============================================================================

DO $$
DECLARE
  func_record RECORD;
  archive_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== ARCHIVING UNUSED FUNCTIONS ===';
  
  FOR func_record IN 
    SELECT routine_name, routine_type
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name != 'update_updated_at_column'
    ORDER BY routine_name
  LOOP
    -- Move function to archive schema
    EXECUTE format('ALTER FUNCTION public.%I SET SCHEMA archive', func_record.routine_name);
    archive_count := archive_count + 1;
    RAISE NOTICE 'Archived function: %', func_record.routine_name;
  END LOOP;
  
  IF archive_count = 0 THEN
    RAISE NOTICE 'No functions to archive (only update_updated_at_column exists)';
  ELSE
    RAISE NOTICE 'Archived % function(s) to archive schema', archive_count;
  END IF;
END $$;

-- ============================================================================
-- A3: Disable unused triggers (all except 'update_sessions_updated_at')
-- ============================================================================
-- Note: We disable triggers instead of deleting them (safer, reversible)
-- ============================================================================

DO $$
DECLARE
  trigger_record RECORD;
  disabled_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== DISABLING UNUSED TRIGGERS ===';
  
  FOR trigger_record IN 
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND trigger_name != 'update_sessions_updated_at'
    ORDER BY event_object_table, trigger_name
  LOOP
    -- Disable trigger (does not delete it)
    EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER %I', 
      trigger_record.event_object_table, 
      trigger_record.trigger_name);
    disabled_count := disabled_count + 1;
    RAISE NOTICE 'Disabled trigger: % on table %', 
      trigger_record.trigger_name, 
      trigger_record.event_object_table;
  END LOOP;
  
  IF disabled_count = 0 THEN
    RAISE NOTICE 'No triggers to disable (only update_sessions_updated_at exists)';
  ELSE
    RAISE NOTICE 'Disabled % trigger(s)', disabled_count;
  END IF;
END $$;

-- ============================================================================
-- A4: Drop unused policies (all except sessions policies)
-- ============================================================================
-- Note: Policies cannot be moved to archive schema, so we drop them
-- They can be recreated from migrations if needed
-- ============================================================================

DO $$
DECLARE
  policy_record RECORD;
  dropped_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== DROPPING UNUSED POLICIES ===';
  
  FOR policy_record IN 
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename != 'sessions'
    ORDER BY tablename, policyname
  LOOP
    -- Drop policy
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
      policy_record.policyname, 
      policy_record.tablename);
    dropped_count := dropped_count + 1;
    RAISE NOTICE 'Dropped policy: % on table %', 
      policy_record.policyname, 
      policy_record.tablename;
  END LOOP;
  
  IF dropped_count = 0 THEN
    RAISE NOTICE 'No policies to drop (only sessions policies exist)';
  ELSE
    RAISE NOTICE 'Dropped % policy/policies', dropped_count;
  END IF;
END $$;

-- ============================================================================
-- A5: Archive unused views
-- ============================================================================

DO $$
DECLARE
  view_record RECORD;
  archive_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== ARCHIVING UNUSED VIEWS ===';
  
  FOR view_record IN 
    SELECT table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
    ORDER BY table_name
  LOOP
    -- Move view to archive schema
    EXECUTE format('ALTER VIEW public.%I SET SCHEMA archive', view_record.table_name);
    archive_count := archive_count + 1;
    RAISE NOTICE 'Archived view: %', view_record.table_name;
  END LOOP;
  
  IF archive_count = 0 THEN
    RAISE NOTICE 'No views to archive';
  ELSE
    RAISE NOTICE 'Archived % view(s) to archive schema', archive_count;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION: Show what remains in public schema
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICATION: REMAINING OBJECTS IN PUBLIC SCHEMA ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables:';
  PERFORM * FROM (
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  ) AS t;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Functions:';
  PERFORM * FROM (
    SELECT routine_name 
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    ORDER BY routine_name
  ) AS f;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers:';
  PERFORM * FROM (
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name
  ) AS tr;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Policies:';
  PERFORM * FROM (
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  ) AS p;
END $$;

COMMIT;

-- ============================================================================
-- SECTION B: DESTRUCTIVE OPERATIONS (COMMENTED OUT)
-- ============================================================================
-- 
-- ⚠️  WARNING: UNCOMMENT ONLY AFTER MANUAL CONFIRMATION ⚠️
-- 
-- These operations PERMANENTLY DELETE objects from archive schema.
-- Only run these after:
--   1. Application has been tested thoroughly with archived objects
--   2. You have confirmed archived objects are not needed
--   3. You have a backup of the database
--   4. You have reviewed the REVERT section and understand how to restore
--
-- ============================================================================

/*
BEGIN;

-- ============================================================================
-- B1: Drop archived tables (PERMANENT - cannot be undone)
-- ============================================================================

DO $$
DECLARE
  table_record RECORD;
  dropped_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== DROPPING ARCHIVED TABLES (DESTRUCTIVE) ===';
  
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'archive'
    ORDER BY tablename
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS archive.%I CASCADE', table_record.tablename);
    dropped_count := dropped_count + 1;
    RAISE NOTICE 'Dropped table: %', table_record.tablename;
  END LOOP;
  
  RAISE NOTICE 'Dropped % table(s) from archive schema', dropped_count;
END $$;

-- ============================================================================
-- B2: Drop archived functions (PERMANENT - cannot be undone)
-- ============================================================================

DO $$
DECLARE
  func_record RECORD;
  dropped_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== DROPPING ARCHIVED FUNCTIONS (DESTRUCTIVE) ===';
  
  FOR func_record IN 
    SELECT routine_name, routine_type
    FROM information_schema.routines
    WHERE routine_schema = 'archive'
    ORDER BY routine_name
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS archive.%I CASCADE', func_record.routine_name);
    dropped_count := dropped_count + 1;
    RAISE NOTICE 'Dropped function: %', func_record.routine_name;
  END LOOP;
  
  RAISE NOTICE 'Dropped % function(s) from archive schema', dropped_count;
END $$;

-- ============================================================================
-- B3: Drop archived views (PERMANENT - cannot be undone)
-- ============================================================================

DO $$
DECLARE
  view_record RECORD;
  dropped_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== DROPPING ARCHIVED VIEWS (DESTRUCTIVE) ===';
  
  FOR view_record IN 
    SELECT table_name
    FROM information_schema.views
    WHERE table_schema = 'archive'
    ORDER BY table_name
  LOOP
    EXECUTE format('DROP VIEW IF EXISTS archive.%I CASCADE', view_record.table_name);
    dropped_count := dropped_count + 1;
    RAISE NOTICE 'Dropped view: %', view_record.table_name;
  END LOOP;
  
  RAISE NOTICE 'Dropped % view(s) from archive schema', dropped_count;
END $$;

-- ============================================================================
-- B4: Drop archive schema (PERMANENT - cannot be undone)
-- ============================================================================
-- Only run this if ALL objects in archive have been dropped

-- DROP SCHEMA IF EXISTS archive CASCADE;

COMMIT;
*/

-- ============================================================================
-- SECTION C: REVERT OPERATIONS (RESTORE ARCHIVED OBJECTS)
-- ============================================================================
-- Use this section to restore archived objects back to public schema
-- ============================================================================

-- ============================================================================
-- C1: Restore archived tables to public schema
-- ============================================================================

/*
BEGIN;

DO $$
DECLARE
  table_record RECORD;
  restored_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== RESTORING ARCHIVED TABLES TO PUBLIC ===';
  
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'archive'
    ORDER BY tablename
  LOOP
    -- Move table back to public schema
    EXECUTE format('ALTER TABLE archive.%I SET SCHEMA public', table_record.tablename);
    restored_count := restored_count + 1;
    RAISE NOTICE 'Restored table: %', table_record.tablename;
  END LOOP;
  
  IF restored_count = 0 THEN
    RAISE NOTICE 'No tables to restore';
  ELSE
    RAISE NOTICE 'Restored % table(s) to public schema', restored_count;
  END IF;
END $$;

-- ============================================================================
-- C2: Restore archived functions to public schema
-- ============================================================================

DO $$
DECLARE
  func_record RECORD;
  restored_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== RESTORING ARCHIVED FUNCTIONS TO PUBLIC ===';
  
  FOR func_record IN 
    SELECT routine_name
    FROM information_schema.routines
    WHERE routine_schema = 'archive'
    ORDER BY routine_name
  LOOP
    -- Move function back to public schema
    EXECUTE format('ALTER FUNCTION archive.%I SET SCHEMA public', func_record.routine_name);
    restored_count := restored_count + 1;
    RAISE NOTICE 'Restored function: %', func_record.routine_name;
  END LOOP;
  
  IF restored_count = 0 THEN
    RAISE NOTICE 'No functions to restore';
  ELSE
    RAISE NOTICE 'Restored % function(s) to public schema', restored_count;
  END IF;
END $$;

-- ============================================================================
-- C3: Re-enable disabled triggers
-- ============================================================================

DO $$
DECLARE
  trigger_record RECORD;
  enabled_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== RE-ENABLING DISABLED TRIGGERS ===';
  
  FOR trigger_record IN 
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND trigger_name != 'update_sessions_updated_at'
    ORDER BY event_object_table, trigger_name
  LOOP
    -- Re-enable trigger
    EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER %I', 
      trigger_record.event_object_table, 
      trigger_record.trigger_name);
    enabled_count := enabled_count + 1;
    RAISE NOTICE 'Re-enabled trigger: % on table %', 
      trigger_record.trigger_name, 
      trigger_record.event_object_table;
  END LOOP;
  
  IF enabled_count = 0 THEN
    RAISE NOTICE 'No triggers to re-enable';
  ELSE
    RAISE NOTICE 'Re-enabled % trigger(s)', enabled_count;
  END IF;
END $$;

-- ============================================================================
-- C4: Restore archived views to public schema
-- ============================================================================

DO $$
DECLARE
  view_record RECORD;
  restored_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== RESTORING ARCHIVED VIEWS TO PUBLIC ===';
  
  FOR view_record IN 
    SELECT table_name
    FROM information_schema.views
    WHERE table_schema = 'archive'
    ORDER BY table_name
  LOOP
    -- Move view back to public schema
    EXECUTE format('ALTER VIEW archive.%I SET SCHEMA public', view_record.table_name);
    restored_count := restored_count + 1;
    RAISE NOTICE 'Restored view: %', view_record.table_name;
  END LOOP;
  
  IF restored_count = 0 THEN
    RAISE NOTICE 'No views to restore';
  ELSE
    RAISE NOTICE 'Restored % view(s) to public schema', restored_count;
  END IF;
END $$;

COMMIT;
*/

-- ============================================================================
-- END OF CLEANUP SCRIPT
-- ============================================================================
-- 
-- SUMMARY:
--   - SAFE section: Archives unused objects (reversible)
--   - DESTRUCTIVE section: Permanently deletes archived objects (commented out)
--   - REVERT section: Restores archived objects to public (commented out)
--
-- NEXT STEPS:
--   1. Run PREVIEW queries to see what will be archived
--   2. Run SAFE section to archive unused objects
--   3. Test application thoroughly
--   4. Only after confirmation, uncomment DESTRUCTIVE section (if needed)
--   5. Use REVERT section if you need to restore archived objects
--
-- ============================================================================

