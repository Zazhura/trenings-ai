-- ============================================================================
-- DATABASE AUDIT SCRIPT - READ ONLY
-- ============================================================================
-- 
-- Purpose: Audit all database objects in public schema
-- This script ONLY READS - it does not modify anything
-- 
-- Run this script in Supabase SQL Editor to see current database state
-- Compare results with docs/db_inventory.md to identify unused objects
--
-- ============================================================================

-- ============================================================================
-- SECTION 1: TABLES
-- ============================================================================

SELECT 
  '=== TABLES IN PUBLIC SCHEMA ===' as section;

SELECT 
  schemaname,
  tablename,
  tableowner,
  tablespace,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- SECTION 2: COLUMNS (for each table)
-- ============================================================================

SELECT 
  '=== COLUMNS IN PUBLIC TABLES ===' as section;

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- SECTION 3: INDEXES
-- ============================================================================

SELECT 
  '=== INDEXES IN PUBLIC SCHEMA ===' as section;

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 4: FUNCTIONS
-- ============================================================================

SELECT 
  '=== FUNCTIONS IN PUBLIC SCHEMA ===' as section;

SELECT 
  routine_schema,
  routine_name,
  routine_type,
  data_type as return_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============================================================================
-- SECTION 5: TRIGGERS
-- ============================================================================

SELECT 
  '=== TRIGGERS IN PUBLIC SCHEMA ===' as section;

SELECT 
  trigger_schema,
  trigger_name,
  event_object_table,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SECTION 6: RLS POLICIES
-- ============================================================================

SELECT 
  '=== RLS POLICIES IN PUBLIC SCHEMA ===' as section;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 7: RLS ENABLED TABLES
-- ============================================================================

SELECT 
  '=== TABLES WITH RLS ENABLED ===' as section;

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND rowsecurity = true
ORDER BY tablename;

-- ============================================================================
-- SECTION 8: VIEWS
-- ============================================================================

SELECT 
  '=== VIEWS IN PUBLIC SCHEMA ===' as section;

SELECT 
  table_schema,
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- SECTION 9: SEQUENCES
-- ============================================================================

SELECT 
  '=== SEQUENCES IN PUBLIC SCHEMA ===' as section;

SELECT 
  sequence_schema,
  sequence_name,
  data_type,
  start_value,
  minimum_value,
  maximum_value,
  increment
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- ============================================================================
-- SECTION 10: FOREIGN KEYS
-- ============================================================================

SELECT 
  '=== FOREIGN KEY CONSTRAINTS ===' as section;

SELECT 
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- SECTION 11: CHECK CONSTRAINTS
-- ============================================================================

SELECT 
  '=== CHECK CONSTRAINTS ===' as section;

SELECT 
  constraint_schema,
  table_name,
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
ORDER BY table_name, constraint_name;

-- ============================================================================
-- SECTION 12: STORAGE BUCKETS (if storage extension is enabled)
-- ============================================================================

SELECT 
  '=== STORAGE BUCKETS (if available) ===' as section;

-- Note: Storage buckets are managed by Supabase Storage service
-- This query may not work if storage extension is not enabled
-- If it fails, ignore this section

SELECT 
  name,
  id,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY name;

-- ============================================================================
-- SUMMARY COUNTS
-- ============================================================================

SELECT 
  '=== SUMMARY COUNTS ===' as section;

SELECT 
  'Tables' as object_type,
  COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Functions' as object_type,
  COUNT(*) as count
FROM information_schema.routines
WHERE routine_schema = 'public'

UNION ALL

SELECT 
  'Triggers' as object_type,
  COUNT(*) as count
FROM information_schema.triggers
WHERE trigger_schema = 'public'

UNION ALL

SELECT 
  'Policies' as object_type,
  COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Views' as object_type,
  COUNT(*) as count
FROM information_schema.views
WHERE table_schema = 'public'

UNION ALL

SELECT 
  'Indexes' as object_type,
  COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public';

-- ============================================================================
-- END OF AUDIT SCRIPT
-- ============================================================================
-- 
-- Compare results with docs/db_inventory.md
-- Any objects found here that are NOT listed in db_inventory.md are candidates
-- for cleanup (see scripts/supabase_cleanup.sql)
--
-- ============================================================================

